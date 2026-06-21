import React, { useEffect, useState } from "react";
import UserAvatar2 from "./UserAvatar2";
import { Spinner } from "@material-tailwind/react";
export default function JoinPopUp({ isOpen, onJoin, onClose, profilePicture, contactData, loading, setLoading }) {
    
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
            <div
                className={`bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <UserAvatar2    {...(profilePicture !== null && profilePicture.type === 'image' && {
                        image: profilePicture
                            .imageUrl,
                    })}
                        {...(profilePicture !== null && profilePicture.type === 'emoji' && {
                            emoji: profilePicture
                                .emoji,
                            simpleBg: profilePicture
                                .bgColor,
                        })}
                        {...(profilePicture !== null && profilePicture.type === 'initials' && {
                            simpleBg: profilePicture
                                .bgColor,
                            text: profilePicture.initials,

                        })} />
                    <h2 className="text-[22px] font-semibold text-gray-900">
                        {contactData.name}
                    </h2>
                </div>

                <p className="text-gray-800 font-medium mb-8 text-[16px]">
                    Are you sure you want to join this {contactData.contactType
                    }?
                </p>

                <div className="flex justify-end gap-6">
                    <button
                        disabled={loading}
                        onClick={() => onJoin(contactData)}
                        className="font-medium text-blue-500 hover:text-blue-600 transition-colors uppercase text-sm tracking-wide"
                    >
                        {loading == false ? "Join" : <Spinner />}
                    </button>
                    <button
                        disabled={loading}
                        onClick={onClose}
                        className="font-medium text-red-500 hover:text-red-600 transition-colors uppercase text-sm tracking-wide"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
