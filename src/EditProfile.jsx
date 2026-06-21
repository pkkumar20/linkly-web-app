import {

    Typography,
    Input
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AvatarWithUpload from "./AvatarWithUpload";
import EditProfileInputs from "./EditProfileInputs";
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from "./firebase hooks/AuthContext";
export default function EditProfileScreen({ Choose }) {

    const { backendUser } = useContext(AuthContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedEmoji, setSelectedEmoji] = useState(null);
    const [isChanged, setIsChanged] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileType, setProfileType] = useState('undefined');
    useEffect(() => {
        if (backendUser != null) {
            setProfileType(backendUser.profile.type);
        }
    });

    const handleFileChange = (file) => {
        setSelectedFile(file); // Store first selected file
    };

    return (
        <>
            <div className="select-none bg-white w-full flex items-center px-4 py-3 ">
                <button
                    className="p-2 mr-2 rounded-full hover:bg-gray-200 transition duration-150"
                    onClick={() => Choose("Profile")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>

                <div className="ml-2 cursor-default">
                    <Typography variant="h5" color="blue-gray">
                        Edit Profile
                    </Typography>
                </div>

            </div>

            <AvatarWithUpload {...(backendUser.profile.type === 'image' && {
                profileLink: backendUser.profile
                    .imageUrl,
                profileType: "image"
            })}
                {...(backendUser.profile.type === 'emoji' && {
                    profileText: backendUser.profile
                        .emoji,
                    profileBg: backendUser.profile
                        .bgColor,
                    profileType: "emoji"
                })}
                {...(backendUser.profile.type === 'initials' && {
                    profileBg: backendUser.profile
                        .bgColor,
                    profileText: backendUser.profile
                        .initials,
                    profileType: 'undefined'
                })}
                isChanged={e => setIsChanged(e)}
                isprofile={false}
                onFileSelect={(file) => {
                    handleFileChange(file)
                    setSelectedEmoji(null)
                }} onEmojiSelect={(e) => {
                    setSelectedEmoji(e)
                    setSelectedFile(null);
                }} disabled={loading} />
            <EditProfileInputs Choose={(e) => Choose(e)} emoji={selectedEmoji} file={selectedFile} isChanged={isChanged} loading={loading} setLoading={(data) => setLoading(data)} />
        </>
    );
}