import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdEdit, MdDeleteOutline, MdAdd } from 'react-icons/md';
import { BiWinkSmile } from 'react-icons/bi';
import { FaTelegramPlane } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageEditor from './ImageEditor';
import toast from 'react-hot-toast';

// ── Hook: natural image dimensions ───────────────────────────────────────────
function useImageDimensions(url) {
    const [dims, setDims] = useState(null);
    useEffect(() => {
        if (!url) return;
        const img = new Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => setDims({ w: 1, h: 1 });
        img.src = url;
    }, [url]);
    return dims;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEGRAM-STYLE MOSAIC LAYOUT — Shows ALL photos, no cap, no +N badge
// ═══════════════════════════════════════════════════════════════════════════════

const GAP = 3;
const OPTIMAL_ROW_H = 200;
const MIN_ROW_H = 80;
const MAX_ROW_H = 300;

function clampRatio(d) {
    if (!d || !d.w || !d.h) return 1;
    return Math.max(0.5, Math.min(2.5, d.w / d.h));
}

function buildRow(ratios, indices, W) {
    const rowR = indices.map(i => ratios[i]);
    const totalGap = GAP * (indices.length - 1);
    const h = (W - totalGap) / rowR.reduce((a, b) => a + b, 0);
    return {
        height: h,
        items: indices.map((idx, k) => ({ index: idx, width: rowR[k] * h })),
    };
}

function layoutAllPhotos(dims, W) {
    const n = dims.length;
    if (!n) return [];
    const ratios = dims.map(d => clampRatio(d));

    // 1 photo
    if (n === 1) return [buildRow(ratios, [0], W)];

    // 2 photos — side by side, or stacked if both very wide & similar
    if (n === 2) {
        if (ratios[0] > 1.3 && ratios[1] > 1.3 && Math.abs(ratios[0] - ratios[1]) < 0.3) {
            const h = Math.min(W / ratios[0], W / ratios[1], MAX_ROW_H);
            return [
                { height: h, items: [{ index: 0, width: W }] },
                { height: h, items: [{ index: 1, width: W }] },
            ];
        }
        return [buildRow(ratios, [0, 1], W)];
    }

    // 3 photos — special: portrait-first → left big + 2 stacked right
    if (n === 3) {
        if (ratios[0] > 1.1) {
            // wide first → big top, 2 below
            const topH = Math.min(W / ratios[0], MAX_ROW_H);
            return [
                { height: topH, items: [{ index: 0, width: W }] },
                buildRow(ratios, [1, 2], W),
            ];
        }
        // portrait first → left big + 2 stacked right
        const totalH = Math.min(W * 0.7, MAX_ROW_H * 1.5);
        const leftW = (W - GAP) * ratios[0] / (ratios[0] + Math.max(ratios[1], ratios[2]));
        const rightW = W - GAP - leftW;
        const sideH = (totalH - GAP) / 2;
        return [{
            height: totalH, _complex: true,
            items: [
                { index: 0, width: leftW, height: totalH },
                { index: 1, width: rightW, height: sideH, _right: true },
                { index: 2, width: rightW, height: sideH, _right: true },
            ],
        }];
    }

    // 4 photos
    if (n === 4) {
        if (ratios[0] > 1.1) {
            return [
                { height: Math.min(W / ratios[0], MAX_ROW_H), items: [{ index: 0, width: W }] },
                buildRow(ratios, [1, 2, 3], W),
            ];
        }
        return [buildRow(ratios, [0, 1], W), buildRow(ratios, [2, 3], W)];
    }

    // 5+ photos: find best split into rows of 2–3
    const score = (splits) => {
        let cursor = 0, s = 0;
        for (const size of splits) {
            const indices = Array.from({ length: size }, (_, k) => cursor + k);
            cursor += size;
            const rr = indices.map(i => ratios[i]);
            const h = (W - GAP * (size - 1)) / rr.reduce((a, b) => a + b, 0);
            if (h < MIN_ROW_H) s -= 3000;
            else if (h > MAX_ROW_H) s -= (h - MAX_ROW_H) * 4;
            else s -= Math.abs(h - OPTIMAL_ROW_H) * 0.8;
        }
        s -= splits.length * 8;
        return s;
    };

    let bestSplits = null;
    let bestScore = -Infinity;
    const generate = (rem, acc) => {
        if (rem === 0) {
            const s = score(acc);
            if (s > bestScore) { bestScore = s; bestSplits = [...acc]; }
            return;
        }
        for (let k = 1; k <= Math.min(rem, 3); k++) {
            if (k === 1 && rem > 1 && acc.length > 0) continue;
            acc.push(k);
            generate(rem - k, acc);
            acc.pop();
        }
    };
    generate(n, []);

    if (!bestSplits) bestSplits = [n]; // fallback: all in one row

    let cursor = 0;
    return bestSplits.map(size => {
        const indices = Array.from({ length: size }, (_, k) => cursor + k);
        cursor += size;
        return buildRow(ratios, indices, W);
    });
}

// ── Single Cell ──────────────────────────────────────────────────────────────
function Cell({ entry, url, width, height, onEdit, onRemove, index, radius }) {
    const isImg = entry?.type === 'image' || entry?.file?.type?.startsWith('image/');
    const isVid = entry?.type === 'video' || entry?.file?.type?.startsWith('video/');
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const [duration, setDuration] = useState(0);

    const formatDuration = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="group" style={{
            width, height, position: 'relative', overflow: 'hidden',
            background: '#e0e0e0', flexShrink: 0, borderRadius: radius || 0,
        }}>
            {!mediaLoaded && (
                <div className="absolute inset-0 z-10 w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {isImg && url && <img src={url} alt="" draggable={false}
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.2s' }} />}

            {isVid && url && <video src={url}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onLoadedData={() => setMediaLoaded(true)}
                onError={() => setMediaLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: mediaLoaded ? 1 : 0, transition: 'opacity 0.2s' }} />}

            {isVid && mediaLoaded && (
                <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[11px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 z-20">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    {formatDuration(duration)}
                </div>
            )}

            {mediaLoaded && (
                <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ zIndex: 20 }}>
                    {isImg && onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(index); }}
                            className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-lg text-white cursor-pointer">
                            <MdEdit size={14} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                        className="p-1.5 bg-black/50 hover:bg-red-600/80 backdrop-blur-md rounded-lg text-white cursor-pointer">
                        <MdDeleteOutline size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Mosaic Preview (ALL photos, scrollable) ──────────────────────────────────
function MosaicPreview({ fileList, previewUrls, onEdit, onRemove, containerW }) {
    const [imageDims, setImageDims] = useState({});

    useEffect(() => {
        let cancelled = false;
        fileList.forEach((entry, i) => {
            if (imageDims[i]) return;
            const url = previewUrls[i];
            const isImg = entry.type === 'image' || entry.file?.type?.startsWith('image/');
            const isVid = entry.type === 'video' || entry.file?.type?.startsWith('video/');
            if (!url) return;
            if (isImg) {
                const img = new Image();
                img.onload = () => {
                    if (!cancelled) setImageDims(p => ({ ...p, [i]: { w: img.naturalWidth, h: img.naturalHeight } }));
                };
                img.src = url;
            } else if (isVid) {
                const v = document.createElement('video');
                v.onloadedmetadata = () => {
                    if (!cancelled) setImageDims(p => ({ ...p, [i]: { w: v.videoWidth || 16, h: v.videoHeight || 9 } }));
                };
                v.src = url;
            }
        });
        return () => { cancelled = true; };
    }, [previewUrls, fileList.length]);

    const dims = fileList.map((_, i) => imageDims[i] || null);
    const rows = layoutAllPhotos(dims, containerW);

    if (!rows.length) return null;

    const R = 12;
    const totalRows = rows.length;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: '10px 12px' }}>
            <div style={{
                flex: 1, minHeight: 0,
                overflowY: 'auto', overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
                display: 'flex', flexDirection: 'column', gap: GAP,
                borderRadius: R,
            }}>
                {rows.map((row, rIdx) => {
                    const isFirst = rIdx === 0;
                    const isLast = rIdx === totalRows - 1;

                    if (row._complex) {
                        const [left, ...rights] = row.items;
                        const rightW = rights[0].width;
                        const sideH = rights[0].height;
                        return (
                            <div key={rIdx} style={{ display: 'flex', gap: GAP, height: row.height, flexShrink: 0 }}>
                                <Cell entry={fileList[left.index]} url={previewUrls[left.index]}
                                    width={left.width} height={row.height}
                                    onEdit={onEdit} onRemove={onRemove} index={left.index}
                                    radius={`${isFirst ? R : 0}px 0 0 ${isLast ? R : 0}px`} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: rightW, flexShrink: 0 }}>
                                    {rights.map((it, k) => (
                                        <Cell key={it.index} entry={fileList[it.index]} url={previewUrls[it.index]}
                                            width={rightW} height={sideH}
                                            onEdit={onEdit} onRemove={onRemove} index={it.index}
                                            radius={k === 0
                                                ? `0 ${isFirst ? R : 0}px 0 0`
                                                : `0 0 ${isLast ? R : 0}px 0`} />
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={rIdx} style={{ display: 'flex', gap: GAP, height: row.height, flexShrink: 0 }}>
                            {row.items.map((it, iIdx) => {
                                const isFirstCol = iIdx === 0;
                                const isLastCol = iIdx === row.items.length - 1;
                                const tl = isFirst && isFirstCol ? R : 0;
                                const tr = isFirst && isLastCol ? R : 0;
                                const br = isLast && isLastCol ? R : 0;
                                const bl = isLast && isFirstCol ? R : 0;
                                return (
                                    <Cell key={it.index} entry={fileList[it.index]} url={previewUrls[it.index]}
                                        width={it.width} height={row.height}
                                        onEdit={onEdit} onRemove={onRemove} index={it.index}
                                        radius={`${tl}px ${tr}px ${br}px ${bl}px`} />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Single image preview ──────────────────────────────────────────────────────
function SingleImagePreview({ url, onEdit }) {
    const dims = useImageDimensions(url);
    const isPortrait = dims ? dims.w / dims.h < 0.85 : false;
    const imgStyle = isPortrait
        ? { maxHeight: '58vh', width: 'auto', maxWidth: '100%', objectFit: 'contain' }
        : { width: '100%', maxHeight: '48vh', objectFit: 'contain' };
    return (
        <div className="flex-1 flex items-center justify-center overflow-hidden relative group"
            style={{ minHeight: 0, padding: '10px 12px' }}>
            <img src={url} alt="" draggable={false}
                style={{ ...imgStyle, borderRadius: 14, boxShadow: '0 2px 24px rgba(0,0,0,0.13)', display: 'block' }} />
            {onEdit && (
                <button onClick={onEdit}
                    className="absolute bottom-4 right-5 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl text-white transition opacity-0 group-hover:opacity-100 cursor-pointer">
                    <MdEdit size={18} />
                </button>
            )}
        </div>
    );
}

// ── Single video preview ──────────────────────────────────────────────────────
function SingleVideoPreview({ url }) {
    return (
        <div className="flex-1 flex items-center justify-center overflow-hidden"
            style={{ minHeight: 0, padding: '10px 12px' }}>
            <video src={url} controls
                style={{ maxHeight: '56vh', width: '100%', objectFit: 'contain', borderRadius: 14, boxShadow: '0 2px 24px rgba(0,0,0,0.13)' }} />
        </div>
    );
}

// ── Document/file list preview ────────────────────────────────────────────────
function DocListPreview({ fileList, previewUrls, onRemove, videoDurations, setVideoDurations, getFileColorAndLabel, formatFileSize }) {
    return (
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, scrollbarWidth: 'none' }}>
            {fileList.map((entry, i) => {
                const { file: f, type: fType } = entry;
                const isImg = fType === 'image' || f?.type?.startsWith('image/');
                const isVid = fType === 'video' || f?.type?.startsWith('video/');
                const url = previewUrls[i];
                const iconData = getFileColorAndLabel(f?.name || '');
                return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            {isImg && url ? <img src={url} alt="" className="w-full h-full object-cover rounded-xl" /> :
                                isVid && url ? (
                                    <>
                                        <video src={url} className="w-full h-full object-cover rounded-xl" />
                                        {!videoDurations[i] && <video src={url} className="hidden" onLoadedMetadata={(e) => setVideoDurations(p => ({ ...p, [i]: e.target.duration }))} />}
                                    </>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl relative flex items-center justify-center shadow" style={{ background: iconData.gradient }}>
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-white/20" style={{ borderBottomLeftRadius: 8, borderTopRightRadius: 10 }} />
                                        <span className="text-white font-bold text-xs">{iconData.label}</span>
                                    </div>
                                )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-medium text-[15px] truncate">{f?.name}</h3>
                            <p className="text-gray-500 text-sm">{formatFileSize(f?.size)}</p>
                        </div>
                        <button onClick={() => onRemove(i)} className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer">
                            <MdDeleteOutline size={22} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POPUP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MediaPreviewPopup({ files = [], source, onClose, onSend, onAddMore }) {
    const [fileList, setFileList] = useState(files);
    const [activeIndex, setActiveIndex] = useState(0);
    const [caption, setCaption] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [videoDurations, setVideoDurations] = useState({});
    const [previewUrls, setPreviewUrls] = useState({});
    const [containerW, setContainerW] = useState(416);
    const popupRef = useRef(null);
    const emojiTimer = useRef(null);
    const addInputRef = useRef(null);

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

    useEffect(() => {
        let currentTotalSize = 0;
        let skippedCount = 0;
        const validFiles = [];
        for (const f of files) {
            const size = f.file?.size || 0;
            if (currentTotalSize + size > MAX_FILE_SIZE) {
                skippedCount++;
            } else {
                currentTotalSize += size;
                validFiles.push(f);
            }
        }
        if (skippedCount > 0) {

            toast.error(`${skippedCount} file(s) exceeded the 30MB total limit and were removed.`);
        }
        setFileList(validFiles);
    }, [files]);

    // Measure popup width so mosaic uses exact pixel widths
    useEffect(() => {
        if (!popupRef.current) return;
        const obs = new ResizeObserver(([e]) => {
            setContainerW(e.contentRect.width - 24); // 12px padding each side
        });
        obs.observe(popupRef.current);
        return () => obs.disconnect();
    }, []);

    // Build blob URLs
    useEffect(() => {
        const urls = {};
        fileList.forEach((entry, i) => {
            const isMedia = entry.type === 'image' || entry.type === 'video'
                || entry.file?.type?.startsWith('image/') || entry.file?.type?.startsWith('video/');
            if (entry.file && isMedia) urls[i] = URL.createObjectURL(entry.file);
        });
        setPreviewUrls(urls);
        return () => Object.values(urls).forEach(u => URL.revokeObjectURL(u));
    }, [fileList]);

    if (!fileList.length) return null;

    const isAllImages = fileList.every(f => f.type === 'image' || f?.file?.type?.startsWith('image/'));
    const isAllVideos = fileList.every(f => f.type === 'video' || f?.file?.type?.startsWith('video/'));
    const isAllMedia = fileList.every(f =>
        f.type === 'image' || f.type === 'video' ||
        f?.file?.type?.startsWith('image/') || f?.file?.type?.startsWith('video/')
    );
    const isDocMode = !isAllMedia;
    const isSingle = fileList.length === 1;
    const firstIsImg = fileList[0]?.type === 'image' || fileList[0]?.file?.type?.startsWith('image/');
    const firstIsVid = fileList[0]?.type === 'video' || fileList[0]?.file?.type?.startsWith('video/');

    const titleText = isSingle
        ? (firstIsImg ? 'Send Photo' : firstIsVid ? 'Send Video' : 'Send File')
        : isAllImages ? `Send ${fileList.length} Photos`
            : isAllVideos ? `Send ${fileList.length} Videos`
                : `Send ${fileList.length} Files`;

    const formatFileSize = (b) => {
        if (!b) return '0 B';
        const k = 1024, sz = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / k ** i).toFixed(1)) + ' ' + sz[i];
    };
    const getFileColorAndLabel = (filename) => {
        const ext = (filename || '').split('.').pop().toLowerCase();
        const map = {
            pdf: { gradient: 'linear-gradient(135deg,#EF5350,#C62828)', label: 'PDF' },
            apk: { gradient: 'linear-gradient(135deg,#9CCC65,#558B2F)', label: 'APK' },
            zip: { gradient: 'linear-gradient(135deg,#FFD54F,#F57F17)', label: 'ZIP' },
            rar: { gradient: 'linear-gradient(135deg,#FFD54F,#F57F17)', label: 'RAR' },
            doc: { gradient: 'linear-gradient(135deg,#64B5F6,#1565C0)', label: 'DOC' },
            docx: { gradient: 'linear-gradient(135deg,#64B5F6,#1565C0)', label: 'DOC' },
            xls: { gradient: 'linear-gradient(135deg,#66BB6A,#2E7D32)', label: 'XLS' },
            xlsx: { gradient: 'linear-gradient(135deg,#66BB6A,#2E7D32)', label: 'XLS' },
            ppt: { gradient: 'linear-gradient(135deg,#FF8A65,#D84315)', label: 'PPT' },
            txt: { gradient: 'linear-gradient(135deg,#BDBDBD,#616161)', label: 'TXT' },
        };
        return map[ext] || { gradient: 'linear-gradient(135deg,#78909C,#37474F)', label: ext.substring(0, 4).toUpperCase() || 'FILE' };
    };

    const handleSend = () => onSend(fileList, caption);
    const handleRemove = (index) => {
        const next = fileList.filter((_, i) => i !== index);
        if (!next.length) { onClose(); return; }
        setFileList(next);
        // Also inform parent if possible, but component uses its own state for now.
    };

    const handleAddMore = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;
        setIsProcessing(true);

        setTimeout(() => {
            let skippedCount = 0;
            let currentTotalSize = fileList.reduce((acc, f) => acc + (f.file?.size || 0), 0);
            const uniqueNewFiles = [];

            for (const newFile of newFiles) {
                const isDuplicate = fileList.some(existing =>
                    existing.file?.name === newFile.name &&
                    existing.file?.size === newFile.size &&
                    existing.file?.lastModified === newFile.lastModified
                ) || uniqueNewFiles.some(f =>
                    f.file.name === newFile.name &&
                    f.file.size === newFile.size &&
                    f.file.lastModified === newFile.lastModified
                );

                if (isDuplicate) continue;

                if (currentTotalSize + newFile.size > MAX_FILE_SIZE) {
                    skippedCount++;
                    continue;
                }

                currentTotalSize += newFile.size;
                uniqueNewFiles.push({
                    file: newFile,
                    type: newFile.type.startsWith('image/') ? 'image' : newFile.type.startsWith('video/') ? 'video' : 'document',
                });
            }

            if (skippedCount > 0) {

                toast.error(`${skippedCount} file(s) exceeded the 30MB total limit and were skipped.`);
            }

            if (uniqueNewFiles.length > 0) {
                setFileList(prev => [...prev, ...uniqueNewFiles]);
            }
            setIsProcessing(false);
        }, 50);

        e.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
            {/* Popup card */}
            <div ref={popupRef} style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: 440,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid #e5e7eb' // subtle border since background is white
            }} className="sm:rounded-[20px] rounded-t-[20px]">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
                    <button onClick={onClose}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexShrink: 0 }}>
                        <MdClose size={20} />
                    </button>
                    <span style={{ color: '#111', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', flex: 1 }}>
                        {titleText}
                    </span>
                    {/* Add more photos button in header */}
                    {!isDocMode && (
                        <label style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', flexShrink: 0 }}
                            title="Add more photos">
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-[#8774FE] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <MdAdd size={20} />
                            )}
                            <input ref={addInputRef} type="file" accept={isAllImages && !isAllVideos ? "image/*" : isAllVideos && !isAllImages ? "video/*" : "image/*,video/*"} multiple className="hidden"
                                onChange={handleAddMore} disabled={isProcessing} />
                        </label>
                    )}
                </div>

                {/* ── Preview area ────────────────────────────────────────── */}
                {isDocMode ? (
                    <DocListPreview
                        fileList={fileList} previewUrls={previewUrls}
                        onRemove={handleRemove}
                        videoDurations={videoDurations} setVideoDurations={setVideoDurations}
                        getFileColorAndLabel={getFileColorAndLabel} formatFileSize={formatFileSize}
                    />
                ) : isSingle ? (
                    firstIsImg
                        ? <SingleImagePreview url={previewUrls[0]} onEdit={() => setIsEditing(true)} />
                        : firstIsVid
                            ? <SingleVideoPreview url={previewUrls[0]} />
                            : null
                ) : (
                    <MosaicPreview
                        fileList={fileList}
                        previewUrls={previewUrls}
                        onEdit={(i) => { setActiveIndex(i); setIsEditing(true); }}
                        onRemove={handleRemove}
                        containerW={containerW}
                    />
                )}

                {/* ── Caption + Send ──────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px 14px',
                    background: '#ffffff', flexShrink: 0,
                    borderTop: '1px solid #f0f0f0',
                }}>
                    <div className="relative"
                        onMouseEnter={() => { clearTimeout(emojiTimer.current); setShowEmoji(true); }}
                        onMouseLeave={() => { emojiTimer.current = setTimeout(() => setShowEmoji(false), 300); }}>
                        <button style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BiWinkSmile size={24} />
                        </button>
                        <AnimatePresence>
                            {showEmoji && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 15 }}
                                    transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                                    className="absolute bottom-[48px] left-0 z-[10000] shadow-2xl rounded-xl overflow-hidden border border-gray-100"
                                    style={{ transformOrigin: 'bottom left' }}
                                >
                                    <EmojiPicker
                                        searchDisabled={true}
                                        onEmojiClick={(d) => setCaption(p => p + d.emoji)}
                                        theme="light" previewConfig={{ showPreview: false }}
                                        height={300} width={280}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <input type="text" value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption..."
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#111', fontSize: 15 }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    />
                    <button onClick={handleSend}
                        style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#8774FE,#7B5FE8)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(135,116,254,0.35)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(135,116,254,0.55)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(135,116,254,0.35)'; }}>
                        <FaTelegramPlane size={20} color="white" style={{ marginLeft: 2 }} />
                    </button>
                </div>
            </div>

            {/* Image editor */}
            {isEditing && fileList[activeIndex] &&
                (fileList[activeIndex].type === 'image' || fileList[activeIndex].file?.type?.startsWith('image/')) &&
                previewUrls[activeIndex] && (
                    <ImageEditor
                        imageUrl={previewUrls[activeIndex]}
                        onCancel={() => setIsEditing(false)}
                        onSave={(blob) => {
                            const newFile = new File([blob], fileList[activeIndex].file.name, { type: 'image/jpeg' });
                            const updated = [...fileList];
                            updated[activeIndex] = { ...updated[activeIndex], file: newFile };
                            setFileList(updated);
                            setIsEditing(false);
                        }}
                    />
                )}

            <style>{`
                input::placeholder { color: #9ca3af; }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
