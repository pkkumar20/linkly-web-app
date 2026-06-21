import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import UserAvatar from "./UserAvatar";
const LinkCard = ({ senderData, sender, time, avatar, contentLines, onContextMenu, onClick, isSelected, isSelectionMode }) => {
    const colors = [
        'bg-blue-50', 'bg-indigo-50', 'bg-purple-50', 'bg-pink-50',
        'bg-rose-50', 'bg-orange-50', 'bg-emerald-50', 'bg-teal-50'
    ];
    const textColors = [
        'text-blue-600', 'text-indigo-600', 'text-purple-600', 'text-pink-600',
        'text-rose-600', 'text-orange-600', 'text-emerald-600', 'text-teal-600'
    ];
    

    const charCode = avatar ? avatar.charCodeAt(0) : 0;
    const colorIndex = charCode % colors.length;
    const bgColor = colors[colorIndex];
    const textColor = textColors[colorIndex];

    const pressTimer = useRef(null);

    const handleTouchStart = (e) => {
        pressTimer.current = setTimeout(() => {
            if (onContextMenu) {
                const touch = e.touches[0];
                onContextMenu({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => { }
                });
            }
        }, 500);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'bg-transparent hover:bg-gray-50/80'
                }`}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
        >
            {/* Avatar / Selection Check */}
            <div className="relative shrink-0">
                {isSelectionMode && isSelected ? (
                    <div className="w-[42px] h-[42px] rounded-full bg-[#8763ea] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>

                ) : isSelectionMode ? (
                    // <div className="w-[42px] h-[42px] rounded-full border-[2px] border-gray-300 flex items-center justify-center">
                    //     <div className={`w-[34px] h-[34px] rounded-full ${bgColor} flex items-center justify-center ${textColor} font-semibold text-sm`}>
                    //         {avatar}
                    //     </div>
                    // </div>
                    <UserAvatar    {...(senderData !== null && senderData.type === 'image' && {
                        image: senderData.imageUrl,
                    })}
                        {...(senderData !== null && senderData.type === 'emoji' && {
                            emoji: senderData
                                .emoji,
                            simpleBg: senderData
                                .bgColor,
                            emojiSize: "text-3xl"
                        })}
                        {...(senderData !== null && senderData.type === 'initials' && {
                            simpleBg: senderData
                                .bgColor,
                            text: senderData
                                .initials,

                        })} />
                ) : (
                    <UserAvatar    {...(senderData !== null && senderData.type === 'image' && {
                        image: senderData.imageUrl,
                    })}
                        {...(senderData !== null && senderData.type === 'emoji' && {
                            emoji: senderData
                                .emoji,
                            simpleBg: senderData
                                .bgColor,
                            emojiSize: "text-3xl"
                        })}
                        {...(senderData !== null && senderData.type === 'initials' && {
                            simpleBg: senderData
                                .bgColor,
                            text: senderData
                                .initials,

                        })} />
                )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0 overflow-hidden pt-0.5">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-[14.5px] font-semibold text-gray-900 truncate">{sender}</p>
                    <div className={`text-[11.5px] font-medium whitespace-nowrap shrink-0 ml-2 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{time}</div>
                </div>

                <div className="space-y-0.5">
                    {contentLines.map((line, index) => {
                        if (!line.trim()) return null;
                        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
                        const parts = line.split(urlRegex);

                        return (
                            <p key={index} className="text-[14px] leading-snug text-gray-600 break-words line-clamp-2 ">
                                {parts.map((part, i) => {
                                    if (part.match(urlRegex)) {
                                        return (
                                            <span
                                                key={i}
                                                className="text-[#8763ea] hover:text-[#6f4bcf] font-medium break-all underline-offset-2 hover:underline"
                                                onClick={(e) => {
                                                    if (!isSelectionMode) {
                                                        e.stopPropagation();
                                                        let finalUrl = part;
                                                        if (!/^https?:\/\//i.test(finalUrl)) {
                                                            finalUrl = 'http://' + finalUrl;
                                                        }
                                                        window.open(finalUrl, '_blank');
                                                    }
                                                }}
                                            >
                                                {part}
                                            </span>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                            </p>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default LinkCard;
