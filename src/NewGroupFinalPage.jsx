import React, { useEffect, useContext } from 'react'
import { AuthContext } from './firebase hooks/AuthContext';
import { motion, AnimatePresence } from "framer-motion";
import {
    ListItem,
    List,
    Typography,
    Spinner
} from "@material-tailwind/react";
import UserAvatar from "./UserAvatar"
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AvatarForProfileSet from './AvatarSelectForProfileSet';
import { useState } from 'react';
const COLOR_OPTIONS = [
    "#ff9a9e", "#1d8fe1", "#625eb1", "#7918f2", "#4801ff", "#44107a", "#ff1361", "#43e97b", "#38f9d7", "#7b54c9",
    "#2af598", "#009efd", "#c471f5", "#fa71cd", "#00c6fb", "#005bea", "#6e45e2", "#7028e4", "#ff0844", "#92fe9d",
    "#00c9ff", "#b721ff", "#21d4fd", "#5f72bd", "#9b23ea", "#f83600", "#f9d423", "#ff5858", "#f09819", "#4481eb",
    "#04befe", "#ff6b6b", "#ee5a24", "#f0932b", "#f9ca24", "#e84393", "#fd79a8", "#b71540", "#6f1e51", "#ff4d6d",
    "#ff758f", "#ff8fa3", "#ffb3c1", "#e63946", "#d90429", "#ef233c", "#f72585", "#b5179e", "#7209b7", "#560bad",
    "#480ca8", "#3f0712", "#9d0208", "#dc2f02", "#e85d04", "#f48c06", "#faa307", "#ffb703", "#ffc300", "#f67280",
    "#c06c84", "#f8b195", "#ff5252", "#ff7675", "#d63031", "#e84118", "#c23616", "#f39c12", "#e67e22", "#d35400",
    "#ff9f43", "#f0d500", "#ffd32a", "#ffc048", "#ffdd59", "#ffeaa7", "#fdcb6e", "#e17055", "#fab1a0", "#ff793f",
    "#ffb142", "#e15f41", "#f19066", "#f5cd79", "#f7d794", "#f8a5c2", "#f78fb3", "#e77f67", "#6ab04c", "#badc58",
    "#22a6b3", "#7ed6df", "#55efc4", "#00b894", "#81ecec", "#00cec9", "#2ecc71", "#27ae60", "#26de81", "#2bcbba",
    "#1dd1a1", "#10ac84", "#05c46b", "#0be881", "#32ff7e", "#7bed9f", "#a8e6cf", "#dcedc1", "#52b788", "#74c69d",
    "#95d5b2", "#b7e4c7", "#d8f3dc", "#1b4332", "#2d6a4f", "#40916c", "#218c74", "#33d9b2", "#20bf6b", "#30336b",
    "#4834d4", "#0984e3", "#74b9ff", "#3498db", "#2980b9", "#1e3799", "#0c2461", "#0a3d62", "#3c6382", "#60a3bc",
    "#82ccdd", "#079992", "#38ada9", "#4a69bd", "#1e90ff", "#70a1ff", "#54a0ff", "#00d2d3", "#028090", "#0077b6",
    "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8", "#45b6fe", "#37a0ea", "#227093", "#2e86de",
    "#48dbfb", "#0abde3", "#57606f", "#6c5ce7", "#a29bfe", "#8c7ae6", "#4a0e4e", "#7f1d1d", "#311042", "#c084fc",
    "#d8b4fe", "#f3e8ff", "#e9d5ff", "#833ab4", "#8e44ad", "#9b59b6", "#a55eea", "#9c27b0", "#ab47bc", "#ba68c8",
    "#d32f2f", "#7b1fa2", "#5e35b1", "#3949ab", "#1e88e5", "#00acc1", "#00897b", "#43a047", "#7cb342", "#c0ca33",
    "#fdd835", "#ffb300", "#fb8c00", "#f4511e", "#6d4c41", "#757575", "#546e7a", "#485563", "#29323c", "#1e272e",
    "#2f3542", "#111111", "#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1", "#1abc9c", "#16a085",
    "#d1ccc0", "#f7f1e3", "#341f97", "#2c2c54", "#474787", "#aaa69d", "#d1d8e0", "#a5b1c2", "#778ca3", "#4b6584",
    "#2f3640", "#353b48", "#718093", "#7f8fa6"
];
function NewGroupFinalPage({ Choose, members }) {
    const { createGroup } = useContext(AuthContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedEmoji, setSelectedEmoji] = useState(null);
    const [loading, setLoading] = useState(false);
    const [membersId, setMembersId] = useState([])
    const [disabled, setDisabled] = useState(false);
    const handleFileChange = (file) => {
        setSelectedFile(file); // Store first selected file
    };
    const [showFab, setShowFab] = useState(false);
    const [groupName, setGroupName] = useState("")
    const inputHandler = (value) => {
        setGroupName(value);
        const changed = value.length > 0;
        setShowFab(changed);
    }
    useEffect(() => {
        if (members.length > 0) {
            const ids = members.map(member => member.otherMember[0]._id._id);
            
            setMembersId(ids);
        }
    }, [members])
    const formatName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
    const handleFabClick = async () => {
        try {
            
            selectedEmoji
            setDisabled(true)
            setLoading(true)
            const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
            const fd = new FormData();
            if (selectedFile !== null) {
                fd.append("file", selectedFile);
                fd.append('profileType', 'image')
            } else if (selectedEmoji !== null) {
                fd.append("emoji", selectedEmoji.emoji);
                fd.append("color", selectedEmoji.color);
                fd.append('profileType', 'emoji')
            } else {
                fd.append('profileType', 'initials')
                fd.append("color", randomColor);

            }
            fd.append("name", groupName);
            membersId.forEach(id => fd.append("members[]", id));

            const newgroup = await createGroup(fd);
            Choose("Home", null, null, null, newgroup.data.data);
        } catch (error) {
            console.log(error);

        }


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
    
    return (
        <div
            id="scrollable-content"
            className="bg-gray-100 w-full scrollbar-telegram overflow-y-auto h-[calc(100vh)]"
        >
            <div className=" bg-white w-full flex items-center gap-4 px-4 py-3 ">
                <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <div>
                    <Typography variant="h5" color="blue-gray">
                        New Group
                    </Typography>
                </div>

            </div>
            <div className='bg-white pt-4' >
                <AvatarForProfileSet disabled={disabled} isprofile={false} onFileSelect={(file) => {
                    handleFileChange(file)
                    setSelectedEmoji(null)
                }} onEmojiSelect={(e) => {
                    

                    setSelectedEmoji(e)
                    setSelectedFile(null);
                }} />
                <div className="px-5 py-2">
                    <div className="my-6">
                        <div class="relative">
                            <input disabled={disabled} value={groupName} onChange={(e) => inputHandler(e.target.value)} name='groupName' type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-[#8763ea] focus:outline-none focus:ring-0 focus:border-[#8763ea] peer" placeholder=" " />
                            <label for="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-[#8763ea] peer-focus:dark:text-[#8763ea] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Group Name</label>
                        </div>
                    </div>
                </div>
            </div>

            {members.length > 0 && (

                <div className="w-full">
                    <div className="h-3 bg-transparent"></div>

                    <div className="bg-white p-2">
                        <Typography variant="h7" className="ml-4 text-blue-500">
                            {members.length} {members.length < 2 ? "member" : 'members'}
                        </Typography>
                    </div>
                    <div

                        className="bg-white "
                    >

                        <List>
                            {members.map((contact) => (
                                <ListItem
                                    //   onClick={() => toggleMember(chat)}
                                    key={contact._id}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                        <UserAvatar
                                            {...(contact.otherMember[0]._id !== null && contact.otherMember[0]._id.profile.type === 'image' && {
                                                image: contact.otherMember[0]._id.profile.imageUrl,
                                            })}
                                            {...(contact.otherMember[0]._id !== null && contact.otherMember[0]._id.profile.type === 'emoji' && {
                                                emojiSize: "text-3xl",
                                                emoji: contact.otherMember[0]._id.profile
                                                    .emoji,
                                                simpleBg: contact.otherMember[0]._id.profile
                                                    .bgColor,
                                            })}
                                            {...(contact.otherMember[0]._id !== null && contact.otherMember[0]._id.profile.type === 'initials' && {
                                                simpleBg: contact.otherMember[0]._id.profile
                                                    .bgColor,
                                                text: contact.otherMember[0].nickName ? (contact.otherMember[0].
                                                    nickLastName ? (contact.otherMember[0].nickName[0].toUpperCase() + contact.otherMember[0].
                                                        nickLastName[0].toUpperCase()) : (contact.otherMember[0].nickName[0].toUpperCase())) : (contact.otherMember[0]._id.profile
                                                            .initials),

                                            })} />

                                        <div className="flex flex-col">
                                            <span className="font-medium text-md flex items-center">
                                                {contact.otherMember[0].nickName ? (contact.otherMember[0].nickLastName ? (formatName(contact.otherMember[0].nickName) + " " + formatName(contact.otherMember[0].nickLastName)) : (formatName(contact.otherMember[0].nickName))) : (contact.otherMember[0]._id.name)}
                                            </span>
                                            <span className="text-gray-500 text-sm">last seen recently</span>
                                        </div>
                                    </div>
                                </ListItem>
                            ))}
                        </List>
                    </div>
                </div>
            )}

            {showFab && (
                <div className="flex justify-end px-5 py-2">
                    <AnimatePresence exitBeforeEnter>
                        <motion.button
                            disabled={disabled}
                            onClick={handleFabClick}
                            className="fixed bottom-7  w-14 h-14 bg-[#8763ea] hover:bg-[#7c56eb] rounded-full shadow-lg flex items-center justify-center  transition" // removed transition
                            aria-label="Save"
                            variants={fabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ willChange: "transform, opacity", zIndex: 50 }}
                        >
                            {loading === true ? (
                                <Spinner />
                            ) : <svg
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
                            </svg>}

                        </motion.button>
                    </AnimatePresence>
                </div>
            )}



        </div>
    )
}

export default NewGroupFinalPage