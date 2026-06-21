import { useEffect, useState,useContext } from "react";
import UserAvatar2 from "../UserAvatar2";
import toast from "react-hot-toast";
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
    Button
} from "@material-tailwind/react";

import { AuthContext } from "../firebase hooks/AuthContext";
export default function LeaveGroupPopUp({ onShare, isOpen, onClose, onSendInviteLink,chat }) {
    if (!isOpen) return null;
    const { backendUser, leaveGroup, deleteAndLeaveGroup } = useContext(AuthContext);
 
    const isOwner = chat.owner.toString() === backendUser._id.toString();
    const handleLeave = async () => {
        const fd = new FormData();
        
        
        fd.append("groupId", chat._id);
        if (isOwner) {
            await deleteAndLeaveGroup(fd)
        } else {
           
            await leaveGroup(fd);
        }
    }
    return (
        <div className=" select-none fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2">
            <div className="relative bg-white rounded-2xl px-5 w-[360px] max-w-full">
       
                <Typography
                className="font-semibold mt-3 text-xl">
                    Linkly
                </Typography>
                <Typography 
                    className="font-medium text-base mt-4 mb-6 "
                >
                    {isOwner ? (`Are you sure you want to delete and leave the
                    group?`):(` Are you sure you want to leave the
                    group?`)}
                   
                </Typography>
                <div className="flex items-center justify-end gap-2  mb-6">
                    {/* <IoMdClose size={27} onClick={onClose} className="  cursor-pointer text-gray-700 hover:text-gray-600"/> */}
                    <Button
                        onClick={()=>onClose()}
                        variant="text" size="lg"
                        ripple={false} className="text-purple-400 font-medium hover:bg-purple-50 px-2 py-2 rounded-2xl" >Cancel</Button>
                    <Button onClick={handleLeave} ripple={false} variant="text" size="lg" className="text-red-400 hover:bg-red-50 font-medium px-2 py-2 rounded-2xl" >{isOwner ?"Delete Group":"Leave group" }</Button>
               
                </div>
            </div>

        </div>
    );
}
