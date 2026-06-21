import React, { useEffect, useContext } from "react";
import {

    Typography,
    List,
    ListItem,
    ListItemPrefix,

} from "@material-tailwind/react";
import Avatar from "./UserAvatar";
import { AuthContext } from "./firebase hooks/AuthContext";
import {
    CalendarIcon,
    PencilIcon,
    ArrowLeftIcon,
    AtSymbolIcon,
    PhoneIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import { PiCalendarHeartLight } from "react-icons/pi";
import LogoutPopover from "./LogoutPopover";
import toast from "react-hot-toast";
export default function ProfileScreen({ Choose }) {
    const { backendUser, } = useContext(AuthContext);
    function getTimeDifference(dateString) {
        const parts = dateString.split('/');
        const inputDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const now = new Date();

        const diffInMs = now - inputDate;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInMonths = Math.floor(diffInDays / 30.4375); // Average month length
        const diffInYears = Math.floor(diffInMonths / 12);

        if (diffInYears >= 1) {
            return `${diffInYears} year${diffInYears > 1 ? 's' : ''} `;
        } else if (diffInMonths >= 1) {
            return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} `;
        } else {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
        }
    }
    const cnvDate = (date) => {
        const dateObj = new Date(date);
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        const formatted = `${day}/${month}/${year}`;
        return formatted;
    }
    return (
        <>
            <div className="select-none bg-white  w-full flex items-center px-4 py-3 ">
                <button
                    className="p-2 mr-2 rounded-full hover:bg-gray-200 transition duration-150"
                    onClick={() => Choose("Home")}
                >
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>

                <div className="ml-2 cursor-default">
                    <Typography variant="h5" color="blue-gray">
                        Profile
                    </Typography>
                </div>

                {/* Push following buttons to the right */}
                <div className="ml-auto flex items-center gap-2 ">
                    <button
                        className="p-2 rounded-full cursor-pointer hover:bg-gray-200 transition duration-150"
                        onClick={() => Choose("EditProfile")}
                    >
                        <PencilIcon className="h-6 w-6 text-gray-700" />
                    </button>
                    <LogoutPopover />
                </div>
            </div>

            <div className="mt-4 mb-4 flex flex-col items-center justify-center">
                <Avatar textSize="text-5xl" size="h-28 w-28" emojiSize={'text-6xl'} {...(backendUser.profile.type === 'image' && {
                    image: backendUser.profile
                        .imageUrl,
                })}
                    {...(backendUser.profile.type === 'emoji' && {
                        emoji: backendUser.profile
                            .emoji,
                        simpleBg: backendUser.profile
                            .bgColor,
                    })}
                    {...(backendUser.profile.type === 'initials' && {
                        simpleBg: backendUser.profile
                            .bgColor,
                        text: backendUser.profile
                            .initials,

                    })} />
                <div>
                    <Typography variant="h5" color="blue-gray" className="mt-4">
                        {backendUser != null ? (backendUser.name + " " + backendUser.lastName) : ("")}
                    </Typography>
                </div>
            </div>
            {/* <hr className="my-2 border-blue-gray-50" /> */}
            <List className="p-4 select-none">
                <ListItem>
                    <ListItemPrefix>
                        <PhoneIcon className="h-6 w-6 mr-2" />
                    </ListItemPrefix>
                    <div>
                        <Typography className="font-medium">
                            {backendUser != null ? (backendUser.phone) : ("")}
                        </Typography>
                        <Typography className="text-sm font-medium">
                            Phone
                        </Typography>
                    </div>
                </ListItem>
                <ListItem
                    onClick={() => {
                        navigator.clipboard.writeText(backendUser.username);
                        toast.success("Username copied to clipboard");
                    }}>
                    <ListItemPrefix>
                        < AtSymbolIcon className="h-6 w-6 mr-2" />
                    </ListItemPrefix>
                    <div>
                        <Typography className="font-medium">
                            {backendUser != null ? (backendUser.username) : ("")}
                        </Typography>
                        <Typography className="text-sm font-medium">
                            Username
                        </Typography>
                    </div>
                </ListItem>
                {backendUser != null && backendUser.bio.length > 0 && (
                    <ListItem>
                        <ListItemPrefix>
                            <InformationCircleIcon className="h-6 w-6 mr-2" />
                        </ListItemPrefix>
                        <div>
                            <Typography className="font-medium">
                                {backendUser != null ? (backendUser.bio) : ("")}
                            </Typography>
                            <Typography className="text-sm font-medium">
                                Bio
                            </Typography>
                        </div>
                    </ListItem>
                )}

                <ListItem>
                    <ListItemPrefix>
                        <CalendarIcon className="h-6 w-6 mr-2" />
                    </ListItemPrefix>
                    <div>
                        <Typography className="font-medium">
                            {cnvDate(backendUser != null ? (backendUser.dob) : (""))} ({getTimeDifference(cnvDate(backendUser != null ? (backendUser.dob) : ("")))} old)
                        </Typography>
                        <Typography className="text-sm font-medium">
                            Date of birth
                        </Typography>
                    </div>
                </ListItem>
                <ListItem>
                    <ListItemPrefix>
                        <PiCalendarHeartLight className="h-6 w-6 mr-2" />
                    </ListItemPrefix>
                    <div>
                        <Typography className="font-medium">
                            {cnvDate(backendUser != null ? (backendUser.doj) : (""))} ({getTimeDifference(cnvDate(backendUser != null ? (backendUser.doj) : ("")))} ago)
                        </Typography>
                        <Typography className="text-sm font-medium">
                            Date of joining
                        </Typography>
                    </div>
                </ListItem>
            </List>
        </>
    );
}