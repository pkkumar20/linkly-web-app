import React, { useState, useContext, useEffect, useRef } from 'react'
import { AuthContext } from '../firebase hooks/AuthContext';
import {
    List,
    ListItem,
    ListItemSuffix,
    Switch,
    Typography,
    ListItemPrefix,
    Checkbox

} from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
function Permissions({ Screen, chat }) {

    const { updateGroupMembersPermissions, backendUser } = useContext(AuthContext);

    const hasConfirmedAdmin = useRef(false);

    useEffect(() => {
        // Only check once on mount — if you opened this screen you had access
        const uid = backendUser._id?.toString();
        const inAdmin = chat.admins.some(admin => {
            const aid = admin._id?._id?.toString() || admin._id?.toString() || admin?.toString();
            return aid === uid;
        });
        const isOwner = chat.owner?._id?.toString() === uid || chat.owner?.toString() === uid;

        if (inAdmin || isOwner) {
            hasConfirmedAdmin.current = true;
        } else {
            Screen("main");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps: only run on mount, never on chat update




    const [toogleValues, setToogleValues] = useState({

        sendMesseges:
            chat.membersPermissions.sendMesseges,
        sendLocation:
            chat.membersPermissions.sendLocation,
        sendMedia:
            chat.membersPermissions.sendMedia,
        sendPhotos:
            chat.membersPermissions.sendPhotos,
        sendVideos:
            chat.membersPermissions.sendVideos,
        sendFiles:
            chat.membersPermissions.sendFiles,
        changeChatInfo:
            chat.membersPermissions.changeChatInfo,
        addUsers:
            chat.membersPermissions.addUsers,
        deleteMessages:
            chat.membersPermissions.deleteMessages
    })
    useEffect(() => {
        setToogleValues((prev) => ({
            ...prev,
            sendMesseges:
                chat.membersPermissions.sendMesseges,
            sendLocation:
                chat.membersPermissions.sendLocation,
            sendMedia:
                chat.membersPermissions.sendMedia,
            sendPhotos:
                chat.membersPermissions.sendPhotos,
            sendVideos:
                chat.membersPermissions.sendVideos,
            sendFiles:
                chat.membersPermissions.sendFiles,
            changeChatInfo:
                chat.membersPermissions.changeChatInfo,
            addUsers:
                chat.membersPermissions.addUsers,
            deleteMessages:
                chat.membersPermissions.deleteMessages
        }));
    }, [chat])
    const [isOpen, setIsopen] = useState(false);
    const handleOpen = () => {
        setIsopen(!isOpen);
    }
    const handleToggle = async (name) => {
        const newValue = !toogleValues[name];


        const isAdmin = chat.admins.some(user => user._id.toString() === backendUser._id.toString());
        const isOwner = chat.owner.toString() === backendUser._id.toString();

        if (!isAdmin && !isOwner) {
            toast.error("Only admins modify permissions"

            );
            return;
        }

        // 1. UI Update (Optimistic)
        if (name === "sendMedia") {
            if (newValue === false) {
                setToogleValues((prev) => ({
                    ...prev,
                    ['sendFiles']: false,
                    ['sendVideos']: false,
                    ['sendPhotos']: false,

                }));
            } else {
                setToogleValues((prev) => ({
                    ...prev,
                    ['sendFiles']: true,
                    ['sendVideos']: true,
                    ['sendPhotos']: true,

                }));
            }
        }
        setToogleValues((prev) => ({
            ...prev,
            [name]: !prev[name]
        }));

        // // 2. Backend Update
        try {
            const fd = new FormData();
            fd.append("groupId", chat._id);
            fd.append("fieldName", name);
            fd.append('value', newValue);

            await updateGroupMembersPermissions(fd);


        } catch (error) {
            console.log(error);

            // 3. Revert if failed
            setToogleValues((prev) => ({
                ...prev,
                [name]: !prev[name]
            }));
            toast.error("Failed to update permission");
        }
    };
    const handleToggleCheckBox = async (name) => {
        const newValue = !toogleValues[name];


        const isAdmin = chat.admins.some(user => user._id.toString() === backendUser._id.toString());
        const isOwner = chat.owner.toString() === backendUser._id.toString();

        if (!isAdmin && !isOwner) {
            toast.error("Only admins modify permissions"

            );
            return;
        }

        // 1. UI Update (Optimistic)
        if (newValue === true) {
            if (toogleValues.sendMedia === false) {
                setToogleValues((prev) => ({
                    ...prev,
                    ['sendMedia']: true
                }));
            }
        }
        setToogleValues((prev) => ({
            ...prev,
            [name]: !prev[name]
        }));

        // // 2. Backend Update
        try {
            const fd = new FormData();
            fd.append("groupId", chat._id);
            fd.append("fieldName", name);
            fd.append('value', newValue);

            await updateGroupMembersPermissions(fd);

        } catch (error) {
            console.log(error);

            // 3. Revert if failed
            setToogleValues((prev) => ({
                ...prev,
                [name]: !prev[name]
            }));
            toast.error("Failed to update permission");
        }
    };
    const getPermissionsLength = () => {
        const mediaKeys = ['sendPhotos', 'sendVideos', 'sendFiles'];

        // 2. Filter the keys to see which ones are TRUE in your state
        const activeCount = mediaKeys.filter(key => toogleValues[key]).length;

        // 3. Format the string result
        const statusLabel = `${activeCount}/${mediaKeys.length}`;
        return statusLabel;
    }
    return (
        <div className="bg-red-500 select-none">
            <div className="bg-white flex items-center gap-4 px-4 py-3">
                <button
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                    onClick={() => Screen("main")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">
                    Permissions
                </Typography>
            </div>
            <div className="px-4 py-2 bg-white">
                <Typography variant='h6' className=" text-base text-blue-500">
                    What can members of this group do?
                </Typography>
            </div>
            <div className="bg-white px-4 pb-4 shadow-md">
                <List>
                    <ListItem onClick={() => handleToggle('sendMesseges')}>
                        <Typography className='font-normal text-black'>Send Messeges</Typography>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.sendMesseges}
                                onChange={() => handleToggle('sendMesseges')}
                            />
                        </ListItemSuffix>
                    </ListItem>
                    <ListItem onClick={() => handleToggle('deleteMessages')}>
                        <Typography className='font-normal text-black'>Delete Messages</Typography>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.deleteMessages}
                                onChange={() => handleToggle('deleteMessages')}
                            />
                        </ListItemSuffix>
                    </ListItem>
                    <ListItem onClick={() => handleOpen()}>
                        <div className="flex items-center gap-2">
                            <Typography className='font-normal text-black'>{`Send Media ${getPermissionsLength()}`} </Typography>
                            {isOpen ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}

                        </div>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.sendMedia}
                                onChange={() => handleToggle('sendMedia')}
                            />
                        </ListItemSuffix>
                    </ListItem>
                    <AnimatePresence initial={false}>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden w-full"
                            >
                                <ListItem onClick={() => handleToggleCheckBox('sendPhotos')}>
                                    <ListItemPrefix onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            onChange={() => handleToggleCheckBox("sendPhotos")}
                                            checked={toogleValues.sendPhotos}
                                            name='item'
                                            id="horizontal-list-react-photos"
                                            ripple={false}
                                            className="hover:before:opacity-0 checked:bg-[#8763ea] checked:border-[#8763ea]"
                                            containerProps={{
                                                className: "p-1",
                                            }}
                                        />
                                    </ListItemPrefix>
                                    <Typography className='font-normal text-black'>Send Images</Typography>
                                </ListItem>
                                <ListItem onClick={() => handleToggleCheckBox('sendVideos')}>
                                    <ListItemPrefix onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            onChange={() => handleToggleCheckBox("sendVideos")}
                                            checked={toogleValues.sendVideos}
                                            name='item'
                                            id="horizontal-list-react-videos"
                                            ripple={false}
                                            className="hover:before:opacity-0 checked:bg-[#8763ea] checked:border-[#8763ea]"
                                            containerProps={{
                                                className: "p-1",
                                            }}
                                        />
                                    </ListItemPrefix>
                                    <Typography className='font-normal text-black'>Send Videos</Typography>
                                </ListItem>
                                <ListItem onClick={() => handleToggleCheckBox('sendFiles')}>
                                    <ListItemPrefix onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            onChange={() => handleToggleCheckBox("sendFiles")}
                                            checked={toogleValues.sendFiles}
                                            name='item'
                                            id="horizontal-list-react-files"
                                            ripple={false}
                                            className="hover:before:opacity-0 checked:bg-[#8763ea] checked:border-[#8763ea]"
                                            containerProps={{
                                                className: "p-1",
                                            }}
                                        />
                                    </ListItemPrefix>
                                    <Typography className='font-normal text-black'>Send Files</Typography>
                                </ListItem>



                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ListItem onClick={() => handleToggle('sendLocation')}>
                        <Typography className='font-normal text-black'>Send Locations</Typography>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.sendLocation}
                                onChange={() => handleToggle('sendLocation')}
                            />
                        </ListItemSuffix>
                    </ListItem>
                    <ListItem onClick={() => handleToggle('changeChatInfo')}>
                        <Typography className='font-normal text-black'>Change Chat Info</Typography>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.changeChatInfo}
                                onChange={() => handleToggle('changeChatInfo')}
                            />
                        </ListItemSuffix>
                    </ListItem>
                    <ListItem onClick={() => handleToggle('addUsers')}>
                        <Typography className='font-normal text-black'>Add Users</Typography>
                        {/* STOP PROPAGATION HERE: Prevents Switch click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <Switch
                                className='bg-red-500 checked:bg-[#8763ea]'
                                checked={toogleValues.addUsers}
                                onChange={() => handleToggle('addUsers')}
                            />
                        </ListItemSuffix>
                    </ListItem>

                </List>
            </div>


        </div>
    )
}

export default Permissions