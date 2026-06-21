import '../scrollbar.css';
import { useState, useContext, useEffect } from "react";
import { AuthContext } from '../firebase hooks/AuthContext';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import AvatarWithCropCircle from "../AvatarWithUpload";
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
    Spinner
} from "@material-tailwind/react";
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
import { IoLockClosedOutline } from "react-icons/io5";
import { AiOutlineLink, AiOutlineDelete } from "react-icons/ai";
import { LiaScrollSolid } from "react-icons/lia";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { LuUsers } from "react-icons/lu";
import { LiaUserTimesSolid } from "react-icons/lia";
import GroupType from './GroupType';
import InviteLinkScreen from './InviteLinkScreen';
import AdministrationScreen from './AdministrationScreen';
import MemberScreen from './MemberScreen';
import RemovedUSersScreen from './RemovedUsers';
import Permissions from './Permissions';
import LeaveGroupPopUp from './LeaveGroupPopUp';
export default function EditScreen({ onShare, onPress, chatData, rdScreen, onSendInviteLink }) {
    const { backendUser, updateGroupInfo, profileUpdateinChanel } = useContext(AuthContext);
    const [popupOpen, setPopupOpen] = useState(false);
    const [screen, setScreen] = useState('main');
    const [showFab, setShowFab] = useState(false);
    const [groupName, setGroupName] = useState(chatData.name);
    const [file, setFile] = useState(null);
    const [emoji, setEmoji] = useState(null);
    const [loading, setLoading] = useState(false);
    const [intinal, setIntial] = useState(true);
    const [intinalValue, setIntialValue] = useState("");
    const color = chatData.details.profile.bgColor;

    const totalActive = Object.values(chatData.membersPermissions).filter(value => value === true).length;
    const totalKeys = Object.keys(chatData.membersPermissions).length;
    function getIsOwner() {
        const isAdmin = chatData.admins.some(user => user._id.toString() === backendUser._id.toString());
        const isOwner = chatData.owner.toString() === backendUser._id.toString();
        if (isOwner || isAdmin) {
            return true;
        } else {
            return false;
        }
    }
    const isOwner = chatData.owner.toString() === backendUser._id.toString();
    const getShowInput = () => {
        const isOwner = chatData.owner.toString() === backendUser._id.toString();
        if (isOwner) {
            return true;
        } else {
            const isAdmin = chatData.admins.some(user => user._id.toString() === backendUser._id.toString());
            if (isAdmin === true) {
                const isChangeAllowed = chatData.permissions.editGroupInfo.includes(backendUser._id);
                if (isChangeAllowed === true) {
                    return true;
                } else {
                    return false;
                }

            } else {
                const isChangeAllowedForUsers = chatData.membersPermissions.changeChatInfo;
                if (isChangeAllowedForUsers === true) {
                    return true;
                } else {
                    return false;
                }
            }

        }

    }
    const showInput = getShowInput();
    const isAdminOrOwner = getIsOwner();
    function getFirstLast(input) {
        const words = input.trim().split(/\s+/);
        if (words.length === 0) return "";

        // Single word: return only first letter
        if (words.length === 1) {
            const emojiInsideWord = /\w\p{Extended_Pictographic}/u.test(words[0][0])
            return emojiInsideWord;
        }

        // Multiple words: first + last letters
        const first = words[0][0];
        const last = words[words.length - 1][0];
        const emojiInsideWord = /\w\p{Extended_Pictographic}/u.test(first + last)
        return emojiInsideWord;
    }
    function getIntial(input) {
        const words = input.trim().split(/\s+/);
        if (words.length === 0) return "";

        // Single word: return only first letter
        if (words.length === 1) {

            return words[0][0];

        }

        // Multiple words: first + last letters
        const first = words[0][0];
        const last = words[words.length - 1][0];


        return first + last;

    }
    const inputHandler = (value) => {
        setGroupName(value);
        const isEmoji = getFirstLast(value);
        if (isEmoji) {

            const intinal = getIntial(value);
            setIntial(true);
            setIntialValue(intinal);

        }
        // getIntial(value);
        // console.log(intinal);

        const changed = value.length > 0;
        setShowFab(changed);
    };
    useEffect(() => {
        // Check if the name is different from the original OR if a new file/emoji is selected
        const nameChanged = groupName !== chatData.name && groupName.length > 0;
        const fileSelected = file !== null;
        const emojiSelected = emoji !== null;

        if (nameChanged || fileSelected || emojiSelected) {
            setShowFab(true);
        } else {
            setShowFab(false);
        }
    }, [groupName, file, emoji, chatData.name]);
    useState(() => {
        if (rdScreen.length > 0) {
            console.log("working")
        }
    })
    useEffect(() => {
        // Check if the name is different from the original OR if a new file/emoji is selected
        const nameChanged = groupName !== chatData.name && groupName.length > 0 && groupName.length !== 0;
        const fileSelected = file !== null;
        const emojiSelected = emoji !== null;

        if (nameChanged || fileSelected || emojiSelected) {
            if (groupName.length == 0) {
                setShowFab(false);
            } else {
                setShowFab(true);
            }

        } else {
            setShowFab(false);
        }
    }, [groupName, file, emoji, chatData.name]);
    // Admin panel slide anim right to left open, left to right close
    const adminVariants = {
        hidden: { x: "100%" },       // Offscreen right (closed)
        visible: { x: 0 },           // Onscreen left (open)
        exit: { x: "100%" }          // Slide out right (closing)
    };
    const handleFabClick = async () => {
        console.log("clicked");

        try {
            setLoading(true)
            const fd = new FormData();
            if (file !== null) {
                fd.append("file", file);
                fd.append('profileType', 'image');
            } else if (emoji !== null) {
                fd.append("emoji", emoji.emoji);
                fd.append("color", emoji.color);
                fd.append('profileType', 'emoji')
            } else {
                fd.append('profileType', 'initials')
                if (intinal === true) {
                    fd.append("initials", intinalValue);
                }
                if (color !== null) {
                    fd.append("color", color);
                } else {
                    const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
                    fd.append("color", randomColor);
                }

            }
            fd.append("name", groupName);

            if (chatData.contactType === "group") {
                fd.append("groupId", chatData._id);
                const res = await updateGroupInfo(fd);
                if (res.status === 200) {
                    console.log(res);

                    setLoading(false);
                    onPress(false)

                }
            } else if (chatData.contactType === "channel") {
                fd.append("channelId", chatData._id);
                const res = await profileUpdateinChanel(fd);
                if (res.status === 200) {
                    console.log(res);

                    setLoading(false);
                    onPress(false)

                }
            }

        } catch (error) {
            console.log(error);

        }
    }

    return (
        <div className=' select-none'
        >
            {/* Main panel: always visible, no animation */}
            <div
                className="fixed right-0 top-0 h-full bg-white shadow-2xl  w-full md:w-96"
                style={{

                    zIndex: screen === "main" ? 40 : 30, // lower than admin if hidden
                    display: screen === "admin" ? "block" : "block" // always display, but layered
                }}
            >
                <div className="bg-gray-100 w-full">
                    <div className="bg-white flex items-center gap-4 px-4 py-3">
                        <button
                            className="p-2 rounded-full hover:bg-gray-200 transition"
                            onClick={() => onPress(false)}
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                        </button>
                        <Typography variant="h5" color="blue-gray" className=' select-none'>


                            {chatData.contactType == "group" && ("Edit Group Info")}
                            {chatData.contactType == "channel" && ("Edit Channel Info")}
                        </Typography>
                    </div>
                    <div className="scrollbar-telegram overflow-y-auto h-[calc(100vh-65px)]">
                        {showInput === true && (
                            <div className="p-4 bg-white">
                                <div className="mt-4">
                                    <AvatarWithCropCircle {...(chatData.details.profile.type === 'image' && {
                                        profileLink: chatData.details.profile
                                            .imageUrl,
                                        profileType: "image"
                                    })}
                                        {...(chatData.details.profile.type === 'emoji' && {
                                            profileText: chatData.details.profile
                                                .emoji,
                                            profileBg: chatData.details.profile
                                                .bgColor,
                                            profileType: "emoji"
                                        })}
                                        {...(chatData.details.profile.type === 'initials' && {
                                            profileBg: chatData.details.profile
                                                .bgColor,
                                            profileText: chatData.details.profile
                                                .initials,
                                            profileType: 'undefined'
                                        })}

                                        isChanged={e => console.log(e)}
                                        isprofile={false}
                                        disabled={loading}
                                        onFileSelect={(file) => {
                                            setFile(file)
                                            setEmoji(null);
                                        }} onEmojiSelect={(e) => {
                                            setFile(null);
                                            setEmoji(e);
                                        }} />
                                </div>
                                <div className="px-5 py-2">
                                    <div className="my-6">
                                        <div className="relative">
                                            <input
                                                value={groupName}
                                                onChange={(e) => inputHandler(e.target.value)}
                                                name="groupName"
                                                type="text"
                                                id="floating_outlined"
                                                className=" h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                                                placeholder=" "
                                            />
                                            <label
                                                htmlFor="floating_outlined"
                                                className="absolute font-medium text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                                            >
                                                {chatData.contactType == "group" ? "Group Name" : "Channel Name"}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAdminOrOwner === true && (
                            <>
                                <div className="h-3" />
                                <div className="bg-white">
                                    <List className=''>
                                        <ListItem onClick={() => setScreen('groupType')}>
                                            <div className="flex items-center gap-3">
                                                <ListItemPrefix>
                                                    <IoLockClosedOutline size={26} />
                                                </ListItemPrefix>
                                                <div className="flex flex-col gap-1">
                                                    <Typography className="font-medium text-md ">
                                                        {chatData.contactType == "group" ? "Group Type" : "Channel Type"}
                                                    </Typography>
                                                    <Typography

                                                        className="text-sm font-body text-gray-500"
                                                    >
                                                        {chatData.details.type.charAt(0).toUpperCase() + chatData.details.type.slice(1)}
                                                    </Typography>
                                                </div>
                                            </div>
                                        </ListItem>
                                        <ListItem onClick={() => setScreen('inviteLink')}>
                                            <div className="flex items-center gap-3">
                                                <ListItemPrefix>
                                                    <AiOutlineLink size={26} />
                                                </ListItemPrefix>
                                                <div className="flex flex-col gap-1">
                                                    <Typography className="font-medium text-md ">
                                                        Invite Link
                                                    </Typography>
                                                    <Typography

                                                        className=" font-body text-sm  text-gray-500"
                                                    >
                                                        1
                                                    </Typography>
                                                </div>
                                            </div>
                                        </ListItem>
                                        {chatData.contactType == "group" && (<ListItem onClick={() => setScreen('permisions')}>
                                            <div className="flex items-center gap-3">
                                                <ListItemPrefix>
                                                    <LiaScrollSolid
                                                        size={26} />
                                                </ListItemPrefix>
                                                <div className="flex flex-col gap-1">
                                                    <Typography className="font-medium text-md ">
                                                        Permissions
                                                    </Typography>
                                                    <Typography

                                                        className=" font-body text-sm  text-gray-500"
                                                    >
                                                        {`${totalActive}/${totalKeys}`}
                                                    </Typography>
                                                </div>
                                            </div>
                                        </ListItem>)}



                                    </List>
                                </div>
                            </>
                        )
                        }
                        {showInput === true && (
                            <div className="h-3" />
                        )}

                        <div className="bg-white">
                            <List>
                                <ListItem onClick={() => setScreen("administration")}>
                                    <div className="flex items-center gap-3">
                                        <ListItemPrefix>
                                            <MdOutlineAdminPanelSettings size={26} />
                                        </ListItemPrefix>
                                        <div className="flex flex-col gap-1">
                                            <Typography className="font-medium text-md ">
                                                Administrators
                                            </Typography>
                                            <Typography

                                                className="font-body text-sm  text-gray-500"
                                            >
                                                {chatData.admins.length}
                                            </Typography>
                                        </div>
                                    </div>
                                </ListItem>
                                <ListItem onClick={() => setScreen("member")}>
                                    <div className="flex items-center gap-3">
                                        <ListItemPrefix>
                                            <LuUsers size={26} />
                                        </ListItemPrefix>
                                        <div className="flex flex-col gap-1">
                                            <Typography className="font-medium text-md ">
                                                {chatData.contactType == "channel" ? "Subscribers" : "Members"}
                                            </Typography>
                                            <Typography

                                                className="font-body text-sm  text-gray-500"
                                            >
                                                {chatData.members.length}
                                            </Typography>
                                        </div>
                                    </div>
                                </ListItem>
                                <ListItem onClick={() => setScreen("removedUser")}>
                                    <div className="flex items-center gap-3">
                                        <ListItemPrefix>
                                            <LiaUserTimesSolid size={26} />
                                        </ListItemPrefix>
                                        <div className="flex flex-col gap-1">
                                            <Typography className="font-medium text-md ">
                                                Blocked Users
                                            </Typography>
                                            <Typography

                                                className="font-body text-sm  text-gray-500"
                                            >
                                                {chatData.removedMembers.length}
                                            </Typography>
                                        </div>
                                    </div>
                                </ListItem>
                            </List>
                        </div>
                        <div className="h-3" />
                        <div className="bg-white ">
                            <List>
                                <ListItem
                                    className="hover:bg-red-100 focus:bg-red-100 "
                                    onClick={() => setPopupOpen(true)}
                                >
                                    <div className="flex items-center gap-3 text-red-600">
                                        <ListItemPrefix>
                                            <AiOutlineDelete size={26} className="text-red-600" />
                                        </ListItemPrefix>
                                        <div className="flex flex-col gap-1">
                                            <Typography className="font-medium text-md text-red-600">
                                                {chatData.contactType == "group" ? (isOwner === true ? "Delete or leave group" : "Leave group") : (isOwner === true ? "Delete or leave channel" : "Leave channel")}
                                            </Typography>
                                        </div>
                                    </div>
                                </ListItem>
                            </List>
                        </div>
                        {showFab && (
                            <div className="flex justify-end px-5 py-2">
                                <button
                                    onClick={() => handleFabClick()}
                                    className="fixed bottom-7 right-5 md:right-auto md:w-14 w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#6f43db]"
                                    aria-label="Save"
                                    style={{ zIndex: 50 }}
                                >
                                    {loading ? (<Spinner></Spinner>) : (<svg
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
                                    </svg>)}

                                </button>
                            </div>
                        )}
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
                                        <LeaveGroupPopUp
                                            onShare={(chatId, userId) => console.log(chatId, userId)}
                                            chat={chatData}
                                            isOpen={popupOpen}
                                            onClose={() => setPopupOpen(false)}

                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* AnimatePresence only for admin panel */}
                <AnimatePresence>
                    {screen === "groupType" && (
                        <motion.div
                            key="groupType"
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <GroupType Screen={(e) => setScreen(e)} chat={chatData} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {screen === 'inviteLink' && (
                        <motion.div
                            key='inviteLink'
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <InviteLinkScreen
                                onShare={() => {
                                    onPress(false);
                                    onShare();
                                }}
                                Screen={(e) => setScreen(e)} chat={chatData} onSendInviteLink={onSendInviteLink} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {screen === 'administration' && (
                        <motion.div
                            key='inviteLink'
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <AdministrationScreen Screen={(e) => setScreen(e)} chat={chatData} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {screen === 'member' && (
                        <motion.div
                            key='inviteLink'
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <MemberScreen Screen={(e) => setScreen(e)} chat={chatData} choose={onSendInviteLink
                            } onShare={onShare} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {screen === 'permisions' && (
                        <motion.div
                            key='inviteLink'
                            className="fixed right-0 top-0 h-full bg-gray-100 shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <Permissions Screen={(e) => setScreen(e)} chat={chatData} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {screen === 'removedUser' && (
                        <motion.div
                            key='inviteLink'
                            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-50 w-full md:w-96"
                            variants={adminVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 250, damping: 28 }}
                        >
                            <RemovedUSersScreen Screen={(e) => setScreen(e)} chat={chatData} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function Popup({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
            <div className="relative bg-white rounded-2xl p-8 w-[400px] max-w-full">
                {/* Close Icon */}
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
                    aria-label="Close popup"
                >
                    &times;
                </button>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold ml-8">Add Contact</h2>
                    <button className="bg-blue-100 text-blue-500 font-semibold px-5 py-2 rounded-xl text-sm opacity-60 cursor-not-allowed">
                        ADD
                    </button>
                </div>
                <div className="flex gap-5 mb-4">
                    {/* Avatar Circle */}
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                    <div className="flex-1 flex flex-col gap-3">
                        {/* First Name */}
                        <input
                            type="text"
                            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 placeholder:text-gray-400 outline-none"
                            placeholder="First name (required)"
                        />
                        {/* Last Name */}
                        <input
                            type="text"
                            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 placeholder:text-gray-400 outline-none"
                            placeholder="Last name (optional)"
                        />
                    </div>
                </div>
                {/* Phone Number */}
                <div className="mt-1">
                    <label className="text-xs text-gray-400 px-1">Phone Number</label>
                    <input
                        type="text"
                        className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 mt-1 placeholder:text-gray-400 outline-none"
                        placeholder="+91 ------- -----"
                    />
                </div>
            </div>
        </div>
    );
}
