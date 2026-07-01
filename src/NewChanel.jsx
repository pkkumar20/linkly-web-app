import { useState, useContext } from 'react';
import { AuthContext } from './firebase hooks/AuthContext';
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {

    Typography,
    Spinner
} from "@material-tailwind/react";
import getColor from "./helper/getColor";
import AvatarWithUpload from "./AvatarWithUpload";
function NewChanel({ Choose }) {
    const { createChanel } = useContext(AuthContext);
    const [showFab, setShowFab] = useState(false);
    const [channelName, setChannelName] = useState("")
    const [file, setFile] = useState(null);
    const [emoji, setEmoji] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputHandler = (value) => {
        setChannelName(value);
        const changed = value.trim().length > 0;
        setShowFab(changed);
    }

    const fabVariants = {
        hidden: {
            opacity: 0,
            scale: 0.7,
            y: 80,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        }
    };
    const AddMemberForChanel = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.append("name", channelName);
        if (file !== null && file !== undefined) {
            fd.append("file", file);
            fd.append('profileType', 'image')
        } else if (emoji !== null && emoji !== undefined) {
            fd.append("emoji", emoji.emoji);
            fd.append("color", emoji.color);
            fd.append('profileType', 'emoji')
        } else {
            fd.append('profileType', 'initials')
            fd.append("color", getColor());

        }

        const res = await createChanel(fd);
        setLoading(false);
        if (res.status === 200) {
            Choose("AddMemberForChanel", null, null, res.data.data);
        }

    }
    return (
        <div
            id="scrollable-content"
            className=" bg-gray-100 w-full scrollbar-telegram overflow-y-auto h-[calc(100vh)]"
        >
            <div className=" bg-white w-full flex items-center gap-4 px-4 py-3 ">
                <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <div>
                    <Typography variant="h5" color="blue-gray">
                        New Channel
                    </Typography>
                </div>

            </div>
            <div className='bg-white pt-4' >
                <AvatarWithUpload isprofile={false}
                    disabled={loading}
                    onFileSelect={(file) => {
                        setFile(file)
                        setEmoji(null)
                    }}
                    onEmojiSelect={(emoji) => {
                        setEmoji(emoji)
                        setFile(null)
                    }}
                />
                <div className="px-5 py-2">
                    <div className="my-6">
                        <div className="relative">
                            <input disabled={loading} value={channelName} onChange={(e) => inputHandler(e.target.value)} name='groupName' type="text" id="floating_outlined" className="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-[#8763ea] focus:outline-none focus:ring-0 focus:border-[#8763ea] peer" placeholder=" " />
                            <label htmlFor="floating_outlined" className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-[#8763ea] peer-focus:dark:text-[#8763ea] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Channel Name</label>
                        </div>

                    </div>
                </div>
            </div>
            {showFab && (
                <div className="flex justify-end px-5 py-2">
                    <AnimatePresence exitBeforeEnter>
                        <motion.button
                            disabled={loading}
                            onClick={AddMemberForChanel}
                            className="fixed bottom-7  w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7c56eb]" // removed transition
                            aria-label="Save"
                            variants={fabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ willChange: "transform, opacity", zIndex: 50 }}
                        >
                            {loading === true ? (<Spinner />) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            )}

                        </motion.button>
                    </AnimatePresence>
                </div>
            )}

        </div>
    )
}

export default NewChanel