import { useEffect, useState, useContext, useRef, useMemo, useCallback, memo } from "react";
import '../scrollbar.css';
import {
    PencilIcon,
    ArrowLeftIcon,
    EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { RiUserAddLine } from "react-icons/ri";

import Avatar from "../UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../UserAvatar2";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { MdOutlineClose, MdOutlineLocalPhone, MdOutlineDeleteOutline } from "react-icons/md";
import { FiUser, FiCalendar } from "react-icons/fi";
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { PiLinkSimpleLight } from "react-icons/pi";
import { BsPeopleFill, BsImages, BsFileEarmark, BsMusicNote } from "react-icons/bs";
import { AuthContext } from "../firebase hooks/AuthContext";
import ForwardPopup from "../ForwardPopup";
import DeleteMultiplePopup from "../DeleteMultiplePopup";
import DeleteChatPopup from "./DeleteChatPopup";
// Persistent cache so optimized thumb URLs are computed once and reused across tab switches
const thumbCache = new Map();
const getOptimizedThumbUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (thumbCache.has(url)) return thumbCache.get(url);
    let result = url;
    if (url.includes('cloudinary.com/')) {
        try {
            if (url.includes('/video/')) {
                result = url.replace(/\.[^/.]+$/, ".jpg");
            } else {
                const parts = url.split('/upload/');
                if (parts.length === 2) {
                    let thumb = `${parts[0]}/upload/w_300,h_300,c_fill,q_auto,f_auto/${parts[1]}`;
                    result = thumb.replace(/\.[^/.]+$/, ".jpg");
                }
            }
        } catch (e) { }
    }
    thumbCache.set(url, result);
    return result;
};

const FMFwdIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>;
const FMDlIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const FMChatIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const FMSelIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const FMDelIcon = () => <svg className="w-[18px] h-[18px] mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

// Memoized SmoothImage to prevent re-renders on tab switch (preserves loaded state)
const SmoothImage = memo(({ src, alt, className }) => {
    const [loaded, setLoaded] = useState(false);
    const thumbUrl = useMemo(() => getOptimizedThumbUrl(src), [src]);
    return (
        <img
            src={thumbUrl}
            alt={alt || ""}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`${className} transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
    );
});
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
    ListItemSuffix
} from "@material-tailwind/react";
import EditScreen from "./EditScreen";
import AddMembers from "./AddMembers";
import toast from "react-hot-toast";
import InfoMediaViewer from "./InfoMediaViewer";
import MusicCard from "../MusicCard";
function ChatInfo({ chat, back, choose, messages, isNavbarHidden, setSearchQuery, onOpenCalendar, selectedUserFilter, setSelectedUserFilter, panelOpen, setPanelOpen }) {
    if (chat === null) return;

    const { contacts, backendUser, deleteSelectedMedia, deleteOneFile } = useContext(AuthContext)
    const [isAnimationFinished, setIsAnimationFinished] = useState(false);

    useEffect(() => {
        if (!panelOpen) {
            setIsAnimationFinished(false);
        }
    }, [panelOpen]);

    const [sidebarMode, setSidebarMode] = useState("info"); // 'info' or 'search'
    const isSearching = sidebarMode === "search" && panelOpen;
    const setIsSearching = (val) => {
        if (val) {
            setSidebarMode("search");
            setPanelOpen(true);
        } else {
            setSidebarMode("info");
            setPanelOpen(false);
            setSearchText("");
            setSearchQuery("");
            setSelectedUserFilter(null);
        }
    };
    const [searchText, setSearchText] = useState("");
    const [showMembersDropdown, setShowMembersDropdown] = useState(false);
    const [memberSearchText, setMemberSearchText] = useState("");
    const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
    const searchHeaderRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isAnimationFinished && sidebarMode === "search" && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isAnimationFinished, sidebarMode]);

    const renderChatAvatar = (size = "w-10 h-10") => {
        if (!chat) return null;
        if (chat.contactType === "person") {
            const member = chat.otherMember?.[0]?._id;
            if (!member) return null;
            return (
                <UserAvatar
                    size={size}
                    {...(member.profile?.type === 'image' && { image: member.profile.imageUrl })}
                    {...(member.profile?.type === 'emoji' && { emoji: member.profile.emoji, simpleBg: member.profile.bgColor })}
                    {...(member.profile?.type === 'initials' && {
                        simpleBg: member.profile.bgColor,
                        text: chat.otherMember[0].nickName ? (chat.otherMember[0].nickLastName ? (chat.otherMember[0].nickName[0].toUpperCase() + chat.otherMember[0].nickLastName[0].toUpperCase()) : (chat.otherMember[0].nickName[0].toUpperCase())) : (member.profile.initials),
                    })}
                />
            );
        }
        const profile = chat.details?.profile;
        if (!profile) return null;
        return (
            <UserAvatar
                size={size}
                {...(profile.type === 'image' && { image: profile.imageUrl })}
                {...(profile.type === 'emoji' && { emoji: profile.emoji, simpleBg: profile.bgColor })}
                {...(profile.type === 'initials' && { text: profile.initials, simpleBg: profile.bgColor })}
            />
        );
    };

    const searchedMessages = useMemo(() => {
        if (!isAnimationFinished || !isSearching) return [];
        let filtered = messages || [];
        if (selectedUserFilter) {
            const filterUserId = selectedUserFilter._id?.toString();
            filtered = filtered.filter(m => {
                const senderId = m.sender?._id?.toString() || (typeof m.sender === 'string' ? m.sender : "");
                return senderId === filterUserId;
            });
        }
        const query = (showMembersDropdown ? memberSearchText : searchText).trim().toLowerCase();
        if (query) {
            filtered = filtered.filter(m => {
                const contentMatches = m.content && m.content.toLowerCase().includes(query);
                const textMatches = m.text && m.text.toLowerCase().includes(query);
                const captionMatches = m.caption && m.caption.toLowerCase().includes(query);
                return contentMatches || textMatches || captionMatches;
            });
        }
        return [...filtered].sort((a, b) => new Date(b.time) - new Date(a.time));
    }, [messages, isSearching, selectedUserFilter, searchText, memberSearchText, showMembersDropdown, isAnimationFinished]);

    const highlightText = (text, query) => {
        if (!text) return "";
        if (!query) return text;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        return (
            <>
                {before}
                <span className="font-bold text-gray-900 bg-yellow-100 px-0.5 rounded">{match}</span>
                {after}
            </>
        );
    };

    const getMessagePreviewText = (msg) => {
        if (msg.content) return msg.content;
        if (msg.text) return msg.text;
        if (msg.chatType === "image") return msg.caption ? `📷 Image: ${msg.caption}` : "📷 Image";
        if (msg.chatType === "video") return msg.caption ? `🎥 Video: ${msg.caption}` : "🎥 Video";
        if (msg.chatType === "document") {
            const docName = msg.documents?.[0]?.name || "Document";
            return `📄 File: ${docName}`;
        }
        if (msg.chatType === "location") return `📍 Location: ${msg.location?.address || "Shared Location"}`;
        return "";
    };

    const formatSearchDate = (timeStr) => {
        if (!timeStr) return "";
        try {
            const d = new Date(timeStr);
            const now = new Date();
            if (isToday(d)) {
                return format(d, "h:mm a");
            }
            if (isYesterday(d)) {
                return "Yesterday";
            }
            if (isThisYear(d)) {
                return format(d, "MMM d");
            }
            return format(d, "MM/dd/yyyy");
        } catch (err) {
            return "";
        }
    };

    const handlePrevSearchResult = (e) => {
        e.stopPropagation();
        if (searchedMessages.length === 0) return;
        const prevIndex = activeSearchIndex <= 0 ? searchedMessages.length - 1 : activeSearchIndex - 1;
        setActiveSearchIndex(prevIndex);
    };

    const handleNextSearchResult = (e) => {
        e.stopPropagation();
        if (searchedMessages.length === 0) return;
        const nextIndex = activeSearchIndex >= searchedMessages.length - 1 ? 0 : activeSearchIndex + 1;
        setActiveSearchIndex(nextIndex);
    };

    useEffect(() => {
        if (activeSearchIndex >= 0 && searchedMessages[activeSearchIndex]) {
            const msgId = searchedMessages[activeSearchIndex]._id;
            const element = document.querySelector(`[data-msg-id="${msgId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("search-highlight-flash");
                const timer = setTimeout(() => {
                    element.classList.remove("search-highlight-flash");
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [activeSearchIndex, searchedMessages]);

    useEffect(() => {
        setIsSearching(false);
        setSearchText("");
        setShowMembersDropdown(false);
        setMemberSearchText("");
        setActiveSearchIndex(-1);
    }, [chat?._id]); // Only reset when switching to a DIFFERENT chat, not on data updates


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchHeaderRef.current && !searchHeaderRef.current.contains(e.target)) {
                setShowMembersDropdown(false);
            }
        };
        if (showMembersDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showMembersDropdown]);

    const [showFab, setShowFab] = useState(false);
    const [members, setMembers] = useState(null)
    const [rdData, setRdData] = useState("")
    const [mediaViewer, setMediaViewer] = useState(null);  // { items, initialIndex }

    const isMediaViewerPushedRef = useRef(false);

    // Sync mediaViewer state with history
    useEffect(() => {
        if (mediaViewer) {
            if (!isMediaViewerPushedRef.current) {
                isMediaViewerPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, infoMediaViewerOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isMediaViewerPushedRef.current) {
                isMediaViewerPushedRef.current = false;
                if (window.history.state?.infoMediaViewerOpen) {
                    window.history.back();
                }
            }
        }
    }, [mediaViewer]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (mediaViewer && !e.state?.infoMediaViewerOpen) {
                isMediaViewerPushedRef.current = false;
                setMediaViewer(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mediaViewer]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    const [isEditScreenOpen, setIsEditScreenOpen] = useState(false);
    const [openAddContact, setOpenAddContact] = useState(false);

    const isEditPushedRef = useRef(false);
    const isAddContactPushedRef = useRef(false);

    // Sync isEditScreenOpen state with history
    useEffect(() => {
        if (isEditScreenOpen) {
            if (!isEditPushedRef.current) {
                isEditPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, editScreenOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isEditPushedRef.current) {
                isEditPushedRef.current = false;
                if (window.history.state?.editScreenOpen) {
                    window.history.back();
                }
            }
        }
    }, [isEditScreenOpen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (isEditScreenOpen && !e.state?.editScreenOpen) {
                isEditPushedRef.current = false;
                setIsEditScreenOpen(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isEditScreenOpen]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    // Sync openAddContact state with history
    useEffect(() => {
        if (openAddContact) {
            if (!isAddContactPushedRef.current) {
                isAddContactPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, addContactOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isAddContactPushedRef.current) {
                isAddContactPushedRef.current = false;
                if (window.history.state?.addContactOpen) {
                    window.history.back();
                }
            }
        }
    }, [openAddContact]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (openAddContact && !e.state?.addContactOpen) {
                isAddContactPushedRef.current = false;
                setOpenAddContact(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [openAddContact]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    const [activeInfoTab, setActiveInfoTab] = useState('members');
    const [infoTabDir, setInfoTabDir] = useState(0);
    const tabBarRef = useRef(null);
    const scrollContainerRef = useRef(null);
    // { items, initialIndex }
    const [musicPlayer, setMusicPlayer] = useState(null);  // { track }
    const [showForward, setShowForward] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [forwardItem, setForwardItem] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

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

    const handleEditBack = (e) => {
        setIsEditScreenOpen(false);
    }
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


    useEffect(() => {
        if (chat !== null) {
            const chatMembers = chat.members;
            const Members = chatMembers.map(member => member._id)
            setMembers(Members);
            const inAdmin = chat.admins
                .some(admin => admin._id === backendUser._id);

            if (chat.membersPermissions.addUsers === true || inAdmin) {
                setShowFab(true);
            } else {
                setShowFab(false);
            }
        }


    }, [chat, contacts]);
    const getRoll = (id) => {
        if (id.toString() === chat.owner.toString()) {
            return "Owner"
        } else if (chat.admins.includes(id) || chat.admins.some(a => a._id === id)) {
            return "Admin"
        } else {
            null
        }
    }
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

    const infoPanelVariants = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };

    const editPanelVariants = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };

    const formatPhone = (phone) => phone.replace(/^\+91/, "");
    const showEditButton = (chat) => {
        if (chat.contactType === "person") {
            return false;
        } else {
            const isAdmin = chat.admins.some((admin) => admin._id.toString() === backendUser._id.toString());
            const isOwner = chat.owner.toString() === backendUser._id.toString();
            if (isOwner || isAdmin) {
                return true;
            }

            return false;
        }

    }


    // Lightweight GPU-accelerated tab transition — exit uses absolute so container height doesn't collapse
    const tabContentVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0,
            position: 'relative',
        }),
        center: {
            x: 0,
            opacity: 1,
            position: 'relative',
            transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
        },
        exit: (direction) => ({
            x: direction > 0 ? -20 : 20,
            opacity: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transition: { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] }
        }),
    };

    const getSenderDetails = (senderId) => {
        if (!senderId) return { name: 'Unknown', profile: null };
        if (typeof senderId === 'object' && senderId.name) {
            return {
                name: `${senderId.name || ''} ${senderId.lastName || ''}`.trim(),
                profile: senderId.profile
            };
        }
        const sid = typeof senderId === 'object' ? senderId._id : senderId;
        if (sid === backendUser?._id) {
            return {
                name: `${backendUser.name || ''} ${backendUser.lastName || ''}`.trim(),
                profile: backendUser.profile
            };
        }
        if (members) {
            const memberObj = members.find(m => {
                const mid = m && typeof m._id === 'object' ? m._id._id : m?._id;
                return mid === sid;
            });
            if (memberObj) {
                return {
                    name: `${memberObj.name || ''} ${memberObj.lastName || ''}`.trim(),
                    profile: memberObj.profile
                };
            }
        }
        if (chat?.contactType === 'person') {
            const other = chat.otherMember?.[0]?._id;
            if (other && (other._id === sid || other === sid)) {
                return {
                    name: `${other.name || ''} ${other.lastName || ''}`.trim(),
                    profile: other.profile
                };
            }
        }
        return { name: 'Unknown', profile: null };
    };

    const getMedia = () => {
        if (!messages) return [];
        const items = [];
        messages.forEach((message) => {
            if (message.isDeleted) return;
            const senderDetails = getSenderDetails(message.sender);
            const msgId = message._realId || message._id;
            if (message.chatType === "image") {
                message.images.forEach((img, i) => items.push({
                    type: message.chatType, url: img.url, name: img.name || 'image.jpg',
                    mediaItemId: img._id,
                    _uid: `${msgId}_${img._id}`,
                    time: message.time, msgImages: message.images, imgIdx: i,
                    senderName: senderDetails.name, senderProfile: senderDetails.profile,
                    messageId: msgId, chatType: message.chatType, forContact: message.forContact,
                    msg: message,
                    media: img,


                }));
            }
            if (message.chatType === "video") {
                message.videos.forEach((vid, i) => items.push({
                    type: message.chatType, url: vid.url, name: vid.name || 'video.mp4',
                    mediaItemId: vid._id,
                    _uid: `${msgId}_${vid._id}`,
                    time: message.time, msgVideos: message.videos, vidIdx: i,
                    senderName: senderDetails.name, senderProfile: senderDetails.profile,
                    messageId: msgId, chatType: message.chatType, forContact: message.forContact,
                    msg: message,
                    media: vid,


                }));
            }
        });
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        return items;
    };
    const getFiles = () => {
        if (!messages) return [];
        const musicExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', '3gp'];
        const items = [];
        messages.forEach((message) => {
            if (message.isDeleted) return;
            const senderDetails = getSenderDetails(message.sender);
            const msgId = message._realId || message._id;
            if (message.chatType === "document") {
                message.documents.forEach((doc) => {
                    const ext = doc.name?.split('.').pop().toLowerCase();
                    if (!musicExts.includes(ext)) {
                        let mediaType = 'file';
                        if (imageExts.includes(ext)) mediaType = 'image';
                        else if (videoExts.includes(ext)) mediaType = 'video';
                        items.push({
                            url: doc.url, name: doc.name, size: doc.size, time: message.time, mediaType, mediaItemId: doc._id, _uid: `${msgId}_${doc._id}`, senderName: senderDetails.name, senderProfile: senderDetails.profile, messageId: msgId, chatType: message.chatType, forContact: message.forContact, msg: message,

                            media: doc,
                            type: message.chatType,
                            doc

                        });
                    }
                });
            }
        });
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        return items;
    };
    const getMusic = () => {
        if (!messages) return [];
        const musicExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
        const items = [];
        messages.forEach((message) => {
            if (message.isDeleted) return;
            const senderDetails = getSenderDetails(message.sender);
            const msgId = message._realId || message._id;
            if (message.chatType === "document") {
                message.documents.forEach((doc) => {
                    const ext = doc.name?.split('.').pop().toLowerCase();
                    if (musicExts.includes(ext)) {
                        items.push({
                            url: doc.url, name: doc.name, size: doc.size, time: message.time,
                            mediaType: 'music', mediaItemId: doc._id, _uid: `${msgId}_${doc._id}`, senderName: senderDetails.name,
                            senderProfile: senderDetails.profile, messageId: msgId, chatType: message.chatType,
                            forContact: message.forContact, msg: message, media: doc, type: message.chatType, doc
                        });
                    }
                });
            }
        });
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        return items;
    };


    const handleIsDeleteAllowed
        = () => {
            if (chat?.contactType !== "person") {

                const isOwner = chat?.
                    owner?.toString() === backendUser._id.toString();
                const isAdmin = chat?.admins.find((admin) => admin._id.toString() === backendUser._id.toString());

                if (chat?.contactType === "channel") {
                    if (isOwner) {
                        return true;
                    }
                    if (isAdmin) {
                        const isDeleteAllowed = chat?.permissions?.deleteMessages.includes(backendUser._id.toString());
                        return isDeleteAllowed;
                    }
                }
                if (chat?.contactType === "group") {
                    if (isOwner) {
                        return true;
                    }
                    if (isAdmin) {
                        const isDeleteAllowed = chat?.permissions?.deleteMessages.includes(backendUser._id.toString());
                        return isDeleteAllowed;
                    } else {
                        const isDeleteAllowed = chat?.membersPermissions?.deleteMessages;
                        return isDeleteAllowed;
                    }
                }
            } else {
                return true;
            }
        }
    // Memoize expensive data computations to prevent lag on tab switch
    const cachedMedia = useMemo(() => {
        if (!isAnimationFinished) return [];
        return getMedia();
    }, [messages, isAnimationFinished]);
    const cachedFiles = useMemo(() => {
        if (!isAnimationFinished) return [];
        return getFiles();
    }, [messages, isAnimationFinished]);
    const cachedMusic = useMemo(() => {
        if (!isAnimationFinished) return [];
        return getMusic();
    }, [messages, isAnimationFinished]);
    const allViewerItems = useMemo(() => cachedMedia.map(item => ({
        type: item.type, url: item.url, name: item.name,
        mediaItemId: item.mediaItemId,
        senderName: item.senderName, senderProfile: item.senderProfile, time: item.time,
        messageId: item.messageId, chatType: item.chatType, forContact: item.forContact,
        msg: item.msg,
    })), [cachedMedia]);

    const getGroups = () => {
        if (chat?.contactType !== 'person' || !chat?.otherMember || chat.otherMember.length === 0) return [];
        const items = [];
        const otherUserId = chat.otherMember[0]._id?._id ? chat.otherMember[0]._id._id.toString() : chat.otherMember[0]._id?.toString();
        const myUserId = backendUser?._id?.toString();

        contacts?.forEach((contact) => {
            if (contact.contactType === 'group') {
                const hasBackendUser = contact.members?.some(m => m._id && (m._id._id ? m._id._id.toString() === myUserId : m._id.toString() === myUserId));
                const hasOtherUser = contact.members?.some(m => m._id && (m._id._id ? m._id._id.toString() === otherUserId : m._id.toString() === otherUserId));
                if (hasBackendUser && hasOtherUser) {
                    items.push(contact);
                }
            }
        });
        return items;
    };

    const getChannels = () => {
        if (chat?.contactType !== 'person' || !chat?.otherMember || chat.otherMember.length === 0) return [];
        const items = [];
        const otherUserId = chat.otherMember[0]._id?._id ? chat.otherMember[0]._id._id.toString() : chat.otherMember[0]._id?.toString();
        const myUserId = backendUser?._id?.toString();

        contacts?.forEach((contact) => {
            if (contact.contactType === 'channel') {
                const hasBackendUser = contact.members?.some(m => m._id && (m._id._id ? m._id._id.toString() === myUserId : m._id.toString() === myUserId));
                const hasOtherUser = contact.members?.some(m => m._id && (m._id._id ? m._id._id.toString() === otherUserId : m._id.toString() === otherUserId));
                if (hasBackendUser && hasOtherUser) {
                    items.push(contact);
                }
            }
        });
        return items;
    };

    const cachedCommonGroups = useMemo(() => {
        if (!isAnimationFinished) return [];
        return getGroups();
    }, [chat, contacts, backendUser, isAnimationFinished]);
    const cachedCommonChannels = useMemo(() => {
        if (!isAnimationFinished) return [];
        return getChannels();
    }, [chat, contacts, backendUser, isAnimationFinished]);

    const infoTabs = useMemo(() => [
        ...(chat?.contactType !== 'person' ? [{ key: 'members', label: 'Members', icon: BsPeopleFill }] : []),
        ...(chat?.contactType === 'person' && cachedCommonGroups.length > 0 ? [{ key: 'groups', label: 'Groups', icon: BsPeopleFill }] : []),
        ...(chat?.contactType === 'person' && cachedCommonChannels.length > 0 ? [{ key: 'channels', label: 'Channels', icon: BsPeopleFill }] : []),
        ...(cachedMedia.length > 0 ? [{ key: 'media', label: 'Media', icon: BsImages }] : []),
        ...(cachedFiles.length > 0 ? [{ key: 'files', label: 'Files', icon: BsFileEarmark }] : []),
        ...(cachedMusic.length > 0 ? [{ key: 'music', label: 'Music', icon: BsMusicNote }] : []),
    ], [chat?.contactType, cachedCommonGroups.length, cachedCommonChannels.length, cachedMedia.length, cachedFiles.length, cachedMusic.length]);

    useEffect(() => {
        if (infoTabs.length > 0 && !infoTabs.find(t => t.key === activeInfoTab)) {
            setActiveInfoTab(infoTabs[0].key);
        }
    }, [infoTabs, activeInfoTab]);

    const activeInfoTabIndex = Math.max(0, infoTabs.findIndex(t => t.key === activeInfoTab));
    const handleInfoTabChange = useCallback((key) => {
        const newIdx = infoTabs.findIndex(t => t.key === key);
        const oldIdx = infoTabs.findIndex(t => t.key === activeInfoTab);
        setInfoTabDir(newIdx > oldIdx ? 1 : -1);
        setActiveInfoTab(key);
    }, [infoTabs, activeInfoTab]);

    const filteredMembers = useMemo(() => {
        if (!isAnimationFinished || !members) return [];
        if (!memberSearchText) return members;
        const q = memberSearchText.toLowerCase();
        return members.filter(m => {
            const fullName = `${m.name || ''} ${m.lastName || ''}`.toLowerCase();
            const username = (m.username || '').toLowerCase();
            return fullName.includes(q) || username.includes(q);
        });
    }, [members, memberSearchText, isAnimationFinished]);

    if (chat == null) {
        return null;
    }
    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const formatItemTime = (isoTime) => {
        if (!isoTime) return '';
        const d = new Date(isoTime);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return `Today at ${hh}:${mm}`;
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${hh}:${mm}`;
        return `${d.toLocaleDateString()} at ${hh}:${mm}`;
    };
    const handleFileDownload = async (file) => {
        if (!file?.url) return;
        try {
            const res = await fetch(file.url);
            const blob = await res.blob();
            const burl = window.URL.createObjectURL(blob);
            let fn = file.name || (file.mediaType === 'image' ? 'image.jpg' : 'video.mp4');
            if (!file.url.startsWith('blob:')) {
                const parts = file.url.split('/');
                const last = parts[parts.length - 1];
                if (last?.includes('.')) fn = last.split('?')[0];
            }
            const a = Object.assign(document.createElement('a'), { href: burl, download: fn, style: 'display:none' });
            document.body.appendChild(a); a.click();
            setTimeout(() => { window.URL.revokeObjectURL(burl); a.remove(); }, 200);
        } catch { window.open(file.url, '_blank'); }
    };
    const handleDeleteSelectedMedia = async () => {

        setShowDelete(false);
        // Resolve pending IDs to real MongoDB IDs before sending to backend
        const resolvedItems = selectedItems.map(item => ({
            ...item,
            messageId: item.msg?._realId || item.msg?._id || item.messageId,
            msg: {
                ...item.msg,
                _id: item.msg?._realId || item.msg?._id,
            },
        }));
        await deleteSelectedMedia(chat._id, resolvedItems)
        setSelectedItems([]);


    }
    return (

        <div>
            <div
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setSidebarMode("info");
                        setPanelOpen(true);
                    }
                }}
                className="bg-white w-full flex items-center px-2 py-2 shadow-xl sticky top-0 z-30 cursor-pointer"
            >
                <button
                    onClick={back}
                    className={`${isNavbarHidden ? "flex" : "lg:hidden"} p-2 mr-2 rounded-full hover:bg-gray-200 transition duration-150`}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                {chat.contactType == "person" && (
                    <div className="div" onClick={() => { setSidebarMode("info"); setPanelOpen(true); }}>
                        <UserAvatar    {...(chat.otherMember[0]._id !== null && chat.otherMember[0]._id.profile.type === 'image' && {
                            image: chat.otherMember[0]._id.profile
                                .imageUrl,
                        })}
                            {...(chat.otherMember[0]._id !== null && chat.otherMember[0]._id.profile.type === 'emoji' && {
                                emoji: chat.otherMember[0]._id.profile
                                    .emoji,
                                simpleBg: chat.otherMember[0]._id.profile
                                    .bgColor,
                            })}
                            {...(chat._id !== null && chat.otherMember[0]._id.profile.type === 'initials' && {
                                simpleBg: chat.otherMember[0]._id.profile
                                    .bgColor,
                                text: chat.otherMember[0].nickName ? (chat.otherMember[0].nickLastName ? (chat.otherMember[0].nickName[0].toUpperCase() + chat.otherMember[0].nickLastName[0].toUpperCase()) : (chat.otherMember[0].nickName[0].toUpperCase())) : (chat.otherMember[0]._id.profile
                                    .initials),

                            })} />
                    </div>
                )}
                {chat.contactType == "group" && (
                    <div className="div" onClick={() => { setSidebarMode("info"); setPanelOpen(true); }}>
                        <UserAvatar    {...(chat.details.profile !== null && chat.details.profile.type === 'image' && {
                            image: chat.details.profile
                                .imageUrl,
                        })}
                            {...(chat.details.profile !== null && chat.details.profile.type === 'emoji' && {
                                emoji: chat.details.profile
                                    .emoji,
                                simpleBg: chat.details.profile
                                    .bgColor,
                            })}
                            {...(chat.details.profile !== null && chat.details.profile.type === 'initials' && {
                                simpleBg: chat.details.profile
                                    .bgColor,
                                text: chat.details.profile.initials,

                            })} />
                    </div>
                )}
                {chat.contactType == "channel" && (
                    <div className="div" onClick={() => { setSidebarMode("info"); setPanelOpen(true); }}>
                        <UserAvatar    {...(chat.details.profile !== null && chat.details.profile.type === 'image' && {
                            image: chat.details.profile
                                .imageUrl,
                        })}
                            {...(chat.details.profile !== null && chat.details.profile.type === 'emoji' && {
                                emoji: chat.details.profile
                                    .emoji,
                                simpleBg: chat.details.profile
                                    .bgColor,
                            })}
                            {...(chat.details.profile !== null && chat.details.profile.type === 'initials' && {
                                simpleBg: chat.details.profile
                                    .bgColor,
                                text: chat.details.profile.initials,

                            })} />
                    </div>
                )}
                <div onClick={() => { setSidebarMode("info"); setPanelOpen(true); }} className="ml-6 flex flex-col">
                    <Typography color="blue-gray" className="select-none font-semibold text-base">
                        {chat.contactType == "person" && (
                            chat.otherMember[0]._id.name ? (chat.otherMember[0]._id.lastName ? (formatName(chat.otherMember[0]._id.name) + " " + formatName(chat.otherMember[0]._id.lastName)) : (formatName(chat.otherMember[0]._id.name))) : (null)
                        )}
                        {(chat.contactType == "group" || chat.contactType == "channel") && (
                            chat.name
                        )}
                    </Typography>
                    <Typography
                        variant="small"
                        color="gray"
                        className="select-none text-sm font-medium text-gray-700"
                    >

                        {(chat.contactType == "channel" || chat.contactType == "group") && (
                            chat.members.length > 1 ? (`${chat.members.length} ${chat.contactType == "channel" ? "Subscribers" : "Members"}`) : (`${chat.members.length} ${chat.contactType == "channel" ? "Subscriber" : "Member"}`)
                        )}
                        {chat.contactType == "person" && (
                            (chat.blockedUserForThisChat && Array.isArray(chat.blockedUserForThisChat) && chat.blockedUserForThisChat.length > 0) ? (
                                "Last seen a long time ago"
                            ) : (
                                chat.otherMember[0]._id.isOnline ? "Online" : formatLastSeen(chat.otherMember[0]._id.lastSeen)
                            )
                        )}
                    </Typography>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarMode("search");
                            setPanelOpen(true);
                        }}
                        className="hidden sm:block p-2 rounded-full cursor-pointer hover:bg-gray-200 transition duration-150"
                    >
                        <HiMagnifyingGlass className="h-6 w-6 text-gray-700" />
                    </button>
                    <LogoutPopover chat={chat} back={back} choose={choose} onSearchClick={() => {
                        setSidebarMode("search");
                        setPanelOpen(true);
                    }} />
                </div>
            </div>

            <AnimatePresence>
                {panelOpen && (
                    <>
                        {/* Backdrop (no click handler) */}
                        <motion.div
                            className=" select-none fixed inset-0 bg-black/40 backdrop-blur-md z-30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        // NO onClick!
                        />

                        {/* Main Info Panel */}
                        <motion.div
                            className="select-none fixed   right-0 top-0 h-full  bg-white shadow-xl z-40 w-full md:w-96"
                            variants={infoPanelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                            onAnimationComplete={() => {
                                if (panelOpen) {
                                    setIsAnimationFinished(true);
                                }
                            }}
                        >
                            {sidebarMode === "search" ? (
                                <div className="flex flex-col h-full bg-white select-none">
                                    {/* Search Header */}
                                    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-200 transition"
                                            onClick={() => {
                                                setPanelOpen(false);
                                                setSidebarMode("info");
                                                setSearchText("");
                                                setSearchQuery("");
                                                setSelectedUserFilter(null);
                                            }}
                                        >
                                            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                                        </button>
                                        <Typography variant="h5" color="blue-gray" className="font-semibold text-lg">
                                            Search Messages
                                        </Typography>
                                    </div>

                                    {/* Search Input Container */}
                                    <div className="p-3 border-b border-gray-100 flex flex-col gap-2 bg-white shrink-0">
                                        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
                                            <HiMagnifyingGlass className="h-5 w-5 text-gray-400 shrink-0" />

                                            {selectedUserFilter && !showMembersDropdown && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUserFilter(null);
                                                        setActiveSearchIndex(-1);
                                                    }}
                                                    className="flex items-center bg-[#3390ec]/10 rounded-full pl-1 pr-2 py-0.5 gap-1 cursor-pointer shrink-0 select-none group transition-all hover:bg-[#3390ec]/20 max-w-[130px]"
                                                    title="Click to remove filter"
                                                >
                                                    <span className="text-[12px] font-medium text-[#3390ec] truncate leading-tight">
                                                        From: {selectedUserFilter.name}
                                                    </span>
                                                    <MdOutlineClose size={12} className="text-[#3390ec]" />
                                                </div>
                                            )}

                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={showMembersDropdown ? memberSearchText : searchText}
                                                onChange={(e) => {
                                                    if (showMembersDropdown) {
                                                        setMemberSearchText(e.target.value);
                                                    } else {
                                                        setSearchText(e.target.value);
                                                        setSearchQuery(e.target.value);
                                                        setActiveSearchIndex(-1);
                                                    }
                                                }}
                                                placeholder={showMembersDropdown ? "Search Members" : "Search"}
                                                className="flex-1 bg-transparent text-gray-800 text-[14px] outline-none min-w-0"
                                            />

                                            {/* Calendar Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onOpenCalendar) onOpenCalendar();
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                                                title="Jump to date"
                                            >
                                                <FiCalendar size={18} />
                                            </button>

                                            {/* Member Filter Button */}
                                            {!showMembersDropdown && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMembersDropdown(true);
                                                        setSearchText("");
                                                        setSearchQuery("");
                                                        setActiveSearchIndex(-1);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                                                    title="Search by member"
                                                >
                                                    <FiUser size={18} />
                                                </button>
                                            )}

                                            {/* Clear Input / Close Button */}
                                            {(searchText || selectedUserFilter || showMembersDropdown) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (showMembersDropdown) {
                                                            if (memberSearchText) {
                                                                setMemberSearchText("");
                                                            } else {
                                                                setShowMembersDropdown(false);
                                                            }
                                                        } else {
                                                            setSearchText("");
                                                            setSearchQuery("");
                                                            setSelectedUserFilter(null);
                                                        }
                                                        setActiveSearchIndex(-1);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
                                                    title="Clear"
                                                >
                                                    <MdOutlineClose size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Search Results List / Members Dropdown */}
                                    <div className="flex-1 overflow-y-auto scrollbar-telegram">
                                        {showMembersDropdown ? (
                                            <div className="flex flex-col">
                                                {filteredMembers.map((member) => (
                                                    <div
                                                        key={member._id}
                                                        onClick={() => {
                                                            if (setSelectedUserFilter) {
                                                                setSelectedUserFilter(member);
                                                            }
                                                            setShowMembersDropdown(false);
                                                            setMemberSearchText("");
                                                            setSearchText("");
                                                            setSearchQuery("");
                                                            setActiveSearchIndex(-1);
                                                        }}
                                                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100/70 cursor-pointer transition-colors"
                                                    >
                                                        <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                                                            <Avatar
                                                                size="w-9 h-9"
                                                                {...(member.profile?.type === 'image' && { image: member.profile.imageUrl })}
                                                                {...(member.profile?.type === 'emoji' && { emoji: member.profile.emoji, emojiSize: "text-lg", simpleBg: member.profile.bgColor })}
                                                                {...(member.profile?.type === 'initials' && { text: member.profile.initials, simpleBg: member.profile.bgColor })}
                                                                {...(!member.profile && { text: member.name?.charAt(0) || "?", simpleBg: "#d1d5db" })}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-gray-900 text-[14px] truncate">
                                                                {member.name} {member.lastName}
                                                            </span>
                                                            {member.username && (
                                                                <span className="text-gray-400 font-normal text-[12px]">
                                                                    {member.username}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredMembers.length === 0 && (
                                                    <div className="text-center py-6 text-gray-400 text-sm">
                                                        No members found
                                                    </div>
                                                )}
                                            </div>
                                        ) : (searchText || selectedUserFilter) ? (
                                            searchedMessages.length > 0 ? (
                                                <div className="flex flex-col bg-white">
                                                    <div className="px-4 py-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                                                        {searchedMessages.length} matched messages
                                                    </div>
                                                    {searchedMessages.map((msg, idx) => {
                                                        const senderDetails = getSenderDetails(msg.sender);
                                                        const isHighlighted = idx === activeSearchIndex;
                                                        return (
                                                            <div
                                                                key={msg._id}
                                                                onClick={() => {
                                                                    setActiveSearchIndex(idx);
                                                                    const element = document.querySelector(`[data-msg-id="${msg._id}"]`);
                                                                    if (element) {
                                                                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                                                                        element.classList.add("search-highlight-flash");
                                                                        setTimeout(() => {
                                                                            element.classList.remove("search-highlight-flash");
                                                                        }, 1500);
                                                                    }
                                                                    // Close sidebar and clear search on search result click
                                                                    setPanelOpen(false);
                                                                    setSidebarMode("info");
                                                                    setSearchText("");
                                                                    setSearchQuery("");
                                                                    setSelectedUserFilter(null);
                                                                }}
                                                                className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-50 ${isHighlighted ? "bg-[#3390ec]/10" : "hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {/* Sender Avatar */}
                                                                <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                                                                    <Avatar
                                                                        size="w-9 h-9"
                                                                        {...(senderDetails.profile?.type === 'image' && { image: senderDetails.profile.imageUrl })}
                                                                        {...(senderDetails.profile?.type === 'emoji' && { emoji: senderDetails.profile.emoji, emojiSize: "text-lg", simpleBg: senderDetails.profile.bgColor })}
                                                                        {...(senderDetails.profile?.type === 'initials' && { text: senderDetails.profile.initials, simpleBg: senderDetails.profile.bgColor })}
                                                                        {...(!senderDetails.profile && { text: senderDetails.name?.charAt(0) || "?", simpleBg: "#d1d5db" })}
                                                                    />
                                                                </div>
                                                                {/* Message info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="font-semibold text-gray-800 text-[14px] truncate">
                                                                            {senderDetails.name}
                                                                        </span>
                                                                        <span className="text-[11px] text-gray-400 font-normal shrink-0">
                                                                            {formatSearchDate(msg.time)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-600 text-[13px] mt-0.5 line-clamp-2 break-all leading-normal">
                                                                        {highlightText(getMessagePreviewText(msg), searchText)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white">
                                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                                        <HiMagnifyingGlass className="h-8 w-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium text-[15px]">No messages found</p>
                                                    <p className="text-gray-400 text-[13px] mt-1">Try searching for other keywords</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                                    <HiMagnifyingGlass className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-medium text-[15px]">Search Messages</p>
                                                <p className="text-gray-400 text-[13px] mt-1">Search for messages in this chat by typing keywords above.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative h-[calc(100vh-17px)] bg-white   py-2">
                                        <div className="flex items-center gap-4 px-4 py-3 bg-white">
                                            <button
                                                className="p-2 rounded-full hover:bg-gray-200 transition"
                                                onClick={() => {
                                                    const depth = window.history.state?.modalDepth || 1;
                                                    window.history.go(-depth);
                                                }}
                                            >
                                                <MdOutlineClose className="h-6 w-6 text-gray-700" />
                                            </button>
                                            <Typography variant="h5" color="blue-gray">

                                                {chat.contactType == "channel" && ("Channel Info")}
                                                {chat.contactType == "group" && ("Group Info")}
                                                {chat.contactType == "person" && ("User Info")}
                                            </Typography>

                                            {showEditButton(chat) && (
                                                <div className="ml-auto flex items-center gap-2 ">
                                                    <button
                                                        className="p-2 rounded-full cursor-pointer hover:bg-gray-200 transition duration-150"
                                                        onClick={() => setIsEditScreenOpen(true)}
                                                    >
                                                        <PencilIcon className="h-6 w-6 text-gray-700" />
                                                    </button>
                                                </div>
                                            )}
                                            {chat.contactType == "person" && (
                                                <div className="ml-auto flex items-center gap-2 ">
                                                    <button
                                                        className=" group/delete p-2 rounded-full cursor-pointer hover:bg-red-50 transition duration-50"

                                                    >
                                                        <MdOutlineDeleteOutline className="h-6 w-6 text-red-600" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div ref={scrollContainerRef} className="scrollbar-telegram overflow-y-auto h-[calc(100dvh-90px)]">
                                            <div className="p-4 ">
                                                <div className="mt-4 mb-4 flex flex-col items-center">
                                                    {(chat.contactType == "group" || chat.contactType == "channel") ? (
                                                        <Avatar textSize="text-5xl" size="w-28 h-28" emojiSize={'text-5xl'} {...(chat.details.profile !== null && chat.details.profile.type === 'image' && {
                                                            image: chat.details.profile
                                                                .imageUrl,
                                                        })}
                                                            {...(chat.details.profile !== null && chat.details.profile.type === 'emoji' && {
                                                                emoji: chat.details.profile
                                                                    .emoji,
                                                                simpleBg: chat.details.profile
                                                                    .bgColor,
                                                            })}
                                                            {...(chat.details.profile !== null && chat.details.profile.type === 'initials' && {
                                                                simpleBg: chat.details.profile
                                                                    .bgColor,
                                                                text: chat.details.profile.initials,

                                                            })} />) : (
                                                        <Avatar textSize="text-5xl" size="w-28 h-28" emojiSize={'text-5xl'} {...(chat.otherMember[0]._id !== null && chat.otherMember[0]._id.profile.type === 'image' && {
                                                            image: chat.otherMember[0]._id.profile
                                                                .imageUrl,
                                                        })}
                                                            {...(chat.otherMember[0]._id !== null && chat.otherMember[0]._id.profile.type === 'emoji' && {
                                                                emoji: chat.otherMember[0]._id.profile
                                                                    .emoji,
                                                                simpleBg: chat.otherMember[0]._id.profile
                                                                    .bgColor,
                                                            })}
                                                            {...(chat._id !== null && chat.otherMember[0]._id.profile.type === 'initials' && {
                                                                simpleBg: chat.otherMember[0]._id.profile
                                                                    .bgColor,
                                                                text: chat.otherMember[0]._id.profile.initials

                                                            })} />)}

                                                    <div className="flex p-2 flex-col items-center mt-2">
                                                        <Typography color="blue-gray" className="font-semibold text-xl text-center">
                                                            {chat.contactType == "person" && (chat.otherMember[0]._id.name ? (chat.otherMember[0]._id.lastName ? (formatName(chat.otherMember[0]._id.name) + " " + formatName(chat.otherMember[0]._id.lastName)) : (formatName(chat.otherMember[0]._id.name))) : (null))}
                                                            {chat.contactType == "group" && (
                                                                chat.name
                                                            )}
                                                        </Typography>
                                                        <Typography
                                                            variant="small"
                                                            color="gray"
                                                            className="text-base font-body text-gray-600 text-center mt-1"
                                                        >
                                                            {chat.contactType == "group" && (
                                                                chat.members.length > 1 ? (`${chat.members.length} Members`) : (`${chat.members.length} Member`)
                                                            )}
                                                        </Typography>
                                                    </div>
                                                </div>

                                                <div className="bg-white">
                                                    {(chat.contactType == "group" || chat.contactType == "channel") && (<List>
                                                        <ListItem className="flex"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.host}/+${chat._id}`);
                                                                toast.success("Link copied")
                                                            }}>  {/* Add flex explicitly if needed */}
                                                            <ListItemPrefix className="flex-shrink-0">  {/* Prevent icon shrinking */}
                                                                <PiLinkSimpleLight size={26} />
                                                            </ListItemPrefix>
                                                            <div className="flex flex-col gap-1 min-w-0 flex-1">  {/* min-w-0 + flex-1 */}
                                                                <Typography className="max-w-[180px] truncate min-w-0 font-normal text-base text-gray-900">
                                                                    {`${window.location.host}/+${chat._id}`}
                                                                </Typography>
                                                                <Typography variant="small" color="gray" className="text-sm max-w-[180px] font-body truncate min-w-0 text-gray-600">
                                                                    Link
                                                                </Typography>
                                                            </div>
                                                        </ListItem>

                                                    </List>)}
                                                    {chat.contactType == "person" && (<List>
                                                        <ListItem className="flex"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(formatPhone(chat.otherMember[0]._id.phone)
                                                                );
                                                                toast.success("Phone copied")
                                                            }}>  {/* Add flex explicitly if needed */}
                                                            <ListItemPrefix className="flex-shrink-0">  {/* Prevent icon shrinking */}
                                                                <MdOutlineLocalPhone className="text-gray-700" size={26} />
                                                            </ListItemPrefix>
                                                            <div className="flex flex-col min-w-0 flex-1">  {/* min-w-0 + flex-1 */}
                                                                <Typography className="max-w-[180px] truncate min-w-0 font-normal text-base text-gray-900">
                                                                    {formatPhone(chat.otherMember[0]._id.phone)}
                                                                </Typography>
                                                                <Typography variant="small" color="gray" className="text-sm max-w-[180px] font-normal truncate min-w-0 text-gray-600">
                                                                    Phone
                                                                </Typography>
                                                            </div>
                                                        </ListItem>
                                                    </List>)}
                                                </div>
                                            </div>


                                            <div className="h-4 bg-gray-100" />

                                            <div className="bg-white">
                                                {!isAnimationFinished ? (
                                                    <div className="animate-pulse p-4 flex flex-col gap-6 select-none">
                                                        {/* Tab bar skeleton matching premium styling */}
                                                        <div className="flex gap-4 border-b border-gray-200 pb-3">
                                                            <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                                                            <div className="h-4 bg-gray-200 rounded-md w-16"></div>
                                                            <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                                        </div>
                                                        {/* List items skeleton matching standard circular/line heights */}
                                                        <div className="flex flex-col gap-4">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                                                                    <div className="flex-1 flex flex-col gap-2">
                                                                        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                                                                        <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Tab Bar */}
                                                        <div ref={tabBarRef} className="border-b border-gray-200 sticky top-0 bg-white z-10 w-full overflow-hidden">
                                                            <AnimatePresence mode="wait">
                                                                {isSelectionMode ? (
                                                                    <motion.div
                                                                        key="selection-header"
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -10 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="flex items-center justify-between px-4 py-3 bg-white text-black w-full"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <button onClick={() => setSelectedItems([])} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                                                                <MdOutlineClose size={24} />
                                                                            </button>
                                                                            <span className="font-medium text-[15px]">{selectedItems.length} Selected</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => {
                                                                                const forwardDatas = selectedItems.map(item => ({
                                                                                    _id: item.messageId || item._id,
                                                                                    chatType: item.chatType,
                                                                                    forContact: item.forContact,
                                                                                    type: item.chatType,
                                                                                    url: item.url,
                                                                                    name: item.name,
                                                                                    senderName: item.senderName,
                                                                                    senderProfile: item.senderProfile,
                                                                                    time: item.time,
                                                                                    media: item.media || { _id: item.mediaItemId, url: item.url, name: item.name },
                                                                                    isForwardOne: false,
                                                                                    msg: item.msg,
                                                                                }));
                                                                                setForwardItem(forwardDatas);
                                                                                setShowForward(true);
                                                                                setSelectedItems([]);
                                                                            }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                                                                <svg className="w-5 h-5 m-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                                                                            </button>
                                                                            {handleIsDeleteAllowed() && (
                                                                                <button onClick={() => setShowDelete(true)} className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors">
                                                                                    <svg className="w-5 h-5 m-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        key="tabs-header"
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="flex relative w-full"
                                                                    >
                                                                        {infoTabs.map((tab) => {
                                                                            const Icon = tab.icon;
                                                                            return (
                                                                                <button
                                                                                    key={tab.key}
                                                                                    onClick={() => handleInfoTabChange(tab.key)}
                                                                                    className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors duration-200
                                                                                    ${activeInfoTab === tab.key ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                >
                                                                                    <Icon size={17} />
                                                                                    {tab.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {/* Sliding underline indicator */}
                                                                        <motion.div
                                                                            className="absolute bottom-0 h-[2px] bg-blue-500 rounded-full shadow-sm"
                                                                            animate={{
                                                                                left: `${activeInfoTabIndex * (100 / infoTabs.length) + (100 / infoTabs.length) * 0.1}%`,
                                                                                width: `${(100 / infoTabs.length) * 0.8}%`,
                                                                            }}
                                                                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                                        />
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Tab Content */}
                                                        <div className=" relative overflow-hidden" style={{ minHeight: 120 }}>
                                                            <AnimatePresence initial={false} custom={infoTabDir}>
                                                                <motion.div
                                                                    key={activeInfoTab}
                                                                    custom={infoTabDir}
                                                                    variants={tabContentVariants}
                                                                    initial="enter"
                                                                    animate="center"
                                                                    exit="exit"
                                                                    style={{ width: '100%', willChange: 'transform, opacity' }}

                                                                >
                                                                    {/* Members */}
                                                                    {
                                                                        (chat.contactType == "group" || chat.contactType == "channel") && members !== null && activeInfoTab === 'members' && (
                                                                            <List>
                                                                                {members.map((member) => (
                                                                                    <ListItem
                                                                                        key={member._id}
                                                                                        className="flex justify-between items-center"
                                                                                    >
                                                                                        <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                                                                            <UserAvatar    {...(member !== null && member.profile.type === 'image' && {
                                                                                                image: member.profile
                                                                                                    .imageUrl,
                                                                                            })}
                                                                                                {...(member !== null && member.profile.type === 'emoji' && {
                                                                                                    emoji: member.profile.emoji,
                                                                                                    simpleBg: member.profile.bgColor,
                                                                                                })}
                                                                                                {...(member !== null && member.profile.type === 'initials' && {
                                                                                                    simpleBg: member.profile.bgColor,
                                                                                                    text: member.profile.initials,

                                                                                                })} />
                                                                                            <div className="flex flex-col gap-1">
                                                                                                <span className="font-medium text-md flex items-center">
                                                                                                    {member.name} { }{member.lastName}
                                                                                                </span>
                                                                                                <span className="text-gray-600 text-sm font-body">
                                                                                                    {member.isOnline ? "Online" : formatLastSeen(member.lastSeen)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <ListItemSuffix>{getRoll(member._id)}</ListItemSuffix>
                                                                                    </ListItem>
                                                                                ))}
                                                                            </List>
                                                                        )}

                                                                    {/* Media - 3-col grid */}
                                                                    {activeInfoTab === 'media' && (() => {
                                                                        if (cachedMedia.length === 0) return (
                                                                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                                                                                <BsImages size={40} className="text-gray-300" />
                                                                                <p className="text-sm">No media shared yet</p>
                                                                            </div>
                                                                        );
                                                                        return (
                                                                            <div className="grid grid-cols-3 gap-0.5">
                                                                                {cachedMedia.map((item, idx) => (
                                                                                    <div
                                                                                        key={item._uid || idx}
                                                                                        className="aspect-square overflow-hidden bg-gray-100 relative cursor-pointer"
                                                                                        onClick={() => {
                                                                                            if (isSelectionMode) {
                                                                                                toggleSelection(item);
                                                                                            } else {
                                                                                                setMediaViewer({ items: cachedMedia, initialIndex: idx });
                                                                                            }
                                                                                        }}
                                                                                        onContextMenu={(e) => {
                                                                                            e.preventDefault();
                                                                                            setContextMenu({ x: e.clientX, y: e.clientY, item });
                                                                                        }}
                                                                                    >
                                                                                        {item.type === 'image' ? (
                                                                                            <div className={`w-full h-full transition-transform duration-200 ${selectedItems.some(i => i._uid === item._uid) ? 'scale-90 rounded-lg overflow-hidden' : ''}`}>
                                                                                                <SmoothImage src={item.url} className="w-full h-full object-cover hover:opacity-90" />
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className={`group w-full h-full relative transition-transform duration-200 ${selectedItems.some(i => i._uid === item._uid) ? 'scale-90 rounded-lg overflow-hidden' : ''}`}>
                                                                                                {item.url?.includes('cloudinary.com/video/') ? (
                                                                                                    <SmoothImage src={item.url} alt="video thumbnail" className="w-full h-full object-cover group-hover:opacity-90" />
                                                                                                ) : (
                                                                                                    <video src={item.url} preload="metadata" className="w-full h-full object-cover group-hover:opacity-90" muted playsInline />
                                                                                                )}
                                                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/60">
                                                                                                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        {selectedItems.some(i => i._uid === item._uid) && (
                                                                                            <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white pointer-events-none">
                                                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                                                            </div>
                                                                                        )}
                                                                                        {isSelectionMode && !selectedItems.some(i => i._uid === item._uid) && (
                                                                                            <div className="absolute top-1.5 right-1.5 border-2 border-white/80 rounded-full w-5 h-5 pointer-events-none transition-opacity"></div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* Files - list with smart thumbnail */}
                                                                    {activeInfoTab === 'files' && (() => {
                                                                        if (cachedFiles.length === 0) return (
                                                                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                                                                                <BsFileEarmark size={40} className="text-gray-300" />
                                                                                <p className="text-sm">No files shared yet</p>
                                                                            </div>
                                                                        );
                                                                        return (
                                                                            <div className="divide-y divide-gray-100">
                                                                                {cachedFiles.map((file, idx) => (
                                                                                    <button
                                                                                        key={file._uid || idx}
                                                                                        className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left ${selectedItems.some(i => i._uid === file._uid) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                                                                        onClick={() => {
                                                                                            if (isSelectionMode) {
                                                                                                toggleSelection(file);
                                                                                                return;
                                                                                            }
                                                                                            if (file.mediaType === 'image' || file.mediaType === 'video') {
                                                                                                setMediaViewer({
                                                                                                    items: [{ type: file.mediaType, url: file.url, name: file.name, mediaItemId: file.mediaItemId, media: file.media, senderName: file.senderName, senderProfile: file.senderProfile, time: file.time, messageId: file.messageId, chatType: file.chatType, forContact: file.forContact, msg: file.msg }],
                                                                                                    initialIndex: 0
                                                                                                });
                                                                                            } else {
                                                                                                handleFileDownload(file);
                                                                                            }
                                                                                        }}
                                                                                        onContextMenu={(e) => {
                                                                                            e.preventDefault();
                                                                                            setContextMenu({ x: e.clientX, y: e.clientY, item: file });
                                                                                        }}
                                                                                    >
                                                                                        {isSelectionMode && (
                                                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedItems.some(i => i._uid === file._uid) ? 'border-white bg-green-500' : 'border-gray-300'}`}>
                                                                                                {selectedItems.some(i => i._uid === file._uid) && (
                                                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {/* Thumbnail or icon */}
                                                                                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                                                                                            {file.mediaType === 'image' ? (
                                                                                                <SmoothImage src={file.url} className="w-full h-full object-cover" />
                                                                                            ) : file.mediaType === 'video' ? (
                                                                                                <>
                                                                                                    {file.url?.includes('cloudinary.com/video/') ? (
                                                                                                        <SmoothImage src={file.url} alt="video thumbnail" className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                        <video src={file.url} preload="metadata" className="w-full h-full object-cover" muted playsInline />
                                                                                                    )}
                                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                                                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                                                                    </div>
                                                                                                </>
                                                                                            ) : (
                                                                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                                                                                    <BsFileEarmark size={22} className="text-blue-500" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                                                {file.size ? `${formatFileSize(file.size)} · ` : ''}{formatItemTime(file.time)}
                                                                                            </p>
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* Music */}
                                                                    {activeInfoTab === 'music' && (() => {
                                                                        if (cachedMusic.length === 0) return (
                                                                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                                                                                <BsMusicNote size={40} className="text-gray-300" />
                                                                                <p className="text-sm">No music shared yet</p>
                                                                            </div>
                                                                        );
                                                                        return (
                                                                            <div className="divide-y divide-gray-100">
                                                                                {cachedMusic.map((track, idx) => (
                                                                                    <div key={track._uid || idx} className={`cursor-pointer flex items-center ${selectedItems.some(i => i._uid === track._uid) ? 'bg-blue-50/50' : ''}`} onClick={() => {
                                                                                        if (isSelectionMode) {
                                                                                            toggleSelection(track);
                                                                                        } else {
                                                                                            setMusicPlayer(track);
                                                                                        }
                                                                                    }} onContextMenu={(e) => {
                                                                                        e.preventDefault();
                                                                                        setContextMenu({ x: e.clientX, y: e.clientY, item: track });
                                                                                    }}>
                                                                                        {isSelectionMode && (
                                                                                            <div className={`ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedItems.some(i => i._uid === track._uid) ? 'border-white bg-green-500' : 'border-gray-300'}`}>
                                                                                                {selectedItems.some(i => i._uid === track._uid) && (
                                                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex-1 min-w-0 pointer-events-none">
                                                                                            <MusicCard
                                                                                                title={track.name}
                                                                                                size={formatFileSize(track.size)}
                                                                                                source="Audio"
                                                                                                rightDate={formatItemTime(track.time)}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    {chat.contactType === 'person' && activeInfoTab === 'groups' && (
                                                                        <List>
                                                                            {cachedCommonGroups.map((group) => (
                                                                                <ListItem
                                                                                    key={group._id}
                                                                                    className="flex justify-between items-center"
                                                                                    onClick={() => {
                                                                                        setPanelOpen(false);
                                                                                        choose("Chat", group, null, null, null, null, null);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                                                                        <UserAvatar
                                                                                            {...(group.details?.profile?.type === 'image' && { image: group.details.profile.imageUrl })}
                                                                                            {...(group.details?.profile?.type === 'emoji' && { emoji: group.details.profile.emoji, simpleBg: group.details.profile.bgColor })}
                                                                                            {...(group.details?.profile?.type === 'initials' && { simpleBg: group.details.profile.bgColor, text: group.details.profile.initials })}
                                                                                        />
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="font-medium text-md flex items-center">
                                                                                                {group.name}
                                                                                            </span>
                                                                                            <span className="text-gray-600 text-sm font-body">
                                                                                                {group.members?.length} members
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </ListItem>
                                                                            ))}
                                                                        </List>
                                                                    )}
                                                                    {chat.contactType === 'person' && activeInfoTab === 'channels' && (
                                                                        <List>
                                                                            {cachedCommonChannels.map((channel) => (
                                                                                <ListItem
                                                                                    key={channel._id}
                                                                                    className="flex justify-between items-center"
                                                                                    onClick={() => {
                                                                                        setPanelOpen(false);
                                                                                        choose("Chat", channel, null, null, null, null, null);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                                                                        <UserAvatar
                                                                                            {...(channel.details?.profile?.type === 'image' && { image: channel.details.profile.imageUrl })}
                                                                                            {...(channel.details?.profile?.type === 'emoji' && { emoji: channel.details.profile.emoji, simpleBg: channel.details.profile.bgColor })}
                                                                                            {...(channel.details?.profile?.type === 'initials' && { simpleBg: channel.details.profile.bgColor, text: channel.details.profile.initials })}
                                                                                        />
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="font-medium text-md flex items-center">
                                                                                                {channel.name}
                                                                                            </span>
                                                                                            <span className="text-gray-600 text-sm font-body">
                                                                                                {channel.members?.length} subscribers
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </ListItem>
                                                                            ))}
                                                                        </List>
                                                                    )}
                                                                </motion.div>
                                                            </AnimatePresence>
                                                        </div>
                                                    </>
                                                )}
                                            </div>



                                        </div>
                                    </div>
                                    {(chat.contactType == "group" || chat.contactType == "channel" && showFab === true) && (
                                        <div className=" flex justify-end  px-2">
                                            <AnimatePresence exitBeforeEnter>
                                                <motion.button
                                                    onClick={() => {
                                                        setOpenAddContact(true)
                                                    }}
                                                    className="fixed bottom-7  w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7c56eb] transition-colors" // removed transition
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
                                </>
                            )}
                        </motion.div>

                        {/* Edit Panel Overlay */}
                        <AnimatePresence mode="wait">
                            {isEditScreenOpen && (
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
                                    <EditScreen
                                        onShare={() => {
                                            setIsEditScreenOpen(false);
                                            setPanelOpen(false);
                                        }}
                                        onPress={handleEditBack}
                                        chatData={chat} rdScreen={rdData}
                                        onSendInviteLink={choose} />

                                </motion.div>
                            )}
                            {openAddContact && (
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
                                        setRdData("ok");
                                        setOpenAddContact(false)

                                    }}
                                        member={(data) => {

                                        }}
                                        chat={chat}
                                    />

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>

            {/* Unified media viewer portal */}
            {mediaViewer && (
                <InfoMediaViewer
                    items={mediaViewer.items}
                    initialIndex={mediaViewer.initialIndex}
                    onClose={() => setMediaViewer(null)}
                    onForward={(item) => {

                        const forwardData = {
                            _id: item.messageId,
                            chatType: item.chatType,
                            forContact: item.forContact,
                            type: item.chatType,
                            url: item.url,
                            name: item.name,
                            senderName: item.senderName,
                            senderProfile: item.senderProfile,
                            time: item.time,
                            media: item.media,
                            isForwardOne: true,
                            msg: item.msg,
                        };


                        setForwardItem(forwardData);
                        setShowForward(true);
                    }}
                />
            )}

            {/* Music player bottom sheet */}
            {musicPlayer && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-2xl px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <BsMusicNote size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{musicPlayer.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(musicPlayer.size)}</p>
                        </div>
                        <button onClick={() => setMusicPlayer(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                            <MdOutlineClose size={20} />
                        </button>
                    </div>
                    <audio controls autoPlay src={musicPlayer.url} className="w-full" style={{ height: 36 }} />
                </div>
            )}
            {(showForward && forwardItem) && (
                <ForwardPopup
                    isOpen={showForward}
                    onClose={() => {
                        setShowForward(false);
                    }}
                    contacts={
                        ContactsWithOtherMember()
                    }
                    backendUser={backendUser}
                    onContactClick={(user) => {


                        const isSendAllowed = () => {
                            if (user.contactType === "person") {
                                return true;
                            }
                            else if (user.contactType === "group") {

                                const isOwner = user.owner.toString() === backendUser._id.toString();
                                if (isOwner) {
                                    return true;
                                } else {
                                    const isAdmin = user.admins.some(admin => admin.
                                        _id.toString() === backendUser._id.toString());
                                    if (isAdmin === true) {
                                        return true;
                                    } else {
                                        const member = user.members.some(member => member.
                                            _id.toString() === backendUser._id.toString());
                                        if (member === true) {
                                            if (user.membersPermissions.sendMessages === true) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        } else {
                                            return false;
                                        }
                                    }

                                }
                            }
                            else if (user.contactType === "channel") {
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                        if (isSendAllowed()) {
                            // Navigate to chat with forward data containing full message details
                            let forwardMessages = [];
                            if (Array.isArray(forwardItem)) {

                                forwardItem.map(item => item.isForwardOne = false)

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
                            setMediaViewer(null);
                            setPanelOpen(false);

                            choose("Chat", user, null, null, null, null, forwardMessages);

                            setForwardItem(null);

                        } else {
                            toast.error("You are not allowed to send messages to this chat");
                        }

                    }}
                />
            )}
            {showDelete && (
                <DeleteMultiplePopup
                    isOpen={showDelete}
                    onClose={() => {
                        setShowDelete(false);
                    }}
                    onDelete={handleDeleteSelectedMedia}
                    count={selectedItems.length}
                    profilePicture={chat.contactType === "person" ? chat.otherMember[0]._id.profile : chat.details.profile}
                />
            )}

            {/* Context Menu portal */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
                    <div
                        className="fixed bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] py-2 w-[220px] z-[9999] border border-gray-100"
                        style={{
                            top: contextMenu.y + 240 > window.innerHeight ? contextMenu.y - 240 : contextMenu.y,
                            left: contextMenu.x + 220 > window.innerWidth ? contextMenu.x - 220 : contextMenu.x
                        }}
                    >
                        <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-50 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            const item = contextMenu.item;
                            const forwardData = {
                                _id: item.messageId, chatType: item.chatType, forContact: item.forContact, type: item.chatType,
                                url: item.url, name: item.name, senderName: item.senderName, senderProfile: item.senderProfile,
                                time: item.time, media: item.media || { _id: item.mediaItemId, url: item.url, name: item.name },
                                isForwardOne: true, msg: item.msg,
                            };
                            setForwardItem(forwardData);
                            setShowForward(true);
                        }}>
                            <FMFwdIcon /> Forward
                        </button>
                        <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-50 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            handleFileDownload(contextMenu.item);
                        }}>
                            <FMDlIcon /> Download
                        </button>
                        <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-50 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            setPanelOpen(false);

                            const el = document.querySelector(`[data-msg-id="${contextMenu.item.msg._id}"]`);
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('bg-blue-100/50', 'transition-colors', 'duration-500');
                                setTimeout(() => el.classList.remove('bg-blue-100/50'), 1500);
                            }


                        }}>
                            <FMChatIcon /> Show in chat
                        </button>
                        <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-gray-50 text-[15px] font-medium text-gray-800" onClick={() => {
                            setContextMenu(null);
                            if (!selectedItems.some(i => i._uid === contextMenu.item._uid)) {
                                setSelectedItems(prev => [...prev, contextMenu.item]);
                            }
                        }}>
                            <FMSelIcon /> Select
                        </button>
                        {handleIsDeleteAllowed() && (
                            <button className="w-full flex items-center px-5 py-2.5 gap-3.5 hover:bg-red-50 hover:text-red-700 text-[15px] font-medium text-red-500 transition-colors" onClick={async () => {
                                setContextMenu(null);

                                await deleteOneFile(contextMenu.item.msg._realId || contextMenu.item.msg._id, chat._id, contextMenu.item.media._id, `${contextMenu.item.chatType}s`);

                            }}>
                                <FMDelIcon /> Delete
                            </button>
                        )}

                    </div>
                </>
            )}
        </div>
    );
}

// Custom premium icons matching the Telegram-style mockup exactly


const LockIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const UnlockIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
);

const DeleteChatIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const SearchIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);


function LogoutPopover({ onSearchClick, chat, back, choose }) {
    const [open, setOpen] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const { blockPerson, unBlockPerson, deletePerson } = useContext(AuthContext);

    useEffect(() => {
        if (!open) return;
        const handleScroll = () => {
            setOpen(false);
        };
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("wheel", handleScroll, true);
        window.addEventListener("touchmove", handleScroll, true);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("wheel", handleScroll, true);
            window.removeEventListener("touchmove", handleScroll, true);
        };
    }, [open]);

    if (chat?.contactType !== "person") return null;

    const isBlockedByMe = () => {
        if (chat && chat.contactType === 'person' && chat.blockedUserForThisChat && Array.isArray(chat.blockedUserForThisChat)) {
            const otherId = chat.otherMember?.[0]?._id?._id || chat.otherMember?.[0]?._id;
            return chat.blockedUserForThisChat.some(id => (id?._id?.toString() || id?.toString()) === otherId?.toString());
        }
        return false;
    };

    const handleBlock = async () => {
        setOpen(false);
        await blockPerson(chat._id, chat.otherMember[0]._id._id);
    };

    const handleUnBlock = async () => {
        setOpen(false);
        await unBlockPerson(chat._id, chat.otherMember[0]._id._id);
    };

    const handleDeleteChat = async (alsoDeleteForOther) => {
        try {
            const res = await deletePerson(chat._id, alsoDeleteForOther);
            if (res && res.status === 200) {
                toast.success("Chat deleted successfully");
                setShowDeletePopup(false);
                if (back) back();
            } else {
                toast.error("Failed to delete chat");
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Failed to delete chat");
        }
    };

    const menuVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: { duration: 0.15, ease: "easeIn" }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.2, ease: "easeOut" }
        }
    };

    return (
        <div className="relative flex justify-end">
            <button
                className="p-2 rounded-full cursor-pointer hover:bg-gray-200 transition duration-150"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                }}
            >
                <EllipsisVerticalIcon className="h-6 w-6 text-gray-700" />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                        />
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={menuVariants}
                            className="absolute right-0  top-14 z-50 w-[170px] bg-[#ececea] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-1 flex flex-col gap-0.5 border border-[#d2d3cd]/50"
                            onClick={(e) => e.stopPropagation()}
                        >




                            {/* Block user / Unblock user */}
                            {isBlockedByMe() ? (
                                <button
                                    onClick={handleUnBlock}
                                    className="flex items-center w-full px-4 py-3 hover:bg-black/5 active:bg-black/10 rounded-md transition text-left text-gray-900 font-semibold text-[15px] gap-[20px] select-none"
                                >
                                    <UnlockIcon className="w-[18px] h-[18px] text-gray-900" />
                                    <span>Unblock user</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleBlock}
                                    className="flex items-center w-full px-4 py-3 hover:bg-black/5 active:bg-black/10 rounded-md transition text-left text-gray-900 font-semibold text-[15px] gap-[20px] select-none"
                                >
                                    <LockIcon className="w-[18px] h-[18px] text-gray-900" />
                                    <span>Block user</span>
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                    if (onSearchClick) onSearchClick();
                                }}
                                className="flex sm:hidden items-center w-full px-4 py-3 hover:bg-black/5 active:bg-black/10 rounded-md transition text-left text-gray-900 font-semibold text-[15px] gap-[20px] select-none"
                            >
                                <SearchIcon className="w-[18px] h-[18px] text-gray-900" />
                                <span>Search</span>
                            </button>

                            {/* Delete Chat */}
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    setShowDeletePopup(true);
                                }}
                                className="flex items-center w-full px-4 py-3 hover:bg-red-500/10 active:bg-red-500/20 rounded-md transition text-left text-[#d32f2f] font-semibold text-[15px] gap-[20px] select-none"
                            >
                                <DeleteChatIcon className="w-[18px] h-[18px] text-[#d32f2f]" />
                                <span>Delete Chat</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeletePopup && (
                    <DeleteChatPopup
                        onClose={() => setShowDeletePopup(false)}
                        onDelete={handleDeleteChat}
                        chat={chat}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default ChatInfo;
