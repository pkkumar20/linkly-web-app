import React, { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../firebase hooks/AuthContext';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;


import {
    List,
    ListItem,
    ListItemSuffix,
    Typography,
    ListItemPrefix,
    Spinner
} from "@material-tailwind/react";
import UserAvatar from "../UserAvatar"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { TbUserX } from "react-icons/tb";
import { HiLockClosed } from "react-icons/hi";
import toast from 'react-hot-toast';

/* Custom toggle with lock icon on the thumb */
function LockToggle({ checked, onChange, showLock }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            style={{
                position: 'relative',
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: checked ? '#8763ea' : 'red',
                transition: 'background 0.25s ease',
                padding: 0,
                flexShrink: 0,
            }}
        >
            {/* Thumb with lock icon */}
            <span
                style={{
                    position: 'absolute',
                    top: 2,
                    left: checked ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'left 0.25s ease',
                }}
            >
                {(checked && showLock) && (
                    <HiLockClosed
                        size={12}
                        style={{
                            color: '#8763ea',

                        }}
                    />
                )}

            </span>
        </button>
    );
}

function AdminPanel({ Screen, chat, selectedAdmin }) {

    const { updateGroupPermissions, backendUser, dismissAdmin, removeAdminInChanel } = useContext(AuthContext);
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        const inAdmin = chat.admins.some(admin => (admin._id?.toString() || admin?.toString()) === selectedAdmin._id?.toString());

        if (!inAdmin) {
            Screen("main");
        }
    }, [chat, selectedAdmin, Screen]);


    const [toogleValues, setToogleValues] = useState({
        editGroupInfo: chat.permissions.editGroupInfo.includes(selectedAdmin._id),
        deleteMessages: chat.permissions.deleteMessages.includes(selectedAdmin._id),
        banMembers: chat.permissions.banMembers.includes(selectedAdmin._id),
        addRemoveMembers: chat.permissions.addRemoveMembers.includes(selectedAdmin._id),
        addNewAdmins: chat.permissions.addNewAdmins.includes(selectedAdmin._id)
    })
    const [showLock, setShowLock] = useState(false);
    useEffect(() => {
        setToogleValues((prev) => ({
            ...prev,
            editGroupInfo: chat.permissions.editGroupInfo.includes(selectedAdmin._id),
            deleteMessages: chat.permissions.deleteMessages.includes(selectedAdmin._id),
            banMembers: chat.permissions.banMembers.includes(selectedAdmin._id),
            addRemoveMembers: chat.permissions.addRemoveMembers.includes(selectedAdmin._id),
            addNewAdmins: chat.permissions.addNewAdmins.includes(selectedAdmin._id)
        }));
        if (isOwner) {
            setShowLock(false);
        } else {
            setShowLock(true);
        }

    }, [chat]);

    const isOwner = chat.owner.toString() === backendUser._id.toString();
    const handleToggle = async (name) => {
        if (!isOwner) {
            toast.dismiss();
            toast.error("Only owner can edit");
            return;
        } else {
            const newValue = !toogleValues[name];


            const isAdmin = chat.admins.some(user => user._id.toString() === backendUser._id.toString());
            const isOwner = chat.owner.toString() === backendUser._id.toString();

            if (!isAdmin && !isOwner) {
                toast.error("Only admins modify permissions"

                );
                return;
            }

            // 1. UI Update (Optimistic)
            setToogleValues((prev) => ({
                ...prev,
                [name]: !prev[name]
            }));

            // 2. Backend Update
            try {
                const fd = new FormData();
                fd.append("groupId", chat._id);
                fd.append("userId", selectedAdmin._id);
                fd.append("fieldName", name);
                fd.append('value', newValue);

                const res = await updateGroupPermissions(fd);


            } catch (error) {
                console.log(error);

                // 3. Revert if failed
                setToogleValues((prev) => ({
                    ...prev,
                    [name]: !prev[name]
                }));
                toast.error("Failed to update permission");
            }
        }

    };

    // ... (Your existing formatLastSeen function) ...
    function formatLastSeen(isoDate) {
        if (!isoDate) return "Offline";
        const lastSeenDate = new Date(isoDate);
        const now = new Date();
        const diffMs = now - lastSeenDate;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const zeroPad = (num) => num.toString().padStart(2, "0");
        const formatTime = (date) => `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        const isYesterday = (d1, d2) => {
            const yesterday = new Date(d2);
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(d1, yesterday);
        };

        if (diffSeconds < 5) return "last seen just now";
        else if (diffMinutes < 1) return `last seen ${diffSeconds} seconds ago`;
        else if (diffMinutes < 60) return `last seen ${diffMinutes} minutes ago`;
        else if (isSameDay(lastSeenDate, now)) return `last seen today at ${formatTime(lastSeenDate)}`;
        else if (isYesterday(lastSeenDate, now)) return `last seen yesterday at ${formatTime(lastSeenDate)}`;
        else if (diffHours < 24 * 7) return `last seen on ${daysOfWeek[lastSeenDate.getDay()]} at ${formatTime(lastSeenDate)}`;
        else {
            const d = lastSeenDate.getDate();
            const m = lastSeenDate.getMonth() + 1;
            const y = lastSeenDate.getFullYear();
            return `last seen on ${zeroPad(d)}/${zeroPad(m)}/${y} at ${formatTime(lastSeenDate)}`;
        }
    }
    const handleDismiss = async () => {
        try {
            setLoading(true);
            const fd = new FormData();
            fd.append("userId", selectedAdmin._id);
            if (chat.contactType === "group") {
                fd.append("groupId", chat._id);
                await dismissAdmin(fd);
            } else if (chat.contactType === "channel") {
                fd.append("channelId", chat._id);
                await removeAdminInChanel(fd);
            }
            Screen("main");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="bg-gray-100 flex flex-col h-full" style={{ userSelect: 'none' }}>
            {/* Header */}
            <div className="bg-white flex items-center gap-4 px-4 py-3">
                <button className="p-2 rounded-full hover:bg-gray-200 transition" onClick={() => Screen("main")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <Typography variant="h5" color="blue-gray">Admin Rights</Typography>
            </div>

            {/* User Info */}
            <div className="flex justify-between items-center px-4 py-3 bg-white">
                <div className="flex items-center space-x-3 py-1 px-1 rounded cursor-pointer transition-all">
                    <UserAvatar
                        {...(selectedAdmin?.profile.type === 'image' && { image: selectedAdmin.profile.imageUrl })}
                        {...(selectedAdmin?.profile.type === 'emoji' && { emoji: selectedAdmin.profile.emoji, simpleBg: selectedAdmin.profile.bgColor })}
                        {...(selectedAdmin?.profile.type === 'initials' && { simpleBg: selectedAdmin.profile.bgColor, text: selectedAdmin.profile.initials })}
                    />
                    <div className="flex flex-col">
                        <span className="font-medium text-md flex items-center">{selectedAdmin?.name} {selectedAdmin?.lastName}</span>
                        <span className="text-gray-600 font-body text-sm">
                            {selectedAdmin && (selectedAdmin.isOnline ? "Online" : formatLastSeen(selectedAdmin.lastSeen))}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-4 bg-white">
                <Typography variant="h6" className="text-blue-500">
                    What can this admin do?
                </Typography>
            </div>

            {/* Permissions List */}
            <div className="bg-white px-4 pb-4 shadow-sm">
                <List>

                    {/* Item 1 */}
                    <ListItem onClick={() => handleToggle('editGroupInfo')}>
                        <Typography className='font-normal text-black'>Change Group info</Typography>
                        {/* STOP PROPAGATION HERE: Prevents toggle click from triggering ListItem click */}
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <LockToggle
                                checked={toogleValues.editGroupInfo}
                                onChange={() => handleToggle('editGroupInfo')}
                                showLock={showLock}
                            />
                        </ListItemSuffix>
                    </ListItem>

                    {/* Item 2 */}
                    <ListItem onClick={() => handleToggle('deleteMessages')}>
                        <Typography className='font-normal text-black'>Delete Messages</Typography>
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <LockToggle
                                checked={toogleValues.deleteMessages}
                                onChange={() => handleToggle('deleteMessages')}
                                showLock={showLock}
                            />
                        </ListItemSuffix>
                    </ListItem>

                    {/* Item 3 */}
                    <ListItem onClick={() => handleToggle('banMembers')}>
                        <Typography className='font-normal text-black'>Ban Users</Typography>
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <LockToggle
                                checked={toogleValues.banMembers}
                                onChange={() => handleToggle('banMembers')}
                                showLock={showLock}
                            />
                        </ListItemSuffix>
                    </ListItem>

                    {/* Item 4 */}
                    <ListItem onClick={() => handleToggle('addRemoveMembers')}>
                        <Typography className='font-normal text-black'>Invite Users By Link</Typography>
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <LockToggle
                                checked={toogleValues.addRemoveMembers}
                                onChange={() => handleToggle('addRemoveMembers')}
                                showLock={showLock}
                            />
                        </ListItemSuffix>
                    </ListItem>

                    {/* Item 5 */}
                    <ListItem onClick={() => handleToggle('addNewAdmins')}>
                        <Typography className='font-normal text-black'>Add New Admins</Typography>
                        <ListItemSuffix onClick={(e) => e.stopPropagation()}>
                            <LockToggle
                                checked={toogleValues.addNewAdmins}
                                onChange={() => handleToggle('addNewAdmins')}
                                showLock={showLock}
                            />
                        </ListItemSuffix>
                    </ListItem>

                </List>
            </div>

            {selectedAdmin._id.toString() !== chat.owner.toString() && (
                (isOwner === true || selectedAdmin._id.toString() === backendUser._id.toString()) ? (<div className="bg-white flex flex-col mt-auto mb-3 shadow-md">
                    <List>
                        <ListItem
                            disabled={loading}
                            className="hover:bg-red-50 my-1 focus:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => !loading && handleDismiss()}
                        >
                            <div className="flex items-center gap-3 text-red-600">
                                <ListItemPrefix>
                                    {loading ? (
                                        <Spinner className="h-5 w-5 text-red-600" />
                                    ) : (
                                        <TbUserX size={24} className="text-red-600" />
                                    )}
                                </ListItemPrefix>
                                <Typography className="font-medium text-md text-red-600">
                                    {loading ? "Dismissing Admin..." : "Dismiss Admin"}
                                </Typography>
                            </div>
                        </ListItem>
                    </List>
                </div>) : null

            )}
        </div>
    );
}

export default AdminPanel;