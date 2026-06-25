import React, { useState, useContext, useEffect, useRef } from 'react'
import {
    List,
    Typography,

    ListItem,
} from "@material-tailwind/react";
import { AuthContext } from '../firebase hooks/AuthContext';
import { RiUserAddLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import UserAvatar from "../UserAvatar"
import AdminPanel from './AdminPanel';
import AddAdminsPopUp from './AddAdminPopUp';
import Lottie from 'lottie-react';
import myAnimation from "../lottie/404 errornotfound.json"
import { formatName } from '../helper/formatName';
function AdministrationScreen({ Screen, chat }) {
    const { addAdmin, backendUser, addAdminInChanel } = useContext(AuthContext)
    useEffect(() => {
        const isAdmin = chat.admins.some(user => user._id.toString() === backendUser._id.toString());
        const isOwner = chat.owner.toString() === backendUser._id.toString();
        if (!isAdmin && !isOwner) {
            setShowFab(false);
        }
    })
    const [popupOpen, setPopupOpen] = useState(false);

    const isAdminPopupPushedRef = useRef(false);

    // Sync popupOpen state with history
    useEffect(() => {
        if (popupOpen) {
            if (!isAdminPopupPushedRef.current) {
                isAdminPopupPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, adminPopupOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isAdminPopupPushedRef.current) {
                isAdminPopupPushedRef.current = false;
                if (window.history.state?.adminPopupOpen) {
                    window.history.back();
                }
            }
        }
    }, [popupOpen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (popupOpen && !e.state?.adminPopupOpen) {
                isAdminPopupPushedRef.current = false;
                setPopupOpen(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [popupOpen]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    const [screen, setScreen] = useState('main');

    const isAdminScreenPushedRef = useRef(false);

    // Sync screen state with history
    useEffect(() => {
        if (screen !== 'main') {
            if (!isAdminScreenPushedRef.current) {
                isAdminScreenPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, adminScreenSub: screen, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isAdminScreenPushedRef.current) {
                isAdminScreenPushedRef.current = false;
                if (window.history.state?.adminScreenSub) {
                    window.history.back();
                }
            }
        }
    }, [screen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (screen !== 'main' && !e.state?.adminScreenSub) {
                isAdminScreenPushedRef.current = false;
                setScreen('main');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [screen]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);
    const [showFab, setShowFab] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const adminVariants = {
        hidden: { x: "100%" },       // Offscreen right (closed)
        visible: { x: 0 },           // Onscreen left (open)
        exit: { x: "100%" }          // Slide out right (closing)
    };

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

    const filterContacts2 = (keyWord) => {
        return chat.admins.filter(member => {
            let displayName = "";

            if (member.nickName) {
                displayName = member.nickLastName
                    ? member.nickName + " " + member.nickLastNam
                    : member.nickName;
            } else if (member.name && member.lastName) {
                displayName = member.name + " " + member.lastName;
            } else if (member.otherMember && member.otherMember[0] && member.otherMember[0]._id && member.otherMember[0]._id.name) {
                const otherPerson = member.otherMember[0]._id;
                displayName = otherPerson.lastName
                    ? otherPerson.name + " " + otherPerson.lastName
                    : otherPerson.name;
            } else if (member._id && member._id.name) {
                displayName = member._id.name;
            }

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
    const getRoll = (id) => {
        if (id.toString() === chat.owner.toString()) {
            return "Owner"
        } else if (chat.admins.includes(id) || chat.admins.some(a => a._id === id)) {
            return "Admin"
        } else {
            null
        }
    }
    const handleAdd = async (chatId, userId) => {

        const isAlreadyAdmin = chat.admins.some(user => user._id.toString() === userId);
        if (isAlreadyAdmin) {
            const adminData = chat.admins.find(user => user._id.toString() === userId);
            setSelected(adminData)

            setScreen('second')
            setFiltered([]);
            setIsSearching(false);
            setSearch("")
        } else {

            const fd = new FormData();

            fd.append("userId", userId);
            fd.append("groupId", chatId);
            if (chat.contactType === "group") {
                const res = await addAdmin(fd);
                if (res.status === 200) {

                    setSelected(res.data.adminData)

                    setScreen('second')
                    setFiltered([]);
                    setIsSearching(false);
                    setSearch("")


                }
            } else if (chat.contactType === "channel") {
                fd.append("channelId", chatId);
                const res = await addAdminInChanel(fd);
                if (res.status === 200) {

                    setSelected(res.data.adminData)

                    setScreen('second')
                    setFiltered([]);
                    setIsSearching(false);
                    setSearch("")


                }
            }

        }


    }

    return (
        <div className="">
            <div
                className="fixed right-0 top-0 h-full bg-white shadow-2xl  w-full md:w-96"
                style={{
                    // md:w-96
                    zIndex: screen === "main" ? 40 : 30, // lower than admin if hidden
                    display: screen === "admin" ? "block" : "block" // always display, but layered
                }}
            >
                <div className="bg-gray-100">
                    <div className="bg-white flex items-center gap-4 px-4 py-3">
                        <button
                            className="p-2 rounded-full hover:bg-gray-200 transition"
                            onClick={() => Screen("main")}
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                        </button>
                        <Typography variant="h5" color="blue-gray">
                            Administration
                        </Typography>
                    </div>
                    <div className=" ">
                        <div className='w-full pb-3 px-6 bg-white'>
                            <input placeholder='Search...' type="text" className='bg-white w-full h-8 focus:outline-none' value={search} onChange={(e) => handleSerch(e.target.value)} />
                        </div>
                        <div className="h-4 bg-gray-100" />
                        <div className="bg-white scrollbar-telegram overflow-y-auto h-[calc(100dvh-40px)] pt-2" >

                            {(chat !== null && chat.admins.length > 0 && isSearching === false) && (
                                <List>
                                    {chat.admins.map((admin) => (
                                        <ListItem
                                            onClick={() => {
                                                setSelected(admin)
                                                setScreen('second')
                                                setFiltered([]);
                                                setIsSearching(false);
                                                setSearch("")
                                            }}
                                            key={admin._id}
                                            className="flex justify-between items-center"
                                        >
                                            <div className="flex items-center space-x-3 py-1 px-1  rounded cursor-pointer transition-all">
                                                <UserAvatar    {...(admin !== null && admin.profile.type === 'image' && {
                                                    image: admin.profile
                                                        .imageUrl,
                                                })}
                                                    {...(admin !== null && admin.profile.type === 'emoji' && {
                                                        emoji: admin.profile.emoji,
                                                        simpleBg: admin.profile.bgColor,
                                                    })}
                                                    {...(admin !== null && admin.profile.type === 'initials' && {
                                                        simpleBg: admin.profile.bgColor,
                                                        text: admin.profile.initials,

                                                    })} />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-md flex items-center">
                                                        {formatName(admin.name)}{" "}{formatName(admin.lastName)}
                                                    </span>
                                                    <span className="text-gray-500 font-medium text-sm">{getRoll(admin._id)}</span>
                                                </div>
                                            </div>
                                        </ListItem>
                                    ))}

                                </List>
                            )}

                            {isSearching === true && (
                                <>
                                    <List>
                                        {filtered.map((admin) => (
                                            <ListItem
                                                onClick={() => {
                                                    setSelected(admin)
                                                    setScreen('second')
                                                    setFiltered([]);
                                                    setIsSearching(false);
                                                    setSearch("")
                                                }}
                                                key={chat.id}
                                                className="flex justify-between items-center"
                                            >
                                                <div className="flex items-center space-x-3 py-1 px-1  rounded cursor-pointer transition-all">
                                                    <UserAvatar    {...(admin !== null && admin.profile.type === 'image' && {
                                                        image: admin.profile
                                                            .imageUrl,
                                                    })}
                                                        {...(admin !== null && admin.profile.type === 'emoji' && {
                                                            emoji: admin.profile.emoji,
                                                            simpleBg: admin.profile.bgColor,
                                                        })}
                                                        {...(admin !== null && admin.profile.type === 'initials' && {
                                                            simpleBg: admin.profile.bgColor,
                                                            text: admin.profile.initials,

                                                        })} />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-md flex items-center">
                                                            {formatName(admin.name)}{" "}{formatName(admin.lastName)}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">{getRoll(admin._id)}</span>
                                                    </div>
                                                </div>
                                            </ListItem>

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
                                    onClick={() => setPopupOpen(true)} className="fixed bottom-7  w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#6f43db]" // removed transition
                                    aria-label="Save"
                                    variants={fabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    style={{ willChange: "transform, opacity", zIndex: 50 }}
                                >
                                    <RiUserAddLine size={28} className='text-white' />
                                    {/* <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-7 h-7 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                          >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                              />
                          </svg> */}
                                </motion.button>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
                {/* AnimatePresence only for admin panel */}
                <AnimatePresence>
                    {screen === "second" && (
                        <motion.div
                            key="groupType"
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <AdminPanel Screen={(e) => setScreen(e)} chat={chat} selectedAdmin={selected} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {popupOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%", scale: 0.98 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1
                        }}
                        exit={{
                            opacity: 0,
                            y: "100%",
                            scale: 0.98,
                            transition: { duration: 0.2, ease: "easeIn" }
                        }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 350,
                            velocity: 2
                        }}
                        style={{
                            backdropFilter: "blur(4px)",        // Increased blur for better effect
                            backgroundColor: "transparent",     // Already transparent ✓
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            top: 0,                            // Changed from height: '100vh'
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ pointerEvents: 'auto' }}>
                            <AddAdminsPopUp
                                onShare={(chatId, userId) => handleAdd(chatId, userId)}
                                chat={chat}
                                isOpen={popupOpen}
                                onClose={() => setPopupOpen(false)}

                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AdministrationScreen