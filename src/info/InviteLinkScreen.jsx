import React, { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../firebase hooks/AuthContext';
import Lottie from 'lottie-react';
import myAnimation from "../lottie/You're in!.json"
import {
    Typography,
    Switch,
} from "@material-tailwind/react";
import { FiMoreVertical } from "react-icons/fi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import SharePopUp from './SharePopUp';
function InviteLinkScreen({ Screen, chat, onSendInviteLink, onShare }) {
    const { changeRequiresApproval } = useContext(AuthContext);
    const [popupOpen, setPopupOpen] = useState(false);
    const [requireApproval, setRequireApproval] = useState(chat.requiresApproval || false);
    useEffect(() => {
        setRequireApproval(chat.requiresApproval);
    }, [chat])
    const handleApprovalChange = async () => {

        setRequireApproval(!requireApproval);
        await changeRequiresApproval(chat._id, !requireApproval);
    }
    return (
        <div className="bg-gray-100 select-none">
            <div className="bg-white flex items-center gap-4 px-4 py-3">
                <button
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                    onClick={() => Screen("main")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">
                    Invite Link
                </Typography>
            </div>
            <div className=' flex flex-col items-center h-56 px-5 '>
                <Lottie animationData={myAnimation} loop={true} style={{ height: 170, width: 200 }} />
                <div className="  flex flex-col items-center">
                    {/* Name */}
                    <Typography
                        variant="small"
                        color="gray"
                        className="text-sm   text-center"
                    >
                        Anyone who has Linkly installed will be able to
                        join  by following this link.
                    </Typography></div>
            </div>
            <div className='bg-white p-3' >
                <div className="w-full max-w-md mx-auto">
                    <div className="text-blue-600 font-medium my-3">Invite Link</div>
                    <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 mb-4 cursor-pointer "
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.host}/+${chat._id}`);
                            toast.success("Link copied")
                        }}>
                        <span className="flex-grow truncate text-gray-900 font-medium">{`${window.location.host}/+${chat._id}`}</span>
                        <button className="ml-3">
                            <FiMoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <button
                        className="w-full py-3 rounded-xl bg-[#8763ea] text-white font-semibold text-base tracking-wide transition hover:bg-[#7c56eb]"
                        onClick={() => setPopupOpen(true)}

                    >
                        SHARE LINK
                    </button>
                </div>

                <div
                    className="w-full max-w-md mx-auto mt-6 flex items-center justify-between cursor-pointer border-t border-gray-100 pt-5"
                    onClick={() => handleApprovalChange()}
                >
                    <div className="flex flex-col pr-4">
                        <Typography color="blue-gray" className="font-medium text-[15px]">
                            Require Admin Approval
                        </Typography>
                        <Typography variant="small" color="gray" className="font-normal mt-0.5 leading-tight">
                            When turned on, admins must approve anyone who wants to join via the link.
                        </Typography>
                    </div>
                    <Switch
                        id="admin-approval-switch"
                        checked={requireApproval}
                        onChange={() => { }}
                        className="h-full w-full checked:bg-[#8763ea]"
                        containerProps={{
                            className: "w-11 h-6 pointer-events-none",
                        }}
                        circleProps={{
                            className: "before:hidden left-0.5 border-none",
                        }}
                    />
                </div>
            </div>
            <AnimatePresence>
                {popupOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%", scale: 0.98 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1
                        }}
                        exit={{
                            opacity: 0,
                            y: "100%",
                            scale: 0.98,
                            transition: { duration: 0.2, ease: "easeIn" }
                        }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 350,
                            velocity: 2
                        }}
                        style={{
                            backdropFilter: "blur(4px)",        // Increased blur for better effect
                            backgroundColor: "transparent",     // Already transparent ✓
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            top: 0,                            // Changed from height: '100vh'
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ pointerEvents: 'auto' }}>
                            <SharePopUp
                                onShare={() => onShare()}
                                chat={chat}
                                isOpen={popupOpen}
                                onClose={() => setPopupOpen(false)}
                                onSendInviteLink={onSendInviteLink}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default InviteLinkScreen