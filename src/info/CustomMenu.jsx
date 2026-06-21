import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from "../firebase hooks/AuthContext";
import { motion, AnimatePresence } from 'framer-motion';
import { RxTrash } from "react-icons/rx";
import { LuMessageSquare } from "react-icons/lu";
import { List, ListItem, Typography } from '@material-tailwind/react';
import UserAvatar from "../UserAvatar";

const CustomMenu = ({ data, onClick ,}) => {
    const { backendUser } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [points, setPoints] = useState({ x: 0, y: 0 });
    const [origin, setOrigin] = useState("top left");

    const menuRef = useRef(null);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    // --- 1. Event Handlers ---

    const handleContextMenu = (e) => {
        e.preventDefault();
        showMenu(e.clientX, e.clientY);
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        timerRef.current = setTimeout(() => {
            showMenu(touch.clientX, touch.clientY);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // --- 2. Positioning Logic (Cursor at top edge of menu) ---

    const showMenu = (cursorX, cursorY) => {
        if (data?._id?.toString() === backendUser?._id?.toString()) return;

        const MENU_WIDTH = 224; // 224px (w-56)
        const MENU_HEIGHT = 120;
        const GAP = 8;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const containerLeft = containerRect.left;
        const containerRight = containerRect.right;
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;

        let finalX = cursorX;
        let finalY = cursorY; // Menu starts at cursor Y position (top edge at cursor)
        let transformOriginX = "left";

        // --- HORIZONTAL POSITIONING ---
        // Default: align left edge with cursor
        finalX = cursorX;
        transformOriginX = "left";

        // Check if menu would overflow right edge
        if (cursorX + MENU_WIDTH > viewportWidth - GAP) {
            // Position menu to the left of cursor
            finalX = cursorX - MENU_WIDTH;
            transformOriginX = "right";
        }

        // Check if positioned menu would overflow left edge
        if (finalX < GAP) {
            finalX = GAP;
            transformOriginX = "left";
        }

        // Final horizontal safety
        finalX = Math.max(GAP, Math.min(finalX, viewportWidth - MENU_WIDTH - GAP));

        // --- CONTAINER CONSTRAINT ---
        if (containerRight - containerLeft < viewportWidth - 2 * GAP) {
            finalX = Math.max(finalX, containerLeft + GAP);
            finalX = Math.min(finalX, containerRight - MENU_WIDTH - GAP);
        }

        // --- VERTICAL POSITIONING (Menu starts at cursor Y position) ---
        // Menu top edge is at cursorY
        // Check if menu would overflow bottom of viewport
        if (cursorY + MENU_HEIGHT > viewportHeight - GAP) {
            // If menu would overflow bottom, we have two options:
            // Option 1: Shift menu up so it fits (keeps cursor at top edge)
            finalY = viewportHeight - MENU_HEIGHT - GAP;

            // Option 2: If we shifted too far up (above cursor), at least ensure
            // the menu doesn't overlap the cursor position too much
            if (finalY > cursorY) {
                // This shouldn't happen with normal cursor positions, but just in case
                finalY = Math.max(GAP, cursorY - MENU_HEIGHT + 20);
            }
        }

        // Ensure menu doesn't go above container top
        finalY = Math.max(containerTop + GAP, finalY);

        // Ensure menu doesn't go below container bottom
        finalY = Math.min(finalY, containerBottom - MENU_HEIGHT - GAP);

        // Final vertical safety
        finalY = Math.max(GAP, Math.min(finalY, viewportHeight - MENU_HEIGHT - GAP));

        setOrigin(`top ${transformOriginX}`);
        setPoints({ x: finalX, y: finalY });
        setIsOpen(true);
    };

    // --- 3. Close Listeners ---

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        const handleScroll = () => setIsOpen(false);

        window.addEventListener('click', handleOutsideClick);
        window.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('click', handleOutsideClick);
            window.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isOpen]);

    // --- 4. Render ---

    return (
        <div
            ref={containerRef}
            className="w-full flex flex-col items-center px-1 py-0.5 relative"
        >

            <ListItem
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (isOpen) setIsOpen(false);
                }}
                className={`flex justify-between items-center w-full max-w-sm bg-white transition-all active:scale-[0.98] border border-transparent hover:bg-gray-100 rounded-xl ${data?._id === backendUser?._id ? "cursor-default" : "cursor-pointer"
                    } ${isOpen ? "bg-gray-100 ring-1 ring-gray-200" : ""}`}
            >
                <div className="flex items-center space-x-3 py-1 px-1">
                    <UserAvatar
                        {...(data?.profile?.type === 'image' && { image: data.profile.imageUrl })}
                        {...(data?.profile?.type === 'emoji' && { emoji: data.profile.emoji, simpleBg: data.profile.bgColor })}
                        {...(data?.profile?.type === 'initials' && { simpleBg: data.profile.bgColor, text: data.profile.initials })}
                    />
                    <div className="flex flex-col text-left">
                        <span className="font-semibold text-slate-800 leading-tight">
                            {`${data.name} ${data.lastName}`}
                        </span>
                    </div>
                </div>
            </ListItem>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.9, transformOrigin: origin }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                        transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.5 }}
                        style={{
                            top: `${points.y}px`,
                            left: `${points.x}px`,
                            position: 'fixed',
                            zIndex: 99999,
                        }}
                        className="w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                    >
                        {/* Visual indicator - small dot at top edge where cursor would be */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '6px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                marginTop: '-3px',
                                zIndex: 1,
                            }}
                        />

                        <List className="p-1 min-w-8">

                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick("Send Message", data);
                                    setIsOpen(false);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 focus:bg-slate-50 active:bg-slate-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <LuMessageSquare size={18} className="text-black " />
                                </div>
                                <Typography className="text-[14px] font-semibold text-black ">
                                    Send Message
                                </Typography>
                            </ListItem>


                            <ListItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick("Delete", data);
                                    setIsOpen(false);
                                }}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 focus:bg-red-50 active:bg-red-50"
                            >
                                <div className="flex items-center justify-center w-5">
                                    <RxTrash size={20} className="text-black group-hover:text-red-600 transition-colors" />
                                </div>
                                <Typography className="text-[14px] font-medium text-black group-hover:text-red-700">
                                    Delete
                                </Typography>
                            </ListItem>

                        </List>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomMenu;