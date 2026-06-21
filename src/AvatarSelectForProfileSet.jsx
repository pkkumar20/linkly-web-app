import React, { useRef, useState, useEffect, useCallback } from "react";
import "./App.css"
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    IconButton,
    Typography,
    Button,
} from "@material-tailwind/react";
import { TbCameraPlus } from "react-icons/tb";
import { Cropper } from "react-cropper";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { FaRegSmile } from "react-icons/fa";
import { MdPhotoCameraBack } from "react-icons/md";
import "cropperjs/dist/cropper.css";
import Picker from "emoji-picker-react";

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

export default function AvatarForProfileSet({
    disabled,
    onEmojiSelect,
    onFileSelect,
    isprofile,
    profileLink,
    profileText,
    profileBg = "#3b82f6"
}) {
    const cropperRef = useRef(null);
    const fileInputRef = useRef(null);
    const colorScrollRef = useRef(null); // ✅ Renamed for clarity
    const [image, setImage] = useState(null);
    const [avatar, setAvatar] = useState();
    const [avatarType, setAvatarType] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [optionDialogOpen, setOptionDialogOpen] = useState(false);
    const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState(null);
    const [emojiBgColor, setEmojiBgColor] = useState(profileBg);
    const [randomColor, setRandomColor] = useState(() =>
        COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]
    );
    const [emojiPrBgColor, setEmojiPrBgColor] = useState();

    // ✅ Initialize random color
    useEffect(() => {
        if (!emojiPrBgColor) {
            setEmojiPrBgColor(randomColor);
            setEmojiBgColor(randomColor);
        }
    }, [randomColor]);

    // ✅ FIXED SCROLL WHEEL - DEPENDENCY ARRAY FIXED
    // ✅ FIXED SCROLL - Attaches AFTER dialog opens
    useEffect(() => {
        const handleScrollAttach = () => {
            const el = colorScrollRef.current;
            if (!el) return;

            const handleWheel = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ✅ CRITICAL: Stop dialog interference
                el.scrollLeft += e.deltaY * 2; // Faster scroll
            };

            el.addEventListener('wheel', handleWheel, { passive: false });

            return () => {
                el.removeEventListener('wheel', handleWheel);
            };
        };

        // ✅ Attach when dialog opens
        if (emojiDialogOpen) {
            const timeoutId = setTimeout(handleScrollAttach, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [emojiDialogOpen]); // ✅ Trigger on dialog state change
 // ✅ Empty deps - runs once

    // Profile link effect
    useEffect(() => {
        if (profileLink && profileLink !== "undefined") {
            setAvatar(profileLink);
            setAvatarType("image");
        }
    }, [profileLink]);

    const openFileInput = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setImage(url);
        setAvatarType("image");
        setTimeout(() => setDialogOpen(true), 100);
    };

    const handleCrop = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;
        cropper.getCroppedCanvas().toBlob((blob) => {
            const croppedUrl = URL.createObjectURL(blob);
            setAvatar(croppedUrl);
            setAvatarType("image");
            setDialogOpen(false);
            onFileSelect?.(new File([blob], "avatar.png", { type: "image/png" }));
        });
    };

    const styleCircle = () => {
        const viewBox = document.querySelector(".cropper-view-box");
        const face = document.querySelector(".cropper-face");
        if (viewBox) viewBox.style.borderRadius = "50%";
        if (face) face.style.borderRadius = "50%";
    };

    useEffect(() => {
        if (dialogOpen) setTimeout(styleCircle, 100);
    }, [dialogOpen]);

    const handleAvatarAreaClick = () => {
        if (!disabled) setOptionDialogOpen(true);
    };

    const handleUseImage = () => {
        setOptionDialogOpen(false);
        setTimeout(openFileInput, 200);
    };

    const handleUseEmoji = () => {
        setOptionDialogOpen(false);
        setTimeout(() => setEmojiDialogOpen(true), 200);
    };

    const handleEmojiClick = useCallback((emojiObject) => {
        setSelectedEmoji(emojiObject.emoji);
    }, []);

    const handleConfirmEmoji = () => {
        const emojiToUse = selectedEmoji || "😊";
        if (emojiToUse && emojiPrBgColor) {
            setAvatar(emojiToUse);
            setAvatarType("emoji");
            setEmojiBgColor(emojiPrBgColor); // ✅ Updates avatar background
            setEmojiDialogOpen(false);
            onEmojiSelect?.({ emoji: emojiToUse, color: emojiPrBgColor });
        }
    };

    const renderAvatar = () => {
        if (avatar && avatarType === "image") {
            return <img src={avatar} alt="avatar" className={`${isprofile ? "w-32 h-32" : "w-28 h-28"} rounded-full object-cover`} />;
        }
        if (avatar && avatarType === "emoji") {
            return (
                <div
                    className={`select-none flex items-center justify-center rounded-full ${isprofile ? "w-32 h-32" : "w-28 h-28"}`}
                    style={{
                        backgroundColor: emojiBgColor,
                        fontSize: isprofile ? "4rem" : "3rem",
                        userSelect: "none",
                    }}
                >
                    {avatar}
                </div>
            );
        }
        if ((!avatar || avatar === "undefined") && profileText) {
            return (
                <Typography className="absolute inset-0 flex items-center justify-center text-blue-gray-100 text-6xl pointer-events-none">
                    {profileText}
                </Typography>
            );
        }
        return null;
    };

    return (
        <>
            {/* Avatar Display */}
            <div
                className={`select-none ${isprofile ? "w-fit mt-6" : "w-28 h-28"} relative rounded-full mx-auto cursor-pointer hover:opacity-90 transition-opacity`}
                style={{ backgroundColor: avatarType === "emoji" ? emojiBgColor : profileBg }}
                onClick={handleAvatarAreaClick}
            >
                {renderAvatar()}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 group-hover:bg-black/30 transition-all z-20">
                    <TbCameraPlus className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
            </div>

            {/* Option Dialog */}
            <Dialog open={optionDialogOpen} handler={setOptionDialogOpen} size="sm">
                <DialogHeader className="flex justify-between items-center px-4 py-2">
                    <span className="text-gray-800 text-base font-medium">Set Avatar</span>
                    <XMarkIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => setOptionDialogOpen(false)} />
                </DialogHeader>
                <DialogBody className="p-4 space-y-3">
                    <Button className="w-full flex items-center gap-2 normal-case" color="blue" variant="outlined" onClick={handleUseImage}>
                        <MdPhotoCameraBack className="w-5 h-5" /> Use Photo
                    </Button>
                    <Button className="w-full flex items-center gap-2 normal-case" color="amber" variant="outlined" onClick={handleUseEmoji}>
                        <FaRegSmile className="w-5 h-5" /> Use Emoji
                    </Button>
                </DialogBody>
            </Dialog>

            {/* Cropper Dialog */}
            <Dialog open={dialogOpen} handler={setDialogOpen} size="lg" className="max-w-md">
                <DialogHeader className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 text-sm font-medium">Adjust Avatar</span>
                    <XMarkIcon className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => setDialogOpen(false)} />
                </DialogHeader>
                <DialogBody className="p-4">
                    {image && (
                        <div className="w-full h-64">
                            <Cropper
                                ref={cropperRef}
                                src={image}
                                style={{ height: "100%", width: "100%" }}
                                aspectRatio={1}
                                viewMode={1}
                                guides={false}
                                background={false}
                                dragMode="none"
                                zoomable={true}
                                cropBoxMovable={true}
                                cropBoxResizable={false}
                                ready={styleCircle}
                                autoCropArea={0.9}
                            />
                        </div>
                    )}
                </DialogBody>
                <DialogFooter className="p-4">
                    <Button color="blue" className="w-full" onClick={handleCrop}>
                        <CheckIcon className="w-5 h-5 inline mr-2" /> Use Photo
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* ✅ EMOJI DIALOG - SCROLL WORKS PERFECTLY */}
            <Dialog open={emojiDialogOpen} handler={setEmojiDialogOpen} size="sm" className="max-w-sm">
                <DialogHeader className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 text-base font-semibold">Choose Emoji</span>
                    <XMarkIcon
                        className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                        onClick={() => {
                            setEmojiDialogOpen(false);
                            setSelectedEmoji(null);
                        }}
                    />
                </DialogHeader>

                <DialogBody className="p-4 space-y-4">
                    {/* Preview */}
                    <div className="flex flex-col items-center space-y-3">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg ring-2 ring-gray-200"
                            style={{ backgroundColor: emojiPrBgColor }}
                        >
                            <span className="text-4xl select-none" style={{ fontSize: '3rem' }}>
                                {selectedEmoji || "😊"}
                            </span>
                        </div>

                        {/* ✅ SCROLL 100% FIXED */}
                        <div className="w-full bg-gray-50 p-4 rounded-xl shadow-sm border">
                            <div
                                ref={colorScrollRef}
                                className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                                style={{
                                    scrollbarWidth: 'none !important',
                                    msOverflowStyle: 'none !important',
                                    WebkitOverflowScrolling: 'touch',
                                    overscrollBehaviorX: 'contain',
                                    touchAction: 'pan-x'
                                }}
                            >
                                {COLOR_OPTIONS.map((color, index) => {
                                    const isSelected = emojiPrBgColor === color;

                                    return (
                                        <button
                                            key={`${color}-${index}`}
                                            onClick={() => setEmojiPrBgColor(color)}
                                            className={`
                mt-2 flex-shrink-0 p-1 rounded-full transition-all duration-300 ease-out
                hover:scale-125 hover:shadow-2xl active:scale-105 active:shadow-lg
                focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60
            `}
                                            style={{
                                                backgroundColor: color,
                                                width: 35,
                                                height: 35,
                                                border: isSelected
                                                    ? `4px solid rgba(255,255,255,0.95)`
                                                    : "2px solid transparent",
                                                boxShadow: isSelected
                                                    ? `
                        0 8px 25px ${color}30, 
                        0 0 0 6px ${color}50,
                        inset 0 2px 4px rgba(255,255,255,0.4)
                    `
                                                    : `
                        0 4px 12px rgba(0,0,0,0.15),
                        inset 0 1px 2px rgba(255,255,255,0.2)
                    `,
                                                cursor: "pointer",
                                                position: "relative",
                                                transform: isSelected ? "scale(1.1)" : "scale(1)"
                                            }}
                                            tabIndex={-1}
                                            role="button"
                                            aria-label={`Background color ${color}`}
                                        >
                                            {/* ✅ GLOW EFFECT - Uses SELECTED COLOR */}
                                            {isSelected && (
                                                <div
                                                    className="absolute inset-0 rounded-full animate-ping [animation-duration:1.5s]"
                                                    style={{
                                                        boxShadow: `0 0 25px ${color}70, 0 0 40px ${color}40`,
                                                        opacity: 0.8
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}


                            </div>
                        </div>
                    </div>

                    <div className="w-full h-64 rounded-xl overflow-hidden shadow-inner border">
                        <Picker
                            width="100%"
                            height="100%"
                            onEmojiClick={handleEmojiClick}
                            skinTonesDisabled={true}
                            lazyLoadEmojis={true}
                            previewConfig={{ showPreview: false }}
                        />
                    </div>

                    <Button
                        color="blue"
                        className="w-full font-semibold shadow-lg hover:shadow-xl"
                        onClick={handleConfirmEmoji}
                        disabled={!emojiPrBgColor || disabled}
                    >
                        <CheckIcon className="w-5 h-5 inline mr-2" />
                        Use This Emoji
                    </Button>
                </DialogBody>
            </Dialog>

        </>
    );
}
