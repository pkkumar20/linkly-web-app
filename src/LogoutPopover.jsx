import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./firebase hooks/AuthContext";
import { getAuth, signOut } from 'firebase/auth';
import toast from "react-hot-toast";
import ProfileQRCodeModal from "./ProfileQRCodeModal";

// ── Custom SVG Icons ──
const EllipsisIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
);

const LinkIconSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const QrCodeIconSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 15h2v2h-2z" fill="currentColor" />
        <path d="M18 18h2v2h-2z" fill="currentColor" />
        <path d="M18 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 18v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const LogoutIconSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function LogoutPopover() {
    const { setIsLoggingOut, backendUser } = useContext(AuthContext);


    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const closeMenu = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 180);
    }, []);

    const toggleMenu = () => {
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

    const handleLogout = () => {
        closeMenu();
        const auth = getAuth();
        signOut(auth)
            .then(() => {
                toast.success("Logged out successfully");
            })
            .catch((error) => {
                console.error("Error logging out:", error);
            });
    };

    return (
        <div className="relative flex justify-end">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className={`p-2 rounded-full cursor-pointer transition-all duration-200 ${isOpen ? 'bg-gray-200/80 text-gray-700' : 'hover:bg-gray-100 text-gray-500'}`}
                aria-label="More options"
            >
                <EllipsisIcon />
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className={`clip-menu ${isClosing ? 'clip-menu-close' : 'clip-menu-open'}`}
                    style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        right: 0,
                        zIndex: 50,
                        transformOrigin: "top right",
                    }}
                >
                    <div className="clip-popover-card" style={{ minWidth: "180px" }}>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.host}/${backendUser?.username}`);
                                toast.dismissAll()
                                toast.success("Profile link copied!");
                                closeMenu();
                            }}
                            className="clip-popover-item"
                            style={{ animationDelay: `0ms` }}
                        >
                            <span className="clip-popover-icon" style={{ color: '#4EA4F6' }}>
                                <LinkIconSVG />
                            </span>
                            <span className="clip-popover-label">Copy Profile Link</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsQrModalOpen(true);
                                closeMenu();
                            }}
                            className="clip-popover-item"
                            style={{ animationDelay: `30ms` }}
                        >
                            <span className="clip-popover-icon" style={{ color: '#E97AD1' }}>
                                <QrCodeIconSVG />
                            </span>
                            <span className="clip-popover-label">Send Profile QR</span>
                        </button>

                        <div className="h-[1px] bg-gray-100 my-1 mx-2" />

                        <button
                            onClick={handleLogout}
                            className="clip-popover-item hover:bg-red-50"
                            style={{ animationDelay: `60ms` }}
                        >
                            <span className="clip-popover-icon text-red-500">
                                <LogoutIconSVG />
                            </span>
                            <span className="clip-popover-label text-red-500">Log Out</span>
                        </button>
                    </div>
                </div>
            )}

            <ProfileQRCodeModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
            />
        </div>
    );
}
