import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IoMdClose } from "react-icons/io";
import UserAvatar from './UserAvatar';
import Lottie from 'lottie-react';
import myAnimation from "./lottie/404 errornotfound.json";
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
} from "@material-tailwind/react";

export default function ForwardPopup({ isOpen, onClose, contacts, onContactClick, backendUser }) {
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef(null);

    // Auto-focus the search bar when the popup opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50);
        }
    }, [isOpen]);

    const isHistoryPushedRef = useRef(false);

    // Handle history push/pop for browser back button support
    useEffect(() => {
        if (isOpen && !isHistoryPushedRef.current) {
            isHistoryPushedRef.current = true;
            window.history.pushState(
                { forwardPopupOpen: true },
                '',
                window.location.pathname + window.location.hash
            );
        } else if (!isOpen && isHistoryPushedRef.current) {
            isHistoryPushedRef.current = false;
            if (window.history.state?.forwardPopupOpen) {
                window.history.back();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (isHistoryPushedRef.current && !e.state?.forwardPopupOpen) {
                isHistoryPushedRef.current = false;
                onClose();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    const handleClose = useCallback(() => {
        setSearchQuery("");
        onClose();
    }, [onClose]);
    const isSendAllowed = (user) => {
        if (user.contactType === "person") {
            return true;
        } else if (user.contactType === "group") {
            const isOwner = user.owner?.toString() === backendUser?._id?.toString();
            if (isOwner) return true;
            const isAdmin = user.admins?.some(admin => admin._id?.toString() === backendUser?._id?.toString());
            if (isAdmin) return true;
            const isMember = user.members?.some(member => member._id?.toString() === backendUser?._id?.toString());
            if (isMember) {
                return user.membersPermissions?.sendMesseges !== false;
            }
            return false;
        } else if (user.contactType === "channel") {
            const isOwner = user.owner?.toString() === backendUser?._id?.toString();
            if (isOwner) return true;
            const isAdmin = user.admins?.some(admin => admin._id?.toString() === backendUser?._id?.toString());
            if (isAdmin) return true;
            return false;
        }
        return false;
    };

    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        return contacts.filter(c => {
            if (!isSendAllowed(c)) return false;
            const name = c.name?.toLowerCase() || c.username?.toLowerCase() || '';
            const isGroupOrChannel = c.contactType === 'group' || c.contactType === 'channel';
            const contactName = isGroupOrChannel ? c.name?.toLowerCase() : (c.members?.find(m => m._id)?.name?.toLowerCase() || c.contactName?.toLowerCase() || '');
            return name.includes(searchQuery.toLowerCase()) || contactName?.includes(searchQuery.toLowerCase());
        });
    }, [contacts, searchQuery, backendUser]);

    if (!isOpen) return null;

    const formatName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
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

    return createPortal(
        <div className="select-none fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-40 p-2" onClick={handleClose}>
            <div
                className="relative bg-white rounded-2xl p-4 w-[350px] max-w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Input Field */}
                <div className="flex items-center mb-6">
                    <IoMdClose size={27} onClick={handleClose} className="cursor-pointer text-gray-700 hover:text-gray-600" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Forward to..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full border-none text-lg caret-[1px] focus:caret-gray-600 focus:outline-none px-2"
                    />
                </div>

                {/* Contacts List */}
                <div id="scrollable-content" className="scrollbar-telegram overflow-y-auto max-h-[60vh]">
                    {contacts && contacts.length > 0 && (
                        <List>
                            {filteredContacts.map((user) => (
                                user.contactType == "person" ? (
                                    <ListItem


                                        onClick={() => {
                                            onContactClick(user)
                                        }}
                                        key={user._id}
                                        className={`flex justify-between items-center
                          
                         `}
                                    >
                                        {/* Left side - Icon + Text */}

                                        <div className="flex items-center gap-3">
                                            <ListItemPrefix>
                                                <UserAvatar    {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'image' && {
                                                    image: user.otherMember[0]._id.profile.imageUrl,
                                                })}
                                                    {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'emoji' && {
                                                        emoji: user.otherMember[0]._id.profile
                                                            .emoji,
                                                        simpleBg: user.otherMember[0]._id.profile
                                                            .bgColor,
                                                        emojiSize: "text-3xl"
                                                    })}
                                                    {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'initials' && {
                                                        simpleBg: user.otherMember[0]._id.profile
                                                            .bgColor,
                                                        text: user.otherMember[0]._id.profile.initials

                                                    })} />
                                            </ListItemPrefix>

                                            <div className="flex flex-col">
                                                {/* Name */}
                                                <Typography className={`font-semibold text-lg`}>
                                                    {user.otherMember[0]._id.name ? (user.otherMember[0]._id.lastName ? (formatName(user.otherMember[0]._id.name) + " " + formatName(user.otherMember[0]._id.lastName)) : (formatName(user.otherMember[0]._id.name))) : (null)}
                                                </Typography>

                                                <Typography
                                                    variant="small"

                                                    className={`text-sm  font-medium max-w-[180px] truncate text-gray-700`}
                                                >
                                                    {user.contactType == "person" && (user.otherMember[0]._id.isOnline ? "Online" : formatLastSeen(user.otherMember[0]._id.lastSeen))}
                                                </Typography>

                                            </div>
                                        </div>

                                        {/* Right side - Time + Unread bubble */}

                                    </ListItem>
                                ) : user.contactType == "group" ? (
                                    <ListItem


                                        onClick={() => {
                                            onContactClick(user)
                                        }}
                                        key={user._id}
                                        className={`flex justify-between items-center
                         "}
                         `}
                                    >
                                        {/* Left side - Icon + Text */}

                                        <div className="flex items-center gap-3">
                                            <ListItemPrefix>
                                                <UserAvatar    {...(user.details.profile !== null && user.details.profile.type === 'image' && {
                                                    image: user.details.profile.imageUrl,
                                                })}
                                                    {...(user.details.profile !== null && user.details.profile.type === 'emoji' && {
                                                        emoji: user.details.profile
                                                            .emoji,
                                                        simpleBg: user.details.profile
                                                            .bgColor,
                                                        emojiSize: "text-3xl"
                                                    })}
                                                    {...(user.details.profile !== null && user.details.profile.type === 'initials' && {
                                                        simpleBg: user.details.profile
                                                            .bgColor,
                                                        text: user.details.profile.initials,

                                                    })} />
                                            </ListItemPrefix>

                                            <div className="flex flex-col">
                                                {/* Name */}
                                                <Typography className={`font-semibold text-lg `}>

                                                    {user.contactType == "group" && (
                                                        user.name
                                                    )}
                                                </Typography>

                                                <Typography

                                                    className={`text-sm font-medium   max-w-[180px] truncate `}
                                                >
                                                    {user.contactType == "group" && (
                                                        user.members.length > 1 ? (`${user.members.length} Members`) : (`${user.members.length} Member`)
                                                    )}
                                                </Typography>

                                            </div>
                                        </div>


                                    </ListItem>
                                ) : user.contactType == "channel" ? (
                                    <ListItem


                                        onClick={() => {
                                            onContactClick(user)
                                        }}
                                        key={user._id}
                                        className={`flex justify-between items-center
                         "}
                         `}
                                    >
                                        {/* Left side - Icon + Text */}

                                        <div className="flex items-center gap-3">
                                            <ListItemPrefix>
                                                <UserAvatar    {...(user.details.profile !== null && user.details.profile.type === 'image' && {
                                                    image: user.details.profile.imageUrl,
                                                })}
                                                    {...(user.details.profile !== null && user.details.profile.type === 'emoji' && {
                                                        emoji: user.details.profile
                                                            .emoji,
                                                        simpleBg: user.details.profile
                                                            .bgColor,
                                                        emojiSize: "text-3xl"
                                                    })}
                                                    {...(user.details.profile !== null && user.details.profile.type === 'initials' && {
                                                        simpleBg: user.details.profile
                                                            .bgColor,
                                                        text: user.details.profile.initials,

                                                    })} />
                                            </ListItemPrefix>

                                            <div className="flex flex-col">
                                                {/* Name */}
                                                <Typography className={`font-semibold text-lg `}>

                                                    {user.contactType == "channel" && (
                                                        user.name
                                                    )}
                                                </Typography>

                                                <Typography

                                                    className={`text-sm font-medium   max-w-[180px] truncate `}
                                                >
                                                    {user.contactType == "channel" && (
                                                        user.members.length > 1 ? (`${user.members.length} Members`) : (`${user.members.length} Member`)
                                                    )}
                                                </Typography>

                                            </div>
                                        </div>


                                    </ListItem>
                                ) : null
                            ))}

                            {searchQuery && filteredContacts.length === 0 && (
                                <div className="flex flex-col items-center h-full">
                                    <Lottie animationData={myAnimation} loop={true} style={{ height: 110, width: 110 }} />
                                    <div className="flex flex-col items-center">
                                        <Typography className="font-medium text-lg text-center">
                                            No Result
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="gray"
                                            className="text-sm max-w-[180px] text-center font-normal"
                                        >
                                            There were no result for "{searchQuery}".
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
                        </List>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );
}
