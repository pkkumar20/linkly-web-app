import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const getFileExt = (name, url) => {
    if (name && name.includes('.')) return name.split('.').pop().toLowerCase();
    if (url) {
        const clean = url.split('?')[0].split('#')[0];
        const lastSegment = clean.split('/').pop();
        if (lastSegment && lastSegment.includes('.')) return lastSegment.split('.').pop().toLowerCase();
    }
    return '';
};

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']);

function getMediaType(name, url) {
    const ext = getFileExt(name, url);
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (VIDEO_EXTS.has(ext)) return 'video';
    if (AUDIO_EXTS.has(ext)) return 'audio';
    return 'file';
}

const getFileColorAndLabel = (filename, url) => {
    const ext = getFileExt(filename, url);
    let gradient = 'linear-gradient(135deg, #5F6368, #424548)';
    let label = ext ? ext.substring(0, 4).toUpperCase() : 'FILE';
    switch (ext) {
        case 'pdf': gradient = 'linear-gradient(135deg, #EF5350, #C62828)'; label = 'PDF'; break;
        case 'apk': gradient = 'linear-gradient(135deg, #9CCC65, #558B2F)'; label = 'APK'; break;
        case 'zip': case 'rar': case '7z': gradient = 'linear-gradient(135deg, #FFD54F, #F57F17)'; label = 'ZIP'; break;
        case 'doc': case 'docx': gradient = 'linear-gradient(135deg, #64B5F6, #1565C0)'; label = 'DOC'; break;
        case 'xls': case 'xlsx': case 'csv': gradient = 'linear-gradient(135deg, #66BB6A, #2E7D32)'; label = 'XLS'; break;
        case 'ppt': case 'pptx': gradient = 'linear-gradient(135deg, #FF8A65, #D84315)'; label = 'PPT'; break;
        case 'txt': case 'rtf': gradient = 'linear-gradient(135deg, #BDBDBD, #616161)'; label = 'TXT'; break;
        case 'mp3': case 'wav': case 'aac': case 'ogg': gradient = 'linear-gradient(135deg, #CE93D8, #7B1FA2)'; label = ext.substring(0, 3).toUpperCase(); break;
        case 'mp4': case 'mov': case 'avi': case 'mkv': case 'webm': gradient = 'linear-gradient(135deg, #4DB6AC, #00695C)'; label = ext.substring(0, 3).toUpperCase(); break;
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': gradient = 'linear-gradient(135deg, #64B5F6, #1E88E5)'; label = ext.substring(0, 3).toUpperCase(); break;
        case 'json': gradient = 'linear-gradient(135deg, #FFB74D, #EF6C00)'; label = 'JSON'; break;
        case 'html': case 'css': case 'js': gradient = 'linear-gradient(135deg, #F06292, #AD1457)'; label = ext.toUpperCase(); break;
        case 'svg': gradient = 'linear-gradient(135deg, #FF8A65, #BF360C)'; label = 'SVG'; break;
        case 'exe': case 'dmg': case 'iso': gradient = 'linear-gradient(135deg, #7986CB, #283593)'; label = ext.toUpperCase(); break;
    }
    return { gradient, label };
};

function getCloudinaryThumb(url) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_200,h_200,c_fill,f_jpg,q_75/');
}

const MediaThumb = ({ url, mediaType }) => {
    if (mediaType === 'image') {
        const thumbUrl = getCloudinaryThumb(url);
        return (
            <img
                src={thumbUrl}
                alt=""
                className="w-full h-full object-cover rounded-xl"
                draggable={false}
            />
        );
    }
    if (mediaType === 'video') {
        const posterUrl = url.includes('res.cloudinary.com')
            ? url.replace('/upload/', '/upload/so_1,w_200,h_200,c_fill,f_jpg,q_75/').replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg')
            : undefined;
        return (
            <div className="w-full h-full relative">
                {posterUrl ? (
                    <img src={posterUrl} alt="" className="w-full h-full object-cover rounded-xl" draggable={false} />
                ) : (
                    <video src={url} className="w-full h-full object-cover rounded-xl" preload="metadata" muted />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.85">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        );
    }
    if (mediaType === 'audio') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-700 rounded-xl overflow-hidden relative group-hover:brightness-105 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:opacity-0 transition-opacity duration-200">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1 shadow-sm opacity-95">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        );
    }
    return null;
};

export default function FileCard({
    fileName,
    fileSize,
    fileSource,
    fileDate,
    url,
    onClick,
    onContextMenu,
    isSelected,
    isSelectionMode,

}) {


    const [hovered, setHovered] = useState(false);
    const pressTimer = React.useRef(null);

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

    const mediaType = getMediaType(fileName, url);
    const isMedia = mediaType !== 'file';
    const iconData = getFileColorAndLabel(fileName, url);

    return (
        <div
            className={`group relative flex items-center justify-between px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/80 bg-transparent'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
        >
            <div className="flex items-center space-x-3.5">
                <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative">
                    {isSelectionMode && isSelected ? (
                        <div className="absolute inset-0 bg-[#8763ea] flex items-center justify-center z-20 rounded-xl">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    ) : null}

                    {hovered && !isMedia ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-xl">
                            <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                        </div>
                    ) : null}

                    {hovered && isMedia ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-xl">
                            <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                        </div>
                    ) : null}

                    {isMedia && url ? (
                        <MediaThumb url={url} mediaType={mediaType} />
                    ) : (
                        <div
                            className="w-full h-full rounded-xl relative flex items-center justify-center"
                            style={{ background: iconData.gradient }}
                        >
                            <div
                                className="absolute top-0 right-0 w-4 h-4 bg-white/25"
                                style={{ borderBottomLeftRadius: '8px', borderTopRightRadius: '8px' }}
                            />
                            <span className="text-white font-bold text-[13px] tracking-wide mt-1 drop-shadow-sm select-none">
                                {iconData.label}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col max-w-[200px] sm:max-w-[280px]">
                    <span className="text-[15px] font-medium text-gray-800 truncate leading-tight">
                        {fileName || 'Document'}
                    </span>
                    <span className="text-[13px] text-gray-500 mt-0.5 truncate">
                        {fileSize} · {fileSource}
                    </span>
                </div>
            </div>

            <div className={`text-[11.5px] font-medium whitespace-nowrap shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{fileDate}</div>
        </div>
    );
}
