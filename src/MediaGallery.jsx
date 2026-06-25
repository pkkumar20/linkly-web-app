import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import InfoMediaViewer from './info/InfoMediaViewer';

// ── Persistent thumbnail cache (survives re-renders & re-mounts) ──
const thumbCache = new Map();

/* ── Single grid tile — fully memoized ── */
const MediaTile = memo(({ item, index, isSelected, isSelectionMode, onSelect, onContextMenu, onOpen }) => {
    const type = item.type || 'image';
    const url = item.url;
    const [loaded, setLoaded] = useState(() => thumbCache.has(url));
    const imgRef = useRef(null);

    // Use IntersectionObserver for true lazy loading
    useEffect(() => {
        if (loaded || type === 'video') return;
        const el = imgRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                obs.disconnect();
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    thumbCache.set(url, true);
                    setLoaded(true);
                };
            }
        }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [url, loaded, type]);

    const handleClick = useCallback(() => {
        if (isSelectionMode && onSelect) {
            onSelect(item);
        } else {
            onOpen(index);
        }
    }, [isSelectionMode, onSelect, item, index, onOpen]);

    const handleContext = useCallback((e) => {
        if (onContextMenu) {
            e.preventDefault();
            onContextMenu(e, item);
        }
    }, [onContextMenu, item]);

    return (
        <div
            ref={imgRef}
            className="relative w-full aspect-square cursor-pointer group"
            onClick={handleClick}
            onContextMenu={handleContext}
        >
            <div className={`w-full h-full transition-transform duration-200 ${isSelected ? 'scale-90 rounded-lg overflow-hidden' : ''}`}>
                {type === 'video' ? (
                    <div className="group w-full h-full relative bg-gray-900">
                        <video
                            src={url + '#t=0.1'}
                            className="w-full h-full object-cover group-hover:opacity-90"
                            muted
                            playsInline
                            preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                        </div>
                    </div>
                ) : loaded ? (
                    <img
                        src={url}
                        alt={`media-${index}`}
                        className="w-full h-full object-cover"
                        decoding="async"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                )}
            </div>

            {/* Selection Overlays */}
            {isSelected && (
                <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white pointer-events-none z-10">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
            )}
            {isSelectionMode && !isSelected && (
                <div className="absolute top-1.5 right-1.5 border-2 border-white/80 rounded-full w-5 h-5 pointer-events-none transition-opacity z-10"></div>
            )}
        </div>
    );
});

/* ── Batch size for progressive rendering ── */
const BATCH_SIZE = 30;

const MediaGallery = ({ images, onContextMenu, onForward, selectedItems = [], isSelectionMode = false, onSelect, isCloseViewer }) => {
    const [viewerIndex, setViewerIndex] = useState(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const sentinelRef = useRef(null);

    const isViewerIndexPushedRef = useRef(false);

    // Sync viewerIndex with history
    useEffect(() => {
        if (viewerIndex !== null) {
            if (!isViewerIndexPushedRef.current) {
                isViewerIndexPushedRef.current = true;
                const currentDepth = window.history.state?.modalDepth || 0;
                window.history.pushState({ ...window.history.state, mediaGalleryViewerOpen: true, modalDepth: currentDepth + 1 }, '', window.location.pathname + window.location.hash);
            }
        } else {
            if (isViewerIndexPushedRef.current) {
                isViewerIndexPushedRef.current = false;
                if (window.history.state?.mediaGalleryViewerOpen) {
                    window.history.back();
                }
            }
        }
    }, [viewerIndex]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (viewerIndex !== null && !e.state?.mediaGalleryViewerOpen) {
                isViewerIndexPushedRef.current = false;
                setViewerIndex(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [viewerIndex]);

    useEffect(() => {
        return () => {
            // Unmount cleanup disabled to prevent history lag
        };
    }, []);

    // Memoize normalized images
    const normalizedImages = useMemo(() =>
        images.map((item, idx) => {
            if (typeof item === 'object') {
                return { ...item, _uid: item._uid || `media_${idx}` };
            }
            return { url: item, type: 'image', _uid: `media_${idx}` };
        }),
        [images]
    );

    // Reset visible count when images change (tab switch)
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [images]);

    // Progressive loading via IntersectionObserver on a sentinel element
    useEffect(() => {
        if (visibleCount >= normalizedImages.length) return;
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisibleCount(prev => Math.min(prev + BATCH_SIZE, normalizedImages.length));
            }
        }, { rootMargin: '300px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [visibleCount, normalizedImages.length]);

    useEffect(() => {
        if (isCloseViewer === true) {
            setViewerIndex(null);
        }
    }, [isCloseViewer]);

    // O(1) selection lookups
    const selectedSet = useMemo(() =>
        new Set(selectedItems.map(i => i._uid)),
        [selectedItems]
    );

    const handleOpen = useCallback((index) => {
        setViewerIndex(index);
    }, []);

    const visibleItems = normalizedImages.slice(0, visibleCount);

    return (
        <div>
            {/* Media Grid */}
            <div className="grid grid-cols-3 gap-[2px]">
                {visibleItems.map((item, index) => (
                    <MediaTile
                        key={item._uid}
                        item={item}
                        index={index}
                        isSelected={selectedSet.has(item._uid)}
                        isSelectionMode={isSelectionMode}
                        onSelect={onSelect}
                        onContextMenu={onContextMenu}
                        onOpen={handleOpen}
                    />
                ))}
            </div>

            {/* Sentinel for loading more */}
            {visibleCount < normalizedImages.length && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                    <div className="w-6 h-6 rounded-full border-[3px] border-[#8763ea]/30 border-t-[#8763ea] animate-spin"></div>
                </div>
            )}

            {/* InfoMediaViewer */}
            {viewerIndex !== null && (
                <InfoMediaViewer
                    items={normalizedImages}
                    initialIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onForward={onForward}
                />
            )}
        </div>
    );
};

export default memo(MediaGallery);
