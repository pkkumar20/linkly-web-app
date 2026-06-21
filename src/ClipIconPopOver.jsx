import React, { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

// ── Telegram-style SVG Icons ──
const PhotoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <circle cx="8.5" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M3 16l4.293-4.293a1 1 0 011.414 0L12 15l3.293-3.293a1 1 0 011.414 0L21 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const FileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const VideoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="15" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M17 9.5l4.2-2.8a.5.5 0 01.8.4v9.8a.5.5 0 01-.8.4L17 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const LocationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

const ContactIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
);

const ClipIcon = ({ isOpen }) => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
    >
        <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

// ── Menu item config ──
const MENU_ITEMS = [
    { id: 'photo', label: 'Photo', Icon: PhotoIcon, color: '#4EA4F6' },
    { id: 'file', label: 'File', Icon: FileIcon, color: '#E97AD1' },
    { id: 'video', label: 'Video', Icon: VideoIcon, color: '#F5A623' },
    { id: 'location', label: 'Location', Icon: LocationIcon, color: '#6DC96E' },
    { id: 'contact', label: 'Contact', Icon: ContactIcon, color: '#7B8CDE' },
];

export default function ClipIconPopOver({ isReactionMenuOpen, isEmojiPickerOpen, onFileSelected, onLocationClick, onContactClick, canSendPhotos = true, canSendVideos = true, canSendFiles = true, canSendLocation = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const docInputRef = useRef(null);

    const closeMenu = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 180);
    }, []);

    const toggleMenu = () => {
        if (isReactionMenuOpen || isEmojiPickerOpen) return;
        if (isOpen) {
            closeMenu();
        } else {
            setIsClosing(false);
            setIsOpen(true);
        }
    };

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeMenu]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') closeMenu(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeMenu]);

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const MAX_SIZE_MB = 30;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);

        if (totalSize > MAX_SIZE_BYTES) {
            toast.error(`Total file size cannot exceed ${MAX_SIZE_MB}MB.`);
            e.target.value = null;
            closeMenu();
            return;
        }

        for (const file of files) {
            if (onFileSelected) onFileSelected(file, type);
        }

        e.target.value = null;
        closeMenu();
    };

    const handleItemClick = (id) => {
        switch (id) {
            case 'photo':
                imageInputRef.current?.click();
                break;
            case 'video':
                videoInputRef.current?.click();
                break;
            case 'file':
                docInputRef.current?.click();
                break;
            case 'location':
                if (onLocationClick) onLocationClick();
                closeMenu();
                break;
            case 'contact':
                if (onContactClick) onContactClick();
                closeMenu();
                break;
            default:
                break;
        }
    };

    // Filter menu items based on permissions
    const visibleItems = MENU_ITEMS.filter(item => {
        if (item.id === 'photo' && !canSendPhotos) return false;
        if (item.id === 'video' && !canSendVideos) return false;
        if (item.id === 'file' && !canSendFiles) return false;
        if (item.id === 'location' && !canSendLocation) return false;
        return true;
    });

    return (
        <div className="relative flex justify-end">
            {/* Hidden file inputs */}
            <input type="file" accept="image/*" multiple ref={imageInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
            <input type="file" accept="video/*" multiple ref={videoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
            <input type="file" accept="*" multiple ref={docInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'document')} />

            {/* Clip button */}
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className={`p-2 rounded-full cursor-pointer transition-all duration-200 ${isOpen ? 'bg-gray-200/80 text-gray-700' : 'hover:bg-gray-100 text-gray-500'}`}
                type="button"
                aria-label="Attach file"
            >
                <ClipIcon isOpen={isOpen} />
            </button>

            {/* Menu */}
            {isOpen && (
                <div
                    ref={menuRef}
                    className={`clip-menu ${isClosing ? 'clip-menu-close' : 'clip-menu-open'}`}
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 18px)",
                        right: 0,
                        zIndex: 50,
                        transformOrigin: "bottom right",
                    }}
                >
                    <div className="clip-popover-card">
                        {visibleItems.map((item, index) => {
                            const { id, label, Icon, color } = item;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleItemClick(id)}
                                    className="clip-popover-item"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <span className="clip-popover-icon" style={{ color }}>
                                        <Icon />
                                    </span>
                                    <span className="clip-popover-label">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
