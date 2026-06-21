import React, { useState, useEffect, useContext } from "react";
import '../scrollbar.css';
import {
    List,
    ListItem,
    Checkbox,
    Typography
} from "@material-tailwind/react";
import { RiUserAddLine } from "react-icons/ri";
import Lottie from 'lottie-react';
import myAnimation from "../lottie/404 errornotfound.json"
import myAnimation2 from "../lottie/empty.json"
import { AuthContext } from "../firebase hooks/AuthContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
const tailwindBgColors = [
    "bg-red-600", "bg-orange-600", "bg-amber-600", "bg-yellow-600", "bg-lime-600",
    "bg-green-600", "bg-teal-600", "bg-cyan-600",
    "bg-blue-600", "bg-indigo-600", "bg-purple-600",
    "bg-red-500", "bg-orange-500", "bg-amber-500",
    "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-teal-500",
    "bg-cyan-500", "bg-blue-500", "bg-indigo-500",
    "bg-purple-500", "bg-pink-500", "bg-red-700",
    "bg-orange-700", "bg-amber-700", "bg-yellow-700", "bg-lime-700", "bg-green-700",
    "bg-teal-700", "bg-cyan-700", "bg-blue-700",
    "bg-indigo-700", "bg-purple-700", "bg-pink-700",

];
function getRandomTailwindColor() {
    const index = Math.floor(Math.random() * tailwindBgColors.length);
    return tailwindBgColors[index];
}
import UserAvatar from "../UserAvatar"

// Chip component
function MemberChip({ member, onRemove, }) {
    const [hovered, setHovered] = useState(false);
    const [color] = useState(() => getRandomTailwindColor());
    return (
        <span
            className={`flex items-center px-2 py-1 rounded-full mr-2 mb-2 bg-gray-500 bg-opacity-20 cursor-pointer transition-all duration-200`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ minWidth: "0" }}
        >
            <span
                className={`w-6 h-6 flex items-center justify-center rounded-full font-bold mr-1 relative`}
                style={{ transition: "background 0.2s", minWidth: "1.5rem" }}
            >
                {/* The avatar and cross are absolutely layered, opacity toggled for smoothness */}
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: hovered ? 0 : 1,
                        transition: "opacity 0.15s",
                        zIndex: 1,
                    }}
                >
                    {member.otherMember[0]._id.profile.type === 'image' ? (<img src={member.otherMember[0]._id.profile.imageUrl} className="w-full h-full rounded-full" alt="" />) : member.otherMember[0]._id.profile.type === 'emoji' ? (<span
                        style={{
                            backgroundColor: member.otherMember[0]._id.profile
                                .bgColor
                        }}
                        className={`flex items-center justify-center w-full h-full text-white rounded-full `}>
                        {member.otherMember[0]._id.profile
                            .emoji}
                    </span>) : (member.otherMember[0]._id.profile.type === 'initials' && (
                        <span
                            style={{
                                backgroundColor: member.otherMember[0]._id.profile
                                    .bgColor
                            }}
                            className={`flex items-center text-sm justify-center w-full h-full text-white rounded-full`}>

                            {member.otherMember[0].nickName ? (member.otherMember[0].
                                nickLastName ? (member.otherMember[0].nickName[0].toUpperCase() + member.otherMember[0].
                                    nickLastName[0].toUpperCase()) : (member.otherMember[0].nickName[0].toUpperCase())) : (member.otherMember[0]._id.profile
                                        .initials)}
                        </span>
                    ))}

                </span>
                <button
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: hovered ? 1 : 0,
                        transition: "opacity 0.15s",
                        zIndex: 2,
                        pointerEvents: hovered ? "all" : "none",
                    }}
                    className={`w-full h-full flex items-center justify-center rounded-full bg-red-500`}
                    onClick={() => onRemove(member._id)}
                >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </span>
            <span className="pr-2 text-sm font-medium">
                {member.otherMember[0].nickName ? (member.otherMember[0].
                    nickLastName ? (member.otherMember[0].nickName + " " + member.otherMember[0].
                        nickLastName) : (member.otherMember[0].nickName)) : (
                    member.otherMember[0]._id.name ? (member.otherMember[0]._id.lastName ? (member.otherMember[0]._id.name + " " + member.otherMember[0]._id.lastName) : (member.otherMember[0]._id.name)) : (null)
                )}
            </span>
        </span>
    );
}

export default function AddMembers({ back, member, chat }) {
    const { contacts, backendUser } = useContext(AuthContext);
    const [selected, setSelected] = useState([]);
    const [selectedNames, setSelectedNames] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [userContacts, setUserContacts] = useState([])
    const [shortedContacts, setShortedContacts] = useState([])
    const [showFab, setShowFab] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
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
    member(selected);
    const addMember = (member) => {
        if (!selected.some((m) => m._id === member._id)) {
            setSelected([...selected, member]);
        }
    };

    useEffect(() => {
        if (contacts.length !== 0 && backendUser != null) {
            const personContacts = contacts.filter(contact => contact.contactType === "person");
            // Suppose `contacts` is the array received from the backend
            const processedContacts = personContacts.map(contact => {
                const otherMembers = contact.members.filter(
                    member => member._id._id !== backendUser._id
                );
                return {
                    ...contact,
                    otherMember: otherMembers, // Array of others
                    lastMessage: contact.lastMessage
                };
            });
            setUserContacts(processedContacts);


        }
    }, [contacts, backendUser]);
    useEffect(() => {
        if (userContacts.length != 0) {
            const sortedContacts = [...userContacts].sort((a, b) =>
                a.otherMember[0]._id.name.localeCompare(b.otherMember[0]._id.name)
            )
            setShortedContacts(sortedContacts);
        }
    }, [userContacts])
    // Add this useEffect after your existing useEffects
    useEffect(() => {
        setShowFab(selected.length > 0);
    }, [selected.length]);

    const removeMember = (id) => {
        setSelected(selected.filter((m) => m._id !== id));
    };

    const toggleMember = (member) => {
        if (selected.some((m) => m._id === member._id)) {
            removeMember(member._id);
        } else {
            addMember(member);
            setIsSearching(false)
            setFiltered([])
            setSearch("")
        }
    };

    const filterContacts2 = (keyWord) => {
        return shortedContacts.filter(contact => {
            // Resolve display name for contact
            const member = contact.otherMember[0];
            let displayName;

            if (member.nickName) {
                displayName = member.nickLastName
                    ? formatName(member.nickName) + " " + formatName(member.nickLastName)
                    : formatName(member.nickName);
            } else if (member._id && member._id.name) {
                displayName = member._id.name;
            } else {
                displayName = "";
            }

            // Filter by keyword (case-insensitive)
            return displayName.toLowerCase().includes(keyWord.toLowerCase());
        });
    };

    const handleSerch = (value) => {
        setSearch(value);
        let fliter = filterContacts2(value);
        fliter.sort((a, b) =>
            a.otherMember[0]._id.name.localeCompare(b.otherMember[0]._id.name)
        )
        setFiltered(fliter)
        setIsSearching(true)
    }
    const formatName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
    const handleFab = () => {
        setLoading(true);

        const formatSelectedMembers = (members) => {
            if (!members || members.length === 0) return '';

            return members
                .map(member => {
                    const mem = member.otherMember[0]._id

                    // If only name exists
                    if (mem.name && !mem.lastName) {
                        return mem.name;
                    }
                    // If both name and lastname exist
                    if (mem.name && mem.lastName) {
                        return `${mem.name} ${mem.lastName}`;
                    }
                    // Fallback to username or id

                })
                .join(', ');
        }
        setSelectedNames(formatSelectedMembers(selected));
        setPopupOpen(true)
        setLoading(false);
    }
    return (
        <>
            <div className="bg-gray-100">
                <div className="bg-white flex-col ">
                    <div className="flex items-center gap-2 px-4 py-3 ">
                        <button
                            className="p-2 rounded-full hover:bg-gray-200 transition"
                            onClick={() => back()}
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                        </button>
                        <Typography variant="h5" className=" select-none" color="blue-gray">
                            {chat.contactType == "channel" ? "Add Subscribers" : "Add Members"}
                        </Typography>
                    </div>

                    <div className="bg-white py-0.5 px-2  flex flex-wrap max-h-20 overflow-y-auto scrollbar-hidden">
                        {selected.map((member) => (
                            <MemberChip key={member._id} member={member} onRemove={removeMember} />
                        ))}
                        <input
                            type="text"
                            className="mb-2 w-full p-2 outline-none rounded"
                            placeholder="Add people..."
                            value={search}
                            onChange={(e) => handleSerch(e.target.value)}
                        // onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>



            </div>
            <div className="h-3 bg-gray-100" />
            {/* lg:h-[calc(100vh-160px) */}
            {isSearching === false && (
                <div
                    id="scrollable-content"
                    className="w-full scrollbar-telegram overflow-y-auto h-[calc(100vh-130px)] "
                >
                    <List>
                        {
                            shortedContacts.map((contact) => (
                                <ListItem
                                    onClick={() => toggleMember(contact)}
                                    key={contact._id}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                        <Checkbox
                                            ripple={false}
                                            className="h-6 w-6 rounded-full border-gray-900/20 bg-gray-900/10 transition-all hover:scale-105 hover:before:opacity-0"
                                            checked={selected.some((m) => m._id === contact._id)}
                                            onChange={() => toggleMember(contact)}
                                        />
                                        <UserAvatar    {...(contact.otherMember[0]._id !== null && contact.otherMember[0]._id.profile.type === 'image' && {
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
                    {shortedContacts.length === 0 && (
                        <div className="flex flex-col items-center  h-full">
                            <Lottie animationData={myAnimation2} loop={true} style={{ height: 300, width: 300 }} />
                            <div className="flex flex-col items-center">
                                {/* Name */}
                                <Typography color="blue-gray" className="font-bold text-lg text-center">
                                    No Contact Found
                                </Typography>

                                {/* Message preview with ellipsis */}


                            </div>
                        </div>




                    )}
                </div>
            )}
            {isSearching === true && (
                <div
                    id="scrollable-content"
                    className="w-full scrollbar-telegram overflow-y-auto h-[calc(100vh-165px)]"
                >
                    <List>
                        {filtered.map((contact) => (
                            <ListItem
                                onClick={() => toggleMember(contact)
                                }
                                key={contact._id}
                                className="flex justify-between items-center"
                            >
                                <div className="flex items-center space-x-3 py-1 px-1 hover:bg-gray-100 rounded cursor-pointer transition-all">
                                    <Checkbox
                                        ripple={false}
                                        className="h-6 w-6 rounded-full border-gray-900/20 bg-gray-900/10 transition-all hover:scale-105 hover:before:opacity-0"
                                        checked={selected.some((m) => m._id === contact._id)}
                                        onChange={() => toggleMember(contact)}
                                    />
                                    <UserAvatar    {...(contact.otherMember[0]._id !== null && contact.otherMember[0]._id.profile.type === 'image' && {
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
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center  h-full">
                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                            <div className="flex flex-col items-center">
                                {/* Name */}
                                <Typography color="blue-gray" className="  select-none font-bold text-lg text-center">
                                    No Result
                                </Typography>

                                {/* Message preview with ellipsis */}
                                <Typography
                                    variant="small"
                                    color="gray"
                                    className=" select-none text-sm max-w-[180px] font-medium  text-center"
                                >
                                    There were no result for "{search}".
                                </Typography>
                                <Typography
                                    variant="small"
                                    color="gray"
                                    className=" select-none text-sm font-medium max-w-[180px] truncate text-center"
                                >
                                    Try a new search.
                                </Typography>
                            </div>
                        </div>




                    )}
                </div>
            )}
            {showFab && (
                <div className="flex justify-end px-5 py-2">
                    <AnimatePresence exitBeforeEnter>
                        <motion.button
                            disabled={loading}
                            onClick={() => handleFab()} className="fixed bottom-7  w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700" // removed transition
                            aria-label="Save"
                            variants={fabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ willChange: "transform, opacity", zIndex: 50 }}
                        >
                            <RiUserAddLine size={28} className='text-white' />
                        </motion.button>
                    </AnimatePresence>
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
                            transition: { duration: 0.2, ease: "easeIn" } // Faster exit
                        }}
                        transition={{
                            type: "spring",
                            damping: 30,    // Increased damping reduces jitter
                            stiffness: 350,  // High stiffness for that "snappy" Telegram feel
                            velocity: 2
                        }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,
                            height: '100vh',
                            pointerEvents: 'none' // Allows clicking through the wrapper
                        }}
                    >
                        <div style={{ pointerEvents: 'auto' }}> {/* Re-enable clicks for the popup */}
                            <Popup
                                isOpen={popupOpen}
                                onClose={() => setPopupOpen(false)}
                                chat={chat}
                                membersNames={selectedNames}
                                members={selected}
                                back={() => back()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
import UserAvatar2 from "../UserAvatar2";
import toast from "react-hot-toast";
function Popup({ isOpen, onClose, chat, members, membersNames, back }) {
    if (!isOpen) return null;
    const { addManyUserInGroupById, addMemberInChanel } = useContext(AuthContext);
    const handleAdd = async () => {
        const getUnjoinedUsers = () => {
            // Extract member IDs from current group (subdocument array)
            const currentMemberIds = chat.members
                .map(member =>
                    member._id._id || member._id // Handle populated vs raw ObjectId
                ).map(id => id.toString());

            // Filter selected users who are NOT in current group
            return members.filter(user =>
                !currentMemberIds.includes(user.otherMember
                [0]._id
                    ._id.toString())
            );
        };
        const unJoinedUsers = getUnjoinedUsers();
        const getUnjoinedUsersIds = () => {
            return unJoinedUsers.map(user => user.otherMember[0]._id._id)
        };
        const unJoinedUsersIds = getUnjoinedUsersIds();
        if (unJoinedUsersIds.length > 0) {
            const fd = new FormData();
            if (chat.contactType === "group") {
                fd.append("groupId", chat._id);
            } else if (chat.contactType === "channel") {
                fd.append("channelId", chat._id);
            }
            unJoinedUsersIds.forEach((id, index) => {
                fd.append('memberIds[]', id);  // Sends as memberIds[0], memberIds[1]...
            });
            if (chat.contactType === "channel") {
                const res = await addMemberInChanel(fd);
                if (res.status == 409) {
                    toast.error("Already joined the channel")
                } else {
                    
                    onClose();
                    back();
                    toast.success("Added sucessfully")
                }


            } else if (chat.contactType === "group") {
                const res = await addManyUserInGroupById(fd);

                
                onClose();
                back();
                toast.success("Added sucessfully")
            }

        } else {
            toast.error(` Already joined the ${chat.contactType}`)
            onClose()
        }

    }
    return (
        <div className=" select-none fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
            <div className="relative bg-white rounded-2xl p-4 w-[250px] max-w-full">
                <div className="flex items-center  mb-6">
                    <UserAvatar2    {...(chat.details.profile !== null && chat.details.profile.type === 'image' && {
                        image: chat.details.profile
                            .imageUrl,
                    })}
                        {...(chat.details.profile !== null && chat.details.profile.type === 'emoji' && {
                            emoji: chat.details.profile
                                .emoji,
                            simpleBg: chat.details.profile
                                .bgColor,
                        })}
                        {...(chat.details.profile !== null && chat.details.profile.type === 'initials' && {
                            simpleBg: chat.details.profile
                                .bgColor,
                            text: chat.details.profile.initials,

                        })} />
                    <h2 className="text-xl font-semibold ml-4">Add {chat.contactType == "channel" ? "Subscribers" : "Members"}</h2>
                </div>
                <div className="flex  items-center justify-center">
                    <p className="font-telegram text-md font-medium text-gray-800   items-center gap-1 max-w-full">
                        Are you sure you want to add{" "}
                        <span className="text-black font-semibold">{membersNames}</span> to{" "}
                        <span className="text-black font-semibold">{chat.name}</span>?
                    </p>
                </div>

                {/* Close Icon */}
                {/* <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
                    aria-label="Close popup"
                >
                    &times;
                </button> */}
                {/* Header */}
                {/* <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold ml-8">Add Contact</h2>
                    <button className="bg-blue-100 text-blue-500 font-semibold px-5 py-2 rounded-xl text-sm opacity-60 cursor-not-allowed">
                        ADD
                    </button>
                </div> */}

                {/* Phone Number */}
                {/* <div className="mt-1">
                    <label className="text-xs text-gray-400 px-1">Phone Number</label>
                    <input
                        type="text"
                        className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 mt-1 placeholder:text-gray-400 outline-none"
                        placeholder="+91 ------- -----"
                    />
                </div> */}
                {/* Buttons */}
                <div className="flex items-end justify-end space-x-3 pt-4">
                    <button
                        className="  py-2 px-3 font-semibold  text-blue-400 rounded-lg text-md hover:bg-blue-50 transition-colors"
                        onClick={onClose}
                    >
                        CANCEL
                    </button>
                    <button
                        className=" py-2 px-3 font-semibold  text-blue-400 rounded-lg text-md hover:bg-blue-50 transition-colors"
                        onClick={() => handleAdd()}
                    >
                        ADD
                    </button>
                </div>
            </div>

        </div>
    );
}

