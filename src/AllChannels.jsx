import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "./firebase hooks/AuthContext";
import Lottie from 'lottie-react';
import myAnimation from "./lottie/404 errornotfound.json"
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "./UserAvatar"
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import {
    List,
    ListItem,
    Button,
    Typography,
    Spinner
} from "@material-tailwind/react";
import toast from "react-hot-toast";

function AllChannels({ Choose, inputRef }) {
    const { contacts, backendUser, getLeftOwnedChannels, joinChannelAgain } = useContext(AuthContext);
    console.log("contacts", contacts)
    const getChannels = () => {
        const foundChannels = contacts.filter(contact => contact.contactType === "channel").map((contact) => {
            const otherMember = contact.members?.filter(
                member => member._id?._id.toString() !== backendUser?._id.toString()
            ) || [];
            return {
                ...contact,
                otherMember: otherMember,
                lastMessage: contact.lastMessage
            };
        })
        return foundChannels
    }
    const [channelsData, setChannelsData] = useState([]);
    const [leftOwnedChannels, setLeftOwnedChannels] = useState([]);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        const fetchLeftChannels = async () => {
            try {
                const res = await getLeftOwnedChannels();
                if (res && res.status === 200) {
                    setLeftOwnedChannels(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching left channels:", err);
            }
        };
        fetchLeftChannels();
    }, [contacts]);

    useEffect(() => {
        const contactData = getChannels();
        const leftMapped = leftOwnedChannels.map(channel => {
            const otherMember = channel.members?.filter(
                member => member._id?._id.toString() !== backendUser?._id.toString()
            ) || [];
            return {
                ...channel,
                otherMember: otherMember,
                lastMessage: channel.lastMessage,
                isLeftOwned: true
            };
        });

        const allChannels = [...contactData, ...leftMapped];

        const shortedContacts = allChannels.sort((a, b) => {
            return (a.name || "").localeCompare(b.name || "");
        });
        setChannelsData(shortedContacts);
    }, [contacts, leftOwnedChannels]);

    const handleJoinAgain = async (channelId) => {
        setJoiningId(channelId);
        const fd = new FormData();
        fd.append("channelId", channelId);
        try {
            const res = await joinChannelAgain(fd);
            if (res && res.status === 200) {
                toast.success("Joined channel again successfully!");
            } else {
                toast.error("Failed to join channel");
            }
        } catch (err) {
            toast.error("Error joining channel");
        } finally {
            setJoiningId(null);
        }
    };
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const filterContacts = (keyWord) => {


        return channelsData.filter((channel) => {
            const displayName = channel.name;
            return displayName.toLowerCase().includes(keyWord.toLowerCase());
        })
    }
    console.log(filtered);
    function formatLastSeen(isoDate) {
        const lastSeenDate = new Date(isoDate);
        const now = new Date();

        const diffMs = now - lastSeenDate; // difference in milliseconds
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        const zeroPad = (num) => num.toString().padStart(2, "0");

        const formatTime = (date) => `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Helper to check if two dates are same day
        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        // Helper to check if d1 is yesterday of d2
        const isYesterday = (d1, d2) => {
            const yesterday = new Date(d2);
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(d1, yesterday);
        };

        if (diffSeconds < 5) {
            return "last seen just now";
        } else if (diffMinutes < 1) {
            return `last seen ${diffSeconds} seconds ago`;
        } else if (diffMinutes < 60) {
            return `last seen ${diffMinutes} minutes ago`;
        } else if (isSameDay(lastSeenDate, now)) {
            return `last seen today at ${formatTime(lastSeenDate)}`;
        } else if (isYesterday(lastSeenDate, now)) {
            return `last seen yesterday at ${formatTime(lastSeenDate)}`;
        } else if (diffHours < 24 * 7) { // within last week
            return `last seen on ${daysOfWeek[lastSeenDate.getDay()]} at ${formatTime(lastSeenDate)}`;
        } else {
            // format date DD/MM/YYYY
            const d = lastSeenDate.getDate();
            const m = lastSeenDate.getMonth() + 1;
            const y = lastSeenDate.getFullYear();
            return `last seen on ${zeroPad(d)}/${zeroPad(m)}/${y} at ${formatTime(lastSeenDate)}`;
        }
    }
    const handleSerch = (value) => {
        setSearch(value);
        if (value.length < 1) {
            setIsSearching(false);
        } else {
            let fliter = filterContacts(value);
            fliter.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            setFiltered(fliter)
            setIsSearching(true)
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
    const [popupOpen, setPopupOpen] = useState(false);

    return (
        <>
            <div className=" bg-white w-full flex items-center gap-4 px-4 py-3 ">
                <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <div className="flex items-center border border-[#8763ea] rounded-full px-4 py-2 w-full  bg-white">
                    <svg className="h-5 w-5 text-[#8763ea] mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => handleSerch(e.target.value)}
                        type="text"
                        placeholder="Search"
                        className="outline-none border-none bg-transparent w-full text-gray-700 placeholder:text-gray-400"
                    />
                </div>

            </div>
            {isSearching === false && (
                <div className="w-full mt-2">
                    {channelsData.length === 0 && (
                        <div className="flex flex-col items-center justify-center  h-full">
                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                            <div className="flex flex-col items-center select-none">
                                {/* Name */}


                                {/* Message preview with ellipsis */}
                                <Typography
                                    variant="small"
                                    color="gray"
                                    className="text-base max-w-[180px]  text-center font-medium"
                                >
                                    No Group now. Create new Group.
                                </Typography>
                                <Typography
                                    variant="small"

                                    className="text-base text-blue-700 max-w-[180px] truncate text-center font-medium cursor-pointer hover:underline"
                                    onClick={() => Choose("NewGroup")}
                                >
                                    Create Now.
                                </Typography>
                            </div>
                        </div>
                    )}
                    {channelsData.length > 0 && (
                        <div id="scrollable-content" className="scrollbar-telegram overflow-y-auto h-[calc(100vh-60px)] ">

                            <List className="p-2 gap-1">
                                {channelsData.map((user) => {
                                    if (!user || user.contactType !== "channel") return null;
                                    return (
                                        <ListItem
                                            key={user._id}
                                            onClick={() => {
                                                if (user.isLeftOwned) return;
                                                Choose("Home", null, null, null, user);
                                            }}
                                            className={`flex items-center gap-4 py-2 px-3 rounded-lg ${user.isLeftOwned ? 'opacity-80 hover:bg-transparent cursor-default' : ''}`}
                                        >
                                            <UserAvatar    {...(user.details.profile !== null && user.details.profile.type === 'image' && {
                                                image: user.details.profile.imageUrl,
                                            })}
                                                {...(user.details.profile !== null && user.details.profile.type === 'emoji' && {
                                                    emoji: user.details.profile
                                                        .emoji,
                                                    simpleBg: user.details.profile
                                                        .bgColor,
                                                    emojiSize: "text-3xl"
                                                })}
                                                {...(user.details.profile !== null && user.details.profile.type === 'initials' && {
                                                    simpleBg: user.details.profile
                                                        .bgColor,
                                                    text: user.details.profile.initials,

                                                })} />



                                            <div className="flex flex-col flex-1 overflow-hidden">

                                                <span className="font-medium text-[16px] text-gray-900 truncate">
                                                    {user.name}
                                                </span>

                                                {user.isLeftOwned ? (
                                                    <span className="text-red-500 text-[13px] font-semibold">
                                                        Created by you and left
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700 text-[13px] font-medium truncate">
                                                        {user.members.length + ` subscriber${user.members.length > 1 ? 's' : ""}`}
                                                    </span>
                                                )}

                                            </div>

                                            {user.isLeftOwned && (
                                                <Button
                                                    size="sm"
                                                    className="rounded-full bg-[#8763ea] text-white py-1.5 px-4 font-semibold text-xs transition-all hover:bg-[#7c56eb] shadow-none hover:shadow-none flex items-center justify-center min-w-[90px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleJoinAgain(user._id);
                                                    }}
                                                >
                                                    {joiningId === user._id ? <Spinner className="h-4 w-4 text-white" /> : "Join again"}
                                                </Button>
                                            )}
                                        </ListItem>
                                    )
                                })}
                            </List>

                        </div>
                    )}


                </div>
            )}
            {isSearching === true && (
                <div className="w-full">

                    <div id="scrollable-content" className="scrollbar-telegram overflow-y-auto h-[calc(100vh-60px)] ">

                        <List className="p-2 gap-1">
                            {filtered.map((user) => (
                                <ListItem
                                    key={user._id}
                                    onClick={() => {
                                        if (user.isLeftOwned) return;
                                        Choose("Home", null, null, null, user);
                                    }}
                                    className={`flex items-center gap-4 py-2 px-3 rounded-lg ${user.isLeftOwned ? 'opacity-80 hover:bg-transparent cursor-default' : ''}`}
                                >
                                    <UserAvatar    {...(user.details.profile !== null && user.details.profile.type === 'image' && {
                                        image: user.details.profile.imageUrl,
                                    })}
                                        {...(user.details.profile !== null && user.details.profile.type === 'emoji' && {
                                            emoji: user.details.profile
                                                .emoji,
                                            simpleBg: user.details.profile
                                                .bgColor,
                                            emojiSize: "text-3xl"
                                        })}
                                        {...(user.details.profile !== null && user.details.profile.type === 'initials' && {
                                            simpleBg: user.details.profile
                                                .bgColor,
                                            text: user.details.profile.initials,

                                        })} />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="font-medium text-[16px] text-gray-900 truncate">
                                            {user.name}
                                        </span>

                                        {user.isLeftOwned ? (
                                            <span className="text-red-500 text-[13px] font-semibold">
                                                Created by you and left
                                            </span>
                                        ) : (
                                            <span className="text-gray-700 text-[13px] font-medium truncate">
                                                {user.members.length + ` subscriber${user.members.length > 1 ? 's' : ""}`}
                                            </span>
                                        )}
                                    </div>

                                    {user.isLeftOwned && (
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-[#8763ea] text-white py-1.5 px-4 font-semibold text-xs transition-all hover:bg-[#7c56eb] shadow-none hover:shadow-none flex items-center justify-center min-w-[90px]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJoinAgain(user._id);
                                            }}
                                        >
                                            {joiningId === user._id ? <Spinner className="h-4 w-4 text-white" /> : "Join again"}
                                        </Button>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center  h-full">
                                <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                                <div className="flex flex-col items-center select-none">
                                    {/* Name */}
                                    <Typography color="blue-gray" className="font-bold text-lg text-center">
                                        No Result
                                    </Typography>

                                    {/* Message preview with ellipsis */}
                                    <Typography
                                        variant="small"
                                        color="gray"
                                        className="text-base max-w-[180px] font-medium text-center"
                                    >
                                        There were no result for "{search}".
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        color="gray"
                                        className="text-base max-w-[180px] truncate text-center font-medium"
                                    >
                                        Try a new search.
                                    </Typography>
                                </div>
                            </div>




                        )}
                    </div>
                </div>
            )}
            <div className="flex justify-end px-5 py-2">
                <AnimatePresence exitBeforeEnter>
                    <motion.button

                        onClick={() => Choose("NewGroup")}
                        className="fixed bottom-7  w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7c56eb]" // removed transition
                        aria-label="Save"
                        variants={fabVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        style={{ willChange: "transform, opacity", zIndex: 50 }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </motion.button>
                </AnimatePresence>
            </div>

            {/* <AddContactPopup isOpen={popupOpen} onClose={() => {
                setPopupOpen(false)

            }} /> */}
        </>
    )
}

export default AllChannels;


function AddContactPopup({ isOpen, onClose }) {
    const { addContact, getUserDetailsForContact, messeges, backendUser } = useContext(AuthContext);
    const [bg, setBg] = useState("bg-blue-500")
    const [name, setName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("");
    const [initial, setIntial] = useState(" ")
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(true);
    // useEffect(() =>{
    //     if (name && name.length >= 1 && lastName && lastName.length >= 1) {
    //         // Both name and last name have at least 1 character
    //        setIntial(name[0].toUpperCase() + lastName[0].toUpperCase());
    //     } else if (name && name.length >= 1) {
    //         // Only name has at least 1 character
    //         setIntial(name[0].toUpperCase());
    //     } else {
    //         setIntial(" ")
    //     }
    //     if (name && name.length >= 1 && phone.length == 10) {
    //         setDisabled(false);
    //     }
    // }
    // )
    const handleClose = () => {
        onClose()
        setPhone("")
        setName("")
        setLastName("")
        setLoading(false)
        setDisabled(true)
        setIntial(" ")
        setUserData(null)

    }
    const handleAdd = async () => {
        if (name && name.length >= 1 && phone.length == 10) {
            setLoading(true);

            const fd = new FormData();
            fd.append("phone", "+91" + phone);
            const res = await addContact(fd);
            console.log(res);
            if (res.status === 200) {
                handleClose();
                toast.success("Contact added sucessfully")
            } else {
                handleClose();
                toast.error("No user found with that phone")
            }



        }
    }
    const handleGetDetails = async (phone) => {
        setLoading(true);

        if (phone === backendUser.phone.replace(/^\+91/, '')) {
            toast.error("Cannot add yourself as contact")
            setLoading(false)
        } else {
            const fd = new FormData();
            fd.append("phone", "+91" + phone);
            const res = await getUserDetailsForContact(fd);
            if (res.status === 200) {
                setUserData(res.data.user.profile)
                console.log(res.data.user.name)
                setName(res.data.user.name);
                setLastName(res.data.user.lastName);
                setLoading(false);
                setDisabled(false)
            } else {
                setLoading(false);
                setDisabled(true)
                toast.error(res.response.data.message)
            }
        }



    }
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}    // start below
                        animate={{ opacity: 1, y: 0 }}      // slide to center & fade in
                        exit={{ opacity: 0, y: 100 }}       // slide down & fade out
                        transition={{ duration: 0.1 }}
                        className="relative bg-white rounded-2xl p-8 w-[400px] max-w-full"
                    >
                        {/* Close Icon and content unchanged */}
                        <button
                            onClick={handleClose}
                            className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 text-2xl"
                            aria-label="Close popup"
                        >
                            &times;
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold ml-8">Add Contact</h2>
                            <Button onClick={handleAdd} disabled={disabled} className="rounded-full bg-[#8763ea]">{loading ? (<Spinner />) : ("Add")}</Button>

                        </div>

                        <div className="flex gap-5 mb-4">
                            {userData === null && (
                                <UserAvatar
                                    size={"h-24 w-24 "}
                                    text={initial}
                                    simpleBg={"bg-[#8763ea]"}
                                    textSize="text-4xl"

                                />
                            )}
                            {userData !== null && (
                                <UserAvatar textSize="text-4xl" size="h-24 w-24" emojiSize={'text-5xl'} {...(userData !== null && userData.type === 'image' && {
                                    image: userData
                                        .imageUrl,
                                })}
                                    {...(userData !== null && userData.type === 'emoji' && {
                                        emoji: userData
                                            .emoji,
                                        simpleBg: userData
                                            .bgColor,
                                    })}
                                    {...(userData !== null && userData.type === 'initials' && {
                                        simpleBg: userData
                                            .bgColor,
                                        text: userData
                                            .initials,

                                    })} />
                            )}


                            <div className="flex-1 flex flex-col gap-3">
                                <input
                                    disabled={true}
                                    value={name}
                                    onChange={e => {
                                        setName(e.target.value)

                                    }}
                                    type="text"
                                    className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 placeholder:text-gray-400 outline-none"
                                    placeholder="First name "
                                />
                                <input
                                    disabled={true}
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    type="text"
                                    className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-700 placeholder:text-gray-400 outline-none"
                                    placeholder="Last name "
                                />
                            </div>
                        </div>

                        <div className="w-full mb-8">
                            <div className="flex items-center">
                                <span className=" text-gray-400 px-4 py-3 bg-transparent border border-gray-200 rounded-l-lg select-none">+91</span>
                                <input

                                    id="phone"
                                    type="tel"
                                    className="border border-gray-200 rounded-r-lg px-4 py-3 w-full text-gray-700 placeholder:text-gray-400 outline-none"
                                    value={phone}
                                    maxLength={10}
                                    onChange={(e) => {
                                        if (/^\d{0,10}$/.test(e.target.value)) {
                                            console.log(userData);

                                            setPhone(e.target.value);
                                            setUserData(null);
                                            setName("")
                                            setBg(" bg-blue-500")


                                        }
                                        // console.log(e.target.value)
                                        if (e.target.value.length == 10) {
                                            handleGetDetails(e.target.value);
                                        }
                                    }}
                                    placeholder="Phone No"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
