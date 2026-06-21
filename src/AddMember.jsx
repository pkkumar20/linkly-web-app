import React, { useState, useEffect, useContext } from "react";
import './scrollbar.css';
import {
    List,
    ListItem,
    Checkbox,
    Typography,
    Spinner
} from "@material-tailwind/react";
import Lottie from 'lottie-react';
import myAnimation from "./lottie/404 errornotfound.json"
import emptyAnimation from "./lottie/empty.json"
import { AuthContext } from "./firebase hooks/AuthContext";
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
import UserAvatar from "./UserAvatar"

// Chip component
function MemberChip({ member, onRemove }) {
    const [hovered, setHovered] = useState(false);
    const [color] = useState(() => getRandomTailwindColor())
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

export default function AddMembers({ Choose, handler, members, loading }) {
    const { contacts, backendUser } = useContext(AuthContext);
    const [selected, setSelected] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [userContacts, setUserContacts] = useState([])
    const [shortedContacts, setShortedContacts] = useState([])
    const [isLoading, SetIsLoading] = useState(loading)
    members(selected);
    const addMember = (member) => {
        if (!selected.some((m) => m._id === member._id)) {
            setSelected([...selected, member]);
        }
    };
    useEffect(() => {
        SetIsLoading(loading)
    }, [loading])
    useEffect(() => {
        if (contacts.length !== 0 && backendUser != null) {
            const personContacts = contacts.filter(contact => contact.contactType === "person");
            console.log(personContacts);
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
        if (value === "") {
            setIsSearching(false)
            setFiltered([])
            return
        }
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
    return (
        <>
            <div className="select-none w-full p-3 rounded shadow-sm bg-white">
                <div className="flex flex-wrap max-h-20 overflow-y-auto scrollbar-hidden">
                    {selected.map((member) => (
                        <MemberChip key={member._id} member={member} onRemove={removeMember} />
                    ))}
                    <input
                        type="text"
                        className="mt-2 w-full p-2 outline-none rounded"
                        placeholder="Add people..."
                        value={search}
                        onChange={(e) => handleSerch(e.target.value)}
                    />
                </div>


            </div>
            {/* lg:h-[calc(100vh-160px) */}
            {isSearching === false && (
                <div
                    id="scrollable-content"
                    className="w-full scrollbar-telegram overflow-y-auto h-[calc(100vh-165px)]"
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
                            <Lottie animationData={emptyAnimation} loop={true} style={{ height: 300, width: 300 }} />
                            <div className="flex flex-col items-center">
                                {/* Name */}
                                <Typography color="blue-gray" className="select-none font-semibold text-lg text-center">
                                    No Contact Found
                                </Typography>

                                {/* Message preview with ellipsis */}
                                <Typography
                                    variant="small"

                                    className=" select-none text-sm max-w-[180px] font-medium  text-center  text-gray-800"
                                >
                                    To add contacts . <a onClick={() => Choose('Contact')} className="text-blue-700 cursor-pointer">Click here</a>
                                </Typography>

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
                        <div className=" select-none flex  flex-col items-center  h-full">
                            <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
                            <div className="flex flex-col items-center">
                                {/* Name */}
                                <Typography color="blue-gray" className="select-none font-semibold text-lg text-center">
                                    No Result
                                </Typography>

                                {/* Message preview with ellipsis */}
                                <Typography
                                    variant="small"

                                    className=" select-none font-medium text-sm max-w-[180px] text-gray-800  text-center"
                                >
                                    There were no result for "{search}".
                                </Typography>
                                <Typography
                                    variant="small"

                                    className="text-gray-800 select-none font-medium text-sm max-w-[180px] truncate text-center"
                                >
                                    Try a new search.
                                </Typography>
                            </div>
                        </div>




                    )}
                </div>
            )}
            <div className="w-full px-5 ">
                <div className="flex justify-end">
                    <button
                        onClick={() => handler(true)}
                        className="fixed bottom-7  w-14 h-14 bg-[#8763ea] hover:bg-[#7c56eb] rounded-full shadow-lg flex items-center justify-center  transition"
                        aria-label="Save"
                    >
                        {isLoading === true ? (
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
                                d="M5 12h14M13 5l7 7-7 7"
                            />
                        </svg>}

                    </button>

                </div>
            </div>


        </>
    );
}

