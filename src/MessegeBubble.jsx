import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./firebase hooks/AuthContext";
import { TbCheck, TbChecks, TbAlertCircle, TbRefresh, TbClockHour4 } from "react-icons/tb";
import toast from "react-hot-toast";
import UserAvatar from "./UserAvatar"
import ImageMessage from "./ImageMessage";
import VideoMessage from "./VideoMessage";
import DocumentMessage from "./DocumentMessage";
import LocationMessage from "./LocationMessage";

const getFirstMedia = (msg) => {
    if (!msg) return null;
    if (msg.images?.length > 0) return { type: 'image', url: msg.images[0].url || msg.images[0] };
    if (msg.videos?.length > 0) return { type: 'video', url: msg.videos[0].url || msg.videos[0] };
    if (msg.documents?.length > 0 || msg.document?.length > 0) {
        const docs = msg.documents || msg.document;
        const firstDoc = docs[0];
        const url = firstDoc.url || firstDoc;
        const name = firstDoc.name || (typeof firstDoc === 'string' ? firstDoc : '');
        const clean = url.split('?')[0].split('#')[0];
        const lastSegment = clean.split('/').pop();
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : (lastSegment && lastSegment.includes('.') ? lastSegment.split('.').pop().toLowerCase() : '');
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return { type: 'image', url };
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { type: 'video', url };
    }
    return null;
};
const MessegeBubble = ({
    choose,
    msg,
    ProfileData,
    chat,
    text,
    time,
    isSent,
    isSeenByMe,
    currentUser,
    chatId,
    onReactionClick,
    searchQuery,
}) => {
    const { addIdToSeenBy, contactsWithOtherMember, contacts, addContactById, backendUser } = useContext(AuthContext);
    const navigate = useNavigate();


    const [loadingContact, setLoadingContact] = useState(false);
    useEffect(() => {
        if (chat != null && msg.forContact.toString() === chat._id.toString()) {
            if (!isSent && (!isSeenByMe || !isSeenByMe.includes(currentUser))) {
                addIdToSeenBy(chatId, currentUser);
            }
        }
    }, [isSent, isSeenByMe, currentUser, chatId, addIdToSeenBy, chat, msg]);

    if (chat == null) {
        return null;
    } if (
        msg.forContact.toString() !== chat._id.toString()
    ) {
        return null;
    }
    const convertDate = (d) => {
        const date = new Date(d);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    };

    const hasOtherIds = isSeenByMe && isSeenByMe.some(id => id !== currentUser);

    const isPending = msg._isPending;
    const hasImages = msg.images && msg.images.length > 0;
    const hasVideos = msg.videos && msg.videos.length > 0;
    const hasDocuments = (msg.documents && msg.documents.length > 0) || (msg.document && msg.document.length > 0);
    const docList = msg.documents || msg.document || [];
    const hasLocation = msg.chatType === 'location' && msg.locationDetails?.coordinates?.length >= 2;
    const hasContact = msg.chatType === 'contact' && msg.contactDetails;
    const hasMedia = hasImages || hasVideos || hasDocuments;
    const hasText = text && text.trim().length > 0;
    const caption = msg.caption || '';
    const hasCaption = caption.trim().length > 0;

    const isRepliedMessageDeleted = !msg.replyDetails?.repliedMessage ||
        (typeof msg.replyDetails.repliedMessage === 'object' && Object.keys(msg.replyDetails.repliedMessage).length === 0) ||
        msg.replyDetails.repliedMessage.isDeleted;

    const timeBlock = (
        <span
            className="flex items-center gap-1 ml-2 text-[11px] whitespace-nowrap flex-shrink-0"
            style={{ color: msg._isError ? "#ef4444" : (isSent ? "#166534" : "#6b7280") }}
        >
            {convertDate(time)}
            {isSent && !msg._isError &&
                (isPending ? (
                    <TbClockHour4 size={14} className="animate-pulse" />
                ) : hasOtherIds ? (
                    <TbChecks size={16} />
                ) : (
                    <TbCheck size={16} />
                ))}
        </span>
    );
    // errorBlock removed and replaced with inline warning next to the bubble

    const escapeRegExp = (str) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const highlightText = (txt, query) => {
        if (!query || !txt) return txt;
        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        const chunks = txt.split(regex);
        return chunks.map((chunk, idx) =>
            chunk.toLowerCase() === query.toLowerCase() ? (
                <mark key={idx} className="bg-yellow-200 text-black px-0.5 rounded-sm">{chunk}</mark>
            ) : (
                chunk
            )
        );
    };

    // Checks if a URL belongs to the current app's domain (same host)
    const isSameDomain = (urlString) => {
        try {
            const fullUrl = /^https?:\/\//i.test(urlString) ? urlString : `http://${urlString}`;
            const parsed = new URL(fullUrl);
            return parsed.host === window.location.host;
        } catch {
            return false;
        }
    };

    // Extracts the pathname from a URL string
    const getPathname = (urlString) => {
        try {
            const fullUrl = /^https?:\/\//i.test(urlString) ? urlString : `http://${urlString}`;
            return new URL(fullUrl).pathname;
        } catch {
            return "";
        }
    };

    const renderTextWithLinks = (textContent) => {
        if (!textContent) return null;

        // Matches:
        // 1. https:// or http:// URLs
        // 2. www. URLs
        // 3. localhost with optional port/path
        // 4. IP addresses (127.x.x.x, 192.168.x.x, 0.0.0.0, etc.) with optional port/path
        // 5. Regular domain names (.com, .org, etc.)
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|localhost(?::\d+)?(?:\/[^\s]*)?|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|in|co|us|uk|io|me|app|dev|ai)(?:\/[^\s]*)?)/gi;

        const parts = textContent.split(urlRegex);

        return parts.map((part, i) => {
            if (!part) return null;
            if (part.match(urlRegex)) {
                const pathname = getPathname(part);
                const isProfileLink = isSameDomain(part) && pathname.startsWith("/@");
                const isGroupOrChannelLink = isSameDomain(part) && pathname.startsWith("/+");

                if (isProfileLink) {
                    // Same-domain profile link → navigate in-app (SPA)
                    const username = pathname.slice(1); // e.g. "@shadow0682"
                    return (
                        <span
                            key={i}
                            className="text-[#8763ea] underline cursor-pointer font-semibold"
                            title={`View profile: ${username}`}
                            onClick={(e) => {
                                if (username === backendUser.username) return;




                                const existingContact = contactsWithOtherMember.find(contact => {
                                    if (contact.contactType === "person" && contact.otherMember[0]._id.username === username) {
                                        return contact;
                                    }
                                })

                                if (existingContact !== undefined) {
                                    window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { contact: existingContact } }));
                                } else {


                                    e.stopPropagation();
                                    navigate(`/${username}`);
                                }





                            }}
                        >
                            {part}
                        </span>
                    );
                }
                if (isGroupOrChannelLink) {
                    // Same-domain profile link → navigate in-app (SPA)
                    const contactId = pathname.slice(2); // e.g. "@shadow0682"

                    return (
                        <span
                            key={i}
                            className="text-[#8763ea] underline cursor-pointer font-semibold"
                            title={`View contact: ${contactId}`}
                            onClick={(e) => {


                                if (contactId === chat._id) return;




                                const existingContact = contactsWithOtherMember.find(contact => {
                                    if (contact.contactType !== "person" && contact._id.toString() === contactId.toString()) {
                                        return contact;
                                    }
                                })

                                if (existingContact !== undefined) {
                                    window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { contact: existingContact } }));
                                } else {


                                    e.stopPropagation();
                                    navigate(`/+${contactId}`);
                                }





                            }}
                        >
                            {part}
                        </span>
                    );
                }

                // External link → open in new tab
                let url = part;
                if (!/^https?:\/\//i.test(url)) {
                    url = `http://${url}`;
                }
                return (
                    <span
                        key={i}
                        className="text-[#6F57D0] underline cursor-pointer font-semibold"
                        title="Click to open link"
                        onClick={(e) => {
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return <React.Fragment key={i}>{highlightText(part, searchQuery)}</React.Fragment>;
        });
    };


    return (
        <div
            className={`flex w-full mb-1.5 ${isSent ? "justify-end pr-3" : "justify-start pl-3"}`}
            key={chatId}
        >
            {chat.contactType === "group"
                && isSent === false && (
                    <UserAvatar
                        size={"h-10 w-10 "}
                        {...(ProfileData !== null && ProfileData.type === 'image' && {
                            image: ProfileData.imageUrl
                        })}
                        {...(ProfileData !== null && ProfileData.type === 'emoji' && {
                            emoji: ProfileData.emoji,
                            simpleBg: ProfileData.bgColor,
                            emojiSize: "text-md"
                        })}
                        {...(ProfileData !== null && ProfileData.type === 'initials' && {
                            text: ProfileData.initials,
                            simpleBg: ProfileData.bgColor,
                            textSize: "text-md"
                        })}
                    />
                )}
            {isSent && msg._isError && !hasMedia && (
                <div className="flex items-center mr-2 self-end mb-1 flex-shrink-0 relative group/resend">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (msg._onRetry) msg._onRetry();
                        }}
                        title="Failed to send. Click to retry."
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: 0,
                        }}
                    >
                        {/* Pulsing red ring */}
                        <span style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(239,68,68,0.15)',
                            animation: 'resend-pulse 1.6s ease-in-out infinite',
                            pointerEvents: 'none',
                        }} />
                        {/* Solid red circle */}
                        <span style={{
                            position: 'absolute',
                            inset: 3,
                            borderRadius: '50%',
                            background: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.45)',
                            transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s',
                        }}
                            className="resend-inner"
                        >
                            {/* Retry arrow SVG */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </span>
                        {/* Tooltip */}
                        <span style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 8px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(17,17,17,0.92)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 9px',
                            borderRadius: 7,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            opacity: 0,
                            transition: 'opacity 0.15s',
                            zIndex: 100,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                            letterSpacing: '0.01em',
                        }}
                            className="resend-tooltip"
                        >
                            Tap to resend
                            {/* Arrow */}
                            <span style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '5px solid rgba(17,17,17,0.92)',
                            }} />
                        </span>
                    </button>
                    <style>{`
                        @keyframes resend-pulse {
                            0%, 100% { transform: scale(1); opacity: 0.7; }
                            50% { transform: scale(1.55); opacity: 0; }
                        }
                        .group\\/resend:hover .resend-tooltip { opacity: 1 !important; }
                        .group\\/resend:hover .resend-inner { transform: scale(1.18) !important; box-shadow: 0 4px 16px rgba(239,68,68,0.55) !important; }
                        .group\\/resend:active .resend-inner { transform: scale(0.92) !important; }
                    `}</style>
                </div>
            )}
            <div
                className={`${isSent ? "bg-green-100 rounded-br-none" : "bg-white rounded-bl-none ml-1"
                    } max-w-[90vw] sm:max-w-[75%] rounded-2xl text-sm shadow overflow-hidden select-none ${hasLocation ? 'min-w-[260px]' : hasContact ? 'min-w-[220px]' : hasDocuments ? 'min-w-[200px]' : 'min-w-[64px]'}`}
                style={{
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                }}
            >
                {/* Forwarded Status Header */}
                {msg.ForwardedDetails?.isForwarded && (
                    <div className="flex flex-col px-3 pt-2 pb-1 relative">
                        <span className="text-[14px] text-[#55a355] font-medium leading-tight mb-0.5">Forwarded from</span>
                        {(() => {
                            const fwd = msg.ForwardedDetails.forwardedFrom;

                            const displayName = fwd?.name;
                            const displayLastName = fwd?.lastName;
                            const displayProfile = fwd?.profile || msg.sender?.profile;

                            return (
                                <div className="flex items-center gap-1.5 mt-[2px]">
                                    <UserAvatar
                                        size="h-[18px] w-[18px]"
                                        {...(displayProfile?.type === 'image' && {
                                            image: displayProfile.imageUrl
                                        })}
                                        {...(displayProfile?.type === 'emoji' && {
                                            emoji: displayProfile.emoji,
                                            simpleBg: displayProfile.bgColor,
                                            emojiSize: "text-[10px]"
                                        })}
                                        {...(displayProfile?.type === 'initials' && {
                                            text: displayProfile.initials,
                                            simpleBg: displayProfile.bgColor,
                                            textSize: "text-[10px]"
                                        })}
                                    />
                                    <span className="text-[14px] text-[#55a355] font-semibold leading-tight">
                                        {msg.ForwardedDetails.forwardedFrom?.name || msg.sender?.name || "Unknown"} {msg.ForwardedDetails.forwardedFrom?.lastName || ""}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Reply Preview Box inside the bubble */}
                {msg.replyDetails?.isReply && (
                    <div
                        className="bg-black/5 hover:bg-black/10 cursor-pointer transition-colors border-l-2 border-green-500 rounded-r-lg mx-1.5 mt-1.5 mb-0.5 px-2 py-1 flex items-center min-w-[50px] overflow-hidden"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isRepliedMessageDeleted) return;
                            const repliedMsg = msg.replyDetails.repliedMessage;
                            const id1 = typeof repliedMsg === 'object' ? repliedMsg?._id : repliedMsg;
                            const id2 = typeof repliedMsg === 'object' ? repliedMsg?._realId : null;
                            const el = document.querySelector(`[data-msg-id="${id1}"]`) ||
                                (id2 && document.querySelector(`[data-msg-id="${id2}"]`)) ||
                                document.querySelector(`[data-real-id="${id1}"]`) ||
                                (id2 && document.querySelector(`[data-real-id="${id2}"]`));
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('search-highlight-flash');
                                setTimeout(() => el.classList.remove('search-highlight-flash'), 1500);
                            }
                        }}
                    >
                        {isRepliedMessageDeleted ? (
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">

                                <span className="text-green-500 text-[13px] italic font-normal truncate">Deleted message</span>
                            </div>
                        ) : (
                            <>
                                {/* Media Thumbnail */}
                                {getFirstMedia(msg.replyDetails.repliedMessage) && (
                                    <div className="w-8 h-8 rounded shrink-0 overflow-hidden mr-2 bg-black/10 flex items-center justify-center">
                                        {getFirstMedia(msg.replyDetails.repliedMessage).type === 'image' ? (
                                            <img src={getFirstMedia(msg.replyDetails.repliedMessage).url} alt="thumbnail" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={getFirstMedia(msg.replyDetails.repliedMessage).url} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-blue-500 text-xs font-semibold truncate leading-tight">
                                        {msg.replyDetails.repliedMessage.sender?.name || "User"}
                                    </span>
                                    <span className="text-gray-600 text-[13px] truncate leading-tight">
                                        {msg.replyDetails.repliedMessage.chatType === 'location' ? '📍 Location' : msg.replyDetails.repliedMessage.chatType === 'contact' ? '👤 Contact' : getFirstMedia(msg.replyDetails.repliedMessage)?.type === 'image' ? 'Photo' : getFirstMedia(msg.replyDetails.repliedMessage)?.type === 'video' ? 'Video' : (msg.replyDetails.repliedMessage.content || msg.replyDetails.repliedMessage.text || 'Attachment')}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Image Grid */}
                {hasImages && <ImageMessage
                    returnData={(w) => {


                    }}
                    choose={choose} chat={chat} msg={msg} images={msg.images} isPending={isPending} isSent={isSent} senderName={isSent ? 'You' : ((msg.sender?.name || '') + (msg.sender?.lastName ? ' ' + msg.sender.lastName : '')).trim() || 'Unknown'} senderProfile={msg.sender?.profile} sendTime={time} caption={caption} formattedTime={convertDate(time)} hasOtherIds={hasOtherIds} />}

                {/* Video List */}
                {hasVideos && <VideoMessage choose={choose} msg={msg} chat={chat} videos={msg.videos} isPending={isPending} isSent={isSent} senderName={isSent ? 'You' : ((msg.sender?.name || '') + (msg.sender?.lastName ? ' ' + msg.sender.lastName : '')).trim() || 'Unknown'} senderProfile={msg.sender?.profile} sendTime={time} caption={caption} formattedTime={convertDate(time)} hasOtherIds={hasOtherIds} />}

                {/* Documents */}
                {hasDocuments && <DocumentMessage choose={choose} msg={msg} chat={chat} documents={docList} isPending={isPending} isSent={isSent} caption={caption} formattedTime={convertDate(time)} hasOtherIds={hasOtherIds} senderName={isSent ? 'You' : ((msg.sender?.name || '') + (msg.sender?.lastName ? ' ' + msg.sender.lastName : '')).trim() || 'Unknown'} senderProfile={msg.sender?.profile} sendTime={time} />}

                {/* Location Message */}
                {hasLocation && <LocationMessage msg={msg} isSent={isSent} formattedTime={convertDate(time)} hasOtherIds={hasOtherIds} timeBlock={timeBlock} />}

                {/* Contact Card */}
                {hasContact && (() => {
                    // const contactProfile = msg.contactDetails?.Id;

                    const contactInitial = (msg.contactDetails?.name || '?').charAt(0).toUpperCase();

                    return (
                        <div className="px-3 pt-2.5 pb-1 flex flex-col">
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    size="h-11 w-11"
                                    {...(msg.contactDetails?.Id !== undefined && msg.contactDetails?.Id?.type === 'image' && { image: msg.contactDetails?.Id.imageUrl })}
                                    {...(msg.contactDetails?.Id !== undefined && msg.contactDetails?.Id.profile?.type === 'emoji' && {
                                        emoji: msg.contactDetails?.Id.profile.emoji,
                                        simpleBg: msg.contactDetails?.Id.profile.bgColor,
                                        emojiSize: "text-xl"
                                    })}
                                    {...(msg.contactDetails?.Id !== undefined && msg.contactDetails?.Id.profile?.type === 'initials' && {
                                        text: msg.contactDetails?.Id.profile.initials,
                                        simpleBg: msg.contactDetails?.Id.profile.bgColor,
                                        textSize: "text-sm"
                                    })}
                                    {...(msg.contactDetails?.Id === undefined && {
                                        text: contactInitial,
                                        simpleBg: msg.contactDetails.color,
                                        textSize: "text-sm"
                                    })}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[15px] font-semibold text-gray-900 truncate">{msg.contactDetails.name}</span>
                                    <span className="text-[13px] text-gray-500 truncate">{msg.contactDetails.phoneNumber}</span>
                                </div>
                            </div>
                            {msg.contactDetails.Id !== undefined &&
                                (<button
                                    disabled={loadingContact}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (loadingContact) return;
                                        const targetUserId = typeof msg.contactDetails.Id === 'object'
                                            ? msg.contactDetails.Id?._id
                                            : msg.contactDetails.Id;

                                        if (!targetUserId) {
                                            toast.error("Contact user ID not available");
                                            return;
                                        }

                                        const existingContact = contacts?.find(c =>
                                            c.contactType === 'person' &&
                                            c.members?.some(m => (m._id?._id || m._id)?.toString() === targetUserId.toString())
                                        );

                                        if (existingContact) {
                                            if (existingContact._id.toString() === chat._id.toString()) {
                                                return;
                                            } else {
                                                choose("Chat", existingContact);
                                            }

                                        }
                                        else {
                                            setLoadingContact(true);
                                            try {
                                                const fd = new FormData();
                                                fd.append("id", targetUserId);
                                                const res = await addContactById(fd);
                                                if (res && res.status === 200) {
                                                    const contact = res.data.contact;
                                                    const contactOtherMembers = contact.members.filter(
                                                        member => (member._id?._id || member._id)?.toString() !== currentUser.toString()
                                                    );
                                                    const formattedContact = {
                                                        ...contact,
                                                        otherMember: contactOtherMembers,
                                                        lastMessage: contact.lastMessage
                                                    };
                                                    choose("Chat", formattedContact);
                                                } else {
                                                    const errorMessage = res?.response?.data?.message || "Failed to add contact";
                                                    toast.error(errorMessage);
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Error adding contact");
                                            } finally {
                                                setLoadingContact(false);
                                            }
                                        }
                                    }}
                                    className="w-full mt-2.5 py-1.5 px-3 bg-[#8763ea]/10 hover:bg-[#8763ea]/20 active:bg-[#8763ea]/30 text-[#8763ea] font-semibold text-[13px] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingContact ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-[#8763ea] border-t-transparent rounded-full mr-1" />
                                            Adding Contact...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                            </svg>
                                            Send Message
                                        </>
                                    )}
                                </button>)
                            }
                            <div className="flex justify-end mt-1">
                                {timeBlock}
                            </div>
                        </div>
                    );
                })()}

                {/* Text + Time row — skip entirely when hasImages (ImageMessage handles it) or location or contact */}
                {!hasImages && !hasVideos && !hasDocuments && !hasLocation && !hasContact && (
                    <div className="px-3 py-2 flex flex-row items-end">
                        {hasText ? (
                            <>
                                <span className="text-black grow">{renderTextWithLinks(text)}</span>
                                {timeBlock}
                            </>
                        ) : hasMedia ? (
                            <div className="flex justify-end w-full">
                                {timeBlock}
                            </div>
                        ) : (
                            <>
                                <span className="text-black grow">{renderTextWithLinks(text)}</span>
                                {timeBlock}
                            </>
                        )}
                    </div>
                )}

                {/* Reactions Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-col items-start px-2 pt-0 pb-1.5 mt-0.5 max-w-full">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onReactionClick) {
                                    onReactionClick(msg);
                                }
                            }}
                            className={`group relative flex items-center rounded-2xl px-2 py-1 select-none transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm backdrop-blur-sm border ${msg.reactions.some(r => (r.user?._id || r.user) === currentUser)
                                ? 'bg-blue-50/90 border-blue-200 hover:bg-blue-100/90 text-blue-700'
                                : 'bg-white/90 border-gray-200/80 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="flex -space-x-[6px]">
                                {[...new Set(msg.reactions.map(r => r.reaction))].slice(0, 4).map((emoji, i) => (
                                    <span
                                        key={i}
                                        className="text-[15px] leading-none drop-shadow-sm z-10 transition-transform group-hover:scale-110"
                                        style={{ zIndex: 10 - i }}
                                    >
                                        {emoji}
                                    </span>
                                ))}
                            </div>
                            {msg.reactions.length > 1 && (
                                <span className="font-semibold text-[12px] pl-1.5 pr-0.5 opacity-80">{msg.reactions.length}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(MessegeBubble, (prev, next) => {
    return prev.msg._id === next.msg._id &&
        prev.msg._isPending === next.msg._isPending &&
        prev.msg._isError === next.msg._isError &&
        prev.msg.content === next.msg.content &&
        prev.msg.caption === next.msg.caption &&
        prev.msg.reactions?.length === next.msg.reactions?.length &&
        prev.isSent === next.isSent &&
        prev.searchQuery === next.searchQuery &&
        prev.msg.seenBy?.length === next.msg.seenBy?.length &&
        prev.msg.isDeleted === next.msg.isDeleted;
});
