import React, { useState, useEffect, useRef, useContext } from "react";
import {
    List,
    Typography,
    ListItem,
    ListItemSuffix,
    Spinner
} from "@material-tailwind/react";
import { UserPlusIcon, TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import UserAvatar from "../UserAvatar"
import myAnimation from "../lottie/empty.json"
import { AuthContext } from "../firebase hooks/AuthContext";
import { LuMessageSquare } from "react-icons/lu";
import { RxTrash } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from 'lottie-react';
import myAnimation2 from "../lottie/404 errornotfound.json"
function RemovedUSersScreen({ Screen, chat }) {
    const { unBlockUser, unBlockUserInChanel } = useContext(AuthContext);
    const [loadingUserId, setLoadingUserId] = useState(null);

    const [openMenuId, setOpenMenuId] = useState(null); // Track which menu is open
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            setOpenMenuId(null);
        };

        if (openMenuId) {
            window.addEventListener('click', handleClickOutside);
        }

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [openMenuId]);

    // Close menu on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpenMenuId(null);
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const handleMenuOpen = (userId) => {
        setOpenMenuId(userId);
    };

    const handleMenuClose = () => {
        setOpenMenuId(null);
    };
    const handleRemove = async (data) => {
        try {
            setLoadingUserId(data._id);
            const fd = new FormData();
            fd.append("userId", data._id);
            if (chat.contactType === "group") {
                fd.append("groupId", chat._id);
                await unBlockUser(fd);
            } else if (chat.contactType === "channel") {
                fd.append("channelId", chat._id);
                await unBlockUserInChanel(fd);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUserId(null);
        }
    };
    const handleMenuItemClick = async (action, userData) => {
        setOpenMenuId(null); // Close menu immediately on click
        if (action === "Add to Group") {
            await handleRemove(userData);
        }
    };
    const filterContacts2 = (keyWord) => {

        return chat.removedMembers.filter(member => {
            // Resolve display name for comemntact


            let displayName;

            if (member.nickName) {
                displayName = member.nickLastName
                    ? member.nickName + " " + member.nickLastName
                    : member.nickName;
            } else if (member.name) {
                displayName = member.name;
            } else {
                displayName = "";
            }

            // Filter by keyword (case-insensitive)
            return displayName.toLowerCase().includes(keyWord.toLowerCase());
        });
    };

    const handleSerch = (value) => {
        setSearch(value);
        if (value.length < 1) {
            setIsSearching(false);
        } else {
            let fliter = filterContacts2(value);
            fliter.sort((a, b) =>
                a.name.localeCompare(b.name)
            )
            setFiltered(fliter)
            setIsSearching(true)
        }


    }
    return (
        <div className="bg-gray-100 select-none">
            <div className="bg-white flex items-center gap-4 px-4 py-3">
                <button
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                    onClick={() => Screen("main")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">
                    Blocked Users
                </Typography>
            </div>
            <div className=" ">
                <div className='w-full px-6 pb-3 bg-white'>
                    <input placeholder='Search...' type="text" className='bg-white w-full h-8 focus:outline-none' value={search} onChange={(e) => handleSerch(e.target.value)} />
                </div>
                <div className=" bg-gray-100 px-6 py-2" >
                    <p className='text-gray-600 text-sm'>{`Users blocked from the ${chat.contactType}  by admins cant rejoin
                        via invite links.`}</p>
                </div>

                {(chat.removedMembers == undefined || chat.removedMembers.length == 0 && isSearching === false) && (
                    <div className="flex bg-white flex-col items-center h-full">
                        <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                        <div className="flex flex-col items-center">
                            <Typography
                                variant="small"
                                color="gray"
                                className="text-sm max-w-[180px] font-normal text-center"
                            >
                                No one is blocked
                            </Typography>
                        </div>
                    </div>
                )}
                {isSearching === true && (

                    <div className="bg-white w-full scrollbar-telegram overflow-y-auto h-[calc(100vh-40px)] px-1 py-2 gap-1" >
                        {
                            filtered.map((user) => (
                                <CustomMenu

                                    chat={chat}
                                    key={user._id}
                                    data={user}
                                    isOpen={openMenuId === user._id}
                                    isLoading={loadingUserId === user._id}
                                    onOpen={() => handleMenuOpen(user._id)}
                                    onClose={handleMenuClose}
                                    onClick={handleMenuItemClick}
                                />
                            ))
                        }
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center  h-full">
                                <Lottie animationData={myAnimation2} loop={true} style={{ height: 300, width: 300 }} />
                                <div className="flex flex-col items-center">
                                    {/* Name */}
                                    <Typography className="font-medium text-lg text-center">
                                        No Result
                                    </Typography>

                                    {/* Message preview with ellipsis */}
                                    <Typography
                                        variant="small"
                                        color="gray"
                                        className="text-sm max-w-[180px]  text-center font-normal"
                                    >
                                        There were no result for "{search}".
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        color="gray"
                                        className="text-sm max-w-[180px] truncate text-center font-normal"
                                    >
                                        Try a new search.
                                    </Typography>
                                </div>
                            </div>




                        )}
                    </div>


                )}
                {(chat.removedMembers !== undefined && chat.removedMembers.length > 0 && isSearching === false) && (
                    <div className="bg-white w-full scrollbar-telegram overflow-y-auto h-[calc(100vh-40px)] px-1 py-2 gap-1" >
                        {
                            chat.removedMembers.map((user) => (
                                <CustomMenu
                                    chat={chat}
                                    key={user._id}
                                    data={user}
                                    isOpen={openMenuId === user._id}
                                    isLoading={loadingUserId === user._id}
                                    onOpen={() => handleMenuOpen(user._id)}
                                    onClose={handleMenuClose}
                                    onClick={handleMenuItemClick}
                                />
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

const CustomMenu = ({ chat, data, onClick, isOpen, isLoading, onOpen, onClose }) => {
    
    const { backendUser } = useContext(AuthContext);
    const [points, setPoints] = useState({ x: 0, y: 0 });
    const [origin, setOrigin] = useState("top left");

    const menuRef = useRef(null);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    // Check if this is the current user
    const isCurrentUser = data?._id?.toString() === backendUser?._id?.toString();

    // --- 1. Event Handlers ---

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to parent

        // DON'T open menu if it's the current user or loading
        if (isCurrentUser || isLoading) return;

        showMenu(e.clientX, e.clientY);
        onOpen(); // Notify parent to open this menu
    };

    const handleTouchStart = (e) => {
        // DON'T open menu if it's the current user or loading
        if (isCurrentUser || isLoading) return;

        const touch = e.touches[0];
        timerRef.current = setTimeout(() => {
            showMenu(touch.clientX, touch.clientY);
            onOpen(); // Notify parent to open this menu
        }, 500);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // --- 2. Positioning Logic (Cursor at top edge of menu) ---

    const showMenu = (cursorX, cursorY) => {
        // DON'T open menu if it's the current user or loading
        if (isCurrentUser || isLoading) return;

        const MENU_WIDTH = 224; // 224px (w-56)
        const MENU_HEIGHT = 120;
        const GAP = 8;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const containerLeft = containerRect.left;
        const containerRight = containerRect.right;
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;

        let finalX = cursorX;
        let finalY = cursorY; // Menu starts at cursor Y position (top edge at cursor)
        let transformOriginX = "left";

        // --- HORIZONTAL POSITIONING ---
        // Default: align left edge with cursor
        finalX = cursorX;
        transformOriginX = "left";

        // Check if menu would overflow right edge
        if (cursorX + MENU_WIDTH > viewportWidth - GAP) {
            // Position menu to the left of cursor
            finalX = cursorX - MENU_WIDTH;
            transformOriginX = "right";
        }

        // Check if positioned menu would overflow left edge
        if (finalX < GAP) {
            finalX = GAP;
            transformOriginX = "left";
        }

        // Final horizontal safety
        finalX = Math.max(GAP, Math.min(finalX, viewportWidth - MENU_WIDTH - GAP));

        // --- CONTAINER CONSTRAINT ---
        if (containerRight - containerLeft < viewportWidth - 2 * GAP) {
            finalX = Math.max(finalX, containerLeft + GAP);
            finalX = Math.min(finalX, containerRight - MENU_WIDTH - GAP);
        }

        // --- VERTICAL POSITIONING (Menu starts at cursor Y position) ---
        // Menu top edge is at cursorY
        // Check if menu would overflow bottom of viewport
        if (cursorY + MENU_HEIGHT > viewportHeight - GAP) {
            // If menu would overflow bottom, we have two options:
            // Option 1: Shift menu up so it fits (keeps cursor at top edge)
            finalY = viewportHeight - MENU_HEIGHT - GAP;

            // Option 2: If we shifted too far up (above cursor), at least ensure
            // the menu doesn't overlap the cursor position too much
            if (finalY > cursorY) {
                // This shouldn't happen with normal cursor positions, but just in case
                finalY = Math.max(GAP, cursorY - MENU_HEIGHT + 20);
            }
        }

        // Ensure menu doesn't go above container top
        finalY = Math.max(containerTop + GAP, finalY);

        // Ensure menu doesn't go below container bottom
        finalY = Math.min(finalY, containerBottom - MENU_HEIGHT - GAP);

        // Final vertical safety
        finalY = Math.max(GAP, Math.min(finalY, viewportHeight - MENU_HEIGHT - GAP));

        setOrigin(`top ${transformOriginX}`);
        setPoints({ x: finalX, y: finalY });
    };

    // --- 3. Close Listeners ---

    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => {
            onClose();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isOpen, onClose]);

    // --- 4. Render ---

    return (
        <div
            ref={containerRef}
            className="w-full flex flex-col items-center px-1 py-0.5 relative"
        >
            <ListItem
                onContextMenu={handleContextMenu}
                onTouchStart={(isCurrentUser || isLoading) ? undefined : handleTouchStart}
                onTouchEnd={(isCurrentUser || isLoading) ? undefined : handleTouchEnd}
                onClick={() => {
                    if (isOpen) onClose();
                }}
                className={`flex justify-between items-center w-full max-w-sm bg-white transition-all active:scale-[0.98] border border-transparent hover:bg-gray-100 rounded-xl ${isCurrentUser || isLoading ? "cursor-default" : "cursor-pointer"
                    } ${isOpen ? "bg-gray-100 ring-1 ring-gray-200" : ""}`}
            >
                <div className="flex items-center space-x-3 py-1 px-1">
                    <UserAvatar
                        {...(data?.profile?.type === 'image' && { image: data.profile.imageUrl })}
                        {...(data?.profile?.type === 'emoji' && { emoji: data.profile.emoji, simpleBg: data.profile.bgColor })}
                        {...(data?.profile?.type === 'initials' && { simpleBg: data.profile.bgColor, text: data.profile.initials })}
                    />
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-md flex items-center">
                            {data.name} { }{data.lastName}
                        </span>
                        <span className="text-gray-600 text-sm font-body">
                            Blocked from {chat.contactType}
                        </span>
                    </div>
                </div>
                {isLoading && (
                    <ListItemSuffix>
                        <Spinner className="h-5 w-5 text-green-600" />
                    </ListItemSuffix>
                )}
            </ListItem>

            <AnimatePresence>
                {isOpen && !isCurrentUser && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.9, transformOrigin: origin }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                        transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.5 }}
                        style={{
                            top: `${points.y}px`,
                            left: `${points.x}px`,
                            position: 'fixed',
                            zIndex: 99999,
                        }}
                        className="w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to window
                    >
                        <List className="p-1 min-w-8">
                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick("Send Message", data);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 focus:bg-slate-50 active:bg-slate-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <LuMessageSquare size={18} className="text-black " />
                                </div>
                                <Typography className="text-[14px] font-semibold text-black ">
                                    Send Message
                                </Typography>
                            </ListItem>

                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onClick("Add to Group", data);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-green-50 focus:bg-green-50 active:bg-green-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <UserPlusIcon className="h-5 w-5 text-black group-hover:text-green-700" />
                                </div>
                                <Typography className="text-[14px] font-medium text-black group-hover:text-green-700">
                                    Add to {chat.contactType}
                                </Typography>
                            </ListItem>
                        </List>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RemovedUSersScreen;