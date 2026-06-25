import React, { useState, useRef, useEffect, memo } from 'react';
import { TbCheck, TbChecks, TbClockHour4 } from 'react-icons/tb';
import VideoViewer from './VideoViewer';

// ── Thumbnail cache ───────────────────────────────────────────────────────────
const thumbCache = new Map();

function getCloudinaryThumbUrl(url) {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    return url
        .replace('/upload/', '/upload/so_1,w_400,f_jpg,q_70/')
        .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg');
}

function getVideoThumbnail(url) {
    if (thumbCache.has(url)) return Promise.resolve(thumbCache.get(url));
    const cloudThumb = getCloudinaryThumbUrl(url);
    if (cloudThumb) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { const result = { thumb: cloudThumb, w: img.naturalWidth, h: img.naturalHeight, duration: 0 }; thumbCache.set(url, result); resolve(result); };
            img.onerror = () => { const result = { thumb: cloudThumb, w: 320, h: 240, duration: 0 }; thumbCache.set(url, result); resolve(result); };
            img.src = cloudThumb;
        });
    }
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'auto'; video.muted = true; video.playsInline = true;
        const finish = (thumb, w, h, dur) => { const result = { thumb, w: w || 320, h: h || 240, duration: dur || 0 }; thumbCache.set(url, result); resolve(result); };
        video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration || 0); };
        video.onseeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                finish(canvas.toDataURL('image/jpeg', 0.7), video.videoWidth, video.videoHeight, video.duration);
            } catch { finish(null, video.videoWidth, video.videoHeight, video.duration); }
        };
        video.onerror = () => finish(null, 320, 240, 0);
        const timeout = setTimeout(() => finish(null, video.videoWidth || 320, video.videoHeight || 240, video.duration || 0), 5000);
        video.addEventListener('seeked', () => clearTimeout(timeout), { once: true });
        video.src = url; video.load();
    });
}

function formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

const PlayIcon = ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.5)" />
        <path d="M19 14.5L35 24L19 33.5V14.5Z" fill="white" />
    </svg>
);

const MAX_VISIBLE = (total) => total <= 4 ? 4 : 5;
const getGridConfig = (visibleCount) => {
    if (visibleCount === 2) return { container: "grid-cols-2 aspect-[2/1]", getCellClass: () => "col-span-1" };
    if (visibleCount === 3) return { container: "grid-cols-2 grid-rows-2 aspect-[4/3]", getCellClass: (i) => i === 0 ? "row-span-2" : "col-span-1" };
    if (visibleCount === 4) return { container: "grid-cols-2 grid-rows-2 aspect-square", getCellClass: () => "col-span-1" };
    return { container: "grid-cols-6 grid-rows-2 aspect-[4/3]", getCellClass: (i) => i < 2 ? "col-span-3" : "col-span-2" };
};


const CircularProgress = ({ progress = 0, size = 52 }) => {
    const radius = (size - 6) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (progress / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="white" strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.25s ease' }}
            />
        </svg>
    );
};

// ── Upload/Error overlay — two-phase: upload (0→85%) + Cloudinary processing (85→99%)
const UploadOverlay = ({ isPending, isError, onRetry }) => {
    const overlayRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('upload');
    const rafRef = useRef(null);
    const prevPct = useRef(0);
    const processingStart = useRef(null);
    const PROCESSING_DURATION = 8000;

    useEffect(() => {
        if (!isPending || isError) {
            cancelAnimationFrame(rafRef.current);
            return;
        }
        const tick = () => {
            if (overlayRef.current) {
                const bar = overlayRef.current.querySelector('.upload-progress-bar');
                if (bar) {
                    const w = parseFloat(bar.style.width) || 0;
                    if (Math.abs(w - prevPct.current) >= 0.5) {
                        prevPct.current = w;
                        setProgress(Math.round(w));
                        if (w >= 84) {
                            if (!processingStart.current) {
                                processingStart.current = Date.now();
                                setPhase('processing');
                            }
                        } else {
                            setPhase('upload');
                        }
                    } else if (prevPct.current >= 84 && processingStart.current) {
                        const elapsed = Date.now() - processingStart.current;
                        const faked = Math.min(99, 85 + Math.floor((elapsed / PROCESSING_DURATION) * 14));
                        if (faked !== Math.round(progress)) setProgress(faked);
                    }
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        processingStart.current = null;
        setPhase('upload');
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isPending, isError]); // eslint-disable-line

    if (isError) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30">
                <button
                    onClick={(e) => { e.stopPropagation(); onRetry && onRetry(); }}
                    className="flex flex-col items-center justify-center gap-[6px] group cursor-pointer border-none bg-transparent"
                >
                    <div className="w-[48px] h-[48px] rounded-full bg-black/50 group-hover:bg-black/70 flex items-center justify-center transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v14" />
                            <path d="M7 8l5-5 5 5" />
                        </svg>
                    </div>
                    <span className="text-white text-[12px] font-medium drop-shadow-md">
                        Retry
                    </span>
                </button>
            </div>
        );
    }

    if (!isPending) return null;

    return (
        <div ref={overlayRef} className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress progress={progress} size={52} />
                <span style={{ position: 'absolute', color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '-0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 1.2 }}>
                    {phase === 'processing' ? '⟳' : `${progress}%`}
                </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600, marginTop: 6, background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: 8, letterSpacing: '0.02em' }}>
                {phase === 'processing' ? 'Processing…' : 'Uploading…'}
            </span>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
                <div
                    className="upload-progress-bar"
                    style={{ height: '100%', background: 'white', width: '0%', transition: 'width 0.25s ease' }}
                />
            </div>
            <span className="upload-progress-text" style={{ display: 'none' }} />
        </div>
    );
};


// ── Shared tile renderer ─────────────────────────────────────────────────────
const VideoTile = ({ thumb, isLoading, isPending, isError, onClick, className, style, playSize = 48 }) => (
    <div
        className={`relative bg-black overflow-hidden ${className || ''}`}
        style={{ ...style, cursor: (isPending || isError) ? 'default' : 'pointer' }}
        onClick={() => { if (!isPending && !isError) onClick(); }}
    >
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 z-[1] transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-8 h-8 rounded-full border-[3px] border-gray-600 border-t-white animate-spin" />
        </div>
        {thumb?.thumb && (
            <img src={thumb.thumb} alt="" className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} draggable={false} />
        )}
        {thumb && !thumb.thumb && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M10 9l5 3-5 3V9z" fill="rgba(255,255,255,0.3)" />
                </svg>
            </div>
        )}
        {!isLoading && !isPending && !isError && (
            <div className="absolute inset-0 flex items-center justify-center z-[2] transition-opacity duration-200 hover:bg-black/10">
                <PlayIcon size={playSize} />
            </div>
        )}
        {thumb?.duration > 0 && !isPending && !isError && (
            <div className="absolute bottom-2 left-2 z-[3] flex items-center px-[6px] py-[2px] rounded text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                {formatDuration(thumb.duration)}
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
const VideoMessage = memo(({ choose, msg, chat, videos, isPending, isSent, senderName, senderProfile, sendTime, caption, formattedTime, hasOtherIds }) => {
    const hasCaption = caption && caption.trim().length > 0;
    const isError = msg?._isError;
    

    const renderTextWithLinks = (textContent) => {
        if (!textContent) return null;
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;
        const parts = textContent.split(urlRegex);
        return parts.map((part, i) => {
            if (!part) return null;
            if (part.match(urlRegex)) {
                let url = part;
                if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
                return <span key={i} className="text-[#6F57D0] underline cursor-pointer font-semibold" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>{part}</span>;
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };

    const videosKey = videos.map(v => v._id || v.url).join(',');
    const [thumbnails, setThumbnails] = useState(() => videos.map((vid) => thumbCache.get(vid.url) || null));

    const prevThumbsKey = useRef(videosKey);
    if (prevThumbsKey.current !== videosKey) {
        prevThumbsKey.current = videosKey;
        setThumbnails(videos.map((vid) => thumbCache.get(vid.url) || null));
    }

    const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

    const isViewerPushedRef = useRef(false);

    // Sync viewerState with history
    useEffect(() => {
        if (viewerState.isOpen) {
            if (!isViewerPushedRef.current) {
                isViewerPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, mediaViewerOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isViewerPushedRef.current) {
                isViewerPushedRef.current = false;
                if (window.history.state?.mediaViewerOpen) {
                    window.history.back();
                }
            }
        }
    }, [viewerState.isOpen]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (viewerState.isOpen && !e.state?.mediaViewerOpen) {
                isViewerPushedRef.current = false;
                setViewerState(prev => ({ ...prev, isOpen: false }));
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [viewerState.isOpen]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    const [showOverlay, setShowOverlay] = useState(isPending || isError);
    const wasPending = useRef(isPending);
    useEffect(() => {
        if (wasPending.current && !isPending && !isError) {
            const t = setTimeout(() => setShowOverlay(false), 400);
            return () => clearTimeout(t);
        }
        if (isError) setShowOverlay(true);
        wasPending.current = isPending;
    }, [isPending, isError]);

    const lockedUrls = useRef(null);
    const prevVideosRef = useRef(null);
    const prevVideosKey = useRef(null);
    if (!lockedUrls.current || prevVideosKey.current !== videosKey) {
        const oldUrlMap = new Map();
        if (prevVideosRef.current && lockedUrls.current) {
            prevVideosRef.current.forEach((oldVid, i) => {
                const key = oldVid._id || oldVid.url;
                if (key && lockedUrls.current[i]) oldUrlMap.set(key.toString(), lockedUrls.current[i]);
            });
        }
        lockedUrls.current = videos.map((vid) => {
            const key = vid._id || vid.url;
            const oldUrl = key ? oldUrlMap.get(key.toString()) : null;
            if (oldUrl?.startsWith('blob:') && vid.url && !vid.url.startsWith('blob:')) return oldUrl;
            return vid.url;
        });
        prevVideosRef.current = videos;
        prevVideosKey.current = videosKey;
    }

    useEffect(() => {
        let cancelled = false;
        Promise.all(lockedUrls.current.map((url) => getVideoThumbnail(url))).then((results) => {
            if (!cancelled) setThumbnails(results);
        });
        return () => { cancelled = true; };
    }, [videosKey]); // eslint-disable-line

    const openViewer = (index) => setViewerState({ isOpen: true, index });
    const closeViewer = () => setViewerState({ isOpen: false, index: 0 });
    const isSingle = videos.length === 1;

    if (isSingle) {
        const thumb = thumbnails[0];
        const isLoading = !thumb;
        const MAX_W = 380, MAX_H = 320;
        let containerStyle = { maxWidth: MAX_W, maxHeight: MAX_H, aspectRatio: '16/9' };
        if (thumb?.w && thumb?.h) {
            const ratio = thumb.w / thumb.h;
            let finalW = Math.min(thumb.w, MAX_W);
            let finalH = finalW / ratio;
            if (finalH > MAX_H) { finalH = MAX_H; finalW = finalH * ratio; }
            containerStyle = { width: finalW, height: finalH };
        }

        return (
            <div style={{ width: containerStyle.width || 300, maxWidth: '100%' }} className="flex flex-col">
                <div className="relative overflow-hidden" style={{ width: '100%', height: containerStyle.height || (300 * 9 / 16), aspectRatio: containerStyle.aspectRatio }}>
                    <VideoTile
                        thumb={thumb}
                        isLoading={isLoading}
                        isPending={isPending}
                        isError={isError}
                        onClick={() => openViewer(0)}
                        style={{ width: '100%', height: '100%' }}
                    />

                    {/* WhatsApp-style upload / error overlay */}
                    {showOverlay && (
                        <UploadOverlay isPending={isPending} isError={isError} onRetry={msg?._onRetry} />
                    )}

                    {/* Time badge */}
                    {!hasCaption && !isError && (
                        <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                            {formattedTime}
                            {isSent && !isError && (isPending ? <TbClockHour4 size={14} /> : hasOtherIds ? <TbChecks size={14} /> : <TbCheck size={14} />)}
                        </div>
                    )}
                    {!hasCaption && isError && (
                        <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}>
                            {formattedTime} · Failed
                        </div>
                    )}
                </div>

                {hasCaption && (
                    <div className="px-3 py-2 flex items-end gap-1">
                        {renderTextWithLinks(caption)}
                        <span className="flex items-center gap-1 ml-2 text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: isError ? '#ef4444' : (isSent ? '#166534' : '#6b7280') }}>
                            {formattedTime}
                            {isSent && !isError && (isPending ? <TbClockHour4 size={16} /> : hasOtherIds ? <TbChecks size={16} /> : <TbCheck size={16} />)}
                        </span>
                    </div>
                )}

                {viewerState.isOpen && (
                    <VideoViewer choose={choose} chatId={chat?._id} msg={msg} videos={videos} initialIndex={viewerState.index} onClose={closeViewer} senderName={senderName} senderProfile={senderProfile} sendTime={sendTime} />
                )}
            </div>
        );
    }

    // ── MULTIPLE VIDEOS ──────────────────────────────────────────────────────
    const total = videos.length;
    const maxVisible = MAX_VISIBLE(total);
    const visibleCount = Math.min(total, maxVisible);
    const hiddenCount = total - visibleCount;
    const visibleVideos = videos.slice(0, visibleCount);
    const { container, getCellClass } = getGridConfig(visibleCount);

    return (
        <div className="w-[300px] sm:w-[380px] md:w-[460px] max-w-full flex flex-col">
            <div className={`relative overflow-hidden grid gap-[2px] w-full ${container}`}>
                {visibleVideos.map((vid, i) => {
                    const thumb = thumbnails[i];
                    const isLoading = !thumb;
                    const isLastVisible = i === visibleCount - 1;
                    const showBadge = isLastVisible && hiddenCount > 0;

                    return (
                        <div key={i} className={`relative overflow-hidden bg-gray-900 ${getCellClass(i)}`}>
                            <VideoTile
                                thumb={thumb}
                                isLoading={isLoading}
                                isPending={isPending}
                                isError={isError}
                                onClick={() => openViewer(i)}
                                style={{ width: '100%', height: '100%' }}
                                playSize={visibleCount > 2 ? 32 : 48}
                            />
                            {showBadge && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/55 z-[2] cursor-pointer" onClick={() => { if (!isPending && !isError) openViewer(i); }}>
                                    <span className="text-white font-semibold text-2xl select-none drop-shadow">+{hiddenCount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {showOverlay && (
                    <UploadOverlay isPending={isPending} isError={isError} onRetry={msg?._onRetry} />
                )}

                {!hasCaption && !isError && (
                    <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                        {formattedTime}
                        {isSent && !isError && (isPending ? <TbClockHour4 size={14} /> : hasOtherIds ? <TbChecks size={14} /> : <TbCheck size={14} />)}
                    </div>
                )}
                {!hasCaption && isError && (
                    <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}>
                        {formattedTime} · Failed
                    </div>
                )}
            </div>

            {hasCaption && (
                <div className="px-3 py-2 flex items-end gap-1">
                    {renderTextWithLinks(caption)}
                    <span className="flex items-center gap-1 ml-2 text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: isError ? '#ef4444' : (isSent ? '#166534' : '#6b7280') }}>
                        {formattedTime}
                        {isSent && !isError && (isPending ? <TbClockHour4 size={16} /> : hasOtherIds ? <TbChecks size={16} /> : <TbCheck size={16} />)}
                    </span>
                </div>
            )}

            {viewerState.isOpen && (
                <VideoViewer choose={choose} chatId={chat?._id} msg={msg} videos={videos} initialIndex={viewerState.index} onClose={closeViewer} senderName={senderName} senderProfile={senderProfile} sendTime={sendTime} />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    if (prevProps.choose !== nextProps.choose) return false;
    if (prevProps.isPending !== nextProps.isPending) return false;
    if (prevProps.msg?._isError !== nextProps.msg?._isError) return false;
    if (prevProps.senderName !== nextProps.senderName) return false;
    if (prevProps.videos.length !== nextProps.videos.length) return false;
    return prevProps.videos.every((v, i) => v.url === nextProps.videos[i]?.url);
});

export default VideoMessage;
