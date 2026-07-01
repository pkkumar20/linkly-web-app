import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router";
import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Drawer,
  Card,
  Badge
} from "@material-tailwind/react";
import Avatar from "./UserAvatar";
import { AuthContext } from "./firebase hooks/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// ── Custom SVG Icons ──
const ProfileIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const NewGroupIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M16 11a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M2.5 19.5c0-2.5 2.2-4.5 5-4.5h3c2.8 0 5 2.5 5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M15 15.5c1.5 0 3 1.2 3 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M19 19v-4m-2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const NewChannelIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M19 19v-4m-2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const ContactsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M12 11a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M8 16c0-1.5 1.5-3 4-3s4 1.5 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <line x1="20" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GroupsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M5.5 20.5c0-2.8 2.7-5 6.5-5s6.5 2.2 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M18 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M21 17.5c0-1.5-1.5-2.8-3.5-3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M6 10a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M3 17.5c0-1.5 1.5-2.8 3.5-3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const ChannelsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const NotificationIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 15h2a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1a1 1 0 011-1h2V9a6 6 0 1112 0v6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    <path d="M10 18v1a2 2 0 104 0v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const InfoIcon = ({ size = 26, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.2" fill="currentColor" />
  </svg>
);

const DownloadIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);
export default function Sidebar({ Choose }) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { backendUser, getorsetProfile } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = React.useState(0);
  useEffect(() => {
    if (backendUser.notifiaction && backendUser.notifiaction.length > 0) {
      const getNotificationCount = backendUser.notifiaction.filter(notify => notify.status === "pending");

      setUnreadCount(getNotificationCount.length);
    }

  }, [backendUser.notifiaction])
  const handleOpen = (value) => setOpen(open === value ? 0 : value);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  useEffect(() => {
    const gt = async () => {
      let data = await getorsetProfile();

    }
    gt()

    const scrollEl = document.getElementById("scrollable-content");

    if (scrollEl) {
      if (isDrawerOpen) {
        scrollEl.style.overflow = "hidden";

      } else {
        scrollEl.style.overflow = "auto";
      }
    }

    return () => {
      if (scrollEl) scrollEl.style.overflow = "auto";
    };
  }, [isDrawerOpen]);
  const handleScreen = (screen) => {
    Choose(screen);
  }
  return (
    <>
      <IconButton variant="text" size="lg" onClick={openDrawer}>
        {isDrawerOpen ? (
          <XMarkIcon className="h-8 w-8 stroke-2" />
        ) : (
          <Bars3Icon className="h-8 w-8 stroke-2" />
        )}
      </IconButton>

      <Drawer open={isDrawerOpen} onClose={closeDrawer}>
        <Card
          color="transparent"
          shadow={true}
          className="h-full w-full p-2"
        >
          <div className="mt-5 ml-8">
            <Avatar textSize="text-4xl" size="h-24 w-24" emojiSize={'text-5xl'} {...(backendUser !== null && backendUser.profile.type === 'image' && {
              image: backendUser.profile
                .imageUrl,
            })}
              {...(backendUser !== null && backendUser.profile.type === 'emoji' && {
                emoji: backendUser.profile
                  .emoji,
                simpleBg: backendUser.profile
                  .bgColor,
              })}
              {...(backendUser !== null && backendUser.profile.type === 'initials' && {
                simpleBg: backendUser.profile
                  .bgColor,
                text: backendUser.profile
                  .initials,

              })} />
            <Typography variant="h6" color="blue-gray" className="  cursor-pointer">
              {backendUser != null ? (backendUser.name + " " + backendUser.lastName) : ("")}
            </Typography>
          </div>
          <List>
            <hr className="my-2 border-blue-gray-50" />
            <ListItem onClick={() => handleScreen("Profile")} className="font-medium">
              <ListItemPrefix>
                <ProfileIcon size={26} className="text-gray-600" />
              </ListItemPrefix>
              Profile
            </ListItem>

            <ListItem onClick={() => handleScreen("NewGroup")} className="font-medium">
              <ListItemPrefix>
                <NewGroupIcon size={26} className="text-gray-600" />
              </ListItemPrefix>
              New Group
            </ListItem>
            <ListItem onClick={() => handleScreen("NewChanel")} className="font-medium">
              <ListItemPrefix>
                <NewChannelIcon size={26} className="text-gray-600" />
              </ListItemPrefix>
              New Channel
            </ListItem>
            <ListItem onClick={() => handleScreen("Contact")} className="font-medium">
              <ListItemPrefix>
                <ContactsIcon size={24} className="text-gray-600" />
              </ListItemPrefix>
              Contacts
            </ListItem>
            <ListItem onClick={() => handleScreen("AllGroups")} className="font-medium">
              <ListItemPrefix>
                <GroupsIcon size={24} className="text-gray-600" />
              </ListItemPrefix>
              Groups
            </ListItem>
            <ListItem onClick={() => handleScreen("AllChannels")} className="font-medium">
              <ListItemPrefix>
                <ChannelsIcon size={26} className="text-gray-600" />
              </ListItemPrefix>
              Channels
            </ListItem>
            <ListItem onClick={() => handleScreen("Notification")} className="font-medium">
              {unreadCount > 0 && (
                <div className="w-full flex items-center justify-center">
                  <ListItemPrefix>
                    <NotificationIcon size={26} className="text-gray-600" />
                  </ListItemPrefix>
                  Notification

                  <div className="ml-auto ">

                    <Badge className="" color="red"></Badge>

                  </div>
                </div>)}
              {unreadCount == 0 && (

                <ListItemPrefix>
                  <NotificationIcon size={26} className="text-gray-600" />
                </ListItemPrefix>


              )}
              {unreadCount == 0 && (

                "Notification"

              )}
            </ListItem>
            <ListItem onClick={() => { closeDrawer(); navigate("/info"); }} className="font-medium">
              <ListItemPrefix>
                <InfoIcon size={26} className="text-gray-600" />
              </ListItemPrefix>
              Info
            </ListItem>
            <ListItem onClick={() => { closeDrawer(); navigate("/download"); }} className="font-medium">
              <ListItemPrefix>
                <DownloadIcon size={24} className="text-gray-600" />
              </ListItemPrefix>
              Download
            </ListItem>
          </List>
        </Card>
      </Drawer>
    </>
  );
}