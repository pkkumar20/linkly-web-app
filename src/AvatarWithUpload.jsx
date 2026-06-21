import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { TbCameraPlus } from "react-icons/tb";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import Picker from "emoji-picker-react";

// ── Color palette ────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
    "#ff9a9e", "#1d8fe1", "#625eb1", "#7918f2", "#4801ff", "#44107a", "#ff1361", "#43e97b", "#38f9d7", "#7b54c9",
    "#2af598", "#009efd", "#c471f5", "#fa71cd", "#00c6fb", "#005bea", "#6e45e2", "#7028e4", "#ff0844", "#92fe9d",
    "#00c9ff", "#b721ff", "#21d4fd", "#5f72bd", "#9b23ea", "#f83600", "#f9d423", "#ff5858", "#f09819", "#4481eb",
    "#04befe", "#ff6b6b", "#ee5a24", "#f0932b", "#f9ca24", "#e84393", "#fd79a8", "#b71540", "#6f1e51", "#ff4d6d",
    "#ff758f", "#ff8fa3", "#ffb3c1", "#e63946", "#d90429", "#ef233c", "#f72585", "#b5179e", "#7209b7", "#560bad",
    "#480ca8", "#3f0712", "#9d0208", "#dc2f02", "#e85d04", "#f48c06", "#faa307", "#ffb703", "#ffc300", "#f67280",
    "#c06c84", "#f8b195", "#ff5252", "#ff7675", "#d63031", "#e84118", "#c23616", "#f39c12", "#e67e22", "#d35400",
    "#ff9f43", "#f0d500", "#ffd32a", "#ffc048", "#ffdd59", "#ffeaa7", "#fdcb6e", "#e17055", "#fab1a0", "#ff793f",
    "#ffb142", "#e15f41", "#f19066", "#f5cd79", "#f7d794", "#f8a5c2", "#f78fb3", "#e77f67", "#6ab04c", "#badc58",
    "#22a6b3", "#7ed6df", "#55efc4", "#00b894", "#81ecec", "#00cec9", "#2ecc71", "#27ae60", "#26de81", "#2bcbba",
    "#1dd1a1", "#10ac84", "#05c46b", "#0be881", "#32ff7e", "#7bed9f", "#a8e6cf", "#dcedc1", "#52b788", "#74c69d",
    "#95d5b2", "#b7e4c7", "#d8f3dc", "#1b4332", "#2d6a4f", "#40916c", "#218c74", "#33d9b2", "#20bf6b", "#30336b",
    "#4834d4", "#0984e3", "#74b9ff", "#3498db", "#2980b9", "#1e3799", "#0c2461", "#0a3d62", "#3c6382", "#60a3bc",
    "#82ccdd", "#079992", "#38ada9", "#4a69bd", "#1e90ff", "#70a1ff", "#54a0ff", "#00d2d3", "#028090", "#0077b6",
    "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8", "#45b6fe", "#37a0ea", "#227093", "#2e86de",
    "#48dbfb", "#0abde3", "#57606f", "#6c5ce7", "#a29bfe", "#8c7ae6", "#4a0e4e", "#7f1d1d", "#311042", "#c084fc",
    "#d8b4fe", "#f3e8ff", "#e9d5ff", "#833ab4", "#8e44ad", "#9b59b6", "#a55eea", "#9c27b0", "#ab47bc", "#ba68c8",
    "#d32f2f", "#7b1fa2", "#5e35b1", "#3949ab", "#1e88e5", "#00acc1", "#00897b", "#43a047", "#7cb342", "#c0ca33",
    "#fdd835", "#ffb300", "#fb8c00", "#f4511e", "#6d4c41", "#757575", "#546e7a", "#485563", "#29323c", "#1e272e",
    "#2f3542", "#111111", "#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1", "#1abc9c", "#16a085",
    "#d1ccc0", "#f7f1e3", "#341f97", "#2c2c54", "#474787", "#aaa69d", "#d1d8e0", "#a5b1c2", "#778ca3", "#4b6584",
    "#2f3640", "#353b48", "#718093", "#7f8fa6"
];

// ── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = "avatar-editor-styles-v4";
if (typeof document !== "undefined") {
    let s = document.getElementById(STYLE_ID);
    if (!s) {
        s = document.createElement("style");
        s.id = STYLE_ID;
        document.head.appendChild(s);
    }
    s.textContent = `
        @keyframes ae-fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes ae-slide-up { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ae-scale-in { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:scale(1) } }
        @keyframes ae-spin { to { transform:rotate(360deg) } }

        .avatar-editor-overlay {
            position:fixed; inset:0; z-index:9999;
            background:rgba(255,255,255,0.55);
            backdrop-filter:blur(32px) saturate(1.4); -webkit-backdrop-filter:blur(32px) saturate(1.4);
            display:flex; flex-direction:column;
            animation: ae-fade-in 0.25s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .avatar-editor-overlay.closing {
            opacity:0; transition: opacity 0.22s ease;
        }

        /* Header */
        .ae-header {
            display:flex; align-items:center; justify-content:space-between;
            padding:14px 20px; flex-shrink:0;
        }
        .ae-header-title { color:#1a1a1a; font-size:18px; font-weight:700; letter-spacing:-0.3px; }
        .ae-close-btn {
            width:40px; height:40px; border-radius:50%; border:none;
            background:rgba(0,0,0,0.05); color:#444;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            transition:background 0.18s;
        }
        .ae-close-btn:hover { background:rgba(0,0,0,0.1); }

        /* Tab strip */
        .ae-tabs {
            display:flex; gap:0; padding:0 20px; flex-shrink:0;
            border-bottom:1px solid rgba(0,0,0,0.06);
        }
        .ae-tab {
            flex:1; padding:12px 0; border:none; background:none;
            color:rgba(0,0,0,0.35); font-size:14px; font-weight:600;
            cursor:pointer; position:relative; transition:color 0.2s;
            text-transform:uppercase; letter-spacing:0.5px;
        }
        .ae-tab.active { color:#4f8ef7; }
        .ae-tab::after {
            content:''; position:absolute; bottom:-1px; left:20%; right:20%;
            height:3px; border-radius:3px; background:#4f8ef7;
            transform:scaleX(0); transition:transform 0.25s ease;
        }
        .ae-tab.active::after { transform:scaleX(1); }

        /* Content area */
        .ae-content { flex:1; overflow:hidden; display:flex; flex-direction:column; min-height:0; }

        /* Cropper panel */
        .ae-crop-panel {
            flex:1; display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            padding:20px; gap:20px;
            animation:ae-scale-in 0.3s ease;
        }
        .ae-crop-panel .cropper-view-box,
        .ae-crop-panel .cropper-face { border-radius:50% !important; }
        .ae-crop-panel .cropper-container { border-radius:16px; overflow:hidden; }
        .ae-crop-panel .cropper-modal { background:rgba(255,255,255,0.6) !important; }

        /* Upload prompt */
        .ae-upload-prompt {
            flex:1; display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:16px;
            cursor:pointer; padding:40px;
            animation:ae-slide-up 0.4s ease;
        }
        .ae-upload-icon {
            width:130px; height:130px; border-radius:50%;
            background:rgba(79,142,247,0.08); border:2.5px dashed rgba(79,142,247,0.3);
            display:flex; align-items:center; justify-content:center;
            transition:all 0.25s ease;
        }
        .ae-upload-prompt:hover .ae-upload-icon {
            background:rgba(79,142,247,0.14); border-color:rgba(79,142,247,0.55);
            transform:scale(1.06);
        }
        .ae-upload-text { color:rgba(0,0,0,0.55); font-size:16px; font-weight:500; }
        .ae-upload-sub { color:rgba(0,0,0,0.28); font-size:13px; }

        /* Emoji panel */
        .ae-emoji-panel {
            flex:1; display:flex; flex-direction:column;
            padding:0; min-height:0;
            animation:ae-slide-up 0.35s ease;
        }
        .ae-emoji-preview {
            display:flex; flex-direction:column; align-items:center;
            padding:24px 20px 16px; gap:14px; flex-shrink:0;
        }
        .ae-emoji-circle {
            width:100px; height:100px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:3.2rem; user-select:none;
            box-shadow:0 8px 32px rgba(0,0,0,0.12);
            transition:background-color 0.35s ease, transform 0.2s ease;
        }
        .ae-emoji-circle:hover { transform:scale(1.05); }

        /* Color bar */
        .ae-color-bar {
            display:flex; gap:12px; padding:12px 20px 20px;
            overflow-x:auto; flex-shrink:0; align-items: center;
            scrollbar-width:none;
            -ms-overflow-style:none;
            -webkit-overflow-scrolling:touch;
        }
        .ae-color-bar::-webkit-scrollbar { display:none; }
        .ae-color-dot {
     
            width:32px; height:32px; min-width:32px;
            border-radius:50%; border:1px solid rgba(0,0,0,0.1); cursor:pointer;
            transition:all 0.2s ease; position:relative;
            margin: 6px 0;
        }
        .ae-color-dot:hover { transform:scale(1.15); }
        .ae-color-dot.selected {
            transform:scale(1.15);
            outline: 3px solid #4f8ef7;
            outline-offset: 2px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        /* Emoji picker wrapper */
        .ae-picker-wrap {
            flex:1; min-height:0; overflow:hidden;
            padding:0 12px 12px;
        }
        .ae-picker-wrap .EmojiPickerReact {
            --epr-bg-color:transparent !important;
            --epr-category-label-bg-color:rgba(255,255,255,0.92) !important;
            --epr-hover-bg-color:rgba(0,0,0,0.05) !important;
            --epr-text-color:rgba(0,0,0,0.75) !important;
            --epr-search-input-bg-color:rgba(0,0,0,0.04) !important;
            --epr-search-input-text-color:#333 !important;
            --epr-search-input-placeholder-color:rgba(0,0,0,0.3) !important;
            --epr-category-icon-active-color:#4f8ef7 !important;
            --epr-indicator-color:#4f8ef7 !important;
            --epr-search-border-color:rgba(0,0,0,0.08) !important;
            border:none !important; box-shadow:none !important;
        }

        /* Confirm FAB */
        .ae-confirm-fab {
            position:absolute; bottom:28px; right:28px; z-index:10;
            width:56px; height:56px; border-radius:50%; border:none;
            background:linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%);
            color:#fff; cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 6px 24px rgba(79,142,247,0.35);
            transition:all 0.2s ease;
            animation:ae-scale-in 0.3s ease;
        }
        .ae-confirm-fab:hover {
            transform:scale(1.08);
            box-shadow:0 8px 32px rgba(79,142,247,0.5);
        }
        .ae-confirm-fab:active { transform:scale(0.95); }
        .ae-confirm-fab:disabled {
            opacity:0.7; cursor:not-allowed;
            transform:none !important;
        }
        .ae-confirm-fab svg { width:26px; height:26px; }

        /* Spinner */
        .ae-spinner {
            width:24px; height:24px;
            border:3px solid rgba(255,255,255,0.25);
            border-top-color:#fff;
            border-radius:50%;
            animation:ae-spin 0.65s linear infinite;
        }

        /* Choose another button */
        .ae-change-btn {
            padding:10px 24px; border-radius:24px;
            border:1px solid rgba(0,0,0,0.1);
            background:rgba(0,0,0,0.04); color:rgba(0,0,0,0.6);
            cursor:pointer; font-size:14px; font-weight:500;
            transition:all 0.18s;
        }
        .ae-change-btn:hover { background:rgba(0,0,0,0.08); }
    `;
    document.head.appendChild(s);
}

// ── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const CheckIcon2 = () => (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="rgba(79,142,247,0.6)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

// ════════════════════════════════════════════════════════════════════════════════
// Full-page editor overlay (portalled)
// ════════════════════════════════════════════════════════════════════════════════
function AvatarEditorFullPage({
    onClose,
    onImageConfirm,
    onEmojiConfirm,
    initialEmoji,
    initialBgColor,
    disabled,
}) {
    const [activeTab, setActiveTab] = useState("photo"); // photo | emoji
    const [phase, setPhase] = useState("mounting"); // mounting → open → closing
    const [cropImage, setCropImage] = useState(null);
    const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji || null);
    const [emojiBgColor, setEmojiBgColor] = useState(initialBgColor || COLOR_OPTIONS[0]);
    const [isCropping, setIsCropping] = useState(false); // spinner state for FAB

    const cropperRef = useRef(null);
    const fileInputRef = useRef(null);
    const colorBarRef = useRef(null);

    // Open animation
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPhase("open"));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Close handler
    const triggerCloseRef = useRef(null);
    const triggerClose = useCallback(() => {
        if (phase === "closing") return;
        setPhase("closing");
        setTimeout(onClose, 230);
    }, [phase, onClose]);
    triggerCloseRef.current = triggerClose;

    // Keyboard
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape" && !isCropping) triggerClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [triggerClose, isCropping]);

    // Color bar horizontal scroll
    useEffect(() => {
        const el = colorBarRef.current;
        if (!el) return;
        const handler = (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                e.stopPropagation();
                el.scrollLeft += e.deltaY * 2;
            }
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, [activeTab]);

    // Style cropper circle
    const styleCircle = useCallback(() => {
        const viewBox = document.querySelector(".ae-crop-panel .cropper-view-box");
        const face = document.querySelector(".ae-crop-panel .cropper-face");
        if (viewBox) viewBox.style.borderRadius = "50%";
        if (face) face.style.borderRadius = "50%";
    }, []);

    useEffect(() => {
        if (cropImage) setTimeout(styleCircle, 150);
    }, [cropImage, styleCircle]);

    // File handling
    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCropImage(URL.createObjectURL(file));
    };

    // Confirm crop — with spinner
    const handleCropConfirm = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper || isCropping) return;
        setIsCropping(true);
        cropper.getCroppedCanvas().toBlob((blob) => {
            const croppedUrl = URL.createObjectURL(blob);
            const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
            onImageConfirm(croppedUrl, croppedFile);
            triggerClose();
        });
    };

    // Confirm emoji
    const handleEmojiConfirm = () => {
        const finalEmoji = selectedEmoji || "😊";
        onEmojiConfirm(finalEmoji, emojiBgColor);
        triggerClose();
    };

    const handleEmojiClick = useCallback((emojiData) => {
        setSelectedEmoji(emojiData.emoji);
    }, []);

    const isOpen = phase === "open";
    const isClosing = phase === "closing";

    return createPortal(
        <div
            className={`avatar-editor-overlay ${isClosing ? "closing" : ""}`}
            style={{ opacity: isOpen ? 1 : isClosing ? 0 : 0 }}
        >
            {/* Header */}
            <div className="ae-header">
                <span className="ae-header-title">
                    {activeTab === "photo" && cropImage ? "Adjust Photo" : activeTab === "photo" ? "Choose Photo" : "Choose Emoji"}
                </span>
                <button className="ae-close-btn" onClick={triggerClose} disabled={isCropping}>
                    <CloseIcon />
                </button>
            </div>

            {/* Tab strip */}
            <div className="ae-tabs">
                <button className={`ae-tab ${activeTab === "photo" ? "active" : ""}`} onClick={() => !isCropping && setActiveTab("photo")}>
                    Photo
                </button>
                <button className={`ae-tab ${activeTab === "emoji" ? "active" : ""}`} onClick={() => !isCropping && setActiveTab("emoji")}>
                    Emoji
                </button>
            </div>

            {/* Content */}
            <div className="ae-content" style={{ position: "relative" }}>

                {/* ── PHOTO TAB ──────────────────────────── */}
                {activeTab === "photo" && (
                    <>
                        {!cropImage ? (
                            <div className="ae-upload-prompt" onClick={openFilePicker}>
                                <div className="ae-upload-icon">
                                    <CameraIcon />
                                </div>
                                <span className="ae-upload-text">Tap to choose a photo</span>
                                <span className="ae-upload-sub">JPG, PNG or WebP</span>
                            </div>
                        ) : (
                            <div className="ae-crop-panel">
                                <div style={{ width: "100%", maxWidth: 400, height: "min(60vh, 400px)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                                    <Cropper
                                        ref={cropperRef}
                                        src={cropImage}
                                        style={{ height: "100%", width: "100%" }}
                                        aspectRatio={1}
                                        viewMode={1}
                                        guides={false}
                                        background={false}
                                        dragMode="move"
                                        zoomable={true}
                                        cropBoxMovable={true}
                                        cropBoxResizable={false}
                                        ready={styleCircle}
                                        autoCropArea={0.88}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button
                                        className="ae-change-btn"
                                        onClick={() => !isCropping && setCropImage(null)}
                                        disabled={isCropping}
                                    >
                                        Choose Another
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm FAB for crop — shows spinner while processing */}
                        {cropImage && (
                            <button
                                className="ae-confirm-fab"
                                onClick={handleCropConfirm}
                                disabled={disabled || isCropping}
                                title="Confirm"
                            >
                                {isCropping ? <div className="ae-spinner" /> : <CheckIcon2 />}
                            </button>
                        )}
                    </>
                )}

                {/* ── EMOJI TAB ──────────────────────────── */}
                {activeTab === "emoji" && (
                    <>
                        <div className="ae-emoji-panel">
                            {/* Preview */}
                            <div className="ae-emoji-preview">
                                <div
                                    className="ae-emoji-circle"
                                    style={{ backgroundColor: emojiBgColor }}
                                >
                                    {selectedEmoji || "😊"}
                                </div>
                            </div>

                            {/* Color bar */}
                            <div className="ae-color-bar" ref={colorBarRef}>
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color}
                                        className={`ae-color-dot ${emojiBgColor === color ? "selected" : ""}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setEmojiBgColor(color)}
                                    />
                                ))}
                            </div>

                            {/* Picker */}
                            <div className="ae-picker-wrap">
                                <Picker
                                    width="100%"
                                    height="100%"
                                    onEmojiClick={handleEmojiClick}
                                    skinTonesDisabled={true}
                                    lazyLoadEmojis={true}
                                    previewConfig={{ showPreview: false }}
                                    theme="light"
                                    searchPlaceholder="Search emoji..."
                                />
                            </div>
                        </div>

                        {/* Confirm FAB */}
                        <button className="ae-confirm-fab" onClick={handleEmojiConfirm} disabled={disabled} title="Confirm Emoji">
                            <CheckIcon2 />
                        </button>
                    </>
                )}
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={disabled}
            />
        </div>,
        document.body
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// Main component (same prop interface as before)
// ════════════════════════════════════════════════════════════════════════════════
export default function AvatarWithCropCircle({
    disabled,
    profileType,
    isChanged,
    onEmojiSelect,
    onFileSelect,
    isprofile,
    profileLink,
    profileText,
    profileEmoji,
    profileBg = "#3b82f6"
}) {
    const [avatar, setAvatar] = useState();
    const [avatarType, setAvatarType] = useState(profileType);
    const [emojiBgColor, setEmojiBgColor] = useState(profileBg);
    const [editorOpen, setEditorOpen] = useState(false);

    // Sync profile link
    useEffect(() => {
        if (profileLink && profileLink !== "undefined") {
            setAvatar(profileLink);
            setAvatarType("image");
        }
    }, [profileLink]);

    // Sync emoji from props
    useEffect(() => {
        if (profileType === "emoji" && profileText) {
            setAvatar(profileText);
            setAvatarType("emoji");
            if (profileBg) setEmojiBgColor(profileBg);
        }
    }, [profileType, profileText, profileBg]);

    const handleAvatarClick = () => {
        if (!disabled) setEditorOpen(true);
    };

    const handleImageConfirm = (croppedUrl, croppedFile) => {
        setAvatar(croppedUrl);
        setAvatarType("image");
        if (typeof onFileSelect === "function") onFileSelect(croppedFile);
        if (typeof isChanged === "function") isChanged(true);
    };

    const handleEmojiConfirm = (emoji, bgColor) => {
        setAvatar(emoji);
        setAvatarType("emoji");
        setEmojiBgColor(bgColor);
        if (typeof isChanged === "function") isChanged(true);
        if (typeof onEmojiSelect === "function") onEmojiSelect({ emoji, color: bgColor });
    };

    // Render avatar content
    const renderAvatar = () => {
        if (avatar && avatarType === "image") {
            return (
                <img
                    src={avatar}
                    alt="avatar"
                    className="w-full h-full rounded-full object-cover"
                    draggable={false}
                />
            );
        }
        if (avatar && avatarType === "emoji") {
            return (
                <span
                    className="select-none pointer-events-none"
                    style={{ fontSize: isprofile ? "3.8rem" : "3.5rem", lineHeight: 1 }}
                >
                    {avatar}
                </span>
            );
        }
        if ((!avatar || avatar === "undefined") && profileText) {
            return (
                <span
                    className="select-none pointer-events-none font-semibold text-white"
                    style={{ fontSize: isprofile ? "3.5rem" : "3rem", lineHeight: 1 }}
                >
                    {profileText}
                </span>
            );
        }
        return null;
    };

    const size = isprofile ? "w-32 h-32" : "w-32 h-32";
    const bgColor = avatarType === "emoji" ? emojiBgColor : profileBg;

    return (
        <>
            {/* Avatar display */}
            <div
                className={`select-none ${size} relative rounded-full mx-auto cursor-pointer group`}
                style={{ background: bgColor }}
                onClick={handleAvatarClick}
            >
                {/* Avatar content */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden">
                    {renderAvatar()}
                </div>

                {/* Hover overlay */}
                <div
                    className="absolute inset-0 flex items-center justify-center rounded-full z-20 transition-all duration-200"
                    style={{
                        background: "rgba(0,0,0,0.25)",
                        opacity: 1,
                    }}
                >
                    <TbCameraPlus
                        className="text-white transition-transform duration-200 group-hover:scale-110"
                        style={{ width: 48, height: 48, opacity: 0.9 }}
                    />
                </div>
            </div>

            {/* Full-page editor */}
            {editorOpen && (
                <AvatarEditorFullPage
                    onClose={() => setEditorOpen(false)}
                    onImageConfirm={handleImageConfirm}
                    onEmojiConfirm={handleEmojiConfirm}
                    initialEmoji={avatarType === "emoji" ? avatar : null}
                    initialBgColor={emojiBgColor}
                    disabled={disabled}
                />
            )}
        </>
    );
}
