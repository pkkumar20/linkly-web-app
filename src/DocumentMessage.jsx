import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { TbCheck, TbChecks, TbClockHour4, TbAlertCircle } from 'react-icons/tb';
import { HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import VideoViewer from './VideoViewer';
import CustomImageViewer from './CustomImageViewer';

// ── Extract extension from name or URL ──────────────────────────────────────
const getFileExt = (name, url) => {
    if (name && name.includes('.')) return name.split('.').pop().toLowerCase();
    if (url) {
        const clean = url.split('?')[0].split('#')[0];
        const lastSegment = clean.split('/').pop();
        if (lastSegment && lastSegment.includes('.')) return lastSegment.split('.').pop().toLowerCase();
    }
    return '';
};

// ── Detect media type from extension ────────────────────────────────────────
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

// ── File color/label — matches MediaPreviewPopup exactly ────────────────────
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

const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Tiny component that loads audio metadata to display duration ─────────────
const AudioDuration = ({ url }) => {
    const [duration, setDuration] = useState(null);
    useEffect(() => {
        if (!url) return;
        const audio = new Audio();
        audio.preload = 'metadata';
        const onLoaded = () => { setDuration(audio.duration); audio.remove(); };
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.src = url;
        return () => { audio.removeEventListener('loadedmetadata', onLoaded); audio.pause(); };
    }, [url]);
    return <span>{duration ? formatDuration(duration) : '...'}</span>;
};

// ── Extract real filename from a URL (last segment before query) ─────────────
const getFilenameFromUrl = (url) => {
    if (!url) return '';
    try {
        const clean = url.split('?')[0].split('#')[0];
        return decodeURIComponent(clean.split('/').pop()) || '';
    } catch { return ''; }
};

// ── Download helper ─────────────────────────────────────────────────────────
// Simple <a href download="name"> pattern using backend proxy (same-origin).
const triggerDownload = (url, filename) => {
    const resolvedName = filename || getFilenameFromUrl(url) || 'download';
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const proxyUrl = `${SERVER_URL}/chanel/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(resolvedName)}`;
    const a = Object.assign(document.createElement('a'), {
        href: proxyUrl,
        download: resolvedName,
        style: 'display:none',
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 300);
};

// ── Cloudinary thumbnail helper ─────────────────────────────────────────────
function getCloudinaryThumb(url) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_200,h_200,c_fill,f_jpg,q_75/');
}

// ── Audio Player Popup ──────────────────────────────────────────────────────
const AudioPlayerPopup = ({ doc, onClose }) => {
    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col items-center gap-4 transition-all transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-[72px] h-[72px] bg-gradient-to-br from-purple-400 to-purple-700 rounded-full flex items-center justify-center shadow-lg mb-2 relative">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                </div>

                <div className="text-center w-full">
                    <h3 className="text-gray-900 font-bold text-lg truncate px-2">{doc.name || 'Audio Document'}</h3>
                    <p className="text-gray-500 text-sm mt-1">{formatFileSize(doc.size)}</p>
                </div>

                <div className="w-full mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-inner">
                    <audio
                        src={doc.url}
                        controls
                        autoPlay
                        className="w-full h-11 outline-none"
                        controlsList="nodownload"
                    />
                </div>

                <button
                    onClick={onClose}
                    className="mt-3 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// ── Thumbnail component for media docs ──────────────────────────────────────
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
                {/* Default Music Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:opacity-0 transition-opacity duration-200">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
                {/* Play Icon on hover */}
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

// ═══════════════════════════════════════════════════════════════════════════════
const DocumentMessage = memo(({ choose, msg, chat, documents, isPending, isSent, caption, formattedTime, hasOtherIds, senderName, senderProfile, sendTime }) => {
    const isError = msg?._isError;
    const hasCaption = caption && caption.trim().length > 0;
    const renderTextWithLinks = (textContent) => {
        if (!textContent) return null;

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
        const parts = textContent.split(urlRegex);

        return parts.map((part, i) => {
            if (!part) return null;
            if (part.match(urlRegex)) {
                let url = part;
                if (!/^https?:\/\//i.test(url)) {
                    url = `http://${url}`;
                }
                return (
                    <span
                        key={i}
                        className="text-[#6F57D0] underline cursor-pointer font-semibold"
                        title="Ctrl+Click to open link"
                        onClick={(e) => {
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };
    // Upload overlay fade-out
    const [showOverlay, setShowOverlay] = useState(isPending);
    const wasPending = useRef(isPending);
    useEffect(() => {
        if (wasPending.current && !isPending) {
            const t = setTimeout(() => setShowOverlay(false), 400);
            return () => clearTimeout(t);
        }
        wasPending.current = isPending;
    }, [isPending]);

    // Derived media lists for viewers
    const allImages = useMemo(() => documents.filter(d => getMediaType(d.name, d.url) === 'image'), [documents]);
    const allVideos = useMemo(() => documents.filter(d => getMediaType(d.name, d.url) === 'video'), [documents]);

    const [viewerState, setViewerState] = useState({ isOpen: false, type: null, index: 0 });
    const [audioDoc, setAudioDoc] = useState(null);

    const handleClick = (e, doc, mediaType) => {
        e.preventDefault();
        if (isPending || !doc.url) return;

        if (mediaType === 'image') {
            const idx = allImages.findIndex(img => img.url === doc.url);
            setViewerState({ isOpen: true, type: 'image', index: idx });
        } else if (mediaType === 'video') {
            const idx = allVideos.findIndex(vid => vid.url === doc.url);
            setViewerState({ isOpen: true, type: 'video', index: idx });
        } else if (mediaType === 'audio') {
            setAudioDoc(doc);
        } else {
            triggerDownload(doc.url, doc.name);
        }
    };

    const closeViewer = () => setViewerState({ isOpen: false, type: null, index: 0 });

    return (
        <div>
            {/* Document cards */}
            <div className="px-2 pt-2 pb-1">
                {documents.map((doc, i) => {
                    const iconData = getFileColorAndLabel(doc.name, doc.url);
                    const mediaType = getMediaType(doc.name, doc.url);
                    const isMedia = mediaType !== 'file';

                    return (
                        <div
                            key={i}
                            onClick={(e) => { if (isError) { e.stopPropagation(); if (msg?._onRetry) msg._onRetry(); return; } handleClick(e, doc, mediaType); }}
                            className={`group relative flex items-center gap-3.5 px-3 py-3 rounded-xl mb-1 transition-all duration-200 ${
                                isError ? 'bg-red-50 border border-red-100 cursor-pointer' :
                                isPending ? 'opacity-70 cursor-wait' : 'hover:bg-black/5 cursor-pointer'
                            }`}
                        >
                            {/* Thumbnail: media preview or gradient badge */}
                            <div className="w-[60px] h-[60px] rounded-xl overflow-hidden flex-shrink-0 shadow-md relative">
                                {isMedia && doc.url ? (
                                    <MediaThumb url={doc.url} mediaType={mediaType} />
                                ) : (
                                    <div
                                        className="w-full h-full rounded-xl relative flex items-center justify-center"
                                        style={{ background: isError ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : iconData.gradient }}
                                    >
                                        <div
                                            className="absolute top-0 right-0 w-5 h-5 bg-white/25"
                                            style={{ borderBottomLeftRadius: '8px', borderTopRightRadius: '10px' }}
                                        />
                                        {isError ? (
                                            /* Retry icon on error */
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                <path d="M3 3v5h5" />
                                            </svg>
                                        ) : (
                                            <span className="text-white font-bold text-sm tracking-wide mt-1 drop-shadow-sm select-none">
                                                {iconData.label}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Circular upload progress ring */}
                                {isPending && !isError && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.38)' }}>
                                        <svg width="34" height="34" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="17" cy="17" r="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                                            <circle
                                                cx="17" cy="17" r="13"
                                                fill="none" stroke="white" strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeDasharray={2 * Math.PI * 13}
                                                strokeDashoffset={2 * Math.PI * 13}
                                                className="upload-progress-bar-doc"
                                                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[15px] font-medium truncate leading-tight ${isError ? 'text-red-600' : 'text-gray-800'}`}>
                                    {doc.name || 'Document'}
                                </p>
                                <p className="text-[13px] mt-0.5">
                                    {isError ? (
                                        <span className="text-red-400 font-medium">Failed · Tap to retry</span>
                                    ) : isPending ? (
                                        <span className="text-gray-400">Uploading... <span className="upload-progress-text-doc font-semibold text-gray-500">0%</span></span>
                                    ) : mediaType === 'audio' ? (
                                        <span className="text-gray-500"><AudioDuration url={doc.url} /></span>
                                    ) : (
                                        <span className="text-gray-500">{formatFileSize(doc.size)}</span>
                                    )}
                                </p>
                                {/* Upload progress bar */}
                                {isPending && !isError && (
                                    <div className="mt-1.5 h-[3px] rounded-full bg-gray-200 overflow-hidden w-full">
                                        <div className="upload-progress-bar h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: '0%' }} />
                                    </div>
                                )}
                            </div>

                            {/* Right side indicator */}
                            {isError && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Caption + time row / time-only row */}
            {hasCaption ? (
                <div className="px-3 py-2 flex items-end gap-1">
                    {renderTextWithLinks(caption)}
                    <span className="flex items-center gap-1 ml-2 text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: msg?._isError ? '#ef4444' : (isSent ? '#166534' : '#6b7280') }}>
                        {formattedTime}
                        {isSent && !msg?._isError && (isPending ? <TbClockHour4 size={16} /> : hasOtherIds ? <TbChecks size={16} /> : <TbCheck size={16} />)}
                    </span>
                </div>
            ) : (
                <div className="px-3 pb-1.5 flex justify-end">
                    <span className="flex items-center gap-1 text-[11px] whitespace-nowrap" style={{ color: msg?._isError ? '#ef4444' : (isSent ? '#166534' : '#6b7280') }}>
                        {formattedTime}
                        {isSent && !msg?._isError && (isPending ? <TbClockHour4 size={14} /> : hasOtherIds ? <TbChecks size={14} /> : <TbCheck size={14} />)}
                    </span>
                </div>
            )}

            {/* Viewers */}
            {viewerState.isOpen && viewerState.type === 'image' && (
                <CustomImageViewer
                    choose={choose}
                    chatId={chat?._id}
                    msg={msg}
                    images={allImages}
                    initialIndex={viewerState.index}
                    onClose={closeViewer}
                    senderName={senderName}
                    senderProfile={senderProfile}
                    sendTime={sendTime}
                />
            )}
            {viewerState.isOpen && viewerState.type === 'video' && (
                <VideoViewer
                    choose={choose}
                    chatId={chat?._id}
                    msg={msg}
                    videos={allVideos}
                    initialIndex={viewerState.index}
                    onClose={closeViewer}
                    senderName={senderName}
                    senderProfile={senderProfile}
                    sendTime={sendTime}
                />
            )}
            {audioDoc && (
                <AudioPlayerPopup
                    doc={audioDoc}
                    onClose={() => setAudioDoc(null)}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    if (prevProps.choose !== nextProps.choose) return false;
    if (prevProps.isPending !== nextProps.isPending) return false;
    if (prevProps.msg?._isError !== nextProps.msg?._isError) return false;
    if (prevProps.caption !== nextProps.caption) return false;
    if (prevProps.documents.length !== nextProps.documents.length) return false;
    return prevProps.documents.every((d, i) => d.url === nextProps.documents[i]?.url);
});

export default DocumentMessage;

