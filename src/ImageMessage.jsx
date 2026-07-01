import React, { useState, useRef, useEffect, memo } from "react";
import { TbCheck, TbChecks, TbClockHour4 } from "react-icons/tb";
import CustomImageViewer from "./CustomImageViewer";

// ── Dimension cache backed by localStorage (survives page refresh) ────────────
const LS_KEY = 'img_dim_cache';
const _stored = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; } })();
const dimCache = new Map(Object.entries(_stored));

function getCachedDims(url) { return dimCache.get(url) || null; }

function setCachedDims(url, dims) {
    dimCache.set(url, dims);
    try {
        if (dimCache.size > 500) dimCache.delete(dimCache.keys().next().value);
        localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(dimCache)));
    } catch { /* quota errors */ }
}

// ── Async preload + cache ─────────────────────────────────────────────────────
function preloadDims(url) {
    return new Promise((resolve) => {
        if (dimCache.has(url)) return resolve(dimCache.get(url));
        const img = new Image();
        img.onload = () => { const d = { w: img.naturalWidth, h: img.naturalHeight }; setCachedDims(url, d); resolve(d); };
        img.onerror = () => resolve({ w: null, h: null });
        img.src = url;
    });
}

// ── Cloudinary thumbnail (low‑quality preview) ────────────────────────────────
function getThumbUrl(url) {
    if (!url || url.startsWith('blob:')) return url;
    if (url.includes('res.cloudinary.com')) return url.replace('/upload/', '/upload/w_400,q_40,f_auto/');
    return url;
}

// ── Resolve initial dimensions (props → cache → null) ─────────────────────────
function resolveInitialDims(img) {
    if (img.w && img.h) return { w: img.w, h: img.h };
    const cached = getCachedDims(img.url);
    if (cached?.w) return cached;
    return null;
}

// ── WhatsApp-style: max visible tiles = 4 (for ≤4 imgs) or 5 (for 5+ imgs) ───
const MAX_VISIBLE = (total) => total <= 4 ? 4 : 5;

// ── Grid layout config for visible tile count ─────────────────────────────────
const getGridConfig = (visibleCount) => {
    if (visibleCount === 2) return { container: "grid-cols-2 aspect-[2/1]", getCellClass: () => "col-span-1" };
    if (visibleCount === 3) return { container: "grid-cols-2 grid-rows-2 aspect-[4/3]", getCellClass: (i) => i === 0 ? "row-span-2" : "col-span-1" };
    if (visibleCount === 4) return { container: "grid-cols-2 grid-rows-2 aspect-square", getCellClass: () => "col-span-1" };
    return { container: "grid-cols-6 grid-rows-2 aspect-[4/3]", getCellClass: (i) => i < 2 ? "col-span-3" : "col-span-2" };
};

// ── WhatsApp-style circular progress ring ────────────────────────────────────
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

// ── Upload / Error overlay — two-phase: upload (0→85%) + processing (85→100%) ────────────
const UploadOverlay = ({ isPending, isError, onRetry }) => {
    const overlayRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('upload'); // 'upload' | 'processing'
    const rafRef = useRef(null);
    const prevPct = useRef(0);
    const processingStart = useRef(null);
    const PROCESSING_DURATION = 8000; // animate 85→100 over ~8s while Cloudinary works

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
                            // Upload done, Cloudinary is now processing
                            if (!processingStart.current) {
                                processingStart.current = Date.now();
                                setPhase('processing');
                            }
                        } else {
                            setPhase('upload');
                        }
                    } else if (prevPct.current >= 84 && processingStart.current) {
                        // Animate progress from 85 → 99 while waiting for Cloudinary
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
            {/* Phase label */}
            <span style={{
                color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600, marginTop: 6,
                background: 'rgba(0,0,0,0.35)', padding: '2px 8px', borderRadius: 8, letterSpacing: '0.02em'
            }}>
                {phase === 'processing' ? 'Processing…' : 'Uploading…'}
            </span>
            {/* Bottom thin bar — ChatArea sets style.width directly on this element */}
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

const ImageMessage = memo(({ choose, msg, chat, images, isPending, senderName, isSent, senderProfile, sendTime, caption, formattedTime, hasOtherIds, returnData }) => {
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
                return (
                    <span key={i} className="text-[#6F57D0] underline cursor-pointer font-semibold"
                        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
                        {part}
                    </span>
                );
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };

    const lockedUrls = useRef(null);
    const prevImagesRef = useRef(null);
    const prevImagesKey = useRef(null);
    const imagesKey = images.map(img => img._id || img.url).join(',');
    if (!lockedUrls.current || prevImagesKey.current !== imagesKey) {
        lockedUrls.current = images.map((img) => img.url);
        prevImagesRef.current = images;
        prevImagesKey.current = imagesKey;
    }

    const [dims, setDims] = useState(() => images.map(img => {
        const d = resolveInitialDims(img);
        if (d?.w && img.url && !dimCache.has(img.url)) setCachedDims(img.url, d);
        return d;
    }));

    const prevDimsKey = useRef(imagesKey);
    if (prevDimsKey.current !== imagesKey) {
        prevDimsKey.current = imagesKey;
        const newDims = images.map(img => {
            const d = resolveInitialDims(img);
            if (d?.w && img.url && !dimCache.has(img.url)) setCachedDims(img.url, d);
            return d;
        });
        setDims(newDims);
    }

    const [loaded, setLoaded] = useState(() => {
        const init = {};
        lockedUrls.current.forEach((url, i) => { if (url?.startsWith('blob:') || dimCache.has(url)) init[i] = true; });
        return init;
    });

    const prevLoadedKey = useRef(imagesKey);
    if (prevLoadedKey.current !== imagesKey) {
        prevLoadedKey.current = imagesKey;
        const init = {};
        lockedUrls.current.forEach((url, i) => { if (url?.startsWith('blob:') || dimCache.has(url)) init[i] = true; });
        setLoaded(init);
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
    const openViewer = (index) => setViewerState({ isOpen: true, index });
    const closeViewer = () => setViewerState({ isOpen: false, index: 0 });

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

    useEffect(() => {
        let cancelled = false;
        const missing = dims.map((d, i) => (!d?.w ? lockedUrls.current[i] : null));
        if (missing.every(u => !u)) return;
        Promise.all(missing.map(url => url ? preloadDims(url) : Promise.resolve(null))).then(results => {
            if (cancelled) return;
            setDims(prev => prev.map((d, i) => (results[i]?.w ? results[i] : d)));
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line

    const isSingle = images.length === 1;

    if (isSingle) {
        const img = images[0];
        const url = lockedUrls.current[0];
        const thumbUrl = getThumbUrl(url);
        const isBlob = url?.startsWith('blob:');
        const isLoaded = loaded[0] || isBlob;
        const dim = dims[0];

        const MAX_W = 300;
        const MAX_H = 400;
        let containerStyle = { maxWidth: MAX_W, maxHeight: MAX_H, aspectRatio: 'auto' };
        if (dim?.w && dim?.h) {
            const ratio = dim.w / dim.h;
            let finalW = Math.min(dim.w, MAX_W);
            let finalH = finalW / ratio;
            if (finalH > MAX_H) { finalH = MAX_H; finalW = finalH * ratio; }
            containerStyle = { width: finalW, height: finalH };
        }

        return (
            <div style={{ width: containerStyle.width || 300, maxWidth: '100%' }} className="flex flex-col">
                <div className="relative overflow-hidden" style={{ width: '100%', height: containerStyle.height || 400, aspectRatio: containerStyle.aspectRatio }}>
                    {/* Spinner while loading */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 z-[1] transition-opacity duration-200 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="w-8 h-8 rounded-full border-[3px] border-gray-300 border-t-blue-500 animate-spin" />
                    </div>

                    {/* Image */}
                    <img
                        src={thumbUrl}
                        alt={img.name || ''}
                        decoding={isBlob ? "sync" : "auto"}
                        className={`w-full h-full object-cover transition-opacity duration-400 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${(isPending || isError) ? '' : 'cursor-pointer hover:brightness-95'}`}
                        onLoad={() => { if (!loaded[0]) setLoaded(prev => ({ ...prev, [0]: true })); }}
                        draggable={false}
                        onClick={() => { if (!isPending && !isError) openViewer(0); }}
                    />

                    {/* WhatsApp-style upload / error overlay */}
                    {showOverlay && (
                        <UploadOverlay
                            isPending={isPending}
                            isError={isError}
                            onRetry={msg?._onRetry}
                        />
                    )}

                    {/* Floating time badge (no caption) */}
                    {!hasCaption && !isError && (
                        <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                            {formattedTime}
                            {isSent && !isError && (isPending ? <TbClockHour4 size={14} /> : hasOtherIds ? <TbChecks size={14} /> : <TbCheck size={14} />)}
                        </div>
                    )}
                    {/* Error time badge */}
                    {!hasCaption && isError && (
                        <div className="absolute bottom-2 right-2 z-[3] flex items-center gap-1 px-[6px] py-[2px] rounded-full text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}>
                            {formattedTime} · Failed
                        </div>
                    )}
                </div>

                {/* Caption */}
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
                    <CustomImageViewer
                        choose={(...w) => { choose(...w); }}
                        chatId={chat?._id}
                        msg={msg}
                        images={images}
                        initialIndex={viewerState.index}
                        onClose={closeViewer}
                        senderName={senderName}
                        senderProfile={senderProfile}
                        sendTime={sendTime}
                        returnData={(w) => { }}
                    />
                )}
            </div>
        );
    }

    // ── Multiple images (WhatsApp-style Grid) ──────────────────────────────
    const total = images.length;
    const maxVisible = MAX_VISIBLE(total);
    const visibleCount = Math.min(total, maxVisible);
    const hiddenCount = total - visibleCount;
    const visibleImages = images.slice(0, visibleCount);
    const { container, getCellClass } = getGridConfig(visibleCount);

    return (
        <div className="w-[300px] sm:w-[380px] md:w-[460px] max-w-full flex flex-col">
            <div className={`relative overflow-hidden grid gap-[2px] w-full ${container}`}>
                {visibleImages.map((img, i) => {
                    const url = lockedUrls.current[i] || img.url;
                    const thumbUrl = getThumbUrl(url);
                    const isBlob = url?.startsWith('blob:');
                    const isLoaded = loaded[i] || isBlob;
                    const isLastVisible = i === visibleCount - 1;
                    const showBadge = isLastVisible && hiddenCount > 0;

                    return (
                        <div
                            key={i}
                            className={`relative overflow-hidden bg-gray-100 ${getCellClass(i)}`}
                            style={{ cursor: (isPending || isError) ? 'default' : 'pointer' }}
                            onClick={() => { if (!isPending && !isError) openViewer(i); }}
                        >
                            <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 z-[1] transition-opacity duration-200 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                <div className="w-8 h-8 rounded-full border-[3px] border-gray-300 border-t-blue-500 animate-spin" />
                            </div>
                            <img
                                src={thumbUrl}
                                alt={img.name || ''}
                                decoding={isBlob ? "sync" : "auto"}
                                className={`w-full h-full object-cover transition-opacity duration-400 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${(isPending || isError) ? '' : 'hover:brightness-90'}`}
                                onLoad={() => { if (!loaded[i]) setLoaded(prev => ({ ...prev, [i]: true })); }}
                                draggable={false}
                            />
                            {showBadge && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/55 z-[2]">
                                    <span className="text-white font-semibold text-2xl select-none drop-shadow">+{hiddenCount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* WhatsApp-style upload / error overlay covering grid */}
                {showOverlay && (
                    <UploadOverlay
                        isPending={isPending}
                        isError={isError}
                        onRetry={msg?._onRetry}
                    />
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

            {/* Caption */}
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
                <CustomImageViewer
                    choose={(w) => { choose(w); }}
                    chatId={chat?._id}
                    msg={msg}
                    images={images}
                    initialIndex={viewerState.index}
                    onClose={closeViewer}
                    senderName={senderName}
                    senderProfile={senderProfile}
                    sendTime={sendTime}
                    returnData={(w) => { }}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    if (prevProps.choose !== nextProps.choose) return false;
    if (prevProps.isPending !== nextProps.isPending) return false;
    if (prevProps.msg?._isError !== nextProps.msg?._isError) return false;
    if (prevProps.senderName !== nextProps.senderName) return false;
    if (prevProps.msg !== nextProps.msg) return false;
    if (prevProps.images?.length !== nextProps.images?.length) return false;
    return prevProps.images?.every((img, i) => img.url === nextProps.images[i]?.url);
});

export default ImageMessage;