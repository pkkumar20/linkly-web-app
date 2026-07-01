import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from './firebase hooks/AuthContext';
import ForwardPopup from './ForwardPopup';
// ── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l5 5-5 5" /><path d="M20 10H8.5a5.5 5.5 0 0 0 0 11H13" /></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const ChevronLeft = () => <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const ChevronRight = () => <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;

const Loader = () => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'civ-spin 0.7s linear infinite' }} />
    </div>
);

function formatViewerTime(isoTime) {
    if (!isoTime) return '';
    const d = new Date(isoTime);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return `Today at ${hh}:${mm}`;
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${hh}:${mm}`;
    return `${d.toLocaleDateString()} at ${hh}:${mm}`;
}

const Avatar = ({ profile }) => {
    if (profile?.type === 'image' && profile?.imageUrl) return <img src={profile.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    if (profile?.type === 'emoji' && profile?.emoji) return <span style={{ fontSize: 17 }}>{profile.emoji}</span>;
    return <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{profile?.initials || '?'}</span>;
};

// ── Inject keyframes once ────────────────────────────────────────────────────
const STYLE_ID = 'civ-styles-v2';
if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
        @keyframes civ-spin { to { transform: rotate(360deg) } }
        .civ-btn { display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:background 0.18s }
        .civ-btn:hover { background:rgba(255,255,255,0.18) }
        .civ-nav-btn { display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;border:none;background:rgba(0,0,0,0.45);color:#fff;cursor:pointer;backdrop-filter:blur(4px);transition:background 0.18s,transform 0.18s }
        .civ-nav-btn:hover { background:rgba(0,0,0,0.65);transform:scale(1.08) }
    `;
    document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════════════════
export default function CustomImageViewer({ choose, chatId, msg, images, initialIndex = 0, onClose, senderName, senderProfile, sendTime, }) {


    const { backendUser, contacts, deleteOneFile } = useContext(AuthContext);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoading, setIsLoading] = useState(true);
    const [showForwardPopup, setShowForwardPopup] = useState(false);

    // Separate opacity/visibility state for open/close transitions
    const [phase, setPhase] = useState('mounting'); // mounting → open → closing → gone

    const wrapperRef = useRef(null);
    const imgRef = useRef(null);

    // All zoom/pan state lives in a ref to avoid re-renders on every frame
    const transform = useRef({ scale: 1, x: 0, y: 0 });
    const drag = useRef({ active: false, startX: 0, startY: 0, moved: false });

    const currentImage = images[currentIndex];

    // ── Apply transform to the DOM directly (no React re-render) ─────────
    const applyTransform = useCallback(() => {
        const el = imgRef.current;
        if (!el) return;
        const { scale, x, y } = transform.current;
        el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }, []);

    // ── Open animation ───────────────────────────────────────────────────
    useEffect(() => {
        // Small delay so the mounting CSS (opacity:0) is painted first
        const raf = requestAnimationFrame(() => setPhase('open'));
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Close handler ────────────────────────────────────────────────────
    const ContactsWithOtherMember = () => {
        const prContacts = contacts.map((contact) => {
            if (contact.contactType === "person") {
                const otherMember = contact.members?.filter(
                    member => member._id?._id.toString() !== backendUser?._id.toString()
                ) || [];
                return {
                    ...contact,
                    otherMember: otherMember,
                    lastMessage: contact.lastMessage
                };
            }
            return contact;
        });
        return prContacts;

    }
    const triggerClose = useCallback(() => {
        if (phase === 'closing') return;
        setPhase('closing');
        setTimeout(onClose, 250);
    }, [phase, onClose]);

    // Sync browser history state for closing on back button
    const triggerCloseRef = useRef(triggerClose);
    useEffect(() => {
        triggerCloseRef.current = triggerClose;
    }, [triggerClose]);

    useEffect(() => {
        const currentDepth = window.history.state?.modalDepth || 0;
        window.history.pushState(
            { ...window.history.state, viewerOpen: true, modalDepth: currentDepth + 1 },
            '',
            window.location.pathname + window.location.hash
        );

        const handlePopState = (e) => {
            if (!e.state?.viewerOpen) {
                triggerCloseRef.current();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (window.history.state?.viewerOpen) {
                window.history.back();
            }
        };
    }, []);
    const contact = contacts.find(contact => contact._id.toString() === msg?.forContact.toString());
    const handleIsDeleteAllowed
        = () => {
            if (contact?.contactType !== "person") {

                const isOwner = contact?.
                    owner?.toString() === backendUser._id.toString();
                const isAdmin = contact?.admins.find((admin) => admin._id.toString() === backendUser._id.toString());

                if (contact?.contactType === "channel") {
                    if (isOwner) {
                        return true;
                    }
                    if (isAdmin) {
                        const isDeleteAllowed = contact?.permissions?.deleteMessages.includes(backendUser._id.toString());
                        return isDeleteAllowed;
                    }
                }
                if (contact?.contactType === "group") {
                    if (isOwner) {
                        return true;
                    }
                    if (isAdmin) {
                        const isDeleteAllowed = contact?.permissions?.deleteMessages.includes(backendUser._id.toString());
                        return isDeleteAllowed;
                    } else {
                        const isDeleteAllowed = contact?.membersPermissions?.deleteMessages;
                        return isDeleteAllowed;
                    }
                }
            } else {
                return true;
            }
        }
    // ── Reset on image change ────────────────────────────────────────────
    useEffect(() => {
        setIsLoading(true);
        transform.current = { scale: 1, x: 0, y: 0 };
        applyTransform();
    }, [currentIndex, applyTransform]);

    // ── Keyboard ─────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') triggerClose();
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [currentIndex, images.length, triggerClose]);

    const go = (dir) => {
        const next = currentIndex + dir;
        if (next >= 0 && next < images.length) setCurrentIndex(next);
    };

    // ── NATIVE wheel listener ({passive:false} so preventDefault works) ──
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const t = transform.current;
            const delta = -e.deltaY;                      // positive = zoom in
            const factor = 1 + Math.abs(delta) * 0.001;   // smooth multiplier
            const newScale = delta > 0
                ? Math.min(t.scale * factor, 5)
                : Math.max(t.scale / factor, 1);

            if (newScale <= 1) {
                t.scale = 1; t.x = 0; t.y = 0;
            } else {
                t.scale = newScale;
            }

            applyTransform();
        };

        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [applyTransform]);

    // ── Pan / drag ───────────────────────────────────────────────────────
    const onPointerDown = (e) => {
        drag.current.moved = false;
        if (transform.current.scale > 1) {
            drag.current = { active: true, startX: e.clientX - transform.current.x, startY: e.clientY - transform.current.y, moved: false };
            if (imgRef.current) imgRef.current.style.cursor = 'grabbing';
        }
    };

    const onPointerMove = (e) => {
        if (!drag.current.active) return;
        drag.current.moved = true;
        transform.current.x = e.clientX - drag.current.startX;
        transform.current.y = e.clientY - drag.current.startY;
        applyTransform();
    };

    const onPointerUp = () => {
        drag.current.active = false;
        if (imgRef.current) imgRef.current.style.cursor = transform.current.scale > 1 ? 'grab' : '';
    };

    // ── Backdrop click → close ───────────────────────────────────────────
    const onBackdropClick = (e) => {
        if (!drag.current.moved) triggerClose();
        drag.current.moved = false;
    };

    // ── Download ─────────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!currentImage?.url) return;
        try {
            const res = await fetch(currentImage.url);
            const blob = await res.blob();
            const burl = window.URL.createObjectURL(blob);
            let fn = currentImage.name || 'image.jpg';
            if (!currentImage.url.startsWith('blob:')) {
                const parts = currentImage.url.split('/');
                const last = parts[parts.length - 1];
                if (last?.includes('.')) fn = last.split('?')[0];
            }
            const a = Object.assign(document.createElement('a'), { href: burl, download: fn, style: 'display:none' });
            document.body.appendChild(a); a.click();
            setTimeout(() => { window.URL.revokeObjectURL(burl); a.remove(); }, 200);
        } catch { window.open(currentImage.url, '_blank'); }
    };

    const handleShare = () => {


        // setForwardItem(currentImage);
        setShowForwardPopup(true);
    };

    const handleDelete = async () => {
        triggerClose();
        await deleteOneFile(msg._realId || msg._id, chatId, currentImage._id, `${msg.chatType}s`);


    };

    // ── CSS transitions (no CSS animation on transform!) ─────────────────
    const isOpen = phase === 'open';
    const isClosing = phase === 'closing';

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            userSelect: 'none',
            opacity: isOpen ? 1 : isClosing ? 0 : 0,
            transition: 'opacity 0.25s ease',
        }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            {/* ── Header ─────────────────────────────────────────── */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-12px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: senderProfile?.bgColor || '#5288c1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        <Avatar profile={senderProfile} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{senderName || 'Unknown'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.3 }}>{formatViewerTime(sendTime)}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="civ-btn" onClick={handleShare} title="Forward"><ForwardIcon /></button>
                    <button className="civ-btn" onClick={handleDownload} title="Download"><DownloadIcon /></button>
                    {handleIsDeleteAllowed() &&
                        <button className="civ-btn" onClick={handleDelete} title="Delete"><DeleteIcon /></button>
                    }
                    <button className="civ-btn" onClick={triggerClose} title="Close" style={{ marginLeft: 4, background: 'rgba(255,255,255,0.12)' }}><CloseIcon /></button>
                </div>
            </div>

            {/* ── Image area ─────────────────────────────────────── */}
            <div
                ref={wrapperRef}
                style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                onClick={onBackdropClick}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
            >
                {isLoading && <Loader />}

                {currentImage && (
                    <img
                        ref={imgRef}
                        src={currentImage.url}
                        alt=""
                        draggable={false}
                        onLoad={() => setIsLoading(false)}
                        style={{
                            maxWidth: '90vw', maxHeight: '88vh',
                            objectFit: 'contain',
                            borderRadius: 4,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
                            willChange: 'transform',
                            cursor: transform.current.scale > 1 ? 'grab' : 'default',
                            /* fade-in controlled by CSS transition, NOT animation */
                            opacity: isLoading ? 0 : (isOpen ? 1 : 0),
                            transition: 'opacity 0.25s ease',
                            /* NO animation property — so JS .style.transform is never overridden */
                        }}
                    />
                )}
            </div>

            {/* ── Navigation ─────────────────────────────────────── */}
            {currentIndex > 0 && (
                <button className="civ-nav-btn" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} onClick={e => { e.stopPropagation(); go(-1); }}>
                    <ChevronLeft />
                </button>
            )}
            {currentIndex < images.length - 1 && (
                <button className="civ-nav-btn" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} onClick={e => { e.stopPropagation(); go(1); }}>
                    <ChevronRight />
                </button>
            )}

            {/* ── Counter ────────────────────────────────────────── */}
            {images.length > 1 && (
                <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, background: 'rgba(0,0,0,0.35)', padding: '3px 10px', borderRadius: 12, backdropFilter: 'blur(4px)' }}>
                    {currentIndex + 1} / {images.length}
                </div>
            )}
            {showForwardPopup && (
                <ForwardPopup
                    isOpen={showForwardPopup}
                    onClose={() => {
                        setShowForwardPopup(false);
                    }}
                    contacts={
                        ContactsWithOtherMember()
                    }
                    backendUser={backendUser}
                    onContactClick={(user) => {
                        const isSendAllowed = () => {
                            if (user.contactType === "person") {
                                return true;
                            }
                            else if (user.contactType === "group") {

                                const isOwner = user.owner.toString() === backendUser._id.toString();
                                if (isOwner) {
                                    return true;
                                } else {
                                    const isAdmin = user.admins.some(admin => admin.
                                        _id.toString() === backendUser._id.toString());
                                    if (isAdmin === true) {
                                        return true;
                                    } else {
                                        const member = user.members.some(member => member.
                                            _id.toString() === backendUser._id.toString());
                                        if (member === true) {
                                            if (user.membersPermissions.sendMessages === true) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        } else {
                                            return false;
                                        }
                                    }

                                }
                            }
                            else if (user.contactType === "channel") {
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                        if (isSendAllowed()) {
                            // Navigate to chat with forward data containing full message details
                            const forwardMessages = [{
                                _id: msg._realId || msg._id,
                                chatType: msg.chatType,
                                forContact: msg.forContact,
                                url: currentImage.url,
                                name: currentImage.name,
                                type: msg.chatType,
                                media: currentImage,
                                isForwardOne: true,

                            }];
                            setShowForwardPopup(false);
                            onClose();
                            const rdData = {

                                to: "Chat",
                                user,
                                forwardMessages
                            }
                            choose(rdData);

                            // setPanelOpen(false);


                            // setForwardItem(null);

                        } else {
                            toast.error("You are not allowed to send messages to this chat");
                        }

                    }}
                />
            )}
        </div>,
        document.body
    );
}
