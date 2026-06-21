import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const tabs = ['Chats', 'Channels', 'Groups', 'Media', 'Links', 'Files', 'Music', 'Location'];

export default function ScrollableTabBar({ Choose, currentTab = 'Chats' }) {
    const scrollRef = useRef(null);
    const handleTabPress = (Tab) => {
        Choose(Tab)
    }
    useEffect(() => {
        const el = scrollRef.current;

        const onWheel = (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY; // convert vertical scroll to horizontal
            }
        };

        if (el) {
            el.addEventListener('wheel', onWheel, { passive: false });
        }

        return () => {
            if (el) {
                el.removeEventListener('wheel', onWheel);
            }
        };
    }, []);

    return (
        <div
            ref={scrollRef}
            className="overflow-x-auto border-b border-gray-200 scrollbar-hide"
        >
            <div className="flex space-x-6 min-w-max px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            handleTabPress(tab)
                        }}
                        className={`relative py-3 text-sm font-medium whitespace-nowrap transition-colors ${currentTab === tab
                            ? 'text-[#8763ea]'
                            : 'text-gray-600 hover:text-[#7c56eb]'
                            }`}
                    >
                        {tab}
                        {currentTab === tab && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8763ea] rounded-full"
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
