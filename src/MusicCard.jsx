import React from 'react';
import { PlayIcon } from "@heroicons/react/24/solid";

const MusicCard = ({ title, size, source, date, rightDate, onClick, onContextMenu, isSelected, isSelectionMode }) => {
    const pressTimer = React.useRef(null);
    const handleTouchStart = (e) => {
        pressTimer.current = setTimeout(() => {
            if (onContextMenu) {
                const touch = e.touches[0];
                onContextMenu({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => { } });
            }
        }, 500);
    };
    const handleTouchEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

    return (
        <div 
            className={`flex items-center justify-between px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer gap-3 ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/80 bg-transparent'}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="relative shrink-0">
                    {isSelectionMode && isSelected ? (
                        <div className="w-10 h-10 rounded-full bg-[#8763ea] flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-gray-900 break-words leading-tight">{title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {size} • {source}
                    </p>
                </div>
            </div>
            <div className={`text-[11.5px] font-medium whitespace-nowrap shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{rightDate}</div>
        </div>
    );
};

export default MusicCard;
