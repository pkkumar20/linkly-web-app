// SidebarWithLogo.jsx
import './scrollbar.css';
import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemPrefix,
} from "@material-tailwind/react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "./UserAvatar"
import Sidebar from "./TestSidebar"
import { RiShareForwardFill } from "react-icons/ri";
import { AuthContext } from './firebase hooks/AuthContext';
import FabPopover from './FabPopOver';
import Lottie from 'lottie-react';
import myAnimation from "./lottie/empty.json"
import { IoCheckmarkCircleOutline, IoOpenOutline, IoExitOutline } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";

// ─── Memoized contact list item (only re-renders when its own props change) ───
const ContactListItem = React.memo(function ContactListItem({
  user,
  isSelected,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onClick,
  backendUserId,
  formatName,
  formatDate,
  lastMessege,
}) {
  const unreadCount = useMemo(() => {
    const currentUserMember = user.members.find(
      member => member._id._id.toString() === backendUserId.toString()
    );
    return currentUserMember?.unread || 0;
  }, [user.members, backendUserId]);

  const lastMsg = useMemo(() => {
    if (user.lastMessage != undefined && user.lastMessage != null) {
      return lastMessege(user.lastMessage, user.otherMember);
    }
    return null;
  }, [user.lastMessage, user.otherMember, lastMessege]);

  const formattedTime = useMemo(() => {
    if (user.lastMessageTime != undefined) {
      return formatDate(user.lastMessageTime);
    }
    return null;
  }, [user.lastMessageTime, formatDate]);

  const displayName = useMemo(() => {
    if (user.contactType === "person") {
      return user.otherMember[0].nickName
        ? (user.otherMember[0].nickLastName
          ? formatName(user.otherMember[0].nickName) + " " + formatName(user.otherMember[0].nickLastName)
          : formatName(user.otherMember[0].nickName))
        : user.otherMember[0]._id.name;
    }
    return user.name || "";
  }, [user.contactType, user.otherMember, user.name, formatName]);

  // Avatar props — memoized to prevent UserAvatar re-renders
  const avatarProps = useMemo(() => {
    if (user.contactType === "person") {
      const member = user.otherMember[0];
      if (member._id !== null && member._id.profile.type === 'image') {
        return { image: member._id.profile.imageUrl };
      }
      if (member._id !== null && member._id.profile.type === 'emoji') {
        return { emoji: member._id.profile.emoji, simpleBg: member._id.profile.bgColor, emojiSize: "text-3xl" };
      }
      if (member._id !== null && member._id.profile.type === 'initials') {
        const text = member.nickName
          ? (member.nickLastName
            ? member.nickName[0].toUpperCase() + member.nickLastName[0].toUpperCase()
            : member.nickName[0].toUpperCase())
          : member._id.profile.initials;
        return { simpleBg: member._id.profile.bgColor, text };
      }
      return {};
    }
    // group or channel
    if (user.details?.profile) {
      const profile = user.details.profile;
      if (profile.type === 'image') return { image: profile.imageUrl };
      if (profile.type === 'emoji') return { emoji: profile.emoji, simpleBg: profile.bgColor, emojiSize: "text-3xl" };
      if (profile.type === 'initials') return { simpleBg: profile.bgColor, text: profile.initials };
    }
    return {};
  }, [user.contactType, user.otherMember, user.details]);

  const selectedClass = isSelected
    ? "!bg-[#8763ea] !text-white hover:!bg-[#8763ea] focus:!bg-[#8763ea] active:!bg-[#8763ea]"
    : (user.contactType === "person" ? "text-black " : (user.contactType === "group" ? "text-gray-700 " : "text-black "));

  return (
    <ListItem
      selected={isSelected}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onClick={onClick}
      className={`flex justify-between items-center ${selectedClass}`}
    >
      {/* Left side - Icon + Text */}
      <div className="flex items-center gap-3" >
        <ListItemPrefix>
          <UserAvatar {...avatarProps} />
        </ListItemPrefix>
        <div className="flex flex-col">
          <Typography className={`font-semibold text-lg ${isSelected ? "text-white" : "text-black"}`}>
            {displayName}
          </Typography>
          <Typography
            variant="small"
            className={`text-sm font-medium max-w-[180px] truncate ${isSelected ? "text-white" : "text-gray-700"}`}
          >
            {lastMsg !== null && user.lastMessage != null ? (
              <span className="flex items-center gap-1 w-full truncate">
                {user.lastMessage.ForwardedDetails?.isForwarded && (
                  <RiShareForwardFill size={15} className={`flex-shrink-0 ${isSelected ? "text-white" : "text-red-600"}`} />
                )}
                <span className="truncate">{lastMsg}</span>
              </span>
            ) : null}
          </Typography>
        </div>
      </div>

      {/* Right side - Time + Unread bubble */}
      <div className="flex flex-col items-end justify-between h-full">
        <Typography variant="small" className={`text-xs font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
          {formattedTime}
        </Typography>
        {unreadCount > 0 && (
          <span className="mt-1 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
    </ListItem>
  );
});

export default function Navbar({ Choose, ChatsData, SelectedChat }) {
  const { contacts, rstUnread, markAllAsRead, backendUser, recentChats, deletePerson, leaveGroup, deleteAndLeaveGroup, leaveChanel } = useContext(AuthContext);
  const [isFocused, setIsFocused] = useState(false);
  const [userContacts, setUserContacts] = useState([])
  const [shortedContacts, setShortedContacts] = useState([])
  const [selectedChat, setSelectedChat] = useState({ _id: "" });

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  // Right-click handler (desktop)
  const handleContextMenu = useCallback((e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, chat });
  }, []);

  // Long-press handlers (mobile)
  const handleTouchStart = useCallback((e, chat) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      const touch = e.touches[0];
      setContextMenu({ visible: true, x: touch.clientX, y: touch.clientY, chat });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, chat: null });
  }, []);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: null,
    actionText: "",
    showCheckbox: false,
    chat: null,
    onConfirm: null
  });
  const [alsoDeleteForOther, setAlsoDeleteForOther] = useState(false);
  const [isModalActionLoading, setIsModalActionLoading] = useState(false);

  const triggerConfirmModal = useCallback((title, message, actionText, showCheckbox, chat, onConfirmCallback) => {
    setAlsoDeleteForOther(false);
    setIsModalActionLoading(false);
    setConfirmModal({
      isOpen: true,
      title,
      message,
      actionText,
      showCheckbox,
      chat,
      onConfirm: async (alsoDelete) => {
        setIsModalActionLoading(true);
        try {
          await onConfirmCallback(alsoDelete);
          setSelectedChat(prev => prev._id === chat._id ? { _id: "" } : prev);
        } catch (err) {
          console.error("Error executing confirm action:", err);
        } finally {
          setIsModalActionLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
    closeContextMenu();
  }, [closeContextMenu]);

  // Context menu actions
  const handleMarkAllAsRead = useCallback(() => {
    if (contextMenu.chat) {
      const chat = contextMenu.chat;

      markAllAsRead(chat._id, backendUser._id);

    }
    closeContextMenu();
  }, [contextMenu.chat, rstUnread, closeContextMenu]);

  const handleOpenInNewTab = useCallback(() => {
    if (contextMenu.chat) {
      window.open('/#' + contextMenu.chat._id, '_blank');
    }
    closeContextMenu();
  }, [contextMenu.chat, closeContextMenu]);

  const handleDeleteOrLeave = useCallback(() => {
    if (!contextMenu.chat) return;
    const chat = contextMenu.chat;
    const isOwner = chat.owner && (chat.owner._id || chat.owner).toString() === backendUser?._id?.toString();

    if (chat.contactType === 'person') {
      triggerConfirmModal(
        "Delete chat",
        <div className="text-gray-700 font-medium text-base leading-relaxed">
          Are you sure you want to delete the chat with <span className="font-bold text-gray-900">{chat.otherMember?.[0]?.nickName || chat.otherMember?.[0]?._id?.name || chat.otherMember?.[0]?._id?.username || "this user"}</span>?
        </div>,
        "Delete Chat",
        true,
        chat,
        async (alsoDelete) => {
          await deletePerson(chat._id, alsoDelete);
        }
      );
    } else if (chat.contactType === 'group') {
      if (isOwner) {
        triggerConfirmModal(
          "Delete group",
          <div className="text-gray-700 font-medium text-base leading-relaxed">
            Are you sure you want to delete the group <span className="font-bold text-gray-900">{chat.name}</span>? All members will be removed and the message history will be permanently deleted.
          </div>,
          "Delete Group",
          true,
          chat,
          async (alsoDelete) => {
            const fd = new FormData();
            fd.append("groupId", chat._id);
            fd.append("deleteForAll", alsoDelete);
            await deleteAndLeaveGroup(fd);
          }
        );
      } else {
        triggerConfirmModal(
          "Leave group",
          <div className="text-gray-700 font-medium text-base leading-relaxed">
            Are you sure you want to leave the group <span className="font-bold text-gray-900">{chat.name}</span>? You will no longer receive updates or messages in this group.
          </div>,
          "Leave Group",
          false,
          chat,
          async () => {
            const fd = new FormData();
            fd.append("groupId", chat._id);
            await leaveGroup(fd);
          }
        );
      }
    } else if (chat.contactType === 'channel') {
      if (isOwner) {
        triggerConfirmModal(
          "Delete channel",
          <div className="text-gray-700 font-medium text-base leading-relaxed">
            Are you sure you want to delete the channel <span className="font-bold text-gray-900">{chat.name}</span>? All subscribers will lose access and all content will be permanently removed.
          </div>,
          "Delete Channel",
          true,
          chat,
          async (alsoDelete) => {
            await deletePerson(chat._id, alsoDelete);
          }
        );
      } else {
        triggerConfirmModal(
          "Leave channel",
          <div className="text-gray-700 font-medium text-base leading-relaxed">
            Are you sure you want to leave the channel <span className="font-bold text-gray-900">{chat.name}</span>? You will stop receiving updates from this channel.
          </div>,
          "Leave Channel",
          false,
          chat,
          async () => {
            const fd = new FormData();
            fd.append("channelId", chat._id);
            fd.append("userId", backendUser._id);
            await leaveChanel(fd);
          }
        );
      }
    }
  }, [contextMenu.chat, backendUser, deletePerson, leaveGroup, deleteAndLeaveGroup, leaveChanel, triggerConfirmModal]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleClickOutside, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleClickOutside, true);
      };
    }
  }, [contextMenu.visible, closeContextMenu]);
  // Sort is handled by the useEffect on line 523-531 (shortedContacts), no inline sort needed
  function timestampToAmPm(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  const lastMessege = useCallback((messegeData, otherMember) => {
    // 

    if (messegeData.chatType !== "label") {
      if (messegeData.chatType === "image") {
        return (
          <span className="flex items-center gap-1.5">
            <img className="w-[14px] h-[14px] rounded-[3px] object-cover flex-shrink-0" src={messegeData.images[0].url} alt="" />
            <span className="truncate">{messegeData.content || (messegeData.images?.length > 1 ? "Album" : "Photo")}</span>
            <span className="truncate">{messegeData.caption}</span>
          </span>
        );
      }
      if (messegeData.chatType === "video") {
        return "Video";
      }
      if (messegeData.chatType === "document") {
        //  return (
        //   <span className="flex items-center gap-1.5">
        //     <img className="w-[14px] h-[14px] rounded-[3px] object-cover flex-shrink-0" src={messegeData.images[0].url} alt="" />
        //     <span className="truncate">{messegeData.content || (messegeData.images?.length > 1 ? "Album" : "Photo")}</span>
        //     <span className="truncate">{messegeData.caption}</span>
        //   </span>
        // );
      }
      return messegeData.content;
    } else {

      if (messegeData.systemMessage.type == "groupCreated") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        if (isYou === true) {
          return "You created the group"
        } else {
          const userData = otherMember.find(user => user._id._id.toString() == messegeData.systemMessage.
            creatorId.toString())

          if (userData !== null) {
            return `${messegeData.systemMessage.
              creatorId.name
              } ${messegeData.systemMessage.
                creatorId.lastName
              } created the group`
          }
        }

      }
      if (messegeData.systemMessage.type == "memberAdded") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You Added ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} added you`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} added ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "memberRemoved") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You removed ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} removed you`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} removed ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "memberUnBlocked") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You unblock ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `You are unblocked by ${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''}`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} unblocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "memberBlocked") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You blocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `You are blocked by ${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} `;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} blocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "memberLeft") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        if (isYou === true) {
          return `You left the group`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} left the group `;
        }

      }

      if (messegeData.systemMessage.type == "channelCreated") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        if (isYou === true) {
          return "You created the channel"
        } else {
          const userData = otherMember.find(user => user._id._id.toString() == messegeData.systemMessage.
            creatorId.toString())

          if (userData !== null) {
            return `${messegeData.systemMessage.
              creatorId.name
              } ${messegeData.systemMessage.
                creatorId.lastName
              } created the channel`
          }
        }

      }
      if (messegeData.systemMessage.type == "channelJoined") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        if (isYou === true) {
          return "You joined the channel"
        } else {
          const userData = otherMember.find(user => user._id._id.toString() == messegeData.systemMessage.
            creatorId.toString())

          if (userData !== null) {
            return `${messegeData.systemMessage.
              creatorId.name
              } ${messegeData.systemMessage.
                creatorId.lastName
              } joined the channel`
          }
        }

      }
      if (messegeData.systemMessage.type == "channelMemberAdded") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You Added ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} added you`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} added ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "channelMemberRemoved") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You removed ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} removed you`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} removed ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "channelMemberUnBlocked") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You unblock ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `You are unblocked by ${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''}`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} unblocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "channelMemberBlocked") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        const isYouMember = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (isYou === true) {
          return `You blocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`;
        }
        if (isYouMember) {
          return `You are blocked by ${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} `;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} blocked ${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''}`.trim();
        }

      }
      if (messegeData.systemMessage.type == "channelMemberLeft") {
        const isYou = messegeData.systemMessage.
          creatorId._id.toString() == backendUser._id.toString();
        if (isYou === true) {
          return `You left the channel`;
        }
        else {
          return `${messegeData.systemMessage.creatorId.name} ${messegeData.systemMessage.creatorId.lastName || ''} left the channel `;
        }

      }
      if (messegeData.systemMessage?.type === "groupJoinedByLink") {
        const youJoined = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (youJoined) {
          return `You joined the group by invitation link`;
        }


        return `${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''} Joined the group by invitation link`.trim();


      }
      if (messegeData.systemMessage?.type === "channelJoinedByLink") {
        const youJoined = messegeData.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
        if (youJoined) {
          return `You joined the channel by invitation link`;
        }


        return `${messegeData.systemMessage.memberId.name} ${messegeData.systemMessage.memberId.lastName || ''} Joined the channel by invitation link`.trim();


      }

    }
  }, [backendUser]);
  const getUnreadCount = (contact) => {
    const currentUserMember = contact.members.find(
      member => member._id._id.toString() === backendUser._id.toString()
    );
    return currentUserMember?.unread || 0;
  }
  useEffect(() => {
    if (SelectedChat != null) {
      setSelectedChat(SelectedChat)
    }
  }, [SelectedChat])
  const handleInputPress = () => {
    Choose("Serch")

  }
  useEffect(() => {
    if (contacts.length !== 0 && backendUser != null) {
      // Suppose `contacts` is the array received from the backend


      const processedContacts = contacts.map(contact => {

        const otherMembers = contact.members?.filter(
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
      const sortedContacts = [...userContacts].sort((a, b) => new Date(b.
        lastMessageTime)
        - new Date(a.
          lastMessageTime)
      );
      setShortedContacts(sortedContacts);
    }
  }, [userContacts])

  const formatDate = useCallback((dateStr) => {
    const inputDate = new Date(dateStr);
    if (isNaN(inputDate.getTime())) {
      // Invalid date, show fallback or error
      return "Invalid Date";
    }
    const now = new Date();

    const diffMs = now - inputDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Helper to pad numbers with leading zero
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    if (diffHours < 24) {
      // less than 24 hours: show time like 4:20 or 18:20
      return inputDate.getHours() + ':' + pad(inputDate.getMinutes());
    }

    if (diffDays < 1) {
      // Less than a day but more than 24 hours (rare edge case)
      return inputDate.getHours() + ':' + pad(inputDate.getMinutes());
    }

    if (diffDays < 7) {
      // less than a week: show day name, e.g. mon
      return weekdays[inputDate.getDay()];
    }

    if (diffDays < 30) {
      // greater than 1 day but less than one month: show day name and date, e.g. mon 12
      return weekdays[inputDate.getDay()] + ' ' + inputDate.getDate();
    }

    if (inputDate.getFullYear() === now.getFullYear()) {
      // same year but greater than 1 month: show month year, e.g. jan 2025
      return months[inputDate.getMonth()] + ' ' + inputDate.getFullYear();
    }

    // different year: show date as dd/mm/yyyy
    return pad(inputDate.getDate()) + '/' + pad(inputDate.getMonth() + 1) + '/' + inputDate.getFullYear();
  }, []);
  const [showFab, setShowFab] = useState(true);
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
  const handleSidevarListPress = useCallback((screen) => {
    Choose(screen)
  }, [Choose]);

  const formatName = useCallback((name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }, []);

  const dataSender = useCallback((data) => {
    setSelectedChat(data);
    Choose("Chat", data);
  }, [Choose]);

  const rdHadler = useCallback((e) => {
    if (e.redirectData != undefined) {
      Choose(e.Screen, e.redirectData)
    } else {
      Choose(e.Screen)
    }
  }, [Choose]);

  const goToChatArea = useCallback((chat) => {
    Choose("Chat", chat);
  }, [Choose]);
  function getNewerMessage(msg1, msg2) {
    const date1 = new Date(msg1.time);
    const date2 = new Date(msg2.time);

    if (date1 > date2) {
      return msg1.messege;
    } else if (date1 < date2) {
      return msg2.messege;
    } else {
      return null; // Both are equal
    }
  }

  return (
    <>
      {/* Parent wrapper */}
      <div className="select-none font-telegram relative h-[100dvh] bg-white py-2">

        {/* Header row: flex with Sidebar + right-aligned input */}
        <div className="flex items-center  justify-between">
          {/* Sidebar icon on the left */}
          <div className="ml-3 mr-3"> <Sidebar Choose={handleSidevarListPress} /></div>


          {/* Search input aligned to right */}
          <div className="w-full flex justify-end mr-6">
            <div
              onClick={handleInputPress}
              className={`flex items-center rounded-md px-4 py-[6px] w-full bg-white border transition-colors duration-200 ${isFocused ? "border-blue-500" : "border-gray-400 cursor-pointer"
                }`}
            >
              <input

                type="text"
                placeholder="Search"
                className="outline-none border-none bg-transparent w-full text-gray-700 placeholder:text-gray-400"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <svg
                className={`h-5 w-5 mr-2 transition-colors duration-200 ${isFocused ? "text-blue-500" : "text-gray-500"
                  }`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>
        <div id="scrollable-content" className="scrollbar-telegram overflow-y-auto h-[calc(100vh-40px)] pt-2">
          {/* scrollable */}

          {(contacts != null && contacts != 'undefined' && contacts.length > 0) && (
            <List>
              {shortedContacts.map((user) => (
                <ContactListItem
                  key={user._id}
                  user={user}
                  isSelected={user._id == selectedChat._id}
                  onContextMenu={(e) => handleContextMenu(e, user)}
                  onTouchStart={(e) => handleTouchStart(e, user)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onClick={() => {
                    if (longPressTriggered.current) return;
                    setSelectedChat({ _id: user._id });
                    goToChatArea(user);
                    rstUnread(user._id, backendUser._id);
                  }}
                  backendUserId={backendUser._id}
                  formatName={formatName}
                  formatDate={formatDate}
                  lastMessege={lastMessege}
                />
              ))}
            </List>
          )}
          {(contacts == null || contacts == 'undefined' || contacts.length == 0) && (
            <div className="flex flex-col items-center justify-center h-full">
              <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
              <div className="flex flex-col items-center">
                <Typography

                  color='blue-gray'
                  className="text-base font-semibold max-w-[180px]   text-center"
                >
                  No contacts found
                </Typography>
                <Typography

                  className="text-sm max-w-[180px] font-medium  text-center  text-gray-800"
                >
                  To add contacts . <a onClick={() => Choose('Contact')} className="text-blue-700 cursor-pointer">Click here</a>
                </Typography>
              </div>
            </div>
          )}
        </div>
        {showFab && (
          <div className="flex justify-end">
            <AnimatePresence mode="wait">
              <motion.button
                // removed transition
                aria-label="Save"
                variants={fabVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{ willChange: "transform, opacity", zIndex: 10 }}
              >
                <FabPopover choose={(e) => rdHadler(e)} />
              </motion.button>
            </AnimatePresence>

          </div>
        )}

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: Math.max(10, Math.min(contextMenu.y, window.innerHeight - 220)),
                left: Math.max(10, Math.min(contextMenu.x, window.innerWidth - 280)),
                zIndex: 9999,
              }}
              className="p-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleMarkAllAsRead}
                className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-3 transition-colors duration-150"
              >
                <IoCheckmarkCircleOutline size={20} className="text-[#8763ea]" />
                Mark as read
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-3 transition-colors duration-150"
              >
                <IoOpenOutline size={20} className="text-[#8763ea]" />
                Open in new tab
              </button>

              {contextMenu.chat && (() => {
                const chat = contextMenu.chat;
                const isOwner = chat.owner && (chat.owner._id || chat.owner).toString() === backendUser?._id?.toString();

                if (chat.contactType === 'person') {
                  return (
                    <button
                      onClick={handleDeleteOrLeave}
                      className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 border-t border-gray-50 mt-1 pt-2"
                    >
                      <MdDeleteOutline size={20} className="text-red-500" />
                      Delete Chat
                    </button>
                  );
                } else if (chat.contactType === 'group') {
                  return isOwner ? (
                    <button
                      onClick={handleDeleteOrLeave}
                      className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 border-t border-gray-50 mt-1 pt-2"
                    >
                      <MdDeleteOutline size={20} className="text-red-500" />
                      Delete Group
                    </button>
                  ) : (
                    <button
                      onClick={handleDeleteOrLeave}
                      className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 border-t border-gray-50 mt-1 pt-2"
                    >
                      <IoExitOutline size={20} className="text-red-500" />
                      Leave Group
                    </button>
                  );
                } else if (chat.contactType === 'channel') {
                  return isOwner ? (
                    <button
                      onClick={handleDeleteOrLeave}
                      className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 border-t border-gray-50 mt-1 pt-2"
                    >
                      <MdDeleteOutline size={20} className="text-red-500" />
                      Delete Channel
                    </button>
                  ) : (
                    <button
                      onClick={handleDeleteOrLeave}
                      className="rounded-lg w-full font-medium text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 border-t border-gray-50 mt-1 pt-2"
                    >
                      <IoExitOutline size={20} className="text-red-500" />
                      Leave Channel
                    </button>
                  );
                }
                return null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.22, ease: [0.0, 0.0, 0.2, 1] }}
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-[320px] px-6 py-6 flex flex-col gap-5 z-10 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0">
                    {confirmModal.chat?.contactType === 'person' && confirmModal.chat?.otherMember?.[0]?._id && (
                      <UserAvatar
                        size="w-10 h-10"
                        textSize="text-md"
                        emojiSize="text-lg"
                        {...((confirmModal.chat.otherMember[0]._id.profile?.type === 'image' || (confirmModal.chat.otherMember[0]._id.profile?.type === undefined && confirmModal.chat.otherMember[0]._id.profile?.imageUrl)) && { image: confirmModal.chat.otherMember[0]._id.profile.imageUrl })}
                        {...(confirmModal.chat.otherMember[0]._id.profile?.type === 'emoji' && { emoji: confirmModal.chat.otherMember[0]._id.profile.emoji, simpleBg: confirmModal.chat.otherMember[0]._id.profile.bgColor })}
                        {...(confirmModal.chat.otherMember[0]._id.profile?.type === 'initials' && {
                          simpleBg: confirmModal.chat.otherMember[0]._id.profile.bgColor,
                          text: confirmModal.chat.otherMember[0].nickName ? (confirmModal.chat.otherMember[0].nickLastName ? (confirmModal.chat.otherMember[0].nickName[0].toUpperCase() + confirmModal.chat.otherMember[0].nickLastName[0].toUpperCase()) : (confirmModal.chat.otherMember[0].nickName[0].toUpperCase())) : (confirmModal.chat.otherMember[0]._id.profile.initials)
                        })}
                      />
                    )}
                    {(confirmModal.chat?.contactType === 'group' || confirmModal.chat?.contactType === 'channel') && confirmModal.chat?.details?.profile && (
                      <UserAvatar
                        size="w-10 h-10"
                        textSize="text-md"
                        emojiSize="text-lg"
                        {...((confirmModal.chat.details.profile.type === 'image' || (confirmModal.chat.details.profile.type === undefined && confirmModal.chat.details.profile.imageUrl)) && { image: confirmModal.chat.details.profile.imageUrl })}
                        {...(confirmModal.chat.details.profile.type === 'emoji' && { emoji: confirmModal.chat.details.profile.emoji, simpleBg: confirmModal.chat.details.profile.bgColor })}
                        {...(confirmModal.chat.details.profile.type === 'initials' && { simpleBg: confirmModal.chat.details.profile.bgColor, text: confirmModal.chat.details.profile.initials })}
                      />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                    {confirmModal.title}
                  </h3>
                </div>

                {confirmModal.message}

                {confirmModal.showCheckbox && (
                  <label className="flex items-center gap-3 cursor-pointer select-none group py-1">
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={alsoDeleteForOther}
                        onChange={(e) => setAlsoDeleteForOther(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ease-out active:scale-90 ${alsoDeleteForOther
                        ? 'bg-[#8763ea] border-[#8763ea] shadow-sm shadow-[#8763ea]/20'
                        : 'border-gray-300 bg-transparent group-hover:border-[#8763ea]'
                        }`}>
                        {alsoDeleteForOther && (
                          <svg
                            className="w-3 h-3 text-white animate-checkbox-scale"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-700 text-[15px] font-medium group-hover:text-gray-950 transition-colors duration-150">
                      {confirmModal.chat?.contactType === 'person' && `Also delete for ${confirmModal.chat?.otherMember?.[0]?.nickName || confirmModal.chat?.otherMember?.[0]?._id?.name || "this user"}`}
                      {confirmModal.chat?.contactType === 'group' && "Also delete for all members"}
                      {confirmModal.chat?.contactType === 'channel' && "Also delete for all subscribers"}
                    </span>
                  </label>
                )}

                <div className="flex items-center justify-end gap-3 mt-2">
                  {!isModalActionLoading && (
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                      className="px-4 py-2 text-[14px] font-semibold text-[#8763ea] hover:bg-blue-50/50 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    disabled={isModalActionLoading}
                    onClick={() => confirmModal.onConfirm(alsoDeleteForOther)}
                    className="px-4 py-2 text-[14px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider cursor-pointer flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isModalActionLoading ? (
                      <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      confirmModal.actionText
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>


  );
}
