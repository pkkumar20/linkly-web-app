import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../UserAvatar";

export default function DeleteChatPopup({ onClose, onDelete, chat }) {
    const [alsoDeleteForOther, setAlsoDeleteForOther] = useState(false);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.22, ease: [0.0, 0.0, 0.2, 1] }}
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-[320px] px-6 py-6 flex flex-col gap-5 z-10 cursor-default"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0">
                        {chat?.otherMember?.[0]?._id && (
                            <Avatar
                                size="w-10 h-10"
                                textSize="text-md"
                                emojiSize="text-lg"
                                {...(chat.otherMember[0]._id.profile?.type === 'image' && { image: chat.otherMember[0]._id.profile.imageUrl })}
                                {...(chat.otherMember[0]._id.profile?.type === 'emoji' && { emoji: chat.otherMember[0]._id.profile.emoji, simpleBg: chat.otherMember[0]._id.profile.bgColor })}
                                {...(chat.otherMember[0]._id.profile?.type === 'initials' && { simpleBg: chat.otherMember[0]._id.profile.bgColor, text: chat.otherMember[0]._id.profile.initials })}
                            />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                        Delete chat
                    </h3>
                </div>

                <div className="text-gray-700 font-medium text-base leading-relaxed">
                    Are you sure you want to delete the chat with <span className="font-bold text-gray-900">{chat?.otherMember?.[0]?._id?.name || chat?.otherMember?.[0]?._id?.username || "this user"}</span>?
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none group py-1">
                    <div className="relative flex items-center justify-center flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={alsoDeleteForOther}
                            onChange={(e) => setAlsoDeleteForOther(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ease-out active:scale-90 ${alsoDeleteForOther
                            ? 'bg-[#8763ea] border-[#8763ea] shadow-sm shadow-[#8763ea]/20'
                            : 'border-gray-300 bg-transparent group-hover:border-[#8763ea]'
                            }`}>
                            {alsoDeleteForOther && (
                                <svg
                                    className="w-3 h-3 text-white animate-checkbox-scale"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-gray-700 text-[15px] font-medium group-hover:text-gray-950 transition-colors duration-150">
                        Also delete for {chat?.otherMember?.[0]?._id?.name || "this user"}
                    </span>
                </label>

                <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[14px] font-semibold text-[#8763ea] hover:bg-blue-50/50 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onDelete(alsoDeleteForOther)}
                        className="px-4 py-2 text-[14px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                    >
                        Delete Chat
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
