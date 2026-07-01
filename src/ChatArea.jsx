import './scrollbar.css';
import React, { useState, useRef, useEffect, useLayoutEffect, useContext, useCallback, useMemo } from "react";
import { Spinner } from "@material-tailwind/react";
import MessegeBubble from "./MessegeBubble";
import myAnimation from "./lottie/Wave.json"
import ClipIconPopOver from "./ClipIconPopOver";
import MediaPreviewPopup from "./MediaPreviewPopup";
import ForwardPopup from "./ForwardPopup";
import DeleteMultiplePopup from "./DeleteMultiplePopup";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import InfiniteScroll from "react-infinite-scroll-component";
import { AuthContext } from "./firebase hooks/AuthContext";
import { FaPaperPlane } from "react-icons/fa";
import { BiWinkSmile } from "react-icons/bi";
import InfoScreen from "./info/InfoScreen";

// Lazy-loaded heavy components (only loaded when needed)
const LazyEmojiPicker = React.lazy(() => import('emoji-picker-react'));
const LazyLottie = React.lazy(() => import('lottie-react'));
const LazyLocationPicker = React.lazy(() => import('./LocationPicker'));
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { GoCheckCircle } from "react-icons/go";
import { BsReply } from "react-icons/bs";
import { IoCopyOutline, IoDownloadOutline, IoLinkOutline } from "react-icons/io5";
import { MdOutlineDeleteOutline, MdKeyboardArrowDown, MdClose } from "react-icons/md";
import { PiShareFat } from "react-icons/pi";
import MessegeLabel from './MessegeLabel';
import UserAvatar from "./UserAvatar";
const MENU_WIDTH = 220;
const MENU_HEIGHT = 310;
const PICKER_WIDTH = 350;
const PICKER_HEIGHT = 390;
const PADDING = 16;

const getFirstMedia = (msg) => {
    if (!msg) return null;
    if (msg.images?.length > 0) return { type: 'image', url: msg.images[0].url || msg.images[0] };
    if (msg.videos?.length > 0) return { type: 'video', url: msg.videos[0].url || msg.videos[0] };
    if (msg.documents?.length > 0 || msg.document?.length > 0) {
        const docs = msg.documents || msg.document;
        const firstDoc = docs[0];
        const url = firstDoc.url || firstDoc;
        const name = firstDoc.name || (typeof firstDoc === 'string' ? firstDoc : '');
        const clean = url.split('?')[0].split('#')[0];
        const lastSegment = clean.split('/').pop();
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : (lastSegment && lastSegment.includes('.') ? lastSegment.split('.').pop().toLowerCase() : '');
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return { type: 'image', url };
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { type: 'video', url };
    }
    return null;
};
export default function ChatArea({ isChatSelected, back, contactData, choose, autoChatSendData, resetAutoSentChat, forwardMessagesData, setForwardMessagesData, isNavbarHidden, isMobile }) {
    const { sendImagesInChanel, sendVideosInChanel, sendDocumentsInChanel, sendImagesInChat, sendVideosInChat, sendDocumentsInChat, sendReply, sendTextMessage, sendLocationMessage, sendContactMessage, currentChatData, backendUser, newMessege, setCCd, deleteMsg, contacts, rstUnread, loadOlderMessages, forwardMessages, forwardOneMedia, forwardSelectedMedia, deleteMultipleMessages, toggleReaction, unBlockPerson } = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightDate, setHighlightDate] = useState("");
    const [panelOpen, setPanelOpen] = useState(() => {
        const hash = window.location.hash;
        const search = window.location.search;
        return hash.includes('info=true') || search.includes('info=true');
    });
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());
    const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
    const [selectedUserFilter, setSelectedUserFilter] = useState(null);
    // Performance optimization: only render latest messages during slide-in animation
    const [isAnimating, setIsAnimating] = useState(isMobile);
    useEffect(() => {
        if (isMobile) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 200);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [contactData?._id, isMobile]);
    const isFirstRender = useRef(true);
    useEffect(() => {
        setSearchQuery("");
        setHighlightDate("");
        if (!isFirstRender.current) {
            setPanelOpen(false);
        }
        isFirstRender.current = false;
        setShowCalendar(false);
        setSelectedUserFilter(null);
    }, [contactData?._id]);

    const isInfoPushedRef = useRef(window.location.hash.includes('info=true') || window.location.search.includes('info=true'));

    // Sync panelOpen state with history to support browser back button
    useEffect(() => {
        if (panelOpen) {
            if (!isInfoPushedRef.current) {
                isInfoPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                const cleanHash = window.location.hash.split('?')[0];
                window.history.pushState({ ...window.history.state, infoOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + cleanHash + "?info=true");
            }
        } else {
            if (isInfoPushedRef.current) {
                isInfoPushedRef.current = false;
                if (window.history.state?.infoOpen) {
                    window.history.back();
                } else {
                    const cleanHash = window.location.hash.split('?')[0];
                    window.history.replaceState({ ...window.history.state, infoOpen: false }, '', window.location.pathname + cleanHash);
                }
            }
        }
    }, [panelOpen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (panelOpen && !e.state?.infoOpen) {
                isInfoPushedRef.current = false;
                setPanelOpen(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [panelOpen]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history.back() lag
        };
    }, []);

    const chat = contactData;
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showForwardPopup, setShowForwardPopup] = useState(false);
    const [showDeleteMultiplePopup, setShowDeleteMultiplePopup] = useState(false);
    const [activeReactionsMessage, setActiveReactionsMessage] = useState(null);

    // Media attachment state (multi-file)
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectionSource, setSelectionSource] = useState(null); // 'menu' or 'drag'
    const [isDragging, setIsDragging] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showContactPicker, setShowContactPicker] = useState(false);

    const isLocationPushedRef = useRef(false);
    const isContactPushedRef = useRef(false);

    // Sync showContactPicker state with history to support browser back button
    useEffect(() => {
        if (showContactPicker) {
            if (!isContactPushedRef.current) {
                isContactPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, contactPickerOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isContactPushedRef.current) {
                isContactPushedRef.current = false;
                if (window.history.state?.contactPickerOpen) {
                    window.history.back();
                }
            }
        }
    }, [showContactPicker]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (showContactPicker && !e.state?.contactPickerOpen) {
                isContactPushedRef.current = false;
                setShowContactPicker(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showContactPicker]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled
        };
    }, []);

    // Sync showLocationPicker state with history to support browser back button
    useEffect(() => {
        if (showLocationPicker) {
            if (!isLocationPushedRef.current) {
                isLocationPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, locationPickerOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isLocationPushedRef.current) {
                isLocationPushedRef.current = false;
                if (window.history.state?.locationPickerOpen) {
                    window.history.back();
                }
            }
        }
    }, [showLocationPicker]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (showLocationPicker && !e.state?.locationPickerOpen) {
                isLocationPushedRef.current = false;
                setShowLocationPicker(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showLocationPicker]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled
        };
    }, []);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const isSelectionPushedRef = useRef(false);

    // Push history state when selection mode is active to support browser back button
    useEffect(() => {
        if (selectedMessages.length > 0 && !isSelectionPushedRef.current) {
            const sessionId = Date.now();
            isSelectionPushedRef.current = sessionId;
            window.history.pushState(
                { selectionSession: sessionId },
                '',
                window.location.pathname + window.location.hash
            );
        } else if (selectedMessages.length === 0 && isSelectionPushedRef.current) {
            if (window.history.state?.selectionSession === isSelectionPushedRef.current) {
                window.history.back();
            }
            isSelectionPushedRef.current = false;
        }
    }, [selectedMessages.length]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (isSelectionPushedRef.current) {
                if (e.state?.selectionSession !== isSelectionPushedRef.current) {
                    isSelectionPushedRef.current = false;
                    setSelectedMessages([]);
                }
            } else if (e.state?.selectionSession) {
                const newState = { ...e.state };
                delete newState.selectionSession;
                window.history.replaceState(newState, '');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    const hasMoreMessagesCache = useRef({});
    const skipRef = useRef(0);
    const isLoadingOlder = useRef(false);
    const totalMessagesRef = useRef(0);

    const [replyingTo, setReplyingTo] = useState(null);

    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [isContextMenuEmojiExpanded, setIsContextMenuEmojiExpanded] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
    const [contextMenuMessage, setContextMenuMessage] = useState(null);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuOrigin, setContextMenuOrigin] = useState({ x: 0, y: 0 });
    const [contextMenuClosing, setContextMenuClosing] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionPickerPosition, setReactionPickerPosition] = useState({ top: 0, left: 0 });
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const contextMenuRef = useRef(null);
    const reactionPickerRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const menuAnimTimeout = useRef();
    const contextMenuLeaveTimeout = useRef(null);
    const lastMarkedReadRef = useRef(null);
    const contextClickRef = useRef(null);

    // ✅ Oldest-first messages (native order). 
    // The CSS flex-direction: column-reverse will physically flip the DOM upside down,
    // placing index 0 at the actual bottom of the scroll container.
    const messages = useMemo(() => {
        if (!currentChatData) return [];
        const seenIds = new Set();
        const unique = [];
        for (const m of currentChatData) {
            const idStr = m._id?.toString();
            if (idStr && !seenIds.has(idStr)) {
                seenIds.add(idStr);
                unique.push(m);
            } else if (!idStr) {
                unique.push(m);
            }
        }
        return unique.sort((a, b) => new Date(a.time) - new Date(b.time));
    }, [currentChatData]);

    // Clean up selected messages if they are deleted (e.g. by another user via socket)
    useEffect(() => {
        if (currentChatData) {
            const currentIds = new Set(currentChatData.map(m => m._id?.toString()));
            setSelectedMessages(prev => {
                if (prev.length === 0) return prev;
                const validSelected = prev.filter(id => currentIds.has(id?.toString()));
                if (validSelected.length !== prev.length) {
                    return validSelected;
                }
                return prev;
            });
        }
    }, [currentChatData]);

    const getLocalDateString = (timestampOrString) => {
        const d = new Date(timestampOrString);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const displayedMessages = useMemo(() => {
        if (isAnimating) return [];
        let filtered = messages;
        if (selectedUserFilter) {
            const filterUserId = selectedUserFilter._id?.toString();
            filtered = filtered.filter(m => {
                const senderId = m.sender?._id?.toString() || (typeof m.sender === 'string' ? m.sender : "");
                return senderId === filterUserId;
            });
        }
        return filtered;
    }, [messages, selectedUserFilter, isAnimating]);

    const handlePrevMonth = () => {
        setCalendarViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCalendarViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const isNextMonthDisabled = useMemo(() => {
        const today = new Date();
        return calendarViewDate.getFullYear() > today.getFullYear() ||
            (calendarViewDate.getFullYear() === today.getFullYear() &&
                calendarViewDate.getMonth() >= today.getMonth());
    }, [calendarViewDate]);

    const isFutureDate = (d, m, y) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(y, m, d);
        return date > today;
    };

    const calendarCells = useMemo(() => {
        const year = calendarViewDate.getFullYear();
        const month = calendarViewDate.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const firstDayIdx = new Date(year, month, 1).getDay();
        const paddingCount = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

        const cells = [];
        for (let i = 0; i < paddingCount; i++) {
            cells.push({ type: 'empty', key: `pad-${i}` });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const isFuture = date > today;
            cells.push({
                type: 'day',
                day,
                date,
                isFuture,
                key: `day-${day}`
            });
        }
        return cells;
    }, [calendarViewDate]);

    const handleJumpToDate = () => {
        try {
            const dateVal = getLocalDateString(tempSelectedDate);
            const targetMsg = messages.find(msg => msg && msg.time && getLocalDateString(msg.time) === dateVal);
            if (!targetMsg) {
                toast.error("No messages found on this date");
            } else {
                // 1. Close the search sidebar and calendar immediately
                setPanelOpen(false);
                setShowCalendar(false);

                // 2. Scroll to target message after sidebar starts closing
                setTimeout(() => {
                    const id1 = targetMsg._id;
                    const id2 = targetMsg._realId;
                    const element = document.querySelector(`[data-msg-id="${id1}"]`) ||
                        (id2 && document.querySelector(`[data-msg-id="${id2}"]`)) ||
                        document.querySelector(`[data-real-id="${id1}"]`) ||
                        (id2 && document.querySelector(`[data-real-id="${id2}"]`));
                    if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }

                    // 3. Trigger highlight once scroll is finished / underway (after 400ms delay)
                    setTimeout(() => {
                        setHighlightDate(dateVal);

                        // 4. Remove highlight after 2 seconds
                        setTimeout(() => {
                            setHighlightDate("");
                        }, 2000);
                    }, 400);
                }, 100);
            }
        } catch (error) {
            console.error("Error jumping to date:", error);
            toast.error("Error searching messages for this date");
        } finally {
            setShowCalendar(false);
        }
    };

    const formatHeaderDate = (date) => {
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    };

    const formatMonthYear = (date) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    function getDateLabel(date) {
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        if (isThisYear(date)) return format(date, "MMMM d");
        return format(date, "yyyy-MM-dd");
    }

    useEffect(() => {
        if (!contactData || !contacts.length) return;

        const contact = contacts.find(c => c._id.toString() === contactData._id);
        if (contact) {
            const unreadValue = contact.members?.find(
                member => (member._id?._id || member._id)?.toString() === backendUser?._id?.toString()
            );
            if (unreadValue?.unread > 0 && lastMarkedReadRef.current !== contact._id) {
                lastMarkedReadRef.current = contact._id;
                rstUnread(contact._id, backendUser._id);
            }
        }
    }, [contacts, contactData, backendUser, rstUnread]);

    useEffect(() => {
        totalMessagesRef.current = currentChatData.length;
    }, [currentChatData]);

    useEffect(() => {
        if (contactData?._id) {
            const isExhausted = hasMoreMessagesCache.current[contactData._id] === false;
            setHasMoreMessages(!isExhausted);
            skipRef.current = 0;
            lastMarkedReadRef.current = null;
        }
    }, [contactData?._id]);

    useEffect(() => {
        if (currentChatData.length > 0 && skipRef.current === 0) {
            skipRef.current = currentChatData.length;
        }
    }, [currentChatData]);

    const loadOlder = useCallback(async () => {
        if (isLoadingOlder.current || !hasMoreMessages || !chat) return;
        isLoadingOlder.current = true;
        setLoadingOlder(true);

        const contactId = chat._id;
        const result = await loadOlderMessages(contactId, skipRef.current);

        if (!result.hasMore || result.messages.length === 0) {
            hasMoreMessagesCache.current[contactId] = false;
            setHasMoreMessages(false);
            setLoadingOlder(false);
            isLoadingOlder.current = false;
            return;
        }

        const fetchedCount = result.messages.length;
        skipRef.current += fetchedCount;

        setLoadingOlder(false);
        isLoadingOlder.current = false;
    }, [chat, hasMoreMessages, loadOlderMessages]);

    useEffect(() => {
        if (autoChatSendData?.trim()) {
            setMessage(autoChatSendData);
            resetAutoSentChat("reset");
        }
    }, [autoChatSendData, resetAutoSentChat]);

    useEffect(() => {
        if (newMessege && backendUser && chat) {
            if (isMessageForCurrentChat(newMessege, backendUser._id, chat._id?._id)) {
                setCCd(newMessege);
            }
        }
    }, [newMessege, backendUser, chat, setCCd]);
    const getBlockStatus = () => {
        if (chat && chat.contactType === 'person' && chat.blockedUserForThisChat && Array.isArray(chat.blockedUserForThisChat)) {
            const myIdStr = backendUser?._id?.toString();
            const otherMemberId = chat.otherMember?.[0]?._id?._id?.toString() || chat.otherMember?.[0]?._id?.toString();

            const amIBlocked = chat.blockedUserForThisChat.some(id => {
                const checkId = id?._id?.toString() || id?.toString();
                return checkId === myIdStr;
            });
            if (amIBlocked) {
                return 'blocked_by_other';
            }

            const isOtherBlocked = otherMemberId && chat.blockedUserForThisChat.some(id => {
                const checkId = id?._id?.toString() || id?.toString();
                return checkId === otherMemberId;
            });
            if (isOtherBlocked) {
                return 'blocked_by_me';
            }
        }
        return null;
    };

    const isBlocked = () => {
        return getBlockStatus() !== null;
    };
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) && !e.target.closest('button[type="emoji-toggle"]')) {
                setShowEmojiPicker(false);
            }
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                closeContextMenu(true);
            }
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) {
                closeReactionPicker();
            }
        };

        if (contextMenuOpen || showReactionPicker || showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [contextMenuOpen, showReactionPicker, showEmojiPicker]);

    // Close context menu when mouse leaves the container bounds with buffer zone & grace period.
    useEffect(() => {
        if (!contextMenuOpen || !contextMenuVisible || contextMenuClosing) return;
        let leaveTimeout = null;
        let rafId;
        const BUFFER = 50; // generous 50px buffer zone around context menu to prevent accidental closes while selecting options

        const handleMouseMove = (e) => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (!contextMenuRef.current) return;
                const rect = contextMenuRef.current.getBoundingClientRect();
                const isInsideBuffer = (
                    e.clientX >= rect.left - BUFFER &&
                    e.clientX <= rect.right + BUFFER &&
                    e.clientY >= rect.top - BUFFER &&
                    e.clientY <= rect.bottom + BUFFER
                );

                if (isInsideBuffer) {
                    if (leaveTimeout) {
                        clearTimeout(leaveTimeout);
                        leaveTimeout = null;
                    }
                } else {
                    if (!leaveTimeout) {
                        leaveTimeout = setTimeout(() => {
                            closeContextMenu();
                        }, 120);
                    }
                }
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(rafId);
            if (leaveTimeout) clearTimeout(leaveTimeout);
        };
    }, [contextMenuOpen, contextMenuVisible, contextMenuClosing]);


    const calculateMenuPosition = (clickX, clickY, menuW, menuH) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let finalLeft, finalTop;

        // Horizontal: prefer opening to the right of cursor; flip left if no space
        if (clickX + menuW + PADDING <= viewportWidth) {
            finalLeft = clickX; // menu's left edge touches cursor
        } else {
            finalLeft = clickX - menuW; // menu's right edge touches cursor
        }

        // Vertical: prefer opening downward from cursor; flip up if no space
        if (clickY + menuH + PADDING <= viewportHeight) {
            finalTop = clickY; // menu's top edge touches cursor
        } else {
            finalTop = clickY - menuH; // menu's bottom edge touches cursor
        }

        // Failsafe clamp so it never goes off-screen
        if (finalLeft < PADDING) finalLeft = PADDING;
        if (finalLeft + menuW > viewportWidth - PADDING) finalLeft = viewportWidth - menuW - PADDING;
        if (finalTop < PADDING) finalTop = PADDING;
        if (finalTop + menuH > viewportHeight - PADDING) finalTop = viewportHeight - menuH - PADDING;

        return { top: finalTop, left: finalLeft };
    };

    const calculatePickerPosition = (menuTop, menuLeft) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let finalTop = menuTop;
        let finalLeft = menuLeft;

        const spaceAbove = menuTop;
        if (spaceAbove < PICKER_HEIGHT + PADDING) {
            finalTop = menuTop + MENU_HEIGHT + 8;
            if (finalTop + PICKER_HEIGHT > viewportHeight - PADDING) {
                finalTop = viewportHeight - PICKER_HEIGHT - PADDING;
            }
        } else {
            finalTop = menuTop - PICKER_HEIGHT - 8;
        }

        const spaceRight = viewportWidth - menuLeft;
        let centeredLeft = menuLeft + MENU_WIDTH / 2 - PICKER_WIDTH / 2;
        if (centeredLeft + PICKER_WIDTH + PADDING <= viewportWidth && centeredLeft >= PADDING) {
            finalLeft = centeredLeft;
        } else if (spaceRight < PICKER_WIDTH + PADDING) {
            finalLeft = menuLeft - PICKER_WIDTH - 8;
            if (finalLeft < PADDING) finalLeft = PADDING;
        } else {
            finalLeft = menuLeft;
            if (finalLeft + PICKER_WIDTH > viewportWidth - PADDING) {
                finalLeft = viewportWidth - PICKER_WIDTH - PADDING;
            }
        }
        return { top: finalTop, left: finalLeft };
    };

    function isMessageForCurrentChat(message, currentUserId, chatUserId) {
        return (
            ((message.sender === currentUserId && message.reciever === chatUserId) ||
                (message.sender === chatUserId && message.reciever === currentUserId))
            && message.isGroupChat === false
        );
    }

    const handleEmojiClick = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
    };

    const getPermissions = () => {
        const allAllowed = { canSendText: true, canSendMedia: true, canSendPhotos: true, canSendVideos: true, canSendFiles: true, canSendLocation: true };
        const noneAllowed = { canSendText: false, canSendMedia: false, canSendPhotos: false, canSendVideos: false, canSendFiles: false, canSendLocation: false };
        if (!chat) return noneAllowed;
        if (chat.contactType === "person") return allAllowed;
        if (chat.contactType === "channel") {
            const uid = backendUser?._id?.toString();
            const isOwner = chat.owner?.toString() === uid || chat.owner?._id?.toString() === uid;
            if (isOwner) return allAllowed;
            const isAdmin = chat.admins?.some(admin => {
                const adminId = admin._id?._id?.toString() || admin._id?.toString() || admin?.toString();
                return adminId === uid;
            });
            if (isAdmin) return allAllowed;
            return noneAllowed;
        }
        if (chat.contactType === "group") {
            const uid = backendUser?._id?.toString();
            const isOwner = chat.owner?.toString() === uid || chat.owner?._id?.toString() === uid;
            if (isOwner) return allAllowed;
            const isAdmin = chat.admins?.some(admin => {
                const adminId = admin._id?._id?.toString() || admin._id?.toString() || admin?.toString();
                return adminId === uid;
            });
            if (isAdmin) return allAllowed;
            const isMember = chat.members?.some(member => {
                const memberId = member._id?._id?.toString() || member._id?.toString() || member?.toString();
                return memberId === uid;
            });
            if (isMember) {
                const p = chat.membersPermissions || {};
                return {
                    canSendText: p.sendMesseges !== false,
                    canSendMedia: p.sendMedia !== false,
                    canSendPhotos: p.sendPhotos !== false,
                    canSendVideos: p.sendVideos !== false,
                    canSendFiles: p.sendFiles !== false,
                    canSendLocation: p.sendLocation !== false,
                };
            }
            return noneAllowed;
        }
        return noneAllowed;
    };

    const permissions = useMemo(() => getPermissions(), [chat, backendUser]);

    const handleRetrySend = async (pendingId, retryParams) => {

        // Set the message back to pending status
        setCCd(prev => prev.map(m => m._id === pendingId ? {
            ...m,
            _isPending: true,
            _isError: false,
            _uploadProgress: 0,
        } : m));


        if (retryParams.type === "text") {
            try {
                await sendTextMessage(chat._id, retryParams.text);
                // if (res?.status === 200 && res?.data?.message) {
                //     setCCd({ ...res.data.message, _replaced: pendingId });
                // } else {
                //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                // }
            } catch (err) {
                setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
            }
        } else if (retryParams.type === "reply") {
            const replyToId = retryParams.replyingTo._realId || retryParams.replyingTo._id?.toString?.() || String(retryParams.replyingTo._id);
            const fd = new FormData();
            fd.append("contactId", chat._id);
            fd.append("chatId", replyToId);
            fd.append("chatType", "reply");
            fd.append("content", retryParams.text);

            try {
                const res = await sendReply(fd);
                if (res?.status === 200 && res?.data?.message) {
                    setCCd({ ...res.data.message, _replaced: pendingId });
                } else {
                    setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                }
            } catch (err) {
                setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
            }
        } else if (retryParams.type === "media") {
            const { files, caption, replyingTo } = retryParams;

            if (replyingTo) {
                const replyToId = replyingTo._id?.toString?.() || String(replyingTo._id);
                const fd = new FormData();
                files.forEach((file) => {
                    fd.append("documents", file.file);
                });
                fd.append("caption", caption || "");
                fd.append("contactId", chat._id);
                fd.append("chatId", replyToId);
                const hasImg = files.some(f => f.file.type.startsWith('image/'));
                const hasVid = files.some(f => f.file.type.startsWith('video/'));
                const pType = hasImg ? "image" : (hasVid ? "video" : "document");
                fd.append("chatType", pType);

                try {
                    await sendReply(fd, {
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                            const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                            if (msgEl) {
                                const progressBar = msgEl.querySelector('.upload-progress-bar');
                                if (progressBar) progressBar.style.width = `${progress}%`;
                                const progressText = msgEl.querySelector('.upload-progress-text');
                                if (progressText) progressText.textContent = `${progress}%`;
                            }
                        }
                    });

                    // if (res?.status === 200 && res?.data?.message) {
                    //     setCCd({ ...res.data.message, _replaced: pendingId });
                    // } else {
                    //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                    // }
                } catch (err) {
                    setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                }
            } else if (chat.contactType === "channel") {
                const fd = new FormData();
                let fieldName = "images";
                let apiCall = sendImagesInChanel;
                const hasImg = files.some(f => f.file.type.startsWith('image/'));
                const hasVid = files.some(f => f.file.type.startsWith('video/'));
                const isVideo = !hasImg && hasVid;
                const isDoc = !hasImg && !hasVid;

                if (isVideo) {
                    fieldName = "videos";
                    apiCall = sendVideosInChanel;
                } else if (isDoc) {
                    fieldName = "documents";
                    apiCall = sendDocumentsInChanel;
                }

                files.forEach((file) => {
                    fd.append(fieldName, file.file);
                });
                fd.append("caption", caption || "");
                fd.append("contactId", chat._id);

                try {
                    await apiCall(fd, {
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                            const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                            if (msgEl) {
                                const progressBar = msgEl.querySelector('.upload-progress-bar');
                                if (progressBar) progressBar.style.width = `${progress}%`;
                                const progressText = msgEl.querySelector('.upload-progress-text');
                                if (progressText) progressText.textContent = `${progress}%`;
                            }
                        }
                    });

                    // if (res?.status === 200 && res?.data?.message) {
                    //     setCCd({ ...res.data.message, _replaced: pendingId });
                    // } else {
                    //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                    // }
                } catch (err) {
                    setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                }
            } else if (chat.contactType === "group" || chat.contactType === "person") {
                const fd = new FormData();
                let fieldName = "images";
                let apiCall = sendImagesInChat;
                const hasImg = files.some(f => f.file.type.startsWith('image/'));
                const hasVid = files.some(f => f.file.type.startsWith('video/'));
                const isVideo = !hasImg && hasVid;
                const isDoc = !hasImg && !hasVid;

                if (isVideo) {
                    fieldName = "videos";
                    apiCall = sendVideosInChat;
                } else if (isDoc) {
                    fieldName = "documents";
                    apiCall = sendDocumentsInChat;
                }

                files.forEach((file) => {
                    fd.append(fieldName, file.file);
                });
                fd.append("caption", caption || "");
                fd.append("contactId", chat._id);

                try {
                    await apiCall(fd, {
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                            const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                            if (msgEl) {
                                const progressBar = msgEl.querySelector('.upload-progress-bar');
                                if (progressBar) progressBar.style.width = `${progress}%`;
                                const progressText = msgEl.querySelector('.upload-progress-text');
                                if (progressText) progressText.textContent = `${progress}%`;
                            }
                        }
                    });

                    // if (res?.status === 200 && res?.data?.message) {
                    //     setCCd({ ...res.data.message, _replaced: pendingId });
                    // } else {
                    //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                    // }
                } catch (err) {
                    setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
                }
            }
        }
    };

    const handleSend = async () => {
        if (message.trim() === "" && (!forwardMessagesData || forwardMessagesData.length === 0)) return;
        if (!permissions.canSendText) {
            toast.error("You are not allowed to send messages in this chat");
            return;
        }

        if (forwardMessagesData && forwardMessagesData.length > 0) {



            try {
                if (forwardMessagesData[0].isForwardOne === true && forwardMessagesData[0].isForwardOne !== null && forwardMessagesData[0].isForwardOne !== undefined) {
                    // Single media forward
                    const fwd = forwardMessagesData[0];
                    setForwardMessagesData([]);
                    const res = await forwardOneMedia(chat._id, fwd._id, fwd.type, fwd.media);
                    if (res?.data?.message) {
                        setCCd(res.data.message);
                    }
                    toast.success(`Message forwarded`);
                } else if (
                    forwardMessagesData[0].isForwardOne === false && forwardMessagesData[0].isForwardOne !== null && forwardMessagesData[0].isForwardOne !== undefined
                ) {

                    await forwardSelectedMedia(chat._id, forwardMessagesData)

                }
                else {

                    const data = [...forwardMessagesData];
                    setForwardMessagesData([]);
                    const timeFilterdata = data.sort((a, b) => new Date(a.time) - new Date(b.time));
                    // Multiple messages forward
                    await forwardMessages(chat._id, timeFilterdata.map(m => m._id), timeFilterdata[0].forContact);
                    toast.success(`Messages forwarded`);
                }
                setForwardMessagesData([]);
            } catch (err) {
                toast.error("Failed to forward messages");
                console.error(err);
                return;
            }

            if (message.trim() === "") {
                const scrollContainer = document.getElementById("chat-scroll-container");
                if (scrollContainer) {
                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }
        }

        if (replyingTo) {
            const replyToId = replyingTo._realId || replyingTo._id?.toString?.() || String(replyingTo._id);
            const sentMessage = message;
            const sentReplyingTo = replyingTo;
            setMessage("");
            setReplyingTo(null);

            // Optimistic pending message for text reply
            const pendingId = `pending_text_${Date.now()}`;
            const pendingMsg = {
                _id: pendingId,
                content: sentMessage,
                sender: { _id: backendUser._id, profile: backendUser.profile },
                chatType: "reply",
                time: new Date().toISOString(),
                delivered: false,
                seenBy: [],
                forContact: chat._id,
                replyDetails: { isReply: true, repliedMessage: sentReplyingTo },
                _isPending: true,
            };
            setCCd(pendingMsg);

            const fd = new FormData();
            fd.append("contactId", chat._id);
            fd.append("chatId", replyToId);
            fd.append("chatType", "reply");
            fd.append("content", sentMessage);

            try {
                const res = await sendReply(fd);
                if (res?.status === 200 && res?.data?.message) {
                    setCCd({ ...res.data.message, _replaced: pendingId });
                } else {
                    // Mark as failed with retry
                    setCCd(prev => prev.map(m => m._id === pendingId ? {
                        ...m,
                        _isPending: false,
                        _isError: true,
                        _retryParams: { type: "reply", text: sentMessage, replyingTo: sentReplyingTo },
                        _onRetry: () => handleRetrySend(pendingId, { type: "reply", text: sentMessage, replyingTo: sentReplyingTo })
                    } : m));
                }
            } catch (err) {
                setCCd(prev => prev.map(m => m._id === pendingId ? {
                    ...m,
                    _isPending: false,
                    _isError: true,
                    _retryParams: { type: "reply", text: sentMessage, replyingTo: sentReplyingTo },
                    _onRetry: () => handleRetrySend(pendingId, { type: "reply", text: sentMessage, replyingTo: sentReplyingTo })
                } : m));
            }
        } else {
            const sentMessage = message;
            setMessage("");
            setReplyingTo(null);

            // Optimistic pending message for normal text send
            const pendingId = `pending_text_${Date.now()}`;
            const pendingMsg = {
                _id: pendingId,
                content: sentMessage,
                sender: { _id: backendUser._id, profile: backendUser.profile },
                chatType: "text",
                time: new Date().toISOString(),
                delivered: false,
                seenBy: [],
                forContact: chat._id,
                _isPending: true,
            };
            setCCd(pendingMsg);

            try {
                const res = await sendTextMessage(chat._id, sentMessage);
                if (res?.status === 200 && res?.data?.message) {
                    setCCd({ ...res.data.message, _replaced: pendingId });
                }
            } catch (err) {
                setCCd(prev => prev.map(m => m._id === pendingId ? {
                    ...m,
                    _isPending: false,
                    _isError: true,
                    _retryParams: { type: "text", text: sentMessage },
                    _onRetry: () => handleRetrySend(pendingId, { type: "text", text: sentMessage })
                } : m));
            }
        }
        // Scroll to bottom after sending
        const scrollContainer = document.getElementById("chat-scroll-container");
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSendLocation = async (location) => {
        setShowLocationPicker(false);

        const pendingId = `pending_location_${Date.now()}`;
        const pendingMsg = {
            _id: pendingId,
            content: 'Location',
            sender: { _id: backendUser._id, profile: backendUser.profile },
            chatType: 'location',
            location: {
                longitude: location.longitude,
                latitude: location.latitude,
                address: location.address,
            },
            locationDetails: {
                coordinates: [location.longitude, location.latitude],
                address: location.address,
            },
            time: new Date().toISOString(),
            delivered: false,
            seenBy: [],
            forContact: chat._id,
            _isPending: true,
        };

        setCCd(pendingMsg);

        setTimeout(() => {
            const scrollContainer = document.getElementById('chat-scroll-container');
            if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);

        try {
            await sendLocationMessage(chat._id, {
                longitude: location.longitude,
                latitude: location.latitude,
                address: location.address,
            });
            // if (res?.status === 200 && res?.data?.message) {
            //     setCCd({ ...res.data.message, _replaced: pendingId });
            // } else {
            //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
            // }
        } catch (err) {
            setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
        }
    };

    const handleSendContact = async (selectedContact) => {
        setShowContactPicker(false);

        const otherUser = selectedContact.otherMember?.[0]?._id;
        if (!otherUser) return;

        const contactName = (otherUser.name || '') + (otherUser.lastName ? ' ' + otherUser.lastName : '');
        const contactPhone = otherUser.phone || '';
        const contactUserId = otherUser._id || null;

        // Optimistic pending message
        const pendingId = `pending_contact_${Date.now()}`;
        const pendingMsg = {
            _id: pendingId,
            content: 'Contact',
            sender: { _id: backendUser._id, profile: backendUser.profile },
            chatType: 'contact',
            contactDetails: {
                name: contactName,
                phoneNumber: contactPhone,
                Id: otherUser,
            },
            time: new Date().toISOString(),
            delivered: false,
            seenBy: [],
            forContact: chat._id,
            _isPending: true,
        };

        setCCd(pendingMsg);

        // Scroll to bottom
        setTimeout(() => {
            const scrollContainer = document.getElementById('chat-scroll-container');
            if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);

        try {
            await sendContactMessage(chat._id, {
                name: contactName,
                phoneNumber: contactPhone,
                contactUserId: contactUserId,
            });
            // if (res?.status === 200 && res?.data?.message) {
            //     setCCd({ ...res.data.message, _replaced: pendingId });
            // } else {
            //     setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
            // }
        } catch (err) {
            setCCd(prev => prev.map(m => m._id === pendingId ? { ...m, _isPending: false, _isError: true } : m));
        }
    };

    const handleContextMenu = (e, message) => {
        e.preventDefault();

        if (selectedMessages.length > 0) return;

        if (contextMenuOpen) {
            closeContextMenu(true);
        }

        clearTimeout(menuAnimTimeout.current);

        // Store click point for useLayoutEffect to use after DOM renders
        contextClickRef.current = { x: e.clientX, y: e.clientY };

        // Render off-screen so the DOM exists for measurement (useLayoutEffect blocks paint)
        setContextMenuMessage(message);
        setContextMenuClosing(false);
        setContextMenuPosition({ top: -9999, left: -9999 });
        setContextMenuOpen(true);
        setContextMenuVisible(false);
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


    // Runs synchronously AFTER DOM mutation but BEFORE browser paint.
    // Measures real menu size → positions correctly → triggers animation — zero visual delay.
    useLayoutEffect(() => {
        if (!contextMenuOpen || contextMenuVisible || !contextClickRef.current) return;

        const menuEl = contextMenuRef.current;
        if (!menuEl) return;

        const { x: clickX, y: clickY } = contextClickRef.current;
        contextClickRef.current = null;

        const actualW = menuEl.offsetWidth;
        const actualH = menuEl.offsetHeight;

        const pos = calculateMenuPosition(clickX, clickY, actualW, actualH);

        setContextMenuOrigin({ x: clickX - pos.left, y: clickY - pos.top });
        setContextMenuPosition(pos);
        setContextMenuVisible(true);
    }, [contextMenuOpen, contextMenuVisible]);

    function closeContextMenu(immediateNoAnim) {
        if (immediateNoAnim) {
            setContextMenuOpen(false);
            setContextMenuMessage(null);
            setContextMenuVisible(false);
            setContextMenuClosing(false);
            setIsContextMenuEmojiExpanded(false);
        } else {
            setContextMenuClosing(true);
            setContextMenuVisible(false);
            // Reduced close animation delay to 100ms for a snappier exit, mimicking Telegram
            menuAnimTimeout.current = setTimeout(() => {
                setContextMenuOpen(false);
                setContextMenuMessage(null);
                setContextMenuClosing(false);
                setIsContextMenuEmojiExpanded(false);
            }, 100);
        }
    }

    function closeReactionPicker() {
        setShowReactionPicker(false);
    }

    function openReactionEmojiPicker() {
        closeContextMenu(true);
        setTimeout(() => {
            setShowReactionPicker(true);
        }, 100);
    }

    // These are kept as no-ops; closing is handled by the mousemove useEffect above.
    const handleContextMenuEnter = () => { };
    const handleContextMenuLeave = () => { };



    const handleQuickReaction = async (emoji) => {
        closeContextMenu();
        closeReactionPicker();

        if (contextMenuMessage && chat) {
            const msgId = contextMenuMessage._realId || contextMenuMessage._id;
            try {
                await toggleReaction(msgId, chat._id, emoji);
            } catch (err) {
                console.error("Failed to add reaction", err);
            }
        }
    };

    const onReply = () => {
        if (!permissions.canSendText) {

            closeContextMenu();
            return;
        }
        const hasRealId = !!contextMenuMessage?._realId;
        const isStillPending = contextMenuMessage?._isPending || contextMenuMessage?._isError;
        const isPendingId = contextMenuMessage?._id && String(contextMenuMessage._id).startsWith('pending');
        if (isStillPending || (isPendingId && !hasRealId)) {
            toast.error("Cannot reply to a message that hasn't finished sending.");
        } else {
            setReplyingTo(contextMenuMessage);
        }
        closeContextMenu();
    };
    const onCopy = () => {
        if (contextMenuMessage) {
            if (contextMenuMessage.chatType === 'contact' && contextMenuMessage.contactDetails) {
                navigator.clipboard.writeText(contextMenuMessage.contactDetails.phoneNumber || "");
            } else {
                navigator.clipboard.writeText(contextMenuMessage.content || contextMenuMessage.text || "");
            }
        }
        closeContextMenu();
    };

    const onCopyLink = () => {
        if (contextMenuMessage) {
            const text = contextMenuMessage.content || contextMenuMessage.text || "";
            const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
            const matches = text.match(URL_REGEX);
            if (matches && matches.length > 0) {
                let url = matches[0];
                if (!/^https?:\/\//i.test(url)) {
                    url = `http://${url}`;
                }
                navigator.clipboard.writeText(url);
            }
        }
        closeContextMenu();
    };
    const onCopyCaption = () => {
        if (contextMenuMessage) {
            navigator.clipboard.writeText(contextMenuMessage.caption || "");
        }
        closeContextMenu();
    };

    const onCopyLinkInCaption = () => {
        if (contextMenuMessage) {
            const text = contextMenuMessage.caption || "";
            const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
            const matches = text.match(URL_REGEX);
            if (matches && matches.length > 0) {
                let url = matches[0];
                if (!/^https?:\/\//i.test(url)) {
                    url = `http://${url}`;
                }
                navigator.clipboard.writeText(url);
            }
        }
        closeContextMenu();
    };

    const onDownload = () => {
        if (!contextMenuMessage) return;

        let url = null;
        let filename = 'download';

        if (contextMenuMessage.images && contextMenuMessage.images.length > 0) {
            url = contextMenuMessage.images[0].url;
            filename = contextMenuMessage.images[0].name || 'image.jpg';
        } else if (contextMenuMessage.videos && contextMenuMessage.videos.length > 0) {
            url = contextMenuMessage.videos[0].url;
            filename = contextMenuMessage.videos[0].name || 'video.mp4';
        } else if (contextMenuMessage.documents && contextMenuMessage.documents.length > 0) {
            url = contextMenuMessage.documents[0].url;
            filename = contextMenuMessage.documents[0].name || 'document';
        }

        if (url) {
            const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
            const proxyUrl = `${SERVER_URL}/chanel/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
            const a = Object.assign(document.createElement('a'), {
                href: proxyUrl,
                download: filename,
                style: 'display:none',
            });
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 300);
        }
        closeContextMenu();
    };
    const contextForwardRef = useRef(null);
    const onForward = () => {
        if (!contextMenuMessage) return;
        const hasRealId = !!contextMenuMessage._realId;
        const isStillPending = contextMenuMessage._isPending || contextMenuMessage._isError;
        const isPendingId = String(contextMenuMessage._id).startsWith('pending');
        if (isStillPending || (isPendingId && !hasRealId)) {
            toast.error("Cannot forward a message that hasn't finished sending.");
            closeContextMenu();
            return;
        }
        contextForwardRef.current = [{ ...contextMenuMessage, _id: contextMenuMessage._realId || contextMenuMessage._id }];
        setShowForwardPopup(true);
        closeContextMenu();
    };

    const handleConfirmForward = async (contactIds) => {
        // Obsolete function since we navigate and then use handleSend, but we'll leave it or replace it
    };
    const onSelect = () => {
        if (contextMenuMessage) {
            setSelectedMessages([contextMenuMessage._id]);
        }
        closeContextMenu();
    };
    const onDelete = () => {
        closeContextMenu();
        const msg = contextMenuMessage;
        if (msg._isError) {
            setCCd(prev => prev.filter(m => m._id !== msg._id));
            toast.success("Failed message deleted");
            return;
        }
        if (msg._isPending || (String(msg._id).startsWith('pending') && !msg._realId)) {
            toast.error("Cannot delete a message that hasn't finished sending.");
            return;
        }
        setMessageToDelete(msg);
    };

    const handleScroll = (e) => {
        if (showEmojiPicker) setShowEmojiPicker(false);
        if (showReactionPicker) closeReactionPicker();
        if (contextMenuOpen) closeContextMenu(true);
        if (e && e.target) {
            if (Math.abs(e.target.scrollTop) > 200) {
                setShowScrollBottom(true);
            } else {
                setShowScrollBottom(false);
            }
        }
    };

    const scrollToBottom = () => {
        const container = document.getElementById("chat-scroll-container");
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
            setShowScrollBottom(false);
        }
    };

    const handleFileSelected = (file, type) => {
        if (!permissions.canSendMedia) {
            toast.error("You are not allowed to send media in this chat");
            return;
        }
        // Support single or multiple files from ClipIconPopOver
        const fileEntry = { file, type };
        setSelectedFiles(prev => [...prev, fileEntry]);
        setSelectionSource('menu');
        setShowEmojiPicker(false);
        setShowReactionPicker(false);
    };

    const handlePaste = (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = Array.from(clipboardData.items || []);
        const filesToUpload = [];

        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    let type = 'document';
                    if (file.type.startsWith('image/')) {
                        if (permissions.canSendPhotos === false) continue;
                        type = 'photo';
                    } else if (file.type.startsWith('video/')) {
                        if (permissions.canSendVideos === false) continue;
                        type = 'video';
                    } else {
                        if (permissions.canSendFiles === false) continue;
                        type = 'document';
                    }
                    filesToUpload.push({ file, type });
                }
            }
        }

        if (filesToUpload.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
            for (const file of Array.from(clipboardData.files)) {
                let type = 'document';
                if (file.type.startsWith('image/')) {
                    if (permissions.canSendPhotos === false) continue;
                    type = 'photo';
                } else if (file.type.startsWith('video/')) {
                    if (permissions.canSendVideos === false) continue;
                    type = 'video';
                } else {
                    if (permissions.canSendFiles === false) continue;
                    type = 'document';
                }
                filesToUpload.push({ file, type });
            }
        }

        if (filesToUpload.length > 0) {
            e.preventDefault();
            if (!permissions.canSendMedia) {
                toast.error("You are not allowed to send media in this chat");
                return;
            }
            setSelectedFiles(prev => [...prev, ...filesToUpload]);
            setSelectionSource('paste');
            setShowEmojiPicker(false);
            setShowReactionPicker(false);
        }
    };

    const handleSendMedia = async (files, caption) => {
        if (!permissions.canSendMedia) {
            toast.error("You are not allowed to send media in this chat");
            return;
        }


        // Create a unique pending ID
        const pendingId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Pre-calculate image dimensions from File objects (async but fast — blobs are in-memory)
        const measureImageDims = (url) =>
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => resolve({ w: null, h: null });
                img.src = url;
            });

        // Build local preview URLs + measure dimensions in parallel
        const fileEntries = files.map((f) => {
            // Strictly respect f.type === 'document'. 
            // Only try to sniff MIME type if it wasn't explicitly designated as a document.
            const isImg = f.type !== 'document' && (f.type === 'image' || f.file?.type?.startsWith('image/'));
            const isVid = f.type !== 'document' && (f.type === 'video' || f.file?.type?.startsWith('video/'));
            const localUrl = URL.createObjectURL(f.file);
            return { f, isImg, isVid, localUrl };
        });


        // Measure all images in parallel before building the pending message
        const dimsResults = await Promise.all(
            fileEntries.map(({ isImg, localUrl }) =>
                isImg ? measureImageDims(localUrl) : Promise.resolve(null)
            )
        );

        const localImages = [];
        const localVideos = [];
        const localDocuments = [];

        fileEntries.forEach(({ f, isImg, isVid, localUrl }, idx) => {
            const dims = dimsResults[idx];
            if (isImg) {
                localImages.push({
                    url: localUrl,
                    name: f.file.name,
                    _localBlob: true,
                    w: dims?.w || null,
                    h: dims?.h || null,
                });
            } else if (isVid) {
                localVideos.push({ url: localUrl, name: f.file.name, _localBlob: true });
            } else {
                localDocuments.push({ url: localUrl, name: f.file.name, size: f.file.size, _localBlob: true });
            }
        });

        // Determine chatType based on what we're sending
        let pendingChatType = 'image';
        if (localImages.length > 0) pendingChatType = 'image';
        else if (localVideos.length > 0) pendingChatType = 'video';
        else pendingChatType = 'document';


        // Create the optimistic pending message
        const pendingMsg = {
            _id: pendingId,
            _clientKey: pendingId,
            content: caption || '',
            sender: { _id: backendUser._id, profile: backendUser.profile },
            chatType: pendingChatType,
            time: new Date().toISOString(),
            delivered: false,
            seenBy: [],
            forContact: chat._id,
            images: localImages,
            videos: localVideos,
            documents: localDocuments,
            caption: caption || '',
            ...(replyingTo && { replyDetails: { isReply: true, repliedMessage: replyingTo } }),
            _isPending: true,
            _uploadProgress: 0,
        };

        // Add pending message to chat immediately (optimistic UI)
        setCCd(pendingMsg);

        // Close the popup
        setSelectedFiles([]);
        setSelectionSource(null);

        // Scroll to bottom after sending media
        setTimeout(() => {
            const scrollContainer = document.getElementById("chat-scroll-container");
            if (scrollContainer) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);

        // Upload to backend
        if (replyingTo) {
            const replyToId = replyingTo._id?.toString?.() || String(replyingTo._id);
            const fd = new FormData();
            files.forEach((file) => {
                fd.append("documents", file.file);
            });
            fd.append("caption", caption);
            fd.append("contactId", chat._id);
            fd.append("chatId", replyToId);
            fd.append("chatType", pendingChatType);
            const sentReplyingTo = replyingTo;
            setReplyingTo(null);

            try {
                const res = await sendReply(fd, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                        if (msgEl) {
                            const progressBar = msgEl.querySelector('.upload-progress-bar');
                            if (progressBar) progressBar.style.width = `${progress}%`;
                            const progressText = msgEl.querySelector('.upload-progress-text');
                            if (progressText) progressText.textContent = `${progress}%`;
                        }
                    }
                });

                if (res?.status === 200 && res?.data?.message) {
                    const realMsg = res.data.message;
                    if (realMsg.images?.length === localImages.length) {
                        realMsg.images = realMsg.images.map((img, i) => ({
                            ...img,
                            url: localImages[i].url
                        }));
                    }
                    if (realMsg.videos?.length === localVideos.length) {
                        realMsg.videos = realMsg.videos.map((vid, i) => ({
                            ...vid,
                            url: localVideos[i].url
                        }));
                    }
                    setCCd({ ...realMsg, _replaced: pendingId });
                } else {
                    console.error("Upload failed:", res);
                    setCCd(prev => prev.map(m => m._id === pendingId ? {
                        ...m,
                        _isPending: false,
                        _isError: true,
                        _retryParams: { type: "media", files, caption, replyingTo: sentReplyingTo, chatType: pendingChatType },
                        _onRetry: () => handleRetrySend(pendingId, { type: "media", files, caption, replyingTo: sentReplyingTo, chatType: pendingChatType })
                    } : m));
                }
            } catch (err) {
                console.error("Upload error:", err);
                setCCd(prev => prev.map(m => m._id === pendingId ? {
                    ...m,
                    _isPending: false,
                    _isError: true,
                    _retryParams: { type: "media", files, caption, replyingTo: sentReplyingTo, chatType: pendingChatType },
                    _onRetry: () => handleRetrySend(pendingId, { type: "media", files, caption, replyingTo: sentReplyingTo, chatType: pendingChatType })
                } : m));
            }
        } else if (chat.contactType === "channel") {
            const fd = new FormData();

            let fieldName = "images";
            let apiCall = sendImagesInChanel;

            if (pendingChatType === "video") {
                fieldName = "videos";
                apiCall = sendVideosInChanel;
            } else if (pendingChatType === "document") {
                fieldName = "documents";
                apiCall = sendDocumentsInChanel;
            }

            files.forEach((file) => {
                fd.append(fieldName, file.file);
            });
            fd.append("caption", caption);
            fd.append("contactId", chat._id);

            try {
                const res = await apiCall(fd, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        // Update the pending message's progress in currentChatData
                        // We do this via a direct state update workaround
                        const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                        if (msgEl) {
                            const progressBar = msgEl.querySelector('.upload-progress-bar');
                            if (progressBar) progressBar.style.width = `${progress}%`;
                            const progressText = msgEl.querySelector('.upload-progress-text');
                            if (progressText) progressText.textContent = `${progress}%`;
                        }
                    }
                });

                if (res?.status === 200 && res?.data?.message) {
                    // Replace pending message with real server message
                    const realMsg = res.data.message;

                    // To prevent flashing, map the new server URLs to our existing local blob URLs
                    // so the UI doesn't jump while the browser downloads the real image.
                    if (realMsg.images?.length === localImages.length) {
                        realMsg.images = realMsg.images.map((img, i) => ({
                            ...img,
                            url: localImages[i].url // Keep using the local blob for seamless transition
                        }));
                    }
                    if (realMsg.videos?.length === localVideos.length) {
                        realMsg.videos = realMsg.videos.map((vid, i) => ({
                            ...vid,
                            url: localVideos[i].url
                        }));
                    }

                    // Swap pending with real message in currentChatData
                    setCCd({ ...realMsg, _replaced: pendingId });
                } else {
                    // Mark as failed
                    console.error("Upload failed:", res);
                    setCCd(prev => prev.map(m => m._id === pendingId ? {
                        ...m,
                        _isPending: false,
                        _isError: true,
                        _retryParams: { type: "media", files, caption, chatType: pendingChatType },
                        _onRetry: () => handleRetrySend(pendingId, { type: "media", files, caption, chatType: pendingChatType })
                    } : m));
                }
            } catch (err) {
                console.error("Upload error:", err);
                setCCd(prev => prev.map(m => m._id === pendingId ? {
                    ...m,
                    _isPending: false,
                    _isError: true,
                    _retryParams: { type: "media", files, caption, chatType: pendingChatType },
                    _onRetry: () => handleRetrySend(pendingId, { type: "media", files, caption, chatType: pendingChatType })
                } : m));
            }
        } else if (chat.contactType === "group" || chat.contactType === "person") {
            const fd = new FormData();

            let fieldName = "images";
            let apiCall = sendImagesInChat;

            if (pendingChatType === "video") {
                fieldName = "videos";
                apiCall = sendVideosInChat;
            } else if (pendingChatType === "document") {
                fieldName = "documents";
                apiCall = sendDocumentsInChat;
            }

            files.forEach((file) => {
                fd.append(fieldName, file.file);
            });
            fd.append("caption", caption);
            fd.append("contactId", chat._id);

            try {
                const res = await apiCall(fd, {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.min(85, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                        const msgEl = document.querySelector(`[data-msg-id="${pendingId}"]`);
                        if (msgEl) {
                            const progressBar = msgEl.querySelector('.upload-progress-bar');
                            if (progressBar) progressBar.style.width = `${progress}%`;
                            const progressText = msgEl.querySelector('.upload-progress-text');
                            if (progressText) progressText.textContent = `${progress}%`;
                        }
                    }
                });

                if (res?.status === 200 && res?.data?.message) {
                    const realMsg = res.data.message;

                    // Keep using local blob URLs for seamless transition (no image flash)
                    if (realMsg.images?.length === localImages.length) {
                        realMsg.images = realMsg.images.map((img, i) => ({
                            ...img,
                            url: localImages[i].url
                        }));
                    }
                    if (realMsg.videos?.length === localVideos.length) {
                        realMsg.videos = realMsg.videos.map((vid, i) => ({
                            ...vid,
                            url: localVideos[i].url
                        }));
                    }

                    setCCd({ ...realMsg, _replaced: pendingId });
                }
            } catch (err) {
                console.error("Upload error:", err);
                setCCd(prev => prev.map(m => m._id === pendingId ? {
                    ...m,
                    _isPending: false,
                    _isError: true,
                    _retryParams: { type: "media", files, caption, chatType: pendingChatType },
                    _onRetry: () => handleRetrySend(pendingId, { type: "media", files, caption, chatType: pendingChatType })
                } : m));
            }
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!permissions.canSendMedia || !permissions.canSendFiles) return;
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!permissions.canSendMedia || !permissions.canSendFiles) {

            return;
        }
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);

            // 30MB total size limit validation
            const MAX_SIZE_MB = 30;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const totalSize = files.reduce((acc, file) => acc + file.size, 0);

            if (totalSize > MAX_SIZE_BYTES) {
                toast.error(`Total file size cannot exceed ${MAX_SIZE_MB}MB.`);
                return;
            }

            const newFiles = files.map(file => {
                return { file, type: 'document' };
            });
            setSelectedFiles(prev => [...prev, ...newFiles]);
            setSelectionSource('drag');
            setShowEmojiPicker(false);
            setShowReactionPicker(false);
        }
    };


    const contactsWithOtherMember = useMemo(() => {
        return contacts.map((contact) => {
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
    }, [contacts, backendUser]);

    // Stable callback for MessegeBubble choose prop — prevents re-renders of memoized bubbles
    const bubbleChoose = useCallback((w, ...args) => {
        if (w && typeof w === 'object' && w.to) {
            choose(w.to, w.user, null, null, null, null, w.forwardMessages);
        } else {
            choose(w, ...args);
        }
    }, [choose]);


    const infoPanelVariants = {
        hidden: { x: "100%" },
        visible: { x: 0 },
        exit: { x: "100%" },
    };
    if (!isChatSelected) return null;

    return (
        <div
            className="h-full w-full flex flex-col relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <style>{`
                @keyframes telegramDelete {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                        max-height: 500px;
                        padding-top: 2px;
                        padding-bottom: 2px;
                        margin-bottom: 6px;
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.85);
                        max-height: 0px;
                        padding-top: 0px;
                        padding-bottom: 0px;
                        margin-bottom: 0px;
                        overflow: hidden;
                    }
                }
                .message-deleting {
                    animation: telegramDelete 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
                    pointer-events: none;
                    overflow: hidden;
                }
            `}</style>
            {/* Drop Zone Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full h-full border-4 border-dashed border-blue-500 rounded-2xl flex flex-col items-center justify-center bg-white/90 shadow-xl">
                        <FaPaperPlane size={56} className="text-blue-500 mb-5 drop-shadow-lg" />
                        <h2 className="text-2xl font-semibold text-gray-800">Drop files here to send</h2>
                        <p className="text-gray-400 text-sm mt-2">You can drop multiple files at once</p>
                    </div>
                </div>
            )}

            <InfoScreen
                key={chat?._id}
                chat={chat}
                back={back}
                choose={choose}
                messages={messages}
                isNavbarHidden={isNavbarHidden}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenCalendar={() => setShowCalendar(true)}
                selectedUserFilter={selectedUserFilter}
                setSelectedUserFilter={setSelectedUserFilter}
                panelOpen={panelOpen}
                setPanelOpen={setPanelOpen}
            />

            <AnimatePresence>
                {showCalendar && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
                    >
                        {/* Backdrop */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1 },
                                exit: { opacity: 0 }
                            }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] cursor-pointer"
                            onClick={() => setShowCalendar(false)}
                        />
                        {/* Modal Dialog */}
                        <motion.div
                            variants={{
                                hidden: { scale: 0.9, opacity: 0, y: 15 },
                                visible: { scale: 1, opacity: 1, y: 0 },
                                exit: { scale: 0.9, opacity: 0, y: 15 }
                            }}
                            transition={{ duration: 0.22, ease: [0.0, 0.0, 0.2, 1] }}
                            className="relative bg-white rounded-[28px] shadow-2xl w-[328px] px-6 pt-6 pb-4 flex flex-col cursor-default z-10"
                        >
                            {/* Header */}
                            <div className="text-[26px] font-semibold text-gray-900 tracking-wide mb-6 leading-tight pl-1">
                                {formatHeaderDate(tempSelectedDate)}
                            </div>

                            {/* Month Navigator */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <button
                                    onClick={handlePrevMonth}
                                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <span className="text-[15px] font-bold text-gray-800">
                                    {formatMonthYear(calendarViewDate)}
                                </span>
                                {!isNextMonthDisabled ? (
                                    <button
                                        onClick={handleNextMonth}
                                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                ) : (
                                    <div className="w-9 h-9" />
                                )}
                            </div>

                            {/* Weekday headers and Calendar grid */}
                            <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                                    <span key={idx} className="text-[12px] font-semibold text-gray-400">
                                        {day}
                                    </span>
                                ))}
                                {calendarCells.map((cell) => {
                                    if (cell.type === 'empty') {
                                        return <span key={cell.key} className="w-9 h-9" />;
                                    }

                                    const isSelected = tempSelectedDate.getDate() === cell.date.getDate() &&
                                        tempSelectedDate.getMonth() === cell.date.getMonth() &&
                                        tempSelectedDate.getFullYear() === cell.date.getFullYear();

                                    return (
                                        <button
                                            key={cell.key}
                                            disabled={cell.isFuture}
                                            onClick={() => setTempSelectedDate(cell.date)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto text-[14px] font-medium transition-all duration-150
                                                ${isSelected
                                                    ? "bg-[#4285f4] text-white font-semibold shadow-sm"
                                                    : cell.isFuture
                                                        ? "text-gray-300 cursor-not-allowed"
                                                        : "text-gray-900 hover:bg-gray-100 cursor-pointer"
                                                }`}
                                        >
                                            {cell.day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between mt-6 px-1">
                                <button
                                    onClick={() => setShowCalendar(false)}
                                    className="px-4 py-2 text-[14px] font-bold text-[#4285f4] hover:bg-blue-50/50 rounded-lg transition-colors uppercase tracking-wide cursor-pointer animate-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleJumpToDate}
                                    className="px-4 py-2 text-[14px] font-bold text-[#4285f4] hover:bg-blue-50/50 rounded-lg transition-colors uppercase tracking-wide cursor-pointer animate-none"
                                >
                                    Jump to Date
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedUserFilter && (
                <div className="flex items-center justify-between bg-[#8763ea]/15 border-b border-[#8763ea]/20 px-6 py-2.5 text-sm text-gray-800 select-none flex-shrink-0">
                    <span className="font-medium flex items-center gap-1.5">
                        👤 Filtering by member: <span className="font-bold text-[#8763ea]">{selectedUserFilter.name} {selectedUserFilter.lastName}</span>
                    </span>
                    <button
                        onClick={() => setSelectedUserFilter(null)}
                        className="text-red-500 font-semibold hover:text-red-700 hover:underline transition-colors"
                    >
                        Clear filter
                    </button>
                </div>
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
                {displayedMessages.length === 0 && !loadingOlder && !isAnimating ? (
                    <div className="relative flex items-center justify-center h-full w-full">
                        <div className="relative w-64 h-80 rounded-3xl bg-black/30 overflow-hidden flex flex-col items-center justify-between py-6 px-4 text-center">
                            <div className="absolute inset-0 -z-10 opacity-40" />
                            <div className="mt-2">
                                <p className="text-white font-semibold text-md">
                                    {selectedUserFilter ? "No messages match your filters..." : "No messages here yet..."}
                                </p>
                            </div>
                            <div className="flex justify-center my-4">
                                <React.Suspense fallback={<div style={{ height: 264, width: 300 }} />}>
                                    <LazyLottie animationData={myAnimation} loop={true} style={{ height: 264, width: 300 }} />
                                </React.Suspense>
                            </div>
                        </div>
                    </div>
                ) : null}

                {displayedMessages.length > 0 && (
                    <div
                        id="chat-scroll-container"
                        className="scrollbar-telegram h-full w-full overflow-y-auto lg:px-16 md:px-10 sm:px-4 px-3"
                        style={{ display: "flex", flexDirection: "column-reverse" }}
                        onScroll={handleScroll}
                    >
                        <InfiniteScroll
                            dataLength={displayedMessages.length}
                            next={loadOlder}
                            style={{ display: "flex", flexDirection: "column-reverse", overflow: "visible" }}
                            hasMore={searchQuery ? false : hasMoreMessages}
                            loader={
                                <div style={{ height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Spinner className="h-6 w-6 text-blue-500" />
                                </div>
                            }
                            scrollableTarget="chat-scroll-container"
                            inverse={true}
                        >
                            {displayedMessages.slice().reverse().map((chatMsg, visualIndex, reversedArray) => {
                                if (chatMsg === null) return null;


                                const prevMsgChronological = visualIndex < reversedArray.length - 1 ? reversedArray[visualIndex + 1] : null;
                                const showDateLabel = !prevMsgChronological || new Date(chatMsg.time).toDateString() !== new Date(prevMsgChronological.time).toDateString();



                                return (
                                    <div key={chatMsg._clientKey || chatMsg._id}>
                                        {showDateLabel && (
                                            <DateLabel
                                                dateText={getDateLabel(new Date(chatMsg.time))}
                                                onClick={() => {
                                                    const d = new Date(chatMsg.time);
                                                    setTempSelectedDate(d);
                                                    setCalendarViewDate(d);
                                                    setShowCalendar(true);
                                                }}
                                            />
                                        )}
                                        <div
                                            data-msg-id={chatMsg._id}
                                            {...(chatMsg._realId && { "data-real-id": chatMsg._realId })}
                                            onDoubleClick={() => {
                                                if (!permissions.canSendText) {

                                                    return;
                                                }
                                                const hasRealId = !!chatMsg._realId;
                                                const isStillPending = chatMsg._isPending || chatMsg._isError;
                                                const isPendingId = chatMsg._id && String(chatMsg._id).startsWith('pending');
                                                if (isStillPending || (isPendingId && !hasRealId)) {
                                                    toast.error("Cannot reply to a message that hasn't finished sending.");
                                                } else {
                                                    setReplyingTo(chatMsg);
                                                }
                                            }}
                                            onContextMenu={e => handleContextMenu(e, chatMsg)}
                                            onClickCapture={(e) => {
                                                if (selectedMessages.length > 0) {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setSelectedMessages(prev =>
                                                        prev.includes(chatMsg._id)
                                                            ? prev.filter(id => id !== chatMsg._id)
                                                            : [...prev, chatMsg._id]
                                                    );
                                                }
                                            }}
                                            className={`relative select-none flex items-center w-full px-2 py-0.5 transition-colors cursor-pointer ${selectedMessages.includes(chatMsg._id) ? 'bg-green-100/40 rounded-2xl' : ''} ${getLocalDateString(chatMsg.time) === highlightDate ? 'search-highlight-flash' : ''} ${chatMsg._isDeleting ? 'message-deleting' : ''}`}
                                        >
                                            {/* Selection Checkbox */}
                                            {selectedMessages.length > 0 && (
                                                <div className="flex-shrink-0 mr-3 ml-2 flex items-center justify-center pointer-events-none">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${selectedMessages.includes(chatMsg._id) ? 'bg-blue-500 border-blue-500 scale-110' : 'border-gray-400'}`}>
                                                        {selectedMessages.includes(chatMsg._id) && (
                                                            <svg viewBox="0 0 24 24" fill="none" className="w-[14px] h-[14px] text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 pointer-events-auto">
                                                {chatMsg.chatType == "label" && (
                                                    <MessegeLabel
                                                        chat={chat}
                                                        messege={chatMsg}
                                                    />
                                                )}
                                                {chatMsg.chatType !== "label" && (
                                                    <MessegeBubble
                                                        choose={bubbleChoose}
                                                        msg={chatMsg}
                                                        chat={chat}
                                                        text={chatMsg.content}
                                                        isSeenByMe={chatMsg.seenBy}
                                                        currentUser={backendUser._id}
                                                        chatId={chatMsg._id}
                                                        isSent={chatMsg.sender._id.toString() === backendUser._id.toString()}
                                                        time={chatMsg.time}
                                                        ProfileData={chatMsg.sender.profile}
                                                        onReactionClick={setActiveReactionsMessage}
                                                        searchQuery={searchQuery}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </InfiniteScroll>
                    </div>
                )}
            </div>

            {/* Context Menu & Reaction Picker */}

            {contextMenuOpen && (
                <>
                    {/* Invisible full-screen backdrop — clicking empty space closes menu */}
                    <div
                        className="fixed inset-0 z-[999]"
                        onClick={() => closeContextMenu()}
                        onContextMenu={(e) => { e.preventDefault(); closeContextMenu(true); }}
                    />

                    <div ref={contextMenuRef}
                        onMouseEnter={handleContextMenuEnter}
                        onMouseLeave={handleContextMenuLeave}
                        onClick={() => closeContextMenu()}
                        className={`tg-ctx-menu ${contextMenuVisible ? 'tg-ctx-menu-open' : ''} ${contextMenuClosing ? 'tg-ctx-menu-close' : ''}`} style={{
                            position: "fixed",
                            top: isContextMenuEmojiExpanded
                                ? `${Math.min(contextMenuPosition.top, window.innerHeight - 450 - 16)}px`
                                : `${contextMenuPosition.top}px`,
                            left: `${contextMenuPosition.left}px`,
                            zIndex: 1000, pointerEvents: "auto", overflow: "visible",
                            width: isContextMenuEmojiExpanded ? 350 : 'auto',
                            height: isContextMenuEmojiExpanded ? 450 : 'auto',
                            transformOrigin: `${contextMenuOrigin.x}px ${contextMenuOrigin.y}px`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end"
                        }}>
                        {/* Reaction emoji row */}
                        {contextMenuMessage && !contextMenuMessage._isError && (
                            <div onClick={(e) => e.stopPropagation()} className={`w-full relative ${isContextMenuEmojiExpanded ? 'flex-1 rounded-xl overflow-hidden bg-white shadow-lg' : 'flex items-center flex-wrap px-1 py-1'}`}>
                                <div
                                    className="custom-reactions-container"
                                    style={isContextMenuEmojiExpanded ? {
                                        position: 'absolute',
                                        top: '8px',
                                        bottom: '24px',
                                        left: '8px',
                                        right: '8px'
                                    } : {
                                        width: '100%',
                                        height: '100%'
                                    }}
                                >
                                    {!isContextMenuEmojiExpanded ? (
                                        <div
                                            onClick={() => setIsContextMenuEmojiExpanded(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: '46px',
                                                backgroundColor: 'rgba(229, 229, 234, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                borderRadius: '30px',
                                                border: '1px solid rgba(0, 0, 0, 0.03)',
                                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                                                width: '300px',
                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <ul style={{
                                                listStyle: 'none',
                                                margin: 0,
                                                padding: '0 4px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                                width: '100%',
                                                gap: '2px'
                                            }}>
                                                {[
                                                    { emoji: '❤️', unified: '2764-fe0f' },
                                                    { emoji: '👍', unified: '1f44d' },
                                                    { emoji: '👎', unified: '1f44e' },
                                                    { emoji: '🔥', unified: '1f525' },
                                                    { emoji: '🥰', unified: '1f970' },
                                                    { emoji: '👏', unified: '1f44f' },
                                                    { emoji: '😁', unified: '1f601' }
                                                ].map((item) => (
                                                    <li key={item.unified} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button
                                                            className="reaction-emoji-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickReaction(item.emoji);
                                                            }}
                                                        >
                                                            <img
                                                                src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${item.unified}.png`}
                                                                alt={item.emoji}
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    objectFit: 'contain'
                                                                }}
                                                            />
                                                        </button>
                                                    </li>
                                                ))}
                                                <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsContextMenuEmojiExpanded(true);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            cursor: 'pointer',
                                                            borderRadius: '50%',
                                                            width: '36px',
                                                            height: '36px',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            transition: 'background-color 0.2s ease-in-out, transform 0.15s ease',
                                                            color: '#5f6368'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                                            e.currentTarget.style.transform = 'scale(1.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                        aria-label="Show all Emojis"
                                                        title="Show all Emojis"
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <EmojiPicker
                                            reactionsDefaultOpen={false}
                                            previewConfig={{ showPreview: false }}
                                            onEmojiClick={(e) => handleQuickReaction(e.emoji)}
                                            theme="light"
                                            width="100%"
                                            height="100%"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Menu items - WhatsApp/Telegram style */}
                        {!isContextMenuEmojiExpanded && (
                            <div className="ctx-menu-body px-1 " onClick={(e) => e.stopPropagation()}>
                                {contextMenuMessage?._isError ? (
                                    <>
                                        <MenuItem
                                            onClick={() => {
                                                closeContextMenu();
                                                if (contextMenuMessage._onRetry) contextMenuMessage._onRetry();
                                            }}
                                            icon={<TbRefresh size={19} />}
                                            text="Resend"
                                        />
                                        <MenuItem onClick={onDelete} icon={<MdOutlineDeleteOutline size={19} />} text="Delete" danger />
                                    </>
                                ) : contextMenuMessage?.chatType === 'label' ? (
                                    <>
                                        <MenuItem onClick={onSelect} icon={<GoCheckCircle size={19} />} text="Select" />
                                        {handleIsDeleteAllowed() ?
                                            <MenuItem onClick={onDelete} icon={<MdOutlineDeleteOutline size={19} />} text="Delete" danger />
                                            : null
                                        }
                                    </>
                                ) : (
                                    <>
                                        {permissions.canSendText && <MenuItem onClick={onReply} icon={<BsReply size={19} />} text="Reply" />}
                                        {contextMenuMessage && ((contextMenuMessage.images && contextMenuMessage.images.length > 0) || (contextMenuMessage.videos && contextMenuMessage.videos.length > 0) || (contextMenuMessage.documents && contextMenuMessage.documents.length > 0)) ? (
                                            <>
                                                <MenuItem onClick={onDownload} icon={<IoDownloadOutline size={19} />} text="Download" />
                                                {contextMenuMessage.caption && contextMenuMessage.caption.trim().length > 0 &&
                                                    (() => {

                                                        const msgText = contextMenuMessage?.caption;
                                                        const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
                                                        const links = msgText.match(URL_REGEX) || [];
                                                        const messageHasLink = links.length > 0;
                                                        const messageIsLink = links.length === 1 && links[0].trim() === msgText.trim();

                                                        return (
                                                            <>
                                                                {(!messageIsLink) && <MenuItem onClick={onCopyCaption} icon={<IoCopyOutline size={19} />} text="Copy" />}
                                                                {(messageHasLink) && <MenuItem onClick={onCopyLinkInCaption} icon={<IoLinkOutline size={19} />} text="Copy Link" />}
                                                            </>
                                                        );
                                                    })()}
                                            </>

                                        ) :
                                            (() => {

                                                const msgText = contextMenuMessage?.content || contextMenuMessage?.text || "";
                                                const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
                                                const links = msgText.match(URL_REGEX) || [];
                                                const messageHasLink = links.length > 0;
                                                const messageIsLink = links.length === 1 && links[0].trim() === msgText.trim();

                                                return (
                                                    <>
                                                        {(!messageIsLink) && (
                                                            <MenuItem
                                                                onClick={onCopy}
                                                                icon={<IoCopyOutline size={19} />}
                                                                text={contextMenuMessage?.chatType === 'contact' ? "Copy Phone Number" : "Copy"}
                                                            />
                                                        )}
                                                        {(messageHasLink) && <MenuItem onClick={onCopyLink} icon={<IoLinkOutline size={19} />} text="Copy Link" />}
                                                    </>
                                                );
                                            })
                                                ()}
                                        <MenuItem onClick={onForward} icon={<PiShareFat size={19} />} text="Forward" />
                                        <MenuItem onClick={onSelect} icon={<GoCheckCircle size={19} />} text="Select" />
                                        {handleIsDeleteAllowed() ?
                                            <MenuItem onClick={onDelete} icon={<MdOutlineDeleteOutline size={19} />} text="Delete" danger />
                                            : null
                                        }
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            <AnimatePresence>
                {showScrollBottom && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-[80px] right-4 md:right-8 lg:right-16 z-20 p-2 bg-white rounded-full shadow-md text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer flex items-center justify-center border border-gray-100"
                    >
                        <MdKeyboardArrowDown size={32} />
                    </motion.button>
                )}
            </AnimatePresence>

            {showReactionPicker && (
                <div ref={reactionPickerRef} className="animate-picker origin-bottom" style={{
                    position: "absolute",
                    bottom: "70px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1100, borderRadius: "12px", width: PICKER_WIDTH, height: PICKER_HEIGHT,
                    overflow: "hidden", pointerEvents: "auto", backgroundColor: "#fff", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                }}>
                    <React.Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
                        <LazyEmojiPicker previewConfig={{ showPreview: false }} onEmojiClick={(e) => handleQuickReaction(e.emoji)} theme="light" width="100%" height="100%" searchPlaceholder="Search emoji..." />
                    </React.Suspense>
                </div>
            )}

            {/* Bottom Section: Input OR Selection Toolbar */}
            {selectedMessages.length > 0 ? (
                <div className="mb-1 relative flex items-center lg:px-16 md:px-10 sm:px-4 px-3 bg-transparent pt-1 pb-[env(safe-area-inset-bottom,4px)]">
                    <div className="flex justify-between items-center flex-1 bg-white rounded-xl px-4 py-2 shadow-sm min-w-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedMessages([])} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <span className="select-none cursor-pointer text-lg text-[#8763ea] font-medium">{selectedMessages.length} Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {!currentChatData.some(m => selectedMessages.includes(m._id) && m.chatType === 'label') && (
                                <button onClick={() => {
                                    const hasInvalid = currentChatData.some(m => selectedMessages.includes(m._id) && (m._isPending || m._isError || (String(m._id).startsWith('pending') && !m._realId)));
                                    if (hasInvalid) {
                                        toast.error("Cannot forward messages that haven't finished sending.");
                                        return;
                                    }
                                    setShowForwardPopup(true);
                                }} className="select-none px-4 py-2 text-[#8763ea] font-medium hover:bg-[#8763ea]/10 rounded-lg transition-colors">Forward</button>
                            )}
                            {handleIsDeleteAllowed() && (
                                <button onClick={() => {
                                    const hasInvalid = currentChatData.some(m => selectedMessages.includes(m._id) && (m._isPending || m._isError || (String(m._id).startsWith('pending') && !m._realId)));
                                    if (hasInvalid) {
                                        toast.error("Cannot delete messages that haven't finished sending.");
                                        return;
                                    }
                                    setShowDeleteMultiplePopup(true);
                                }} className="px-4 py-2 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors">Delete</button>)}
                        </div>
                    </div>
                </div>
            ) : getBlockStatus() === 'blocked_by_other' ? (
                <div className="mb-1 relative flex items-center justify-center lg:px-16 md:px-10 sm:px-4 px-3 bg-transparent pt-1 pb-[env(safe-area-inset-bottom,4px)]">
                    <div className="w-full bg-white/80 backdrop-blur-sm rounded-xl py-3.5 px-4 shadow-sm text-center text-gray-500 text-sm font-medium border border-gray-100 select-none">
                        You cannot send messages to this user.
                    </div>
                </div>
            ) : getBlockStatus() === 'blocked_by_me' ? (
                <div className="mb-1 relative flex items-center justify-center lg:px-16 md:px-10 sm:px-4 px-3 bg-transparent pt-1 pb-[env(safe-area-inset-bottom,4px)]">
                    <div className="w-full bg-white/80 backdrop-blur-sm rounded-xl py-3.5 px-4 shadow-sm text-center text-gray-500 text-sm font-medium border border-gray-100 select-none flex items-center justify-center gap-2">
                        <span>You blocked this user.</span>
                        <button
                            onClick={async () => {
                                try {
                                    const otherId = chat.otherMember?.[0]?._id?._id || chat.otherMember?.[0]?._id;
                                    await unBlockPerson(chat._id, otherId);
                                    toast.success("User unblocked");
                                } catch (error) {
                                    toast.error("Failed to unblock user");
                                }
                            }}
                            className="text-[#8763ea] font-semibold hover:underline cursor-pointer"
                        >
                            Unblock
                        </button>
                    </div>
                </div>
            ) : (permissions.canSendText || permissions.canSendMedia) ?
                (
                    <div className="mb-1 relative flex items-end lg:px-16 md:px-10 sm:px-4 px-3 bg-transparent pt-1 pb-[env(safe-area-inset-bottom,4px)] gap-1">
                        {/* Main Input Wrapper */}
                        <div className="flex flex-col flex-1 bg-white rounded-xl shadow-sm min-w-0">
                            {/* Reply Snippet UI */}
                            {replyingTo && (
                                <div className="flex items-center justify-between px-3 pt-2 pb-1 relative">
                                    <div className="flex items-center min-w-0 flex-1 cursor-pointer" onClick={() => {
                                        const id1 = replyingTo._id;
                                        const id2 = replyingTo._realId;
                                        const el = document.querySelector(`[data-msg-id="${id1}"]`) ||
                                            (id2 && document.querySelector(`[data-msg-id="${id2}"]`)) ||
                                            document.querySelector(`[data-real-id="${id1}"]`) ||
                                            (id2 && document.querySelector(`[data-real-id="${id2}"]`));
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}>
                                        <div className="text-blue-500 mr-3 ml-1">
                                            <BsReply size={22} />
                                        </div>
                                        <div className="w-[3px] bg-blue-500 rounded-full h-8 mr-2 flex-shrink-0"></div>

                                        {/* Media Thumbnail */}
                                        {getFirstMedia(replyingTo) && (
                                            <div className="w-8 h-8 rounded shrink-0 overflow-hidden mr-2 bg-gray-100 flex items-center justify-center">
                                                {getFirstMedia(replyingTo).type === 'image' ? (
                                                    <img src={getFirstMedia(replyingTo).url} alt="thumbnail" className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={getFirstMedia(replyingTo).url} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-blue-500 font-medium text-[14px] leading-tight truncate">
                                                Reply to {replyingTo.sender?.profile?.fullName || replyingTo.sender?.name || 'User'}
                                            </span>
                                            <span className="text-gray-500 text-[14px] leading-tight truncate">
                                                {replyingTo.chatType === 'location' ? '📍 Location' : getFirstMedia(replyingTo)?.type === 'image' ? 'Photo' : getFirstMedia(replyingTo)?.type === 'video' ? 'Video' : (replyingTo.content || replyingTo.text || 'Attachment')}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2 flex-shrink-0">
                                        <MdClose size={22} />
                                    </button>
                                </div>
                            )}

                            {/* Forward Snippet UI */}
                            {forwardMessagesData && forwardMessagesData.length > 0 && (
                                <div className="flex items-center justify-between px-3 pt-2 pb-1 relative">
                                    <div className="flex items-center min-w-0 flex-1">
                                        <div className="text-[#55a355] mr-3 ml-1">
                                            <PiShareFat size={22} />
                                        </div>
                                        <div className="w-[3px] bg-[#55a355] rounded-full h-8 mr-2 flex-shrink-0"></div>

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[#55a355] font-medium text-[14px] leading-tight truncate">
                                                Forward Message
                                            </span>
                                            <span className="text-gray-500 text-[14px] leading-tight truncate">
                                                {forwardMessagesData.length} Message{forwardMessagesData.length > 1 ? 's' : ''} from {forwardMessagesData[0].sender?.profile?.fullName || forwardMessagesData[0].sender?.name || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setForwardMessagesData([])} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2 flex-shrink-0">
                                        <MdClose size={22} />
                                    </button>
                                </div>
                            )}

                            {/* Input Row */}
                            <div className="flex justify-center items-center px-4 py-3 min-w-0">
                                <button type="emoji-toggle" className={`mr-2 flex-shrink-0 ${permissions.canSendText ? 'text-gray-500' : 'text-gray-300 cursor-not-allowed'}`} onClick={(e) => { e.stopPropagation(); if (permissions.canSendText) setShowEmojiPicker((prev) => !prev); }}>
                                    <BiWinkSmile size={24} />
                                </button>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder={permissions.canSendText ? "Message" : "You can't send text messages"}
                                    disabled={!permissions.canSendText}
                                    className={`select-none flex-1 min-w-0 max-w-full text-[15px] outline-none bg-transparent pl-1 ${permissions.canSendText ? 'text-black' : 'text-gray-400 cursor-not-allowed'}`}
                                />
                                {permissions.canSendMedia && (
                                    <ClipIconPopOver
                                        isReactionMenuOpen={contextMenuOpen || isContextMenuEmojiExpanded}
                                        isEmojiPickerOpen={showReactionPicker || showEmojiPicker}
                                        onFileSelected={handleFileSelected}
                                        canSendPhotos={permissions.canSendPhotos}
                                        canSendVideos={permissions.canSendVideos}
                                        canSendFiles={permissions.canSendFiles}
                                        canSendLocation={permissions.canSendLocation}
                                        onLocationClick={() => setShowLocationPicker(true)}
                                        onContactClick={() => setShowContactPicker(true)}
                                    />
                                )}
                            </div>
                        </div>

                        {showEmojiPicker && permissions.canSendText && (
                            <div
                                ref={emojiPickerRef}
                                className="animate-picker origin-bottom absolute bg-white rounded-xl shadow-lg border border-gray-200"
                                style={{
                                    zIndex: 9999,
                                    bottom: 'calc(100% + 8px)',
                                    left: '0',
                                    right: '0',
                                    width: 'min(100%, 350px)',
                                    height: 'min(50vh, 380px)',
                                    margin: '0 auto',
                                }}
                            >
                                <React.Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
                                    <LazyEmojiPicker previewConfig={{ showPreview: false }} skinTonesDisabled={true} onEmojiClick={handleEmojiClick} theme="light" width="100%" height="100%" searchDisabled={window.innerWidth < 640} />
                                </React.Suspense>
                            </div>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!permissions.canSendText}
                            className={`flex-shrink-0 rounded-full h-[52px] w-[52px] text-white flex items-center justify-center transition-colors shadow-sm ml-1 ${permissions.canSendText ? 'bg-[#8763ea] hover:bg-[#7c56eb]' : 'bg-gray-300 cursor-not-allowed'}`}
                            type="button"
                        >
                            <FaPaperPlane size={22} className="relative right-0.5" />
                        </button>
                    </div>
                ) : null}

            {/* Media Preview Popup */}
            {selectedFiles.length > 0 && (
                <MediaPreviewPopup
                    files={selectedFiles}
                    source={selectionSource}
                    onClose={() => {
                        setSelectedFiles([]);
                        setSelectionSource(null);
                    }}
                    onSend={handleSendMedia}
                    onAddMore={(newFile, newType) => {
                        setSelectedFiles(prev => [...prev, { file: newFile, type: newType }]);
                    }}
                />
            )}

            <AnimatePresence>
                {showLocationPicker && (
                    <React.Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} />}>
                        <LazyLocationPicker
                            onClose={() => setShowLocationPicker(false)}
                            onSend={handleSendLocation}
                        />
                    </React.Suspense>
                )}
            </AnimatePresence>

            {/* Contact Picker Popup */}
            <AnimatePresence>
                {showContactPicker && (
                    <ContactPickerPopup
                        contacts={contacts}
                        backendUser={backendUser}
                        onClose={() => setShowContactPicker(false)}
                        onSelect={handleSendContact}
                    />
                )}
            </AnimatePresence>

            <ForwardPopup
                isOpen={showForwardPopup}
                onClose={() => {
                    setShowForwardPopup(false);
                    contextForwardRef.current = null;
                }}
                contacts={
                    contactsWithOtherMember
                }
                backendUser={backendUser}
                onContactClick={(user) => {
                    let messagesToForward;
                    if (contextForwardRef.current) {
                        messagesToForward = contextForwardRef.current;
                    } else {
                        messagesToForward = currentChatData
                            .filter(m => selectedMessages.includes(m._id))
                            .map(m => ({ ...m, _id: m._realId || m._id }));
                    }


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
                        choose("Chat", user, null, null, null, null, messagesToForward);
                        setShowForwardPopup(false);
                        setSelectedMessages([]);
                        contextForwardRef.current = null;
                    } else {
                        toast.error("You are not allowed to send messages to this chat");
                    }
                }}
            />

            <DeleteMultiplePopup
                isOpen={showDeleteMultiplePopup}
                onClose={() => setShowDeleteMultiplePopup(false)}
                count={selectedMessages.length}
                profilePicture={chat?.contactType === "person" ? chat?.otherMember?.[0]?._id?.profile : chat?.details?.profile}
                onDelete={async () => {
                    const selectedIds = [...selectedMessages];
                    const messagesToDeleteObjs = currentChatData.filter(m => selectedIds.includes(m._id));

                    setShowDeleteMultiplePopup(false);
                    setSelectedMessages([]);

                    if (messagesToDeleteObjs.length > 0) {
                        // 1. Trigger collapse animation
                        setCCd(prev => prev.map(m => selectedIds.includes(m._id) ? { ...m, _isDeleting: true } : m));

                        // 2. Wait for animation to finish, then delete
                        setTimeout(async () => {
                            try {
                                await deleteMultipleMessages(messagesToDeleteObjs, chat._id);
                            } catch (err) {
                                console.error("Error deleting multiple messages:", err);
                            }
                        }, 350);
                    }
                }}
            />

            <DeleteMultiplePopup
                isOpen={!!messageToDelete}
                onClose={() => setMessageToDelete(null)}
                count={1}
                profilePicture={chat?.contactType === "person" ? chat?.otherMember?.[0]?._id?.profile : chat?.details?.profile}
                onDelete={async () => {
                    const msg = messageToDelete;
                    setMessageToDelete(null);

                    // 1. Trigger collapse animation
                    setCCd(prev => prev.map(m => m._id === msg._id ? { ...m, _isDeleting: true } : m));

                    // 2. Wait for animation to finish, then delete
                    setTimeout(async () => {
                        await deleteMsg(msg);
                    }, 350);
                }}
            />

            {/* Reactions Sidebar Overlay */}
            <AnimatePresence>
                {activeReactionsMessage && activeReactionsMessage.reactions && (
                    // <>
                    //     <motion.div 
                    //         initial={{ opacity: 0 }}
                    //         animate={{ opacity: 1 }}
                    //         exit={{ opacity: 0 }}
                    //         transition={{ duration: 0.2 }}
                    //         className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[90] cursor-pointer" 
                    //         onClick={() => setActiveReactionsMessage(null)}
                    //     ></motion.div>
                    //     <motion.div 
                    //         initial="hidden"
                    //         animate="visible"
                    //         exit="exit"
                    //         variants={{
                    //             hidden: { x: "100%" },
                    //             visible: { x: 0 },
                    //             exit: { x: "100%" },
                    //         }}
                    //         transition={{ type: "tween", duration: 0.3 }}
                    //         className="absolute top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)] z-[100] flex flex-col border-l border-gray-100"
                    //     >
                    //         <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white shadow-sm z-10">
                    //             <h3 className="font-bold text-gray-800 text-[15px] tracking-wide inline-flex items-center gap-2">
                    //                 <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">{activeReactionsMessage.reactions.length}</span>
                    //                 Reactions
                    //             </h3>
                    //             <button
                    //                 onClick={() => setActiveReactionsMessage(null)}
                    //                 className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    //             >
                    //                 <MdClose size={20} />
                    //             </button>
                    //         </div>
                    //         <div className="flex-1 overflow-y-auto p-2 scrollbar-telegram bg-gray-50/30">
                    //             {activeReactionsMessage.reactions.map((r, i) => {
                    //                 const isMe = (r.user?._id || r.user) === backendUser._id;
                    //                 const userProfile = r.user?.profile;
                    //                 return (
                    //                     <div 
                    //                         key={i} 
                    //                         className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white transition-colors mb-1.5 border border-transparent hover:border-gray-100 hover:shadow-sm group cursor-pointer"
                    //                         onClick={() => {
                    //                             if (isMe) {
                    //                                 const msgId = activeReactionsMessage._realId || activeReactionsMessage._id;
                    //                                 toggleReaction(msgId, chat._id, r.reaction)
                    //                                     .then(() => setActiveReactionsMessage(null))
                    //                                     .catch(err => console.error(err));
                    //                             }
                    //                         }}
                    //                     >
                    //                         <div className="flex items-center gap-3.5 min-w-0">
                    //                             <div className="relative">
                    //                                 <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center bg-gray-200 shadow-sm">
                    //                                     <UserAvatar
                    //                                         size="h-full w-full"
                    //                                         {...(userProfile?.type === 'image' && {
                    //                                             image: userProfile.imageUrl
                    //                                         })}
                    //                                         {...(userProfile?.type === 'emoji' && {
                    //                                             emoji: userProfile.emoji,
                    //                                             simpleBg: userProfile.bgColor,
                    //                                             emojiSize: "text-lg"
                    //                                         })}
                    //                                         {...(userProfile?.type === 'initials' && {
                    //                                             text: userProfile.initials,
                    //                                             simpleBg: userProfile.bgColor,
                    //                                             textSize: "text-sm"
                    //                                         })}
                    //                                         {...(!userProfile && {
                    //                                             text: r.user?.name?.charAt(0) || "?",
                    //                                             simpleBg: "#d1d5db",
                    //                                             textSize: "text-sm"
                    //                                         })}
                    //                                     />
                    //                                 </div>
                    //                                 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[3px] shadow-sm ring-1 ring-black/5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    //                                     <span className="text-[14px] leading-none block">{r.reaction}</span>
                    //                                 </div>
                    //                             </div>
                    //                             <div className="flex flex-col min-w-0">
                    //                                 <span className="text-[14px] font-semibold text-gray-800 truncate leading-tight">
                    //                                     {isMe ? "You" : r.user?.name + (r.user?.lastName ? " " + r.user.lastName : "")}
                    //                                 </span>
                    //                                 {isMe && <span className="text-[11px] text-gray-400 mt-0.5 group-hover:text-red-400 transition-colors">Tap to remove</span>}
                    //                             </div>
                    //                         </div>
                    //                     </div>
                    //                 );
                    //             })}
                    //         </div>
                    //     </motion.div>
                    // </>
                    <>
                        <motion.div
                            className=" select-none fixed inset-0 bg-black/40 backdrop-blur-md z-30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setActiveReactionsMessage(null)}
                        // NO onClick!
                        />
                        <motion.div
                            className="select-none fixed flex flex-col right-0 top-0 h-screen bg-gray-100 shadow-xl z-40 w-full md:w-96"
                            variants={infoPanelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white shadow-sm z-10">
                                <h3 className="font-medium text-gray-800 text-lg tracking-wide inline-flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">{activeReactionsMessage.reactions.length}</span>
                                    Reactions
                                </h3>
                                <button
                                    onClick={() => setActiveReactionsMessage(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <MdClose size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-telegram bg-gray-50/30">
                                {activeReactionsMessage.reactions.map((r, i) => {
                                    const isMe = (r.user?._id || r.user) === backendUser._id;
                                    const userProfile = r.user?.profile;
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white transition-colors mb-1.5 border border-transparent hover:border-gray-100 hover:shadow-sm group cursor-pointer"
                                            onClick={() => {
                                                if (isMe) {
                                                    const msgId = activeReactionsMessage._realId || activeReactionsMessage._id;
                                                    toggleReaction(msgId, chat._id, r.reaction)
                                                        .then(() => setActiveReactionsMessage(null))
                                                        .catch(err => console.error(err));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="relative">
                                                    <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center bg-gray-200 shadow-sm">
                                                        <UserAvatar
                                                            size="h-full w-full"
                                                            {...(userProfile?.type === 'image' && {
                                                                image: userProfile.imageUrl
                                                            })}
                                                            {...(userProfile?.type === 'emoji' && {
                                                                emoji: userProfile.emoji,
                                                                simpleBg: userProfile.bgColor,
                                                                emojiSize: "text-lg"
                                                            })}
                                                            {...(userProfile?.type === 'initials' && {
                                                                text: userProfile.initials,
                                                                simpleBg: userProfile.bgColor,
                                                                textSize: "text-sm"
                                                            })}
                                                            {...(!userProfile && {
                                                                text: r.user?.name?.charAt(0) || "?",
                                                                simpleBg: "#d1d5db",
                                                                textSize: "text-sm"
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[3px] shadow-sm ring-1 ring-black/5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                        <span className="text-[14px] leading-none block">{r.reaction}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[14px] font-semibold text-gray-800 truncate leading-tight">
                                                        {isMe ? "You" : r.user?.name + (r.user?.lastName ? " " + r.user.lastName : "")}
                                                    </span>
                                                    {isMe && <span className="font-normal text-[11px] text-gray-400 mt-0.5 group-hover:text-red-400 transition-colors">Tap to remove</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function ContactPickerPopup({ contacts, backendUser, onClose, onSelect }) {
    const [search, setSearch] = useState('');

    const personContacts = useMemo(() => {
        return contacts
            .filter(c => c.contactType === 'person')
            .map(contact => {
                const otherMember = contact.members?.filter(
                    member => member._id?._id?.toString() !== backendUser?._id?.toString()
                ) || [];
                return { ...contact, otherMember };
            })
            .filter(c => c.otherMember.length > 0)
            .sort((a, b) => {
                const nameA = (a.otherMember[0]?._id?.name || '').toLowerCase();
                const nameB = (b.otherMember[0]?._id?.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [contacts, backendUser]);

    const filtered = useMemo(() => {
        if (!search.trim()) return personContacts;
        const q = search.toLowerCase();
        return personContacts.filter(c => {
            const user = c.otherMember[0]?._id;
            if (!user) return false;
            const fullName = ((user.name || '') + ' ' + (user.lastName || '')).toLowerCase();
            const phone = (user.phone || '').toLowerCase();
            return fullName.includes(q) || phone.includes(q);
        });
    }, [personContacts, search]);

    // Group contacts alphabetically
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(contact => {
            const name = contact.otherMember[0]?._id?.name || '';
            const letter = name.charAt(0).toUpperCase() || '#';
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(contact);
        });
        return groups;
    }, [filtered]);

    return (
        <div className="select-none fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-40 p-2" onClick={onClose}>
            <div
                className="relative bg-white rounded-2xl p-4 w-[350px] max-w-full flex flex-col"
                style={{ maxHeight: 'min(75vh, 580px)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Input Field */}
                <div className="flex items-center mb-4 flex-shrink-0">
                    <MdClose size={27} onClick={onClose} className="cursor-pointer text-gray-700 hover:text-gray-600" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border-none text-lg caret-[1px] focus:caret-gray-600 focus:outline-none px-2 text-gray-900 placeholder:text-gray-400"
                    />
                </div>

                {/* Contacts List */}
                <div className="scrollbar-telegram overflow-y-auto flex-1">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <p className="font-medium text-lg text-center text-gray-800">No Result</p>
                            <p className="text-sm text-center text-gray-500 mt-1">
                                There were no results for "{search}".
                            </p>
                            <p className="text-sm text-center text-gray-500">Try a new search.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filtered.map(contact => {
                                const user = contact.otherMember[0]?._id;
                                if (!user) return null;
                                const profile = user.profile;
                                const displayName = (user.name || '') + (user.lastName ? ' ' + user.lastName : '');
                                const isOnline = user.isOnline;

                                return (
                                    <div
                                        key={contact._id}
                                        onClick={() => onSelect(contact)}
                                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200/75 cursor-pointer transition-colors"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <UserAvatar
                                                {...(profile?.type === 'image' && { image: profile.imageUrl })}
                                                {...(profile?.type === 'emoji' && {
                                                    emoji: profile.emoji,
                                                    simpleBg: profile.bgColor,
                                                    emojiSize: "text-3xl"
                                                })}
                                                {...(profile?.type === 'initials' && {
                                                    text: profile.initials,
                                                    simpleBg: profile.bgColor
                                                })}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-lg text-gray-900 leading-tight">
                                                {displayName}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700 leading-tight mt-0.5">
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const DateLabel = React.memo(({ dateText, onClick }) => (
    <div className="select-none w-full flex justify-center my-3">
        <div
            onClick={onClick}
            title="Click to select a date"
            className="bg-white/10 backdrop-blur-xl rounded-full px-4 py-[3px] text-[14px] tracking-wide font-medium text-white max-w-[85%] text-center leading-tight cursor-pointer hover:bg-white/20 transition-colors"
        >
            {dateText}
        </div>
    </div>
));

function MenuItem({ onClick, icon, text, danger }) {
    return (
        <div onClick={onClick} className={`ctx-menu-item ${danger ? 'ctx-menu-item-danger' : ''} rounded-lg`}>
            <span className="ctx-menu-icon">{icon}</span>
            <span className="ctx-menu-text">{text}</span>
        </div>
    );
}