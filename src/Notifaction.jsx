import React, { useContext, useState, useEffect } from 'react'
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
    Spinner,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { AuthContext } from './firebase hooks/AuthContext';
import Avatar from "./UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
function getAvatarProps(profile) {
    if (!profile) return {};
    if (profile.type === 'image') return { image: profile.imageUrl };
    if (profile.type === 'emoji') return { emoji: profile.emoji, simpleBg: profile.bgColor, emojiSize: "text-2xl" };
    if (profile.type === 'initials') return { simpleBg: profile.bgColor, text: profile.initials };
    return {};
}

const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Declined' },
];

const contentVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function Notifaction({ Choose }) {
    const { notifiaction, approveInvite, declineInvite, removeNotification } = useContext(AuthContext);
    const [notification, setNotification] = useState(notifiaction);
    const [activeTab, setActiveTab] = useState('all');
    const [direction, setDirection] = useState(0);
    const [loadingStates, setLoadingStates] = useState({});

    useEffect(() => {
        setNotification(notifiaction);
    }, [notifiaction]);
    const activeIndex = tabs.findIndex(t => t.key === activeTab);

    const handleTabChange = (key) => {
        const newIndex = tabs.findIndex(t => t.key === key);
        const oldIndex = tabs.findIndex(t => t.key === activeTab);
        setDirection(newIndex > oldIndex ? 1 : -1);
        setActiveTab(key);
    };

    const filtered = (notification || []).filter(n => {
        if (activeTab === 'all') return true;
        return n.status === activeTab;
    });

    const handleApprove = async (contactId, notifiactionId) => {
        setLoadingStates(prev => ({ ...prev, [notifiactionId]: 'approve' }));
        const res = await approveInvite(contactId, notifiactionId);
        setLoadingStates(prev => ({ ...prev, [notifiactionId]: null }));
        if (res.status === 200) {
            toast.success(res.message);
            setNotification(prev => prev.map(n => n._id === notifiactionId ? { ...n, status: 'approved' } : n));
        } else {
            toast.error(res.message);
        }
    }

    const handleDecline = async (contactId, notifiactionId) => {
        setLoadingStates(prev => ({ ...prev, [notifiactionId]: 'decline' }));
        const res = await declineInvite(contactId, notifiactionId);
        setLoadingStates(prev => ({ ...prev, [notifiactionId]: null }));
        if (res.status === 200) {
            toast.success(res.message);
            setNotification(prev => prev.map(n => n._id === notifiactionId ? { ...n, status: 'rejected' } : n));
        } else {
            toast.error(res.message);
        }
    }

    const handleDelete = async (contactId, notifiactionId) => {
        const res = await removeNotification(contactId, notifiactionId);
        if (res?.status === 200) {
            toast.success("Notification removed");
        } else {
            toast.error(res?.response?.data?.message || "Failed to remove");
        }
    };

    return (
        <div className="select-none h-full bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 shadow-sm">
                <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">
                    Notifications
                </Typography>
            </div>

            {/* Tabs */}
            <div className="relative flex border-b border-gray-200">
                {tabs.map((tab) => {
                    const count = (notification || []).filter(n => tab.key === 'all' ? true : n.status === tab.key).length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200
                                ${activeTab === tab.key
                                    ? 'text-[#6F57D0]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-blue-400' : 'text-gray-400'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
                {/* Sliding indicator */}
                <motion.div
                    className="absolute bottom-0 h-[2px] bg-[#6F57D0] rounded-full"
                    animate={{
                        left: `${activeIndex * (100 / tabs.length) + (100 / tabs.length) * 0.15}%`,
                        width: `${(100 / tabs.length) * 0.7}%`,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={contentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                                <p className="text-sm">No {activeTab === 'all' ? '' : activeTab} requests</p>
                            </div>
                        ) : (
                            <List>
                                {filtered.map((notif) => {
                                    const user = notif.userId;
                                    const group = notif.groupId;
                                    if (!user || !group) return null;

                                    const isChannel = group.contactType === 'channel';
                                    const userName = `${user.name || ''}${user.lastName ? ' ' + user.lastName : ''}`.trim() || 'Unknown';
                                    const groupName = group.name || 'Unknown';

                                    return (
                                        <ListItem key={notif._id} ripple={false} className="flex-col items-start gap-2 py-3 cursor-default">
                                            {/* User + Group row */}
                                            <div className="flex items-center gap-3 w-full">
                                                <ListItemPrefix>
                                                    <Avatar {...getAvatarProps(user.profile)} />
                                                </ListItemPrefix>
                                                <div className="flex-1 min-w-0">
                                                    <Typography className="font-semibold text-sm text-black leading-tight">
                                                        {userName}
                                                    </Typography>
                                                    <Typography className="text-xs text-gray-500 leading-tight mt-0.5">
                                                        wants to join <span className="font-semibold text-gray-700">{groupName}</span>
                                                        <span className="text-gray-400"> · {isChannel ? 'Channel' : 'Group'}</span>
                                                    </Typography>
                                                </div>
                                                <Avatar {...getAvatarProps(group.details?.profile)} size="w-9 h-9" textSize="text-xs" />
                                            </div>

                                            {/* Buttons — only for pending */}
                                            {notif.status === 'pending' && (
                                                <div className="flex gap-2 w-full mt-1 pl-14">
                                                    <button 
                                                        disabled={loadingStates[notif._id]}
                                                        onClick={() => handleApprove(notif.groupId._id, notif._id)} 
                                                        className="flex items-center justify-center gap-2 flex-1 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {loadingStates[notif._id] === 'approve' && <Spinner className="h-4 w-4" />}
                                                        Approve
                                                    </button>
                                                    <button 
                                                        disabled={loadingStates[notif._id]}
                                                        onClick={() => handleDecline(notif.groupId._id, notif._id)} 
                                                        className="flex items-center justify-center gap-2 flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {loadingStates[notif._id] === 'decline' && <Spinner className="h-4 w-4" />}
                                                        Decline
                                                    </button>
                                                </div>
                                            )}

                                            {/* Status badge + delete for approved/declined */}
                                            {notif.status === 'approved' && (
                                                <div className="flex items-center justify-between pl-14 pr-1">
                                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Approved</span>
                                                    <button
                                                        onClick={() => handleDelete(notif.groupId._id, notif._id)}
                                                        className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Remove notification"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            {notif.status === 'rejected' && (
                                                <div className="flex items-center justify-between pl-14 pr-1">
                                                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Declined</span>
                                                    <button
                                                        onClick={() => handleDelete(notif.groupId._id, notif._id)}
                                                        className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Remove notification"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}