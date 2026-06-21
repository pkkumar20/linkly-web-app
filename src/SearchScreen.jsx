// SidebarWithLogo.jsx
import './scrollbar.css';

import React, { useRef, useEffect, useContext, useCallback, useMemo } from "react";
import {
    Typography,
    List,
    ListItem,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon
} from "@heroicons/react/24/solid";
import ScrollableTabBar from './ScrollableTabBar';
import FileCard from './FileCard';
import MusicCard from './MusicCard';
import { useState } from 'react';
import LinkCard from './LinkCard';
import MediaGallery from './MediaGallery';
import { AuthContext } from "./firebase hooks/AuthContext";
import ForwardPopup from './ForwardPopup';
import toast from 'react-hot-toast';
import { formatName } from './helper/formatName';

const FMFwdIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>;
const FMDlIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const FMChatIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const FMSelIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

import { motion, AnimatePresence } from "framer-motion";

const TABS_ORDER = ['Chats', 'Channels', 'Groups', 'Media', 'Links', 'Files', 'Music', 'Voice'];
import UserAvatar from "./UserAvatar";
import Lottie from 'lottie-react';
import myAnimation from "./lottie/404 errornotfound.json"
export default function SerchScreen({ Choose, inputRef }) {
    const { backendUser, contacts, recentChats } = useContext(AuthContext);

    const scrollContainerRef = useRef(null);
    const scrollThumbRef = useRef(null);
    const scrollTrackRef = useRef(null);
    const rafRef = useRef(null);

    const [isTabMounted, setIsTabMounted] = useState(true);

    const [isFocused, setIsFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [tab, setTab] = useState("Chats");
    const [direction, setDirection] = useState("right");
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showForward, setShowForward] = useState(false);
    const [forwardItem, setForwardItem] = useState(null);
    const [closeViewer, setCloseViewer] = useState(false);
    const isSelectionMode = selectedItems.length > 0;

    const toggleSelection = (item) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(i => i._uid === item._uid);
            if (isSelected) {
                return prev.filter(i => i._uid !== item._uid);
            } else {
                return [...prev, item];
            }
        });
    };
    const ContactsWithOtherMember = () => {
        const prContacts = contacts.map((contact) => {
            if (contact.contactType === "person") {
                const otherMember = contact.members?.filter(
                    member => member._id?._id.toString() !== backendUser?._id.toString()
                ) || [];
                return {
                    ...contact,
                    otherMember: otherMember,
                    lastMessage: contact.lastMessage
                };
            }
            return contact;
        });
        return prContacts;

    }
    const [personContacts, setPersonContacts] = useState([])
    const [groupContacts, setGroupContacts] = useState([])
    const [channels, setChannels] = useState([])
    const [mediaFiles, setMediaFiles] = useState([])
    const [links, setLinks] = useState([])
    const [files, setFiles] = useState([])
    const [music, setMusic] = useState([])
    const [voice, setVoice] = useState([])
    const [locations, setLocations] = useState([])
    const [audioPlayer, setAudioPlayer] = useState(null)

    // ── Ref-based scrollbar (no React re-renders on scroll) ──
    const updateScrollbar = useCallback(() => {
        // Disabled custom scrollbar overlay
    }, []);

    useEffect(() => {
        updateScrollbar();
        const t = setTimeout(updateScrollbar, 150);
        window.addEventListener('resize', updateScrollbar);
        return () => { window.removeEventListener('resize', updateScrollbar); clearTimeout(t); };
    }, [tab, mediaFiles, files, music, personContacts, groupContacts, channels, isSelectionMode, updateScrollbar]);

    const handleScroll = useCallback(() => {
        if (rafRef.current) return;           // already scheduled
        rafRef.current = requestAnimationFrame(() => {
            updateScrollbar();
            rafRef.current = null;
        });
    }, [updateScrollbar]);
    const getContacts = (type) => {
        const foundChats = contacts.filter(contact => contact.contactType === type).map((contact) => {
            const otherMember = contact.members?.filter(
                member => member._id?._id.toString() !== backendUser?._id.toString()
            ) || [];
            return {
                ...contact,
                otherMember: otherMember,
                lastMessage: contact.lastMessage
            };
        })
        return foundChats;
    }

    const getChatName = (chat) => {
        if (chat.contactType === 'person') {
            const other = chat.otherMember?.[0]?._id;
            return other ? `${other.name || ''} ${other.lastName || ''}`.trim() : "Unknown";
        }
        return chat.name || "Unknown";
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatTelegramDate = (dateParam) => {
        if (!dateParam) return '';
        const dateObj = new Date(dateParam);
        const now = new Date();
        const isSameDay = dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth() && dateObj.getDate() === now.getDate();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = dateObj.getFullYear() === yesterday.getFullYear() && dateObj.getMonth() === yesterday.getMonth() && dateObj.getDate() === yesterday.getDate();
        const timeOnly = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (isSameDay) return timeOnly;
        if (isYesterday) return "Yesterday";
        if (dateObj.getFullYear() === now.getFullYear()) return dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        return dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getMedia = () => {
        let allMediaUrls = [];
        if (recentChats && recentChats.length > 0) {
            let allMsgs = [];
            recentChats.forEach(chat => {
                if (chat.messages && Array.isArray(chat.messages)) {
                    allMsgs.push(...chat.messages);
                }
            });
            allMsgs.sort((a, b) => new Date(b.time) - new Date(a.time));

            allMsgs.forEach(msg => {
                let senderName = 'Unknown';
                let senderProfile = null;

                if (msg.sender && typeof msg.sender === 'object') {
                    senderName = `${msg.sender.name || ''} ${msg.sender.lastName || ''}`.trim() || 'Unknown';
                    senderProfile = msg.sender.profile;
                }

                if (msg.chatType === "image" && msg.images) {
                    msg.images.forEach(img => allMediaUrls.push({
                        url: img.url,
                        type: 'image',
                        time: msg.time,
                        senderName,
                        senderProfile,
                        msg: msg,
                        messageId: msg._realId || msg._id,
                        mediaItemId: img._id,
                        _uid: `${msg._realId || msg._id}_${img._id}`,
                        name: img.name || 'image.jpg',
                        media: img
                    }));
                } else if (msg.chatType === "video" && msg.videos) {
                    msg.videos.forEach(vid => allMediaUrls.push({
                        url: vid.url,
                        type: 'video',
                        time: msg.time,
                        senderName,
                        senderProfile,
                        msg: msg,
                        messageId: msg._realId || msg._id,
                        mediaItemId: vid._id,
                        _uid: `${msg._realId || msg._id}_${vid._id}`,
                        name: vid.name || 'video.mp4',
                        media: vid
                    }));
                }
            });
        }
        return allMediaUrls;
    }

    const getFilesAndMusic = () => {
        let allFiles = [];
        let allMusic = [];
        if (recentChats && recentChats.length > 0) {
            let allMsgs = [];
            recentChats.forEach(chat => {
                if (chat.messages && Array.isArray(chat.messages)) {
                    chat.messages.forEach(msg => {
                        allMsgs.push({ ...msg, _chatName: getChatName(chat) });
                    });
                }
            });
            allMsgs.sort((a, b) => new Date(b.time) - new Date(a.time));

            const musicExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];

            allMsgs.forEach(msg => {
                if (msg.chatType === "document" && msg.documents) {
                    msg.documents.forEach(doc => {
                        const ext = doc.name?.split('.').pop().toLowerCase();

                        const fileObj = {
                            fileName: doc.name,
                            fileSize: formatFileSize(doc.size),
                            fileSource: msg.sender?.name ? `${msg.sender.name} ${msg.sender.lastName || ''}`.trim() : 'Unknown',
                            fileDate: formatTelegramDate(msg.time),
                            url: doc.url,
                            title: doc.name,
                            size: formatFileSize(doc.size),
                            source: msg.sender?.name ? `${msg.sender.name} ${msg.sender.lastName || ''}`.trim() : 'Unknown',
                            date: msg.time,
                            rightDate: `${new Date(msg.time).getMonth() + 1}/${new Date(msg.time).getDate()}/${new Date(msg.time).getFullYear()}`,
                            msg: msg,
                            messageId: msg._realId || msg._id,
                            mediaItemId: doc._id || Math.random().toString(),
                            _uid: `${msg._realId || msg._id}_${doc._id || Math.random().toString()}`,
                            type: 'document',
                            name: doc.name,
                            senderName: msg.sender?.name ? `${msg.sender.name} ${msg.sender.lastName || ''}`.trim() : 'Unknown',
                            senderProfile: msg.sender?.profile || null,
                            media: doc,

                        };

                        if (musicExts.includes(ext)) {
                            allMusic.push(fileObj);
                        } else {
                            allFiles.push(fileObj);
                        }
                    });
                }
            });
        }
        return { files: allFiles, music: allMusic };
    }

    const groupMusicData = (musicItems) => {
        const grouped = {};
        musicItems.forEach(item => {
            const d = new Date(item.date);
            const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!grouped[monthName]) grouped[monthName] = [];
            grouped[monthName].push(item);
        });
        return grouped;
    }

    const getLinksFromChats = () => {
        let allLinks = [];
        const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;

        if (recentChats && recentChats.length > 0) {
            let allMsgs = [];
            recentChats.forEach(chat => {
                if (chat.messages && Array.isArray(chat.messages)) {
                    chat.messages.forEach(msg => {
                        allMsgs.push({ ...msg, _chatName: getChatName(chat) });
                    });
                }
            });
            allMsgs.sort((a, b) => new Date(b.time) - new Date(a.time));

            allMsgs.forEach(msg => {
                let textToSearch = "";

                if (msg.content) textToSearch += msg.content + " ";

                const matches = textToSearch.match(URL_REGEX);
                if (matches && matches.length > 0) {
                    let senderName = 'Unknown';
                    let senderData = {}
                    let avatar = 'U';

                    if (msg.sender && typeof msg.sender === 'object') {
                        senderName = `${msg.sender.name || ''} ${msg.sender.lastName || ''}`.trim() || 'Unknown';
                        avatar = senderName.charAt(0).toUpperCase();
                        senderData = msg.sender.profile;
                    } else {
                        senderName = 'Unknown';
                        avatar = senderName.charAt(0).toUpperCase();
                    }

                    const timeString = formatTelegramDate(msg.time);

                    const contentLines = [];
                    if (msg.content) {
                        contentLines.push(...msg.content.split('\n'));
                    }
                    if (msg.caption) {
                        contentLines.push(...msg.caption.split('\n'));
                    }

                    allLinks.push({
                        senderData: senderData,
                        sender: senderName,
                        avatar: avatar,
                        time: timeString,
                        contentLines: contentLines,
                        rawTime: msg.time,
                        url: matches[0],
                        msgId: msg._realId || msg._id || Math.random().toString(),
                        msg: msg,
                        type: 'link',
                        _uid: msg._realId || msg._id || Math.random().toString()
                    });
                }
            });
        }
        return allLinks;
    }

    const getLocationsFromChats = () => {
        let allLocations = [];
        if (recentChats && recentChats.length > 0) {
            let allMsgs = [];
            recentChats.forEach(chat => {
                if (chat.messages && Array.isArray(chat.messages)) {
                    chat.messages.forEach(msg => {
                        allMsgs.push({ ...msg, _chatName: getChatName(chat) });
                    });
                }
            });
            allMsgs.sort((a, b) => new Date(b.time) - new Date(a.time));

            allMsgs.forEach(msg => {
                if (msg.chatType === "location") {
                    allLocations.push({
                        senderName: msg.sender?.name ? `${msg.sender.name} ${msg.sender.lastName || ''}`.trim() : 'Unknown',
                        time: formatTelegramDate(msg.time),
                        rawTime: msg.time,
                        location: msg.locationDetails,
                        msgId: msg._realId || msg._id,
                        msg: msg,
                        _uid: msg._realId || msg._id
                    });
                }
            });
        }
        
        return allLocations;
    };

    useEffect(() => {
        setPersonContacts(getContacts("person"))
        setGroupContacts(getContacts("group"))
        setChannels(getContacts("channel"))

        setMediaFiles(getMedia())
        const fm = getFilesAndMusic();
        setFiles(fm.files);
        setMusic(fm.music);
        setLinks(getLinksFromChats());
        setLocations(getLocationsFromChats());
    }, [contacts, recentChats])

    // Filtered lists for tabs
    const filteredPersonContacts = useMemo(() => {
        if (!searchQuery.trim()) return personContacts;
        const q = searchQuery.toLowerCase();
        return personContacts.filter(user => {
            const other = user.otherMember?.[0];
            const name = other?._id?.name || "";
            const lastName = other?._id?.lastName || "";
            const nickName = other?.nickName || "";
            const nickLastName = other?.nickLastName || "";
            const username = other?._id?.username || "";
            const email = other?._id?.email || "";
            const searchStr = `${name} ${lastName} ${nickName} ${nickLastName} ${username} ${email}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [personContacts, searchQuery]);

    const filteredGroupContacts = useMemo(() => {
        if (!searchQuery.trim()) return groupContacts;
        const q = searchQuery.toLowerCase();
        return groupContacts.filter(group => {
            const name = group.name || "";
            const desc = group.details?.description || "";
            const searchStr = `${name} ${desc}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [groupContacts, searchQuery]);

    const filteredChannels = useMemo(() => {
        if (!searchQuery.trim()) return channels;
        const q = searchQuery.toLowerCase();
        return channels.filter(channel => {
            const name = channel.name || "";
            const desc = channel.details?.description || "";
            const searchStr = `${name} ${desc}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [channels, searchQuery]);

    const filteredMediaFiles = useMemo(() => {
        if (!searchQuery.trim()) return mediaFiles;
        const q = searchQuery.toLowerCase();
        return mediaFiles.filter(item => {
            const name = item.name || "";
            const senderName = item.senderName || "";
            const searchStr = `${name} ${senderName}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [mediaFiles, searchQuery]);

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        const q = searchQuery.toLowerCase();
        return files.filter(item => {
            const fileName = item.fileName || "";
            const fileSource = item.fileSource || "";
            const searchStr = `${fileName} ${fileSource}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [files, searchQuery]);

    const filteredMusic = useMemo(() => {
        if (!searchQuery.trim()) return music;
        const q = searchQuery.toLowerCase();
        return music.filter(item => {
            const title = item.title || "";
            const fileName = item.fileName || "";
            const source = item.source || "";
            const fileSource = item.fileSource || "";
            const searchStr = `${title} ${fileName} ${source} ${fileSource}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [music, searchQuery]);

    const filteredLinks = useMemo(() => {
        if (!searchQuery.trim()) return links;
        const q = searchQuery.toLowerCase();
        return links.filter(item => {
            const url = item.url || "";
            const sender = item.sender || "";
            const content = Array.isArray(item.contentLines) ? item.contentLines.join(" ") : "";
            const searchStr = `${url} ${sender} ${content}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [links, searchQuery]);

    const filteredLocations = useMemo(() => {
        if (!searchQuery.trim()) return locations;
        const q = searchQuery.toLowerCase();
        return locations.filter(item => {
            const senderName = item.senderName || "";
            const address = item.location?.address || "";
            const searchStr = `${senderName} ${address}`.toLowerCase();
            return searchStr.includes(q);
        });
    }, [locations, searchQuery]);

    // ── Memoized props for MediaGallery (prevents unnecessary re-renders) ──
    const mediaImages = useMemo(() =>
        filteredMediaFiles.length > 0 ? filteredMediaFiles : [],
        [filteredMediaFiles]
    );

    const renderNoResults = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg className="w-16 h-16 text-gray-300 mb-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Typography variant="small" color="gray" className="text-base max-w-[250px] text-center font-medium select-none text-gray-500">
                No results found for "{searchQuery}"
            </Typography>
        </div>
    );

    const handleMediaContext = useCallback((e, item) => {
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    }, []);

    const handleMediaForward = useCallback((item) => {
        const forwardData = {
            _id: item.messageId, chatType: item.type, forContact: item.msg?.forContact,
            type: item.type, url: item.url, name: item.name, senderName: item.senderName,
            senderProfile: item.senderProfile, time: item.time, media: item.media,
            isForwardOne: true, msg: item.msg,
        };
        setForwardItem(forwardData);
        setShowForward(true);
    }, []);

    const handleBackPress = () => {
        Choose("Home")
    }

    const handleTabPress = (newTab) => {
        const currentIndex = TABS_ORDER.indexOf(tab);
        const newIndex = TABS_ORDER.indexOf(newTab);
        setDirection(newIndex > currentIndex ? "right" : "left");
        setIsTabMounted(false);
        setTab(newTab);
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
    const slideVariants = {
        initial: (direction) => ({
            x: direction === "right" ? 50 : -50,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.25, ease: "easeOut" },
        },
        exit: (direction) => ({
            x: direction === "right" ? -50 : 50,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
        }),
    };
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="select-none p-2"
            >
                <div className="flex items-center justify-between">
                    {/* Sidebar icon on the left */}
                    <div className="ml-3 mr-3"><button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={handleBackPress}>
                        <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                    </button> </div>


                    {/* Search input aligned to right */}
                    <div className="w-full flex justify-end mr-6">
                        <div className={` w-full max-w-md ml-3`} >
                            {/* <Input
                                ref={inputRef}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                label="Search"
                                className="text-left " // optional for inner alignment
                              /> */}
                            <div
                                className={`flex items-center rounded-md px-4 py-[6px] w-full bg-white border transition-colors duration-200 ${isFocused ? "border-[#8763ea]" : "border-gray-300"
                                    }`}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search"
                                    className="outline-none border-none bg-transparent w-full text-gray-700 placeholder:text-gray-400"
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                />
                                <svg
                                    className={`h-5 w-5 mr-2 transition-colors duration-200 ${isFocused ? "text-[#8763ea]" : "text-gray-500"
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-2 mt-2 relative min-h-[44px]">
                    <AnimatePresence mode="wait">
                        {isSelectionMode ? (
                            <motion.div
                                key="selection-header"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between px-4 py-2 bg-white text-black w-full absolute inset-0 z-20"
                            >
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedItems([])} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                        <svg className="w-6 h-6 m-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    <span className="font-medium text-[15px]">{selectedItems.length} Selected</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => {
                                        

                                        const forwardDatas = selectedItems.map(item => ({
                                            _id: item.msg._id,
                                            chatType: item.msg.chatType,
                                            forContact: item.msg.forContact,
                                            type: item.msg.chatType,
                                            content: item.msg.content,
                                            sender: item.msg.sender,
                                            time: item.msg.time,
                                            media: item.media,
                                            isForwardOne: false,
                                            msg: item.msg,

                                        }));
                                        setForwardItem(forwardDatas);
                                        setShowForward(true);
                                        setSelectedItems([]);
                                    }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                        <svg className="w-5 h-5 m-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tabs-header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full absolute inset-0"
                            >
                                <ScrollableTabBar Choose={handleTabPress} currentTab={tab} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="relative h-[calc(100vh-120px)] w-full">
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="scrollbar-hidden h-full overflow-y-auto overflow-x-hidden pb-32"
                    >
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={tab}
                                custom={direction}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                onAnimationComplete={() => setIsTabMounted(true)}
                                className="w-full"
                            >
                                               {tab === 'Media' && (
                                    isTabMounted ? (
                                        mediaFiles.length > 0 ? (
                                            filteredMediaFiles.length > 0 ? (
                                                <MediaGallery
                                                    images={mediaImages}
                                                    onContextMenu={handleMediaContext}
                                                    onForward={handleMediaForward}
                                                    selectedItems={selectedItems}
                                                    isSelectionMode={isSelectionMode}
                                                    onSelect={toggleSelection}
                                                    isCloseViewer={closeViewer}
                                                />
                                            ) : (
                                                renderNoResults()
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                                <Typography variant="small" color="gray" className="text-base max-w-[200px] text-center font-medium select-none">
                                                    No media yet. Share some photos or videos.
                                                </Typography>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex justify-center items-center py-20 w-full">
                                            <div className="w-8 h-8 rounded-full border-[3px] border-[#8763ea]/30 border-t-[#8763ea] animate-spin"></div>
                                        </div>
                                    )
                                )}
                                {tab === 'Files' && (
                                    files.length > 0 ? (
                                        filteredFiles.length > 0 ? (
                                            filteredFiles.map((item, index) => (
                                                <FileCard
                                                    key={index}
                                                    fileName={item.fileName}
                                                    fileSize={item.fileSize}
                                                    fileSource={item.fileSource}
                                                    fileDate={item.fileDate}
                                                    url={item.url}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        handleMediaContext(e, item);
                                                    }}
                                                    isSelected={selectedItems.some(i => i._uid === item._uid)}
                                                    isSelectionMode={isSelectionMode}
                                                    onClick={async () => {
                                                        if (isSelectionMode) {
                                                            toggleSelection(item);
                                                        } else {
                                                            try {
                                                                const res = await fetch(item.url);
                                                                const blob = await res.blob();
                                                                const burl = window.URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.style.display = 'none';
                                                                a.href = burl;
                                                                a.download = item.fileName || 'file';
                                                                document.body.appendChild(a);
                                                                a.click();
                                                                setTimeout(() => { window.URL.revokeObjectURL(burl); a.remove(); }, 200);
                                                            } catch (err) {
                                                                window.open(item.url, '_blank');
                                                            }
                                                        }
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <Typography variant="small" color="gray" className="text-base max-w-[200px] text-center font-medium select-none">
                                                No files yet. Share some documents.
                                            </Typography>
                                        </div>
                                    )
                                )}
                                {(tab === 'Music' || tab === 'Voice') && (
                                    music.length > 0 ? (
                                        filteredMusic.length > 0 ? (
                                            Object.entries(groupMusicData(filteredMusic)).map(([month, items]) => (
                                                <div key={month} className="mb-6">
                                                    <h2 className="text-md font-semibold text-gray-700 mb-2 px-4">{month}</h2>
                                                    <div>
                                                        {items.map((item, index) => (
                                                            <MusicCard
                                                                key={index}
                                                                {...item}
                                                                onClick={() => {
                                                                    if (isSelectionMode) toggleSelection(item);
                                                                    else setAudioPlayer(item);
                                                                }}
                                                                onContextMenu={(e) => { e.preventDefault(); handleMediaContext(e, item); }}
                                                                isSelected={selectedItems.some(i => i._uid === item._uid)}
                                                                isSelectionMode={isSelectionMode}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <Typography variant="small" color="gray" className="text-base max-w-[200px] text-center font-medium select-none">
                                                {tab === 'Music' ? 'No music yet. Share some audio files.' : 'No voice messages yet.'}
                                            </Typography>
                                        </div>
                                    )
                                )}
                                {tab === 'Links' && (
                                    links.length > 0 ? (
                                        filteredLinks.length > 0 ? (
                                            filteredLinks.map((item) => (
                                                <LinkCard
                                                    key={item.msgId}
                                                    {...item}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        handleMediaContext(e, item);
                                                    }}
                                                    onClick={() => {
                                                        

                                                        if (isSelectionMode) toggleSelection(item);
                                                        else {
                                                            let finalUrl = item.url;
                                                            if (!/^https?:\/\//i.test(finalUrl)) {
                                                                finalUrl = 'http://' + finalUrl;
                                                            }
                                                            window.open(finalUrl, '_blank');
                                                        }
                                                    }}
                                                    isSelected={selectedItems.some(i => i._uid === item._uid)}
                                                    isSelectionMode={isSelectionMode}
                                                />
                                            ))
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <Typography variant="small" color="gray" className="text-base max-w-[200px] text-center font-medium select-none">
                                                No links yet. Share some links in chats.
                                            </Typography>
                                        </div>
                                    )
                                )}
                                {tab === 'Location' && (
                                    locations.length > 0 ? (
                                        filteredLocations.length > 0 ? (
                                            filteredLocations.map((item) => (
                                                <div
                                                    key={item.msgId}
                                                    className={`flex items-center px-4 py-3 rounded-xl mx-2 my-1 cursor-pointer transition-colors ${selectedItems.some(i => i._uid === item._uid) ? 'bg-blue-50/60' : 'bg-transparent hover:bg-gray-50/80'}`}
                                                    onContextMenu={(e) => { e.preventDefault(); handleMediaContext(e, item); }}
                                                    onClick={() => {
                                                        if (isSelectionMode) {
                                                            toggleSelection(item);
                                                        } else {
                                                            // Open chat logic similar to show in chat
                                                            let chatToOpen = contacts.find(c => c._id === item.msg.forContact);
                                                            if (chatToOpen) {
                                                                Choose("Chat", chatToOpen);
                                                                setTimeout(() => {
                                                                    const el = document.querySelector(`[data-msg-id="${item.msg._realId || item.msg._id}"]`);
                                                                    if (el) {
                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        el.classList.add('bg-blue-100/50', 'transition-colors', 'duration-500');
                                                                        setTimeout(() => el.classList.remove('bg-blue-100/50'), 1500);
                                                                    }
                                                                }, 500);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <div className="relative shrink-0 mr-3">
                                                        {isSelectionMode && selectedItems.some(i => i._uid === item._uid) ? (
                                                            <div className="w-11 h-11 rounded-full bg-[#8763ea] flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            </div>
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 text-[14.5px] truncate">{item.senderName}'s Location</p>
                                                        <p className="text-[12.5px] text-gray-500 truncate mt-0.5">{item.location?.address || 'Shared Location'}</p>
                                                    </div>
                                                    <div className={`text-[11.5px] font-medium whitespace-nowrap shrink-0 ${selectedItems.some(i => i._uid === item._uid) ? 'text-blue-500' : 'text-gray-400'}`}>{item.time}</div>
                                                </div>
                                            ))
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <Typography variant="small" color="gray" className="text-base max-w-[200px] text-center font-medium select-none">
                                                No locations shared yet.
                                            </Typography>
                                        </div>
                                    )
                                )}
                                {tab === 'Chats' && (
                                    personContacts.length > 0 ? (
                                        filteredPersonContacts.length > 0 ? (
                                            <List>
                                                {filteredPersonContacts.map((user) => (
                                                    <ListItem
                                                        key={user._id}
                                                        onClick={() => {
                                                            Choose("Home", null, null, null, user);
                                                        }}
                                                        className="flex items-center gap-4 py-2 px-3 rounded-lg"
                                                    >
                                                        <UserAvatar    {...(user.otherMember[0]?._id !== null && user.otherMember[0]?._id?.profile?.type === 'image' && {
                                                            image: user.otherMember[0]._id.profile.imageUrl,
                                                        })}
                                                            {...(user.otherMember[0]?._id !== null && user.otherMember[0]?._id?.profile?.type === 'emoji' && {
                                                                emoji: user.otherMember[0]._id.profile
                                                                    .emoji,
                                                                simpleBg: user.otherMember[0]._id.profile
                                                                    .bgColor,
                                                                emojiSize: "text-3xl"
                                                            })}
                                                            {...(user.otherMember[0]?._id !== null && user.otherMember[0]?._id?.profile?.type === 'initials' && {
                                                                simpleBg: user.otherMember[0]._id.profile
                                                                    .bgColor,
                                                                text: user.otherMember[0].nickName ? (user.otherMember[0].
                                                                    nickLastName ? (user.otherMember[0].nickName[0].toUpperCase() + user.otherMember[0].
                                                                        nickLastName[0].toUpperCase()) : (user.otherMember[0].nickName[0].toUpperCase())) : (user.otherMember[0]._id.profile
                                                                            .initials),

                                                            })} />

                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="font-medium text-[16px] text-gray-900 truncate">
                                                                {user.otherMember[0]?.nickName ? (user.otherMember[0]?.nickLastName ? (formatName(user.otherMember[0].nickName) + " " + formatName(user.otherMember[0].nickLastName)) : (formatName(user.otherMember[0].nickName))) : (user.otherMember[0]?._id?.name)}
                                                            </span>
                                                            <span className="text-gray-700 text-[13px] font-medium truncate">{user.otherMember[0]._id.isOnline ? "Online" : formatLastSeen(user.otherMember[0]._id.lastSeen)}</span>
                                                        </div>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center  h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <div className="flex flex-col items-center select-none">
                                                <Typography
                                                    variant="small"
                                                    color="gray"
                                                    className="text-base max-w-[180px]  text-center font-medium"
                                                >
                                                    No contact now. Add some contacts.
                                                </Typography>
                                                <Typography
                                                    variant="small"
                                                    className="text-base text-blue-700 max-w-[180px] truncate text-center font-medium cursor-pointer hover:underline"
                                                    onClick={() => Choose("Contact")}
                                                >
                                                    Add now.
                                                </Typography>
                                            </div>
                                        </div>
                                    )
                                )}
                                {tab === 'Groups' && (
                                    groupContacts.length > 0 ? (
                                        filteredGroupContacts.length > 0 ? (
                                            <List>
                                                {filteredGroupContacts.map((user) => (
                                                    <ListItem
                                                        key={user._id}
                                                        onClick={() => {
                                                            Choose("Home", null, null, null, user);
                                                        }}
                                                        className="flex items-center gap-4 py-2 px-3 rounded-lg"
                                                    >
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

                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="font-medium text-[16px] text-gray-900 truncate">
                                                                {user.name}
                                                            </span>
                                                            <span className="text-gray-700 text-[13px] font-medium truncate">{user.members.length + ` subscriber${user.members.length > 1 ? 's' : ""}`}</span>
                                                        </div>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center  h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <div className="flex flex-col items-center select-none">
                                                <Typography
                                                    variant="small"
                                                    color="gray"
                                                    className="text-base max-w-[180px]  text-center font-medium"
                                                >
                                                    No Group now. Create new Group.
                                                </Typography>
                                                <Typography
                                                    variant="small"
                                                    className="text-base text-blue-700 max-w-[180px] truncate text-center font-medium cursor-pointer hover:underline"
                                                    onClick={() => Choose("NewGroup")}
                                                >
                                                    Create Now.
                                                </Typography>
                                            </div>
                                        </div>
                                    )
                                )}
                                {tab === 'Channels' && (
                                    channels.length > 0 ? (
                                        filteredChannels.length > 0 ? (
                                            <List>
                                                {filteredChannels.map((user) => (
                                                    <ListItem
                                                        key={user._id}
                                                        onClick={() => {
                                                            Choose("Home", null, null, null, user);
                                                        }}
                                                        className="flex items-center gap-4 py-2 px-3 rounded-lg"
                                                    >
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

                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="font-medium text-[16px] text-gray-900 truncate">
                                                                {user.name}
                                                            </span>
                                                            <span className="text-gray-700 text-[13px] font-medium truncate">{user.members.length + ` subscriber${user.members.length > 1 ? 's' : ""}`}</span>
                                                        </div>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            renderNoResults()
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center  h-full">
                                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                            <div className="flex flex-col items-center select-none">
                                                <Typography
                                                    variant="small"
                                                    color="gray"
                                                    className="text-base max-w-[180px]  text-center font-medium"
                                                >
                                                    No Channel now. Create new Channel.
                                                </Typography>
                                                <Typography
                                                    variant="small"
                                                    className="text-base text-blue-700 max-w-[180px] truncate text-center font-medium cursor-pointer hover:underline"
                                                    onClick={() => Choose("NewChanel")}
                                                >
                                                    Create Now.
                                                </Typography>
                                            </div>
                                        </div>
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </motion.div>

            {/* Context Menu portal */}
            {audioPlayer && (
                <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAudioPlayer(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="p-5 flex flex-col items-center">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg text-center truncate w-full px-2">{audioPlayer.title || audioPlayer.fileName || 'Audio Message'}</h3>
                            <p className="text-sm text-gray-500 mt-1">{audioPlayer.fileDate || audioPlayer.date ? formatTelegramDate(audioPlayer.date) : ''}</p>
                            <div className="w-full mt-6">
                                <audio src={audioPlayer.url} controls autoPlay className="w-full outline-none" controlsList="nodownload" />
                            </div>
                        </div>
                        <button className="absolute top-3 right-3 p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors" onClick={() => setAudioPlayer(null)}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            )}

            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
                    <div
                        className="fixed bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.15)] px-2 py-2 w-[190px] z-[9999] border border-gray-100"
                        style={{
                            top: contextMenu.y + 240 > window.innerHeight ? contextMenu.y - 240 : contextMenu.y,
                            left: contextMenu.x + 220 > window.innerWidth ? contextMenu.x - 220 : contextMenu.x
                        }}
                    >
                        <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-200 text-[15px] rounded-lg font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            const item = contextMenu.item;
                            const forwardData = {
                                _id: item.messageId, chatType: item.type, forContact: item.msg?.forContact, type: item.type,
                                url: item.url, name: item.name, senderName: item.senderName, senderProfile: item.senderProfile,
                                time: item.time, media: item.media || { _id: item.mediaItemId, url: item.url, name: item.name },
                                isForwardOne: true, msg: item.msg,
                            };
                            setForwardItem(forwardData);
                            setShowForward(true);
                        }}>
                            <FMFwdIcon /> Forward
                        </button>
                        <button className="w-full rounded-lg flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-200 text-[15px] font-medium text-gray-800" onClick={async () => {
                            setContextMenu(null);
                            const item = contextMenu.item;
                            

                            if (!item?.url) return;

                            if (item.type === 'link') {
                                try {
                                    await navigator.clipboard.writeText(item.url);
                                    toast.success("Link copied!");
                                } catch (e) {
                                    window.open(item.url, '_blank');
                                }
                                return;
                            }

                            try {
                                const res = await fetch(item.url);
                                const blob = await res.blob();
                                const burl = window.URL.createObjectURL(blob);
                                let fn = item.name;
                                if (!fn && !item.url.startsWith('blob:')) {
                                    const parts = item.url.split('/');
                                    const last = parts[parts.length - 1];
                                    if (last?.includes('.')) fn = last.split('?')[0];
                                }
                                if (!fn) fn = item.type === 'video' ? 'video.mp4' : 'image.jpg';
                                const a = Object.assign(document.createElement('a'), { href: burl, download: fn, style: 'display:none' });
                                document.body.appendChild(a); a.click();
                                setTimeout(() => { window.URL.revokeObjectURL(burl); a.remove(); }, 200);
                            } catch { window.open(item.url, '_blank'); }
                        }}>
                            {contextMenu?.item?.type === 'link' ? (
                                <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            ) : (
                                <FMDlIcon />
                            )}
                            {contextMenu?.item?.type === 'link' ? 'Copy Link' : 'Download'}
                        </button>
                        <button className="w-full rounded-lg flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-200 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            const item = contextMenu.item;
                            if (item.msg?._id) {

                                // A simplified show in chat - Since this is global search, 
                                // we'd need to Choose("Chat", theChat) and scroll.
                                // For now, we'll try to find the contact and Choose it
                                let chatToOpen = contacts.find(c => c._id === item.msg.forContact);
                                if (!chatToOpen) {
                                    const personChat = personContacts.find(c => c._id === item.msg.forContact);
                                    if (personChat) chatToOpen = personChat;
                                }
                                if (chatToOpen) {
                                    Choose("Chat", chatToOpen);
                                    setTimeout(() => {
                                        const el = document.querySelector(`[data-msg-id="${item.msg._realId || item.msg._id}"]`);
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            el.classList.add('bg-blue-100/50', 'transition-colors', 'duration-500');
                                            setTimeout(() => el.classList.remove('bg-blue-100/50'), 1500);
                                        }
                                    }, 500);
                                }
                            }
                        }}>
                            <FMChatIcon /> Show in chat
                        </button>
                        <button className="w-full rounded-lg flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-200 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            if (isSelectionMode) {
                                setSelectedItems([]);
                            } else {
                                setSelectedItems([contextMenu.item]);
                            }
                        }}>
                            <FMSelIcon /> {isSelectionMode ? "Clear " : "Select"}
                        </button>
                    </div>
                </>
            )}

            {(showForward && forwardItem) && (
                <ForwardPopup
                    isOpen={showForward}
                    onClose={() => setShowForward(false)}
                    contacts={ContactsWithOtherMember()}
                    backendUser={backendUser}
                    onContactClick={(user) => {
                        

                        let forwardMessages = [];
                        if (Array.isArray(forwardItem)) {
                            forwardItem.forEach(item => {
                                const hasMedia = (Array.isArray(item.msg?.images) && item.msg.images.length > 0) ||
                                    (Array.isArray(item.msg?.videos) && item.msg.videos.length > 0) ||
                                    (Array.isArray(item.msg?.documents) && item.msg.documents.length > 0);
                                item.isForwardOne = hasMedia ? false : undefined;
                            });
                            forwardMessages = forwardItem;
                        } else {
                            forwardMessages = [{
                                _id: forwardItem.messageId || forwardItem._id,
                                chatType: forwardItem.chatType,
                                forContact: forwardItem.forContact,
                                type: forwardItem.type,
                                url: forwardItem.url,
                                name: forwardItem.name,
                                media: forwardItem.media,
                                isForwardOne: forwardItem.isForwardOne || false,
                                msg: forwardItem.msg,
                                isForwardMultipleOne: true
                            }];
                        }
                        

                        setShowForward(false);
                        setCloseViewer(true);
                        setForwardItem(null);
                        Choose("Chat", user, null, null, null, null, forwardMessages);
                    }}
                />
            )}
        </>
    );
}
