import React, { useState } from 'react'
import {

    Typography,
    Input
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AvatarForProfileSet from './AvatarSelectForProfileSet';
import AvatarWithCropCircle from './AvatarWithUpload';
import ProfileSetInputs from './ProfileSetInputs';

import "react-datepicker/dist/react-datepicker.css";
function ProfileSet({ onProfileset }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedEmoji, setSelectedEmoji] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleFileChange = (file) => {
        setSelectedFile(file); // Store first selected file
    };
    return (
        <div className=' bg-white  min-h-screen max-w-xl flex-col py-20 justify-center mx-auto items-center px-3 md:px-0 ' >
            <AvatarForProfileSet disabled={loading} isprofile={false} onFileSelect={(file) => {
                handleFileChange(file)
                setSelectedEmoji(null)
            }} onEmojiSelect={(e) => {
                setSelectedEmoji(e)
                setSelectedFile(null);
            }} />
            <ProfileSetInputs disabled={loading} file={selectedFile} emoji={selectedEmoji} onProfileset={e => onProfileset(e)} />


        </div>
    )
}

export default ProfileSet