import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
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
    { id: "blue", name: "Ocean", gradient: "linear-gradient(135deg, #4EA4F6 0%, #6C5CE7 100%)", qrColor: "#4A6CF7", dotColors: ["#4EA4F6", "#6C5CE7"] },
    { id: "sunset", name: "Sunset", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)", qrColor: "#E85D5D", dotColors: ["#FF6B6B", "#FFB347"] },
    { id: "emerald", name: "Emerald", gradient: "linear-gradient(135deg, #00B894 0%, #55E6C1 100%)", qrColor: "#00A884", dotColors: ["#00B894", "#55E6C1"] },
    { id: "violet", name: "Violet", gradient: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)", qrColor: "#9333EA", dotColors: ["#A855F7", "#EC4899"] },
    { id: "midnight", name: "Midnight", gradient: "linear-gradient(135deg, #1e1e2e 0%, #3b3b5c 100%)", qrColor: "#4a4a7a", dotColors: ["#1e1e2e", "#3b3b5c"] },
    { id: "rose", name: "Rose", gradient: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)", qrColor: "#E45A9E", dotColors: ["#F472B6", "#FB7185"] },
    { id: "sky", name: "Sky", gradient: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)", qrColor: "#3B82F6", dotColors: ["#38BDF8", "#818CF8"] },
    { id: "amber", name: "Amber", gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)", qrColor: "#D97706", dotColors: ["#F59E0B", "#EF4444"] },
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
    { id: "slate", name: "Slate", gradient: "linear-gradient(135deg, #475569 0%, #64748B 100%)", qrColor: "#3D4A5C", dotColors: ["#3D4A5C", "#64748B"] },
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

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const LoaderIcon = () => (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CopyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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

export default function GroupAndChannelQRCodeModal({ isOpen, onClose, chat }) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
    const [step, setStep] = useState("select"); // "select" | "share"
    const [copiedImage, setCopiedImage] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const qrCardRef = useRef(null);
    const themeScrollRef = useRef(null);

    const isQrPushedRef = useRef(false);
    const isSharePushedRef = useRef(false);

    // Main Modal History Management (Standard Linkly Pattern)
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            if (!isQrPushedRef.current) {
                isQrPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState(
                    { ...window.history.state, groupQrModalOpen: true, modalDepth: currentDepth + 1 },
                    '',
                    window.location.pathname + window.location.hash
                );
            }
        } else {
            if (isQrPushedRef.current) {
                isQrPushedRef.current = false;
                if (window.history.state?.groupQrModalOpen) {
                    window.history.back();
                }
            }
            setIsVisible(false);
            setStep("select");
            setCopiedImage(false);
        }
    }, [isOpen]);

    // Sub-Screen History Management (Share Screen)
    useEffect(() => {
        if (step === "share") {
            if (!isSharePushedRef.current) {
                isSharePushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState(
                    { ...window.history.state, groupQrShareSubScreen: true, modalDepth: currentDepth + 1 },
                    '',
                    window.location.pathname + window.location.hash
                );
            }
        } else {
            if (isSharePushedRef.current) {
                isSharePushedRef.current = false;
                if (window.history.state?.groupQrShareSubScreen) {
                    window.history.back();
                }
            }
        }
    }, [step]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        if (isSharePushedRef.current && window.history.state?.groupQrShareSubScreen) {
            isSharePushedRef.current = false;
            window.history.back();
        }
        if (isQrPushedRef.current && window.history.state?.groupQrModalOpen) {
            isQrPushedRef.current = false;
            window.history.back();
        }
        setTimeout(onClose, 200);
    }, [onClose]);

    // Listen to browser/mobile back button (popstate)
    useEffect(() => {
        const handlePopState = (e) => {
            if (step === "share" && !e.state?.groupQrShareSubScreen) {
                isSharePushedRef.current = false;
                setStep("select");
                return;
            }
            if (isOpen && !e.state?.groupQrModalOpen) {
                isQrPushedRef.current = false;
                isSharePushedRef.current = false;
                setIsVisible(false);
                setTimeout(onClose, 200);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, step, onClose]);

    const inviteUrl = `${window.location.origin}/+${chat?._id}`;

    if (!isOpen && !isVisible) return null;
    if (!chat) return null;

    const generateQRImage = async () => {
        if (!qrCardRef.current) return null;
        try {
            const canvas = await html2canvas(qrCardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                ignoreElements: (element) => element.tagName === 'CANVAS',
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

    const handleCopyImageToClipboard = async () => {
        setIsCopying(true);
        // Let the browser render the spinner
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            const blob = await generateQRImage();
            if (!blob) return;
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                setCopiedImage(true);
                toast.dismissAll();
                toast.success("Image copied to clipboard");
                setTimeout(() => setCopiedImage(false), 2000);
            } else {
                toast.error("Image copy not supported in browser");
            }
        } catch (err) {
            console.error("Failed to copy image:", err);
            toast.error("Failed to copy image");
        } finally {
            setIsCopying(false);
        }
    };

    const textToImage = (text, bgColor, isEmoji = false) => {
        const px = 160;
        const canvas = document.createElement("canvas");
        canvas.width = px;
        canvas.height = px;
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
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

    const renderAvatarLarge = () => {
        const profile = chat.details?.profile || chat.profile;
        const size = "80px";
        const baseStyle = {
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            overflow: "hidden",
            userSelect: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "block",
        };
        if (profile?.type === "image") {
            return <img src={profile.imageUrl} alt="avatar" style={baseStyle} />;
        }
        if (profile?.type === "emoji") {
            const src = textToImage(profile.emoji, profile.bgColor || "#4f8ef7", true);
            return <img src={src} alt="avatar" style={baseStyle} />;
        }
        const initial = chat.name?.charAt(0).toUpperCase() || "C";
        const src = textToImage(initial, profile?.bgColor || "#4f8ef7", false);
        return <img src={src} alt="avatar" style={baseStyle} />;
    };

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

                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                        {renderAvatarLarge()}

                        <h3 style={{
                            color: "#fff",
                            fontSize: 18,
                            fontWeight: 700,
                            marginTop: 12,
                            marginBottom: 2,
                            textShadow: "0 1px 4px rgba(0,0,0,0.15)",
                            textAlign: "center",
                        }}>
                            {chat.name}
                        </h3>

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
                                value={inviteUrl}
                                size={120}
                                bgColor="#ffffff"
                                fgColor={selectedTheme.qrColor}
                                level="Q"
                                style={{ display: "block" }}
                            />
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
                }}>Share QR</span>
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
                        {chat.name}
                    </h2>
                </motion.div>

                {/* QR Code Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    style={{
                        background: "#fff",
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                        position: "relative",
                    }}
                >
                    <QRCode
                        value={inviteUrl}
                        size={160}
                        bgColor="#ffffff"
                        fgColor={selectedTheme.qrColor}
                        level="Q"
                        style={{ display: "block" }}
                    />
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "#fff",
                        borderRadius: "50%",
                        padding: 4,
                    }}>
                        <LinklyLogo size={22} bg={selectedTheme.qrColor} />
                    </div>
                </motion.div>
            </div>

            {/* Bottom Actions - ONLY Copy to Clipboard */}
            <div className="share-footer" style={{
                padding: "0 24px 24px",
                position: "relative",
                zIndex: 2,
            }}>
                <motion.button
                    onClick={handleCopyImageToClipboard}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        width: "100%",
                        padding: "14px 20px",
                        borderRadius: 16,
                        background: copiedImage ? "#ffffff" : "rgba(255,255,255,0.95)",
                        color: copiedImage ? "#059669" : "#1f2937",
                        border: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        transition: "all 0.2s",
                    }}
                >
                    {isCopying ? <LoaderIcon /> : copiedImage ? <CheckIcon /> : <CopyIcon />}
                    <span>{isCopying ? "Copying..." : copiedImage ? "Copied to Clipboard!" : "Copy to Clipboard"}</span>
                </motion.button>
            </div>
        </motion.div>
    );

    const mainPortal = createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
                backgroundColor: isVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
                backdropFilter: isVisible ? "blur(6px)" : "blur(0px)",
                opacity: isOpen ? 1 : 0,
                pointerEvents: isVisible ? "auto" : "none",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
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
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {step === "select" ? SelectionPage() : SharePage()}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );

    return mainPortal;
}
