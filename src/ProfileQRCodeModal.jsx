import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { AuthContext } from "./firebase hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

// ── Linkly Logo SVG (for QR center) ──
const LinklyLogo = ({ size = 22, color = "#fff", bg = "#8763ea" }) => (
    <div style={{
        width: size + 10,
        height: size + 10,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    }}>
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
            <polyline
                points="16 11 13 13 11 11 8 13"
                style={{ fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
            />
            <path
                d="M20.88,13.46A9,9,0,0,1,7.88,20L3,21l1-4.88a9,9,0,1,1,16.88-2.66Z"
                style={{ fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
            />
        </svg>
    </div>
);

// ── Gradient Theme Presets (28 themes) ──
const THEME_PRESETS = [
    // Original 8
    { id: "blue", name: "Ocean", gradient: "linear-gradient(135deg, #4EA4F6 0%, #6C5CE7 100%)", qrColor: "#4A6CF7", dotColors: ["#4EA4F6", "#6C5CE7"] },
    { id: "sunset", name: "Sunset", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)", qrColor: "#E85D5D", dotColors: ["#FF6B6B", "#FFB347"] },
    { id: "emerald", name: "Emerald", gradient: "linear-gradient(135deg, #00B894 0%, #55E6C1 100%)", qrColor: "#00A884", dotColors: ["#00B894", "#55E6C1"] },
    { id: "violet", name: "Violet", gradient: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)", qrColor: "#9333EA", dotColors: ["#A855F7", "#EC4899"] },
    { id: "midnight", name: "Midnight", gradient: "linear-gradient(135deg, #1e1e2e 0%, #3b3b5c 100%)", qrColor: "#4a4a7a", dotColors: ["#1e1e2e", "#3b3b5c"] },
    { id: "rose", name: "Rose", gradient: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)", qrColor: "#E45A9E", dotColors: ["#F472B6", "#FB7185"] },
    { id: "sky", name: "Sky", gradient: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)", qrColor: "#3B82F6", dotColors: ["#38BDF8", "#818CF8"] },
    { id: "amber", name: "Amber", gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)", qrColor: "#D97706", dotColors: ["#F59E0B", "#EF4444"] },
    // 20 new themes
    { id: "coral", name: "Coral", gradient: "linear-gradient(135deg, #FF6F61 0%, #DE4D86 100%)", qrColor: "#E6574E", dotColors: ["#FF6F61", "#DE4D86"] },
    { id: "mint", name: "Mint", gradient: "linear-gradient(135deg, #00D2D3 0%, #54A0FF 100%)", qrColor: "#00B4B5", dotColors: ["#00D2D3", "#54A0FF"] },
    { id: "lavender", name: "Lavender", gradient: "linear-gradient(135deg, #C084FC 0%, #818CF8 100%)", qrColor: "#9F67F8", dotColors: ["#C084FC", "#818CF8"] },
    { id: "peach", name: "Peach", gradient: "linear-gradient(135deg, #FBBF24 0%, #F472B6 100%)", qrColor: "#E5A820", dotColors: ["#FBBF24", "#F472B6"] },
    { id: "ocean_deep", name: "Deep Ocean", gradient: "linear-gradient(135deg, #0F3460 0%, #533483 100%)", qrColor: "#2D4A8A", dotColors: ["#0F3460", "#533483"] },
    { id: "lime", name: "Lime", gradient: "linear-gradient(135deg, #84CC16 0%, #22D3EE 100%)", qrColor: "#65A30D", dotColors: ["#84CC16", "#22D3EE"] },
    { id: "berry", name: "Berry", gradient: "linear-gradient(135deg, #DB2777 0%, #7C3AED 100%)", qrColor: "#BE185D", dotColors: ["#DB2777", "#7C3AED"] },
    { id: "arctic", name: "Arctic", gradient: "linear-gradient(135deg, #67E8F9 0%, #A78BFA 100%)", qrColor: "#4DD0E1", dotColors: ["#67E8F9", "#A78BFA"] },
    { id: "tangerine", name: "Tangerine", gradient: "linear-gradient(135deg, #FB923C 0%, #F43F5E 100%)", qrColor: "#EA8033", dotColors: ["#FB923C", "#F43F5E"] },
    { id: "forest", name: "Forest", gradient: "linear-gradient(135deg, #059669 0%, #0D9488 100%)", qrColor: "#047857", dotColors: ["#059669", "#0D9488"] },
    { id: "twilight", name: "Twilight", gradient: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)", qrColor: "#4F46E5", dotColors: ["#6366F1", "#EC4899"] },
    { id: "golden", name: "Golden", gradient: "linear-gradient(135deg, #D97706 0%, #B45309 100%)", qrColor: "#B45309", dotColors: ["#D97706", "#B45309"] },
    { id: "magenta", name: "Magenta", gradient: "linear-gradient(135deg, #E11D48 0%, #BE185D 100%)", qrColor: "#C81A3F", dotColors: ["#E11D48", "#BE185D"] },
    { id: "teal", name: "Teal", gradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)", qrColor: "#0F9F94", dotColors: ["#14B8A6", "#06B6D4"] },
    { id: "neon", name: "Neon", gradient: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)", qrColor: "#0EA572", dotColors: ["#10B981", "#3B82F6"] },
    { id: "plum", name: "Plum", gradient: "linear-gradient(135deg, #7E22CE 0%, #4338CA 100%)", qrColor: "#6D1DB8", dotColors: ["#7E22CE", "#4338CA"] },
    { id: "candy", name: "Candy", gradient: "linear-gradient(135deg, #F87171 0%, #C084FC 100%)", qrColor: "#E55A5A", dotColors: ["#F87171", "#C084FC"] },
    { id: "slate", name: "Slate", gradient: "linear-gradient(135deg, #475569 0%, #64748B 100%)", qrColor: "#3D4A5C", dotColors: ["#475569", "#64748B"] },
    { id: "spring", name: "Spring", gradient: "linear-gradient(135deg, #34D399 0%, #FBBF24 100%)", qrColor: "#2BB883", dotColors: ["#34D399", "#FBBF24"] },
    { id: "aurora", name: "Aurora", gradient: "linear-gradient(135deg, #06B6D4 0%, #8B5CF6 0%, #EC4899 100%)", qrColor: "#7C3AED", dotColors: ["#06B6D4", "#EC4899"] },
    { id: "charcoal", name: "Charcoal", gradient: "linear-gradient(135deg, #1F2937 0%, #374151 100%)", qrColor: "#374151", dotColors: ["#1F2937", "#374151"] },
];

// ── SVG Icons ──
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);



const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const BackArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const getContactDisplayInfo = (contact, backendUser) => {
    if (contact.contactType === "person") {
        const other = contact.members?.find(m => (m._id?._id || m._id)?.toString() !== backendUser?._id?.toString());
        const user = other?._id || other;
        return {
            name: user?.name ? `${user.name}${user.lastName ? ' ' + user.lastName : ''}` : "Unknown",
            profile: user?.profile,
            subtitle: user?.isOnline ? "Online" : "",
        };
    }
    return {
        name: contact.name || "Unknown",
        profile: contact.details?.profile || contact.profile,
        subtitle: `${contact.members?.length || 0} members`,
    };
};

const SelectedContactChip = ({ contact, onRemove, backendUser }) => {
    const [isHovered, setIsHovered] = useState(false);
    const info = getContactDisplayInfo(contact, backendUser);
    const profile = info.profile;

    return (
        <div
            onClick={() => onRemove(contact)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#e8f0fe",
                borderRadius: 20,
                padding: "3px 10px 3px 3px",
                fontSize: 13,
                fontWeight: 500,
                color: "#1a73e8",
                cursor: "pointer",
                transition: "background 0.15s",
            }}
        >
            <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                {isHovered ? (
                    <div style={{ width: "100%", height: "100%", background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </div>
                ) : (
                    <UserAvatar
                        size="w-full h-full"
                        textSize="text-[10px]"
                        {...(profile?.type === 'image' && { image: profile.imageUrl })}
                        {...(profile?.type === 'emoji' && { emoji: profile.emoji, simpleBg: profile.bgColor, emojiSize: "text-[12px]" })}
                        {...(profile?.type === 'initials' && { text: profile.initials, simpleBg: profile.bgColor })}
                    />
                )}
            </div>
            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.name}</span>
        </div>
    );
};

export default function ProfileQRCodeModal({ isOpen, onClose }) {
    const { backendUser, contacts, sendImagesInChat, sendImagesInChanel, handleChat, sendBulkQrImage } = useContext(AuthContext);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
    const [step, setStep] = useState("select"); // "select" | "share"
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const qrCardRef = useRef(null);
    const themeScrollRef = useRef(null);

    // Contact picker state
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [isSendingOnLinkly, setIsSendingOnLinkly] = useState(false);
    const contactSearchRef = useRef(null);

    const isQrPushedRef = useRef(false);
    const isSharePushedRef = useRef(false);
    const isPickerPushedRef = useRef(false);

    // Main Modal History Management
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            if (!isQrPushedRef.current) {
                isQrPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState(
                    { ...window.history.state, profileQrModalOpen: true, modalDepth: currentDepth + 1 },
                    '',
                    window.location.pathname + window.location.hash
                );
            }
            return () => clearTimeout(timer);
        } else {
            if (isQrPushedRef.current) {
                isQrPushedRef.current = false;
                if (window.history.state?.profileQrModalOpen) {
                    window.history.back();
                }
            }
            setIsVisible(false);
            const timer = setTimeout(() => {
                setStep("select");
                setShowContactPicker(false);
                setCopied(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Sub-Screen History Management (Share Screen)
    useEffect(() => {
        if (step === "share") {
            if (!isSharePushedRef.current) {
                isSharePushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState(
                    { ...window.history.state, profileQrShareSubScreen: true, modalDepth: currentDepth + 1 },
                    '',
                    window.location.pathname + window.location.hash
                );
            }
        } else {
            if (isSharePushedRef.current) {
                isSharePushedRef.current = false;
                if (window.history.state?.profileQrShareSubScreen) {
                    window.history.back();
                }
            }
        }
    }, [step]);

    // Sub-Screen History Management (Contact Picker)
    useEffect(() => {
        if (showContactPicker) {
            if (!isPickerPushedRef.current) {
                isPickerPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState(
                    { ...window.history.state, profileQrPickerOpen: true, modalDepth: currentDepth + 1 },
                    '',
                    window.location.pathname + window.location.hash
                );
            }
        } else {
            if (isPickerPushedRef.current) {
                isPickerPushedRef.current = false;
                if (window.history.state?.profileQrPickerOpen) {
                    window.history.back();
                }
            }
        }
    }, [showContactPicker]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        if (isPickerPushedRef.current && window.history.state?.profileQrPickerOpen) {
            isPickerPushedRef.current = false;
            window.history.back();
        }
        if (isSharePushedRef.current && window.history.state?.profileQrShareSubScreen) {
            isSharePushedRef.current = false;
            window.history.back();
        }
        if (isQrPushedRef.current && window.history.state?.profileQrModalOpen) {
            isQrPushedRef.current = false;
            window.history.back();
        }
        setTimeout(onClose, 300);
    }, [onClose]);

    // Listen to browser/mobile back button (popstate)
    useEffect(() => {
        const handlePopState = (e) => {
            if (showContactPicker && !e.state?.profileQrPickerOpen) {
                window._linklyModalPopped = true;
                isPickerPushedRef.current = false;
                setShowContactPicker(false);
                return;
            }
            if (step === "share" && !e.state?.profileQrShareSubScreen) {
                window._linklyModalPopped = true;
                isSharePushedRef.current = false;
                setStep("select");
                return;
            }
            if (isOpen && !e.state?.profileQrModalOpen) {
                window._linklyModalPopped = true;
                isQrPushedRef.current = false;
                isSharePushedRef.current = false;
                isPickerPushedRef.current = false;
                setIsVisible(false);
                setTimeout(onClose, 300);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, step, showContactPicker, onClose]);

    const profileUrl = `${window.location.origin}/${backendUser?._id}`;

    // ── Contact picker helpers ──
    const isSendAllowed = (user) => {
        if (user.contactType === "person") return true;
        if (user.contactType === "group") {
            const uid = backendUser?._id?.toString();
            const isOwner = user.owner?.toString() === uid;
            if (isOwner) return true;
            const isAdmin = user.admins?.some(a => (a._id?._id || a._id || a)?.toString() === uid);
            if (isAdmin) return true;
            const isMember = user.members?.some(m => (m._id?._id || m._id || m)?.toString() === uid);
            if (isMember) {
                if (user.membersPermissions?.sendMedia === false && user.membersPermissions?.sendPhotos === false) {
                    return false;
                }
                return true;
            }
            return false;
        }
        if (user.contactType === "channel") {
            const uid = backendUser?._id?.toString();
            const isOwner = user.owner?.toString() === uid;
            if (isOwner) return true;
            const isAdmin = user.admins?.some(a => (a._id?._id || a._id || a)?.toString() === uid);
            return !!isAdmin;
        }
        return false;
    };

    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        return contacts.filter(c => {
            if (!isSendAllowed(c)) return false;
            const q = contactSearch.toLowerCase();
            if (!q) return true;
            if (c.contactType === "person") {
                const other = c.members?.find(m => (m._id?._id || m._id)?.toString() !== backendUser?._id?.toString());
                const name = (other?._id?.name || other?.name || "").toLowerCase();
                return name.includes(q);
            }
            return (c.name || "").toLowerCase().includes(q);
        });
    }, [contacts, contactSearch, backendUser]);

    if (!isOpen && !isVisible) return null;
    if (!backendUser) return null;



    const toggleContactSelection = (contact) => {
        setSelectedContacts(prev => {
            const exists = prev.find(c => c._id === contact._id);
            if (exists) return prev.filter(c => c._id !== contact._id);
            return [...prev, contact];
        });
    };

    const generateQRImage = async () => {
        if (!qrCardRef.current) return null;
        try {
            const canvas = await html2canvas(qrCardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const header = clonedDoc.querySelector('.share-header');
                    const footer = clonedDoc.querySelector('.share-footer');
                    if (header) header.style.visibility = 'hidden';
                    if (footer) footer.style.visibility = 'hidden';
                }
            });
            const padding = 80;
            const paddedCanvas = document.createElement("canvas");
            paddedCanvas.width = canvas.width + padding * 2;
            paddedCanvas.height = canvas.height + padding * 2;
            const ctx = paddedCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
            ctx.drawImage(canvas, padding, padding);
            return new Promise(resolve => {
                paddedCanvas.toBlob(blob => resolve(blob), 'image/png');
            });
        } catch (err) {
            console.error("Failed to generate image:", err);
            return null;
        }
    };

    const handleShareOnLinkly = () => {
        setShowContactPicker(true);
        setContactSearch("");
        setSelectedContacts([]);
        setTimeout(() => contactSearchRef.current?.focus(), 100);
    };

    const handleSendToContacts = async () => {
        if (selectedContacts.length === 0) return;
        setIsSendingOnLinkly(true);
        try {
            const blob = await generateQRImage();
            if (!blob) {
                setIsSendingOnLinkly(false);
                return;
            }
            const file = new File([blob], 'linkly-qr.png', { type: 'image/png' });

            const fd = new FormData();
            fd.append("images", file);

            // Append all contact IDs for bulk sending
            const contactIds = selectedContacts.map(c => c._id);
            fd.append("contactIds", JSON.stringify(contactIds));

            if (sendBulkQrImage) {
                const res = await sendBulkQrImage(fd);
                
                if (res.status === 200) {
                    setShowContactPicker(false);
                    setSelectedContacts([]);
                    handleClose();
                    toast.dismissAll();
                    toast.success("QR Code sent successfully");
                    window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { contact: res.data.data } }));
                }
                else {

                }

            }

            // Navigate to the last selected contact's chat
            // const lastContact = selectedContacts[selectedContacts.length - 1];
            // if (handleChat) handleChat(lastContact._id);


        } catch (err) {
            console.error("Failed to send on Linkly:", err);
        }
        setIsSendingOnLinkly(false);
    };

    const handleShareOthers = async () => {
        if (!qrCardRef.current) return;
        setIsSharing(true);
        try {
            const canvas = await html2canvas(qrCardRef.current, {
                backgroundColor: null,
                scale: 2, // High res
                useCORS: true,
                onclone: (clonedDoc) => {
                    const header = clonedDoc.querySelector('.share-header');
                    const footer = clonedDoc.querySelector('.share-footer');
                    if (header) header.style.visibility = 'hidden';
                    if (footer) footer.style.visibility = 'hidden';
                }
            });

            // Create a new canvas with a white background and padding to center the card
            const padding = 80; // padding scaled by 2
            const paddedCanvas = document.createElement("canvas");
            paddedCanvas.width = canvas.width + padding * 2;
            paddedCanvas.height = canvas.height + padding * 2;
            const ctx = paddedCanvas.getContext("2d");

            // Draw white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);

            // Draw the captured card canvas in the center
            ctx.drawImage(canvas, padding, padding);

            paddedCanvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsSharing(false);
                    return;
                }
                const file = new File([blob], 'linkly-qr.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: `${backendUser.name}'s Profile`,
                            text: `Scan my Linkly QR to connect!`,
                            files: [file],
                        });
                    } catch (err) {
                        if (err.name !== "AbortError") console.error("Share failed:", err);
                    }
                } else {
                    // Fallback to download if sharing files is not supported
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "linkly-qr.png";
                    a.click();
                    URL.revokeObjectURL(url);
                }
                setIsSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error("Failed to generate image:", err);
            setIsSharing(false);
        }
    };

    // Helper: draw emoji/text on a canvas and return a data URL
    const textToImage = (text, bgColor, isEmoji = false) => {
        const px = 160; // 2x for retina
        const canvas = document.createElement("canvas");
        canvas.width = px;
        canvas.height = px;
        const ctx = canvas.getContext("2d");
        // Background circle
        ctx.beginPath();
        ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        // Text
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isEmoji) {
            ctx.font = `${px * 0.5}px sans-serif`;
        } else {
            ctx.font = `bold ${px * 0.45}px sans-serif`;
            ctx.fillStyle = "#fff";
        }
        ctx.fillText(text, px / 2, px / 2 + (isEmoji ? 2 : 0));
        return canvas.toDataURL("image/png");
    };

    // Render avatar (large, for header)
    const renderAvatarLarge = () => {
        const { profile } = backendUser;
        if (!profile) return null;
        const size = "80px";
        const baseStyle = {
            width: size,
            height: size,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.5)",
            objectFit: "cover",
            overflow: "hidden",
            userSelect: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "block",
        };
        if (profile.type === "image") {
            return <img src={profile.imageUrl} alt="avatar" style={baseStyle} />;
        }
        if (profile.type === "emoji") {
            const src = textToImage(profile.emoji, profile.bgColor || "#4f8ef7", true);
            return <img src={src} alt="avatar" style={baseStyle} />;
        }
        const initial = profile.initials || backendUser.name?.charAt(0).toUpperCase();
        const src = textToImage(initial, profile.bgColor || "#4f8ef7", false);
        return <img src={src} alt="avatar" style={baseStyle} />;
    };

    // ── Selection Page ──
    const SelectionPage = () => (
        <motion.div
            key="select"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                height: "100%",
            }}
        >
            {/* Header */}
            <div style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 8px",
            }}>
                <button
                    onClick={handleClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#6b7280",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                    <CloseIcon />
                </button>
                <span style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#1f2937",
                    letterSpacing: "-0.01em",
                }}>QR Code</span>
                <div style={{ width: 36 }} />
            </div>

            {/* Preview Card — no animation on theme change, just CSS transitions */}
            <div style={{
                margin: "16px 24px 0",
                width: "calc(100% - 48px)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}>
                <div style={{
                    padding: "28px 24px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    overflow: "hidden",
                    isolation: "isolate",
                }}>
                    {/* Animated gradient background layer */}
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={selectedTheme.id}
                            initial={{ clipPath: "circle(0% at 50% 50%)", zIndex: 0 }}
                            animate={{ clipPath: "circle(150% at 50% 50%)", zIndex: 0 }}
                            exit={{ opacity: 1, zIndex: -1 }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: selectedTheme.gradient,
                            }}
                        />
                    </AnimatePresence>
                    {/* Decorative circles */}
                    <div style={{
                        position: "absolute",
                        top: -30,
                        right: -30,
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                    }} />
                    <div style={{
                        position: "absolute",
                        bottom: -20,
                        left: -20,
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                    }} />

                    {/* Wrapper with zIndex to stay above background */}
                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                        {renderAvatarLarge()}

                        <h3 style={{
                            color: "#fff",
                            fontSize: 18,
                            fontWeight: 700,
                            marginTop: 12,
                            marginBottom: 2,
                            textShadow: "0 1px 4px rgba(0,0,0,0.15)",
                        }}>
                            {backendUser.name} {backendUser.lastName}
                        </h3>
                        {backendUser.username && (
                            <span style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: 14,
                                fontWeight: 500,
                            }}>
                                @{backendUser.username}
                            </span>
                        )}

                        {/* QR Preview (smaller) */}
                        <motion.div
                            key={selectedTheme.id}
                            initial={{ opacity: 0, rotateY: 90, filter: "blur(4px)" }}
                            animate={{ opacity: 1, rotateY: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            style={{
                                marginTop: 16,
                                background: "#fff",
                                borderRadius: 16,
                                padding: 12,
                                position: "relative",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <QRCode
                                value={profileUrl}
                                size={120}
                                bgColor="#ffffff"
                                fgColor={selectedTheme.qrColor}
                                level="Q"
                                style={{ display: "block" }}
                            />
                            {/* Linkly logo overlay on QR center */}
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "#fff",
                                borderRadius: "50%",
                                padding: 3,
                            }}>
                                <LinklyLogo size={18} bg={selectedTheme.qrColor} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Theme Selector Label */}
            <div style={{
                width: "100%",
                padding: "20px 28px 8px",
            }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}>Choose Theme</span>
            </div>

            {/* Theme Dots — horizontal scroll strip */}
            <div
                className="scrollbar-hidden"
                ref={themeScrollRef}
                onWheel={(e) => {
                    if (themeScrollRef.current) {
                        themeScrollRef.current.scrollLeft += e.deltaY * 2;
                    }
                }}
                style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 28px 10px",
                    overflowX: "auto",
                    overflowY: "hidden",
                    width: "100%",
                    scrollBehavior: "smooth",
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                    maskImage: "linear-gradient(to right, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to right, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                }}
            >
                {THEME_PRESETS.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        style={{
                            width: 40,
                            height: 40,
                            minWidth: 40,
                            borderRadius: "50%",
                            background: theme.gradient,
                            border: selectedTheme.id === theme.id
                                ? "3px solid #1f2937"
                                : "3px solid transparent",
                            cursor: "pointer",
                            outline: "none",
                            position: "relative",
                            boxShadow: selectedTheme.id === theme.id
                                ? "0 0 0 3px rgba(31,41,55,0.15)"
                                : "0 2px 6px rgba(0,0,0,0.12)",
                            transition: "border 0.2s, box-shadow 0.2s, transform 0.2s",
                            padding: 0,
                            flexShrink: 0,
                            transform: selectedTheme.id === theme.id ? "scale(1.15)" : "scale(1)",
                        }}
                    >
                        {selectedTheme.id === theme.id && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>

            {/* Continue Button */}
            <div style={{ padding: "16px 28px 20px", width: "100%" }}>
                <motion.button
                    onClick={() => setStep("share")}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: "100%",
                        padding: "14px 24px",
                        borderRadius: 14,
                        border: "none",
                        background: selectedTheme.gradient,
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        transition: "background 0.4s ease",
                        letterSpacing: "0.01em",
                    }}
                >
                    Share QR Code
                    <ArrowRightIcon />
                </motion.button>
            </div>
        </motion.div>
    );

    // ── Share Page ──
    const SharePage = () => (
        <motion.div
            ref={qrCardRef}
            key="share"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                background: selectedTheme.gradient,
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Decorative blobs */}
            <div style={{
                position: "absolute",
                top: -50,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute",
                bottom: -30,
                left: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute",
                top: "40%",
                left: -50,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
            }} />

            {/* Header */}
            <div className="share-header" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 8px",
                position: "relative",
                zIndex: 2,
            }}>
                <button
                    onClick={() => setStep("select")}
                    style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(8px)",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                >
                    <BackArrowIcon />
                </button>
                <span className="select-none" style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#fff",
                    textShadow: "0 1px 4px rgba(0,0,0,0.12)",
                }}>Share Profile</span>
                <button
                    onClick={handleClose}
                    style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(8px)",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                >
                    <CloseIcon />
                </button>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 24px 16px",
                position: "relative",
                zIndex: 2,
            }}>
                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ textAlign: "center", marginBottom: 20 }}
                >
                    {renderAvatarLarge()}
                    <h2 className="select-none" style={{
                        color: "#fff",
                        fontSize: 22,
                        fontWeight: 700,
                        marginTop: 12,
                        marginBottom: 2,
                        textShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}>
                        {backendUser.name} {backendUser.lastName}
                    </h2>
                    {backendUser.username && (
                        <span className="select-none" style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: 15,
                            fontWeight: 500,
                        }}>
                            {backendUser.username}
                        </span>
                    )}
                </motion.div>

                {/* QR Code Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
                    style={{
                        background: "#ffffff",
                        borderRadius: 20,
                        padding: 16,
                        position: "relative",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    }}
                >
                    <QRCode
                        value={profileUrl}
                        size={180}
                        bgColor="#ffffff"
                        fgColor={selectedTheme.qrColor}
                        level="Q"
                        style={{ display: "block" }}
                    />
                    {/* Linkly logo overlay */}
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "#fff",
                        borderRadius: "50%",
                        padding: 4,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    }}>
                        <LinklyLogo size={22} bg={selectedTheme.qrColor} />
                    </div>
                </motion.div>

                {/* Scan text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="select-none"
                    style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        marginTop: 16,
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                    }}
                >
                    Scan to open profile
                </motion.p>
            </div>

            {/* Bottom Action Buttons */}
            <motion.div
                className="share-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    padding: "12px 20px 20px",
                    display: "flex",
                    gap: 10,
                    position: "relative",
                    zIndex: 2,
                }}
            >
                <button
                    className="select-none"
                    onClick={handleShareOnLinkly}
                    style={{
                        flex: 1,
                        padding: "13px 16px",
                        borderRadius: 14,
                        border: "none",
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(12px)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                >
                    {copied ? <CheckIcon /> : <LinklyLogo size={16} bg="transparent" color="#fff" />}
                    {copied ? "Copied!" : "Share on Linkly"}
                </button>
                <button
                    className="select-none"
                    onClick={handleShareOthers}
                    disabled={isSharing}
                    style={{
                        flex: 1,
                        padding: "13px 16px",
                        borderRadius: 14,
                        border: "none",
                        background: "#fff",
                        color: selectedTheme.dotColors[0],
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: isSharing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        transition: "all 0.2s",
                        opacity: isSharing ? 0.8 : 1,
                    }}
                    onMouseEnter={e => {
                        if (isSharing) return;
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={e => {
                        if (isSharing) return;
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                    }}
                >
                    {isSharing ? (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderTopColor: 'transparent', animation: 'tg-spin 0.8s linear infinite' }} />
                    ) : (
                        <ShareIcon />
                    )}
                    {isSharing ? "Generating..." : "Share Others"}
                </button>
            </motion.div>
        </motion.div>
    );



    // ── Contact Picker Popup ──
    const renderContactPickerPopup = () => {
        if (!showContactPicker) return null;
        return createPortal(
            <div
                className="fixed inset-0 z-[10000] flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => { setShowContactPicker(false); setSelectedContacts([]); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onClick={e => e.stopPropagation()}
                    className="relative w-[360px] max-w-[90vw] mx-4"
                    style={{
                        background: "#fff",
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
                        maxHeight: "75vh",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: "16px 20px 12px",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}>
                        <button
                            onClick={() => { setShowContactPicker(false); setSelectedContacts([]); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <input
                            ref={contactSearchRef}
                            type="text"
                            placeholder="Send to..."
                            value={contactSearch}
                            onChange={e => setContactSearch(e.target.value)}
                            style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                fontSize: 16,
                                fontWeight: 500,
                                color: "#1a1a1a",
                                background: "transparent",
                            }}
                        />
                    </div>

                    {/* Selected chips */}
                    {selectedContacts.length > 0 && (
                        <div style={{
                            padding: "8px 16px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            borderBottom: "1px solid #f0f0f0",
                        }}>
                            {selectedContacts.map(c => (
                                <SelectedContactChip key={c._id} contact={c} onRemove={toggleContactSelection} backendUser={backendUser} />
                            ))}
                        </div>
                    )}

                    {/* Contacts List */}
                    <div className="scrollbar-telegram" style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
                        {filteredContacts.length === 0 ? (
                            <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
                                <p style={{ fontSize: 14 }}>No contacts found</p>
                            </div>
                        ) : (
                            filteredContacts.map(contact => {
                                const info = getContactDisplayInfo(contact, backendUser);
                                const isSelected = selectedContacts.some(c => c._id === contact._id);
                                const profile = info.profile;
                                return (
                                    <div
                                        key={contact._id}
                                        onClick={() => toggleContactSelection(contact)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "10px 20px",
                                            cursor: "pointer",
                                            background: isSelected ? "#f0f7ff" : "transparent",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <UserAvatar
                                            size="w-11 h-11"
                                            {...(profile?.type === 'image' && { image: profile.imageUrl })}
                                            {...(profile?.type === 'emoji' && { emoji: profile.emoji, simpleBg: profile.bgColor, emojiSize: "text-2xl" })}
                                            {...(profile?.type === 'initials' && { text: profile.initials, simpleBg: profile.bgColor })}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {info.name}
                                            </p>
                                            {info.subtitle && (
                                                <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{info.subtitle}</p>
                                            )}
                                        </div>
                                        {/* Checkbox */}
                                        <div style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: "50%",
                                            border: isSelected ? "none" : "2px solid #ccc",
                                            background: isSelected ? selectedTheme.dotColors[0] : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.15s",
                                            flexShrink: 0,
                                        }}>
                                            {isSelected && (
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Send Button */}
                    {selectedContacts.length > 0 && (
                        <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0" }}>
                            <button
                                onClick={handleSendToContacts}
                                disabled={isSendingOnLinkly}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: 14,
                                    border: "none",
                                    background: selectedTheme.gradient,
                                    color: "#fff",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    cursor: isSendingOnLinkly ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    opacity: isSendingOnLinkly ? 0.7 : 1,
                                    transition: "all 0.2s",
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                }}
                            >
                                {isSendingOnLinkly ? (
                                    <>
                                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'tg-spin 0.8s linear infinite' }} />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                        </svg>
                                        Send to {selectedContacts.length} {selectedContacts.length === 1 ? "chat" : "chats"}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>,
            document.body
        );
    };

    const mainPortal = createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
                backgroundColor: isVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
                backdropFilter: isVisible ? "blur(6px)" : "blur(0px)",
                opacity: isOpen ? 1 : 0,
                pointerEvents: isVisible ? "auto" : "none",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={handleClose}
        >
            <motion.div
                className="relative w-full max-w-sm mx-4 overflow-hidden"
                style={{
                    borderRadius: 24,
                    boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
                    background: step === "share" ? "transparent" : "#fff",
                    maxHeight: "90vh",
                }}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{
                    scale: isVisible ? 1 : 0.9,
                    opacity: isVisible ? 1 : 0,
                    y: isVisible ? 0 : 20,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {step === "select" ? SelectionPage() : SharePage()}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );

    return (
        <>
            {mainPortal}
            {renderContactPickerPopup()}
        </>
    );
}
