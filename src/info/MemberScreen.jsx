import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    List,
    Typography,
    ListItemSuffix,
    ListItem,
} from "@material-tailwind/react";
import { RiUserAddLine, RiUserForbidLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import UserAvatar from "../UserAvatar"
import { AuthContext } from "../firebase hooks/AuthContext";
import { RxTrash } from "react-icons/rx";
import { LuMessageSquare } from "react-icons/lu";
import { TbUserUp } from "react-icons/tb";
import AddMembers from './AddMembers';
import Lottie from 'lottie-react';
import myAnimation from "../lottie/404 errornotfound.json";
import toast from 'react-hot-toast';

function MemberScreen({ Screen, chat, choose, onShare }) {
    const { blockUser, removeUser, blockUserInChanel, removeUserInChanel, addAdminInChanel, addAdmin, contacts, addContactById, backendUser } = useContext(AuthContext);

    const [showFab, setShowFab] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null); // Track which menu is open
    const [openAdddContact, setOpenAddContact] = useState(false);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const fabVariants = {
        hidden: {
            opacity: 0,
            scale: 0.7,
            y: 80,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        }
    };
    const editPanelVariants = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };
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

    const handleMenuOpen = (memberId) => {
        setOpenMenuId(memberId);
    };

    const handleMenuClose = () => {
        setOpenMenuId(null);
    };
    const handleBlock = (data) => {

        setFiltered([]);
        setIsSearching(false);
        setSearch("")
        const fd = new FormData();
        fd.append("userId", data._id);
        if (chat.contactType === "channel") {
            fd.append("channelId", chat._id);
            blockUserInChanel(fd);
        } else {
            fd.append("groupId", chat._id);
            blockUser(fd);
        }

    };
    const handleRemove = (data) => {
        setFiltered([]);
        setIsSearching(false);
        setSearch("")
        const fd = new FormData();
        fd.append("userId", data._id);
        if (chat.contactType === "channel") {
            fd.append("channelId", chat._id);
            removeUserInChanel(fd);
        } else {
            fd.append("groupId", chat._id);
            removeUser(fd);
        }

    };
    const handleAdd = (data) => {
        setFiltered([]);
        setIsSearching(false);
        setSearch("")
        const fd = new FormData();
        fd.append("userId", data._id);
        if (chat.contactType === "channel") {
            fd.append("channelId", chat._id);
            addAdminInChanel(fd);
        } else {
            fd.append("groupId", chat._id);
            addAdmin(fd);
        }

    };
    const handleMenuItemClick = async (action, memberData) => {
        if (action === "Delete") {
            handleBlock(memberData);
        } else if (action === "Remove") {
            handleRemove(memberData);
        } else if (action === "Promote to Admin") {
            handleAdd(memberData);
        } else if (action === "Send Message") {
            const userId = memberData._id;
            if (userId !== undefined && userId !== null) {
                // Helper to navigate to chat - uses choose prop or falls back to custom event
                const navigateToChat = (contact) => {
                    if (typeof choose === 'function') {
                        choose("Chat", contact);
                    } else {
                        // Fallback: dispatch custom event that AuthenticatedUser listens for
                        window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { contact } }));
                    }
                    if (onShare) onShare();
                };

                const existingContact = contacts?.find(c =>
                    c.contactType === 'person' &&
                    c.members?.some(m => (m._id?._id || m._id)?.toString() === userId.toString())
                );
                if (existingContact) {
                    if (existingContact._id.toString() === chat._id.toString()) {
                        return;
                    } else {
                        navigateToChat(existingContact);
                    }
                } else {
                    const toastId = toast.loading("Adding contact...");
                    try {
                        const fd = new FormData();
                        fd.append("id", userId);
                        const res = await addContactById(fd);
                        if (res && res.status === 200) {
                            const newContact = res.data.contact;
                            const contactOtherMembers = newContact.members.filter(
                                member => (member._id?._id || member._id)?.toString() !== backendUser?._id?.toString()
                            );
                            const formattedContact = {
                                ...newContact,
                                otherMember: contactOtherMembers,
                                lastMessage: newContact.lastMessage
                            };
                            toast.success("Contact added", { id: toastId });
                            navigateToChat(formattedContact);
                        } else {
                            const errorMessage = res?.response?.data?.message || "Failed to add contact";
                            toast.error(errorMessage, { id: toastId });
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Error adding contact", { id: toastId });
                    }
                }
            }

        }
        setOpenMenuId(null); // Close menu after clicking an item
    };

    const filterContacts2 = (keyWord) => {

        return chat.members.filter(member => {
            // Resolve display name for comemntact

            let displayName;

            if (member.nickName) {
                displayName = member.nickLastName
                    ? formatName(member.nickName) + " " + formatName(member.nickLastName)
                    : formatName(member.nickName);
            } else if (member._id && member._id.name) {
                displayName = member._id.name + " " + member._id.lastName;
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
                a.otherMember[0]._id.name.localeCompare(b.otherMember[0]._id.name)
            )
            setFiltered(fliter)
            setIsSearching(true)
        }


    }
    const formatName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    return (
        <div className="bg-gray-100">
            <div className="bg-white flex items-center gap-4 px-4 py-3">
                <button
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                    onClick={() => Screen("main")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">
                    Members
                </Typography>
            </div>
            <div className=" ">
                <div className='w-full pb-3 px-6 bg-white'>
                    <input placeholder='Search...' type="text" onChange={(e) => handleSerch(e.target.value)} value={search} className='bg-white w-full h-8 focus:outline-none' />
                </div>
                <div className="h-4 bg-gray-100" />
                <div className="bg-white scrollbar-telegram overflow-y-auto h-[calc(100vh-40px)] pt-2" >

                    {(chat !== null && chat.members.length > 0 && isSearching == false) && (
                        <List>
                            {chat.members.map((member) => (
                                <CustomMenu
                                    key={member._id._id}
                                    data={member._id}
                                    chat={chat}
                                    isOpen={openMenuId === member._id._id}
                                    onOpen={() => handleMenuOpen(member._id._id)}
                                    onClose={handleMenuClose}
                                    onClick={handleMenuItemClick}
                                />
                            ))}
                        </List>
                    )}

                    {isSearching == true && (
                        <>
                            <List>
                                {filtered.map((member) => (
                                    <CustomMenu
                                        key={member._id._id}
                                        data={member._id}
                                        chat={chat}
                                        isOpen={openMenuId === member._id._id}
                                        onOpen={() => handleMenuOpen(member._id._id)}
                                        onClose={handleMenuClose}
                                        onClick={handleMenuItemClick}
                                    />
                                ))}
                            </List>
                            {filtered.length === 0 && (
                                <div className="flex flex-col items-center  h-full">
                                    <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
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
                        </>

                    )}
                </div>
            </div>
            {showFab && (
                <div className="flex justify-end px-5 py-2">
                    <AnimatePresence exitBeforeEnter>
                        <motion.button
                            onClick={() => setOpenAddContact(true)}
                            className="fixed bottom-7 w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#6f43db]"
                            aria-label="Save"
                            variants={fabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ willChange: "transform, opacity", zIndex: 50 }}
                        >
                            <RiUserAddLine size={28} className='text-white' />
                        </motion.button>
                    </AnimatePresence>
                </div>
            )}
            <AnimatePresence mode="wait">
                {openAdddContact && (
                    <motion.div
                        key="edit-panel"
                        className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                        variants={editPanelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        style={{ pointerEvents: "auto" }}
                    >
                        <AddMembers back={() => {

                            setOpenAddContact(false)

                        }}
                            member={(data) => {

                            }}
                            chat={chat}
                        />

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const CustomMenu = ({ data, onClick, chat, isOpen, onOpen, onClose }) => {

    const { backendUser, } = useContext(AuthContext);
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

        // DON'T open menu if it's the current user
        if (isCurrentUser) return;

        showMenu(e.clientX, e.clientY);
        onOpen(); // Notify parent to open this menu
    };

    const handleTouchStart = (e) => {
        // DON'T open menu if it's the current user
        if (isCurrentUser) return;

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
        // This should never be called for current user, but double-check
        if (isCurrentUser) return;

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
    const getRoll = (id) => {
        if (id.toString() === chat.owner.toString()) {
            return "Owner"
        } else if (chat.admins.includes(id) || chat.admins.some(a => a._id === id)) {
            return "Admin"
        } else {
            return null
        }
    }

    function formatLastSeen(isoDate) {
        const lastSeenDate = new Date(isoDate);
        const now = new Date();

        const diffMs = now - lastSeenDate; // difference in milliseconds
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        const zeroPad = (num) => num.toString().padStart(2, "0");

        const formatTime = (date) => `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Helper to check if two dates are same day
        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        // Helper to check if d1 is yesterday of d2
        const isYesterday = (d1, d2) => {
            const yesterday = new Date(d2);
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(d1, yesterday);
        };

        if (diffSeconds < 5) {
            return "last seen just now";
        } else if (diffMinutes < 1) {
            return `last seen ${diffSeconds} seconds ago`;
        } else if (diffMinutes < 60) {
            return `last seen ${diffMinutes} minutes ago`;
        } else if (isSameDay(lastSeenDate, now)) {
            return `last seen today at ${formatTime(lastSeenDate)}`;
        } else if (isYesterday(lastSeenDate, now)) {
            return `last seen yesterday at ${formatTime(lastSeenDate)}`;
        } else if (diffHours < 24 * 7) { // within last week
            return `last seen on ${daysOfWeek[lastSeenDate.getDay()]} at ${formatTime(lastSeenDate)}`;
        } else {
            // format date DD/MM/YYYY
            const d = lastSeenDate.getDate();
            const m = lastSeenDate.getMonth() + 1;
            const y = lastSeenDate.getFullYear();
            return `last seen on ${zeroPad(d)}/${zeroPad(m)}/${y} at ${formatTime(lastSeenDate)}`;
        }
    }

    return (
        <div
            ref={containerRef}
            className=" select-none w-full flex flex-col items-center px-1 py-0.5 relative"
        >
            <ListItem
                onContextMenu={handleContextMenu}
                onTouchStart={isCurrentUser ? undefined : handleTouchStart}
                onTouchEnd={isCurrentUser ? undefined : handleTouchEnd}
                onClick={() => {
                    if (isOpen) onClose();
                }}
                className={`flex justify-between items-center w-full max-w-sm bg-white transition-all active:scale-[0.98] border border-transparent hover:bg-gray-100 rounded-xl ${isCurrentUser ? "cursor-default" : "cursor-pointer"
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
                            {data.isOnline ? "Online" : formatLastSeen(data.lastSeen)}
                        </span>
                    </div>
                </div>
                <ListItemSuffix>{getRoll(data._id)}</ListItemSuffix>
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
                                    onClick("Promote to Admin", data);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 focus:bg-slate-50 active:bg-slate-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <TbUserUp size={20} className="text-black " />
                                </div>
                                <Typography className="text-[14px] font-semibold text-black ">
                                    Promote to Admin
                                </Typography>
                            </ListItem>

                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick("Delete", data);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 focus:bg-red-50 active:bg-red-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <RiUserForbidLine size={20} className="text-black group-hover:text-red-600 transition-colors" />
                                </div>
                                <Typography className="text-[14px] font-medium text-black group-hover:text-red-700">
                                    Block User
                                </Typography>
                            </ListItem>
                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick("Remove", data);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 focus:bg-red-50 active:bg-red-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <RxTrash size={20} className="text-black group-hover:text-red-600 transition-colors" />
                                </div>
                                <Typography className="text-[14px] font-medium text-black group-hover:text-red-700">
                                    Remove from {chat.contactType}
                                </Typography>
                            </ListItem>
                        </List>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default MemberScreen;