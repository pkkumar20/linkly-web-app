import React, { useState } from 'react'
import Lottie from 'lottie-react';
import myAnimation from "../lottie/You're in!.json"
import {
    Typography,

} from "@material-tailwind/react";
import { FiMoreVertical } from "react-icons/fi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import SharePopUp from './SharePopUp';
function InviteLinkScreen({ Screen, chat, onSendInviteLink, onShare }) {
    const [popupOpen, setPopupOpen] = useState(false);
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
                        <button  className="ml-3">
                            <FiMoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <button
                        className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold text-base tracking-wide transition hover:bg-blue-600"
                        onClick={()=>setPopupOpen(true)}
                        
                    >
                        SHARE LINK
                    </button>
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
                                onShare={()=>onShare()}
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