
import '../scrollbar.css';
import {
    Spinner,
    List,
    ListItem,
    ListItemPrefix,
    Typography,

} from "@material-tailwind/react";

import { AnimatePresence, motion } from "motion/react"
import { IoCheckmarkOutline } from "react-icons/io5";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from '../firebase hooks/AuthContext';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
function GroupType({ Screen, chat }) {
    const { typeUpdateinChanel } = useContext(AuthContext)
    const [isPrivate, setIsPrivate] = useState(chat.details.type == "private" ? true : false);
    const [loading, setLoading] = useState(false);
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        setIsPrivate(chat.details.type === "private");
    }, [chat._id, chat.details.type]);

    useEffect(() => {
        const isOriginallyPrivate = chat.details.type === "private";
        setIsChanged(isOriginallyPrivate !== isPrivate);
    }, [chat, isPrivate]);

    const handleChange = (value) => {
        setIsPrivate(value);
    };
    const handleSave = async () => {
        setLoading(true);
        if (chat.contactType === "group") {
            // Save group type
        } else if (chat.contactType === "channel") {
            const type = isPrivate ? "private" : "public";
            const fd = new FormData();
            fd.append("channelId", chat._id);
            fd.append("type", type);
            await typeUpdateinChanel(fd);

            // Save channel type
        }
        setLoading(false);
    };
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
                    {chat.contactType == "group" ? "Group Type" : "Channel Type"}
                </Typography>
                {isChanged === true && (
                    <button
                        disabled={loading}
                        className="p-2 rounded-full hover:bg-gray-200 transition ml-auto"
                        onClick={handleSave}
                    >
                        {loading === true ? (<Spinner />) : (<IoCheckmarkOutline className="h-6 w-6 text-gray-700" />)}

                    </button>
                )}

            </div>
            <div className="bg-white p-2">
                <Typography variant='h6' className='m-3 text-blue-600 cursor-pointer '>{chat.contactType == "group" ? "Group Type" : "Channel Type"}</Typography>
                <List>
                    <ListItem onClick={() => handleChange(true)}>
                        <div className="flex items-center gap-3  w-full">
                            <ListItemPrefix>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={isPrivate}
                                        onChange={() => handleChange(true)}
                                        className="sr-only peer"

                                    />
                                    <span className="w-6 h-6 rounded-full border-2 border-[#8763ea] flex items-center justify-center transition peer-checked:border-[#8763ea]">
                                        <span className={`w-3.5 h-3.5 rounded-full bg-[#8763ea] transition-opacity ${isPrivate ? "opacity-100" : "opacity-0"}`} />
                                    </span>
                                </label>
                            </ListItemPrefix>
                            <div className="flex flex-col w-full">
                                <Typography className="font-normal text-base text-black">
                                    {chat.contactType == "group" ? "Private Group" : "Private Channel"}
                                </Typography>
                                <Typography

                                    className="text-sm font-body  text-gray-700 "
                                >
                                    Private {chat.contactType == "group" ? "groups" : "channels"} can only be joined if you were
                                    invited or have an invite link.
                                </Typography>
                            </div>
                        </div>
                    </ListItem>
                    <ListItem onClick={() => handleChange(false)}>
                        <div className="flex items-center gap-3  w-full">
                            <ListItemPrefix>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={isPrivate === false}
                                        onChange={() => handleChange(false)}
                                        className="sr-only peer"

                                    />
                                    <span className="w-6 h-6 rounded-full border-2 border-[#8763ea] flex items-center justify-center transition peer-checked:border-[#8763ea]">
                                        <span className={`w-3.5 h-3.5 rounded-full bg-[#8763ea] transition-opacity ${isPrivate ? "opacity-0" : "opacity-100"}`} />
                                    </span>

                                </label>
                            </ListItemPrefix>

                            <div className="flex flex-col w-full">
                                <Typography className="font-normal text-base text-black">
                                    {chat.contactType == "group" ? "Public Group" : "Public Channel"}
                                </Typography>
                                <Typography

                                    className="text-sm font-body  text-gray-700  "
                                >
                                    Public {chat.contactType == "group" ? "groups" : "channels"} can be found in search, chat
                                    history is available to everyone and anyone
                                    can join.
                                </Typography>
                            </div>

                        </div>
                    </ListItem>
                </List>
            </div>
            <div className='h-3' />
            <div className="bg-white p-2">
                <List>
                    <ListItem
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.host}/+${chat._id}`);
                            toast.success("Link copied")
                        }}>
                        <div className="flex items-center gap-3  w-full">
                            <div className="flex flex-col w-full">
                                <Typography className="font-normal truncate text-base text-black">
                                    {`${window.location.host}/+${chat._id}`}
                                </Typography>
                                <Typography

                                    className="text-sm font-body  text-gray-600 "
                                >
                                    People can Join your group by ollowing this in
                                </Typography>
                            </div>
                        </div>
                    </ListItem>

                </List>
            </div>

        </div>
    )
}

export default GroupType