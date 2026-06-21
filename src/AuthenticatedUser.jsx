import React, { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from './firebase hooks/AuthContext';
import "./App.css";
import { useLocation, useNavigate } from 'react-router';
import uuid4 from "uuid4";
import Navbar from "./Navbar";
import SerchScreen from "./SearchScreen";
import SettingScreen from "./SettingScreen";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@material-tailwind/react";
import ProfileScreen from "./ProfileScreen";
import EditProfileScreen from "./EditProfile";
import NewGroup from "./NewGroup";
import NewGroupFinalPage from "./NewGroupFinalPage";
import bg from "./background/bg1.png";
import ChatArea from "./ChatArea";
import NewChanel from "./NewChanel";
import AddMemberForChanel from "./AddMemeberForChanel";
import Contact from "./Contact"
import Notification from "./Notifaction"
import toast from "react-hot-toast";
import JoinPopUp from "./JoinPopUp";
import AllGroups from "./AllGroups";
import AllChannels from "./AllChannels";

// Order of screens for direction logic
const screenOrder = ["Home", "Serch", "Setting", "Profile", "EditProfile", "Chat", "NewGroup", "NewGroupFinalPage", "NewChanel", "AddMemberForChanel", "Contact", "Notification", "AllGroups", "AllChannels"];
const chatsDataWithBg = [
  { id: 1, type: "user", name: "Evelyn", message: "Don’t forget to smile!", time: 1758291640031, unreadMsgValue: 9 },
  { id: 2, type: "user", name: "Isabella", message: "I’ll send you the location.", time: 1758295063680, unreadMsgValue: 1 },
  { id: 3, type: "user", name: "Owen", message: "Yes, definitely.", time: 1758296080139, unreadMsgValue: 2 },
  { id: 4, type: "user", name: "Amelia", message: "Yes, I agree with that.", time: 1758298635574, unreadMsgValue: 0 },
  { id: 5, type: "user", name: "Ethan", message: "Don’t forget the meeting later.", time: 1758299674403, unreadMsgValue: 5 },
  { id: 6, type: "user", name: "Sebastian", message: "I’ll let you know.", time: 1758303328000, unreadMsgValue: 4 },
  { id: 7, type: "user", name: "Scarlett", message: "Where should we meet?", time: 1758303999999, unreadMsgValue: 5 },
  { id: 8, type: "user", name: "Penelope", message: "Sounds like a plan.", time: 1758304793510, unreadMsgValue: 8 },
  { id: 9, type: "user", name: "James", message: "I’m on my way.", time: 1758306847102, unreadMsgValue: 5 },
  { id: 10, type: "user", name: "Gabriel", message: "See you in class.", time: 1758309245129, unreadMsgValue: 5 },
  { id: 11, type: "user", name: "Jack", message: "What time tomorrow?", time: 1758310123567, unreadMsgValue: 6 },
  { id: 12, type: "user", name: "Ivan", message: "See you soon.", time: 1758311876543, unreadMsgValue: 6 },
  { id: 13, type: "user", name: "Harper", message: "See you at the party!", time: 1758312738420, unreadMsgValue: 6 },
  { id: 14, type: "user", name: "Mason", message: "The tickets are booked.", time: 1758313856934, unreadMsgValue: 2 },
  { id: 15, type: "user", name: "Daniel", message: "It’s already done.", time: 1758314167080, unreadMsgValue: 4 },
  { id: 16, type: "user", name: "Charlotte", message: "Talk to you tomorrow.", time: 1758315267890, unreadMsgValue: 8 },
  { id: 17, type: "user", name: "Jack", message: "Talk to you tomorrow.", time: 1758315267891, unreadMsgValue: 8 },
  { id: 18, type: "user", name: "Alexander", message: "We’ll figure it out.", time: 1758316269843, unreadMsgValue: 1 },
  { id: 19, type: "user", name: "Sophia", message: "Where are you now?", time: 1758316473800, unreadMsgValue: 1 },
  { id: 20, type: "user", name: "Liam", message: "Happy Birthday!", time: 1758317000350, unreadMsgValue: 4 },
  { id: 21, type: "user", name: "Jayden", message: "That’s interesting.", time: 1758317043029, unreadMsgValue: 3 },
  { id: 22, type: "user", name: "Zoe", message: "Call me later.", time: 1758317854072, unreadMsgValue: 4 },
  { id: 23, type: "user", name: "Abigail", message: "I’m so excited!", time: 1758318401128, unreadMsgValue: 2 },
  { id: 24, type: "user", name: "Emma", message: "Can we reschedule?", time: 1758318991023, unreadMsgValue: 2 },
  { id: 25, type: "user", name: "Benjamin", message: "That was awesome!", time: 1758319040011, unreadMsgValue: 3 },
  { id: 26, type: "user", name: "Sophia", message: "Don’t forget about it.", time: 1758319129000, unreadMsgValue: 1 },
  { id: 27, type: "user", name: "Chloe", message: "Good luck with that.", time: 1758319589315, unreadMsgValue: 7 },
  { id: 28, type: "user", name: "Lucas", message: "What’s the update?", time: 1758320012302, unreadMsgValue: 2 },
  { id: 29, type: "user", name: "Evelyn", message: "Don’t forget to smile!", time: 1758320574988, unreadMsgValue: 9 },
  { id: 30, type: "user", name: "Lily", message: "Take care.", time: 1758321234580, unreadMsgValue: 1 },
  { id: 31, type: "user", name: "Owen", message: "Yes, definitely.", time: 1758321458741, unreadMsgValue: 2 },
  { id: 32, type: "user", name: "Jackson", message: "Send me the pics!", time: 1758322073030, unreadMsgValue: 0 },
  { id: 33, type: "user", name: "Riley", message: "I’ll be there soon.", time: 1758322701845, unreadMsgValue: 0 },
  { id: 34, type: "user", name: "Samuel", message: "That’s funny!", time: 1758322966238, unreadMsgValue: 0 },
  { id: 35, type: "user", name: "Noah", message: "Let’s play football this weekend.", time: 1758323120403, unreadMsgValue: 0 },
  { id: 36, type: "user", name: "Ella", message: "Text me when you’re free.", time: 1758323204002, unreadMsgValue: 0 },
  { id: 37, type: "user", name: "Michael", message: "Got it, thanks.", time: 1758323312341, unreadMsgValue: 0 },
  { id: 38, type: "user", name: "Daniel", message: "It’s already done.", time: 1758323438906, unreadMsgValue: 4 },
  { id: 39, type: "user", name: "Jayden", message: "That’s interesting.", time: 1758323509014, unreadMsgValue: 3 },
  { id: 40, type: "user", name: "Matthew", message: "Sure, no problem.", time: 1758323746018, unreadMsgValue: 3 },
  { id: 41, type: "user", name: "Layla", message: "It’s fine.", time: 1758323782350, unreadMsgValue: 0 },
  { id: 42, type: "user", name: "Grace", message: "Thanks for sharing.", time: 1758323887217, unreadMsgValue: 2 },
  { id: 43, type: "user", name: "Noah", message: "Good morning!", time: 1758324275601, unreadMsgValue: 2 },
  { id: 44, type: "user", name: "Sophia", message: "Where are you now?", time: 1758324829723, unreadMsgValue: 1 },
  { id: 45, type: "user", name: "Isabella", message: "I’ll send you the location.", time: 1758325327299, unreadMsgValue: 1 },
  { id: 46, type: "user", name: "Charlotte", message: "Talk to you tomorrow.", time: 1758325986714, unreadMsgValue: 8 },
  { id: 47, type: "user", name: "Lucas", message: "What’s the update?", time: 1758326528758, unreadMsgValue: 2 },
  { id: 48, type: "user", name: "Benjamin", message: "That was awesome!", time: 1758326788921, unreadMsgValue: 3 },
  { id: 49, type: "user", name: "Jack", message: "What time tomorrow?", time: 1758327123456, unreadMsgValue: 6 },
  { id: 50, type: "user", name: "Ethan", message: "Don’t forget the meeting later.", time: 1758327890123, unreadMsgValue: 5 }
];



const avatarGradientBGs = [
  "#ff9a9e", "#1D8FE1",

  "#c471f5", "#fa71cd",
  "#625EB1", "#7918F2",
  "#4801FF", " #44107A",
  "#FF1361",
  "#43e97b", "#38f9d7",
  "#7b54c9",
  "#2af598", "#009efd",
  "#c471f5", "#fa71cd",
  "#00c6fb", "#005bea",
  "#6e45e2",
  "#7028e4",
  "#ff0844",
  "#92fe9d", "#00c9ff",
  "#b721ff", "#21d4fd",
  "#5f72bd", "#9b23ea",
  "#f83600", "#f9d423",
  "#ff5858", "#f09819",
  "#4481eb", "#04befe"
]



function getRandomTailwindColor() {
  const index = Math.floor(Math.random() * avatarGradientBGs.length);
  return avatarGradientBGs[index];
}
const chatsData = chatsDataWithBg.map(chat => ({
  ...chat,
  bg: getRandomTailwindColor()
}));
let id = uuid4()
let bg1 = getRandomTailwindColor()
chatsData.push({ id: id, type: "group", bg: bg1, name: "New Group", message: "Hello", time: Date.now(), unreadMsgValue: 1 })
const screens = {
  Home: Navbar,
  Setting: SettingScreen,
  Serch: SerchScreen,
  Profile: ProfileScreen,
  EditProfile: EditProfileScreen,
  NewGroup: NewGroup,
  NewGroupFinalPage: NewGroupFinalPage,
  NewChanel: NewChanel,
  AddMemberForChanel: AddMemberForChanel,
  Contact,
  AllGroups,
  AllChannels,
  Notification,

  Chat: (props) => <ChatArea {...props} />,  // Forward props so back etc. work
};

function AuthenticatedUser() {
  const { addContactById, addInGroupById, backendUser, handleChat, recentChats, selctedContact, contacts, joinChanelByInvite } = useContext(AuthContext);
  const location = useLocation();
  const findContact = (id) => {
    // ✅ Early return if no ID or no contacts
    if (!id || !contacts?.length) {
      setCurrent("Home")
      setSelectedChat(null);
      setActiveChat(false)
      window.history.pushState({}, '', `/`);
      return null;
    }

    const targetContact = contacts.find(
      (contact) => contact._id?.toString() === id.toString()
    );

    if (!targetContact) {
      setCurrent("Home")
      setSelectedChat(null);
      setActiveChat(false)
      window.history.pushState({}, '', `/`);
      return null;
    }

    // ✅ Safe member filtering
    const otherMember = targetContact.members?.filter(
      (member) => member?._id._id?.toString() !== backendUser?._id?.toString()
    ) || [];

    return {
      ...targetContact,
      otherMember,
      lastMessage: targetContact.lastMessage,
    };
  };

  const [chastData, setChatsData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [newGroupFinalData, setNewGroupFinalData] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [rdDataForChanel, setRdDataForChanel] = useState(null);
  const [isJoinPopUpOpen, setIsJoinPopUpOpen] = useState(false);
  const [joinPopUpData, setJoinPopUpData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (chatsData.length > 0) {
      setChatsData(chatsData)
    }
  }, [chatsData]);
  const [current, setCurrent] = useState("Home");
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState("forward");
  const [animating, setAnimating] = useState(false);
  const initialLoad = useRef(true);
  const currentRef = useRef(current);
  const navigate = useNavigate();

  // Keep ref in sync with current screen
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Handle browser back button for non-Home screens (e.g. Notification)
  useEffect(() => {
    const sidebarScreens = ["Setting", "Serch", "Profile", "EditProfile", "NewGroup", "NewGroupFinalPage", "NewChanel", "AddMemberForChanel", "Contact", "Notification"];

    const handlePopState = (e) => {
      if (sidebarScreens.includes(currentRef.current)) {
        // Navigate back to Home without changing URL
        setPrev(currentRef.current);
        setCurrent("Home");
        setDirection("back");
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);

        // Keep URL with hash preserved
        window.history.pushState({}, '', window.location.pathname + window.location.hash);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // NEW: track if user opened a chat (for mobile view)
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeChat, setActiveChat] = useState(false);
  const [autoSendChat, setAutoSendChat] = useState("");
  const [forwardMessagesData, setForwardMessagesData] = useState([]);
  const isChatSelected = !!selectedChat;
  useEffect(() => {
    // ✅ Get all query params
    const params = new URLSearchParams(window.location.search);
    const userID = params.get('userID');  // "abc123"
    const groupId = params.get('groupId');  // "abc123"
    // "messages"
    const chatId = params.get('chatId');  // "abc123"





    if (userID) {

      const handleAddContact = async () => {


        const fd = new FormData();
        fd.append("id", userID);

        const res = await addContactById(fd);
        if (res.status === 200) {
          const contactWithOtherMembers = () => {
            const contact = res.data.contact;
            const contactOtherMembers = contact.members.filter(
              member => member._id._id !== res.data.user._id
            );
            return {
              ...contact,
              otherMember: contactOtherMembers, // Array of others
              lastMessage: contact.lastMessage
            };
          }
          const contact = contactWithOtherMembers();
          window.history.pushState({}, '', `/#${contact._id}`);
          // UpdateSelecetdChat(contact);
          setSelectedChat(contact);
          setActiveChat(true);


        } else if (res.response.status == 409) {
          window.history.pushState({}, '', `/`);
          toast.error("Cannot add yourself as contact")
        }
      }
      handleAddContact();

    }
    if (groupId) {
      const chatData = location.state?.context;
      if (chatData !== null) {
        const targetContact = contacts.find(
          (contact) => contact._id?.toString() === chatData._id.toString()
        );

        if (targetContact !== null && targetContact !== undefined) {
          window.history.pushState({}, '', `/#${chatData._id}`);
          handleChat(chatData._id);
          setSelectedContactId(chatData._id);
          setActiveChat(true);

        } else {
          setJoinPopUpData(chatData);
          setIsJoinPopUpOpen(true)
        }

      }


    }
    const handleHashChange = () => {
      const hashData = window.location.hash;
      if (hashData && hashData.startsWith('#')) {
        const contactId = hashData.substring(1);
        handleChat(contactId);
        setSelectedContactId(contactId);
        setDirection("forward");
        setActiveChat(true);
      } else {
        setDirection("back");
        setSelectedContactId(null);
        setSelectedChat(null);
        setActiveChat(false);
      }
    };

    // Run on initial load
    handleHashChange();

    // Run whenever the hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  function useIsSmMd() {
    const [isSmMd, setIsSmMd] = useState(false);

    useEffect(() => {
      function handleResize() {
        setIsSmMd(window.innerWidth < 1024);
      }
      handleResize();

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isSmMd;
  }
  // ✅ Add this useEffect (key fix!)
  useEffect(() => {
    if (selectedContactId && contacts.length > 0) {


      // ✅ Find FRESH contact data
      const freshContact = findContact(selectedContactId);

      if (freshContact) {




        setSelectedChat(freshContact);
      }
    }
  }, [contacts, selectedContactId]); // ✅ Re-runs when contacts change!

  const isSmMd = useIsSmMd();
  const handleInputPress = (next, ChatData = null, extraData = null, redirectData = null, redirectData2 = null, autoChatSendData = null, forwardData = null) => {

    if (next === "Chat" && autoChatSendData && ChatData) {

      // UpdateSelecetdChat(ChatData)
      setSelectedContactId(ChatData._id)
      setSelectedChat(ChatData);
      setAutoSendChat(autoChatSendData)
      if (forwardData) {

        setForwardMessagesData(forwardData);
      }

      setActiveChat(true);
      window.history.pushState({}, '', `/#${ChatData._id}`);
      return;  // ✅ don’t navigate away to Setting screen
    }
    if (next === "Chat" && ChatData) {

      handleChat(ChatData._id);

      setSelectedContactId(ChatData._id)
      // UpdateSelecetdChat(ChatData);
      setSelectedChat(ChatData);
      if (forwardData) {


        setForwardMessagesData(forwardData);
      }
      setActiveChat(true);
      window.history.pushState({}, '', `/#${ChatData._id}`);
      return;  // ✅ don’t navigate away to Setting screen
    }
    if (next === "NewGroupFinalPage" && extraData) {
      setMembersData(extraData);
    }

    if (next === "Home" && redirectData) {
      setNewGroupFinalData(redirectData);
      let id = uuid4()
      let bg = getRandomTailwindColor()
      setChatsData(prevData => [
        ...prevData,
        { id: id, type: "group", bg: bg, name: redirectData, message: "Hello", time: Date.now(), unreadMsgValue: 1 }
      ]);
      setSelectedChat({ id: id, type: "group", bg: bg, name: redirectData, message: "Hello", time: Date.now(), unreadMsgValue: 1 })
      setActiveChat(true);
    }
    if (next === "Home" && redirectData2) {

      if (redirectData2.otherMember === undefined) {
        const otherMembers = redirectData2.members.filter((member) => member._id._id.toString() !== backendUser._id.toString());
        redirectData2.otherMember = otherMembers;
      }

      handleChat(redirectData2._id);

      setSelectedContactId(redirectData2._id)
      // UpdateSelecetdChat(ChatData);
      setSelectedChat(redirectData2);
      window.history.pushState({}, '', `/#${redirectData2._id}`);

      setActiveChat(true);

      if (current !== "Home") {
        setPrev(current);
        setCurrent("Home");
        setDirection("back");
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
      }
      return;
    }


    if (next === "AddMemberForChanel" && redirectData) {

      setSelectedContactId(redirectData._id)
      setSelectedChat(redirectData)
      setActiveChat(true);
      setRdDataForChanel(redirectData)
      window.history.pushState({}, '', `/#${redirectData._id}`);
    }
    if (next === current || animating) return;
    const currentIndex = screenOrder.indexOf(current);
    const nextIndex = screenOrder.indexOf(next);
    const dir = nextIndex > currentIndex ? "forward" : "back";

    // Push history entry for non-Home screens so browser back button can return to Home
    const sidebarScreens = ["Setting", "Serch", "Profile", "EditProfile", "NewGroup", "NewGroupFinalPage", "NewChanel", "AddMemberForChanel", "Contact", "Notification"];
    if (sidebarScreens.includes(next)) {
      window.history.pushState({ screen: next }, '', window.location.pathname + window.location.hash);
    }

    setPrev(current);
    setCurrent(next);
    setDirection(dir);
    setAnimating(true);

    initialLoad.current = false;
    setTimeout(() => setAnimating(false), 300);
  };

  // Listen for custom navigation events from deeply nested components (e.g., MemberScreen)
  useEffect(() => {
    const handleNavigateToChat = (e) => {

      const { contact } = e.detail || {};
      if (contact) {
        if (contact.otherMember === undefined) {
          const otherMembers = contact.members.filter((member) => member._id._id.toString() !== backendUser._id.toString());
          contact.otherMember = otherMembers;
        }

        handleInputPress("Chat", contact);
      }
    };
    window.addEventListener('navigate-to-chat', handleNavigateToChat);
    return () => window.removeEventListener('navigate-to-chat', handleNavigateToChat);
  }, []);

  const getScreen = (name) => {

    const Component = screens[name];
    if (name === "Chat") {
      return <Component
        autoChatSendData={autoSendChat}
        resetAutoSentChat={(data) => {
          setAutoSendChat("")


        }}
        choose={handleInputPress}
        isChatSelected={isChatSelected}
        chat={selectedChat}
        contactData={selectedChat}
        forwardMessagesData={forwardMessagesData}
        setForwardMessagesData={setForwardMessagesData}
        back={() => {
          setActiveChat(false);
          setCurrent("Home");
          setPrev("Chat");
          setDirection("back");
          setAnimating(true);
          window.history.pushState({}, '', `/`);
          setTimeout(() => setAnimating(false), 300);
        }}
      />;
    }
    if (name === "Home") {
      return <Component Choose={handleInputPress} ChatsData={chastData} SelectedChat={selectedChat} contactData={selectedChat} />;
    }
    if (name === "NewGroupFinalPage") {
      return <Component Choose={handleInputPress} members={membersData} />;
    }
    if (name === "AddMemberForChanel") {
      return <Component Choose={handleInputPress} rdData={selectedChat} />;
    }
    return <Component Choose={handleInputPress} />;
  };


  const handleBackFromChat = () => {
    console.log("back from chat");
    setActiveChat(false);
    window.history.pushState({}, '', `/`);
  };
  const variants = {
    initial: (dir) => ({
      x: dir === "forward" ? "100%" : "-100%",
    }),
    animate: {
      x: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: (dir) => ({
      x: dir === "forward" ? "-100%" : "100%",
      transition: { duration: 0.25, ease: "easeOut" },
    }),
    fadeInitial: { opacity: 0 },
    fadeAnimate: {
      opacity: 1,
      transition: { duration: 0.25 },
    },
  };
  const handleBack = () => {
    setDirection("exit");      // Set exit animation to back direction (L→R)
    setAnimating(true);
    window.history.pushState({}, '', `/`);
    setTimeout(() => {
      setActiveChat(false);    // Unmount ChatArea only after exit animation finishes
      setCurrent("Home");
      setPrev("Chat");
      setAnimating(false);
    }, 30);                   // 300ms matches animation duration
  };
  const handleJoin = async (data) => {
    setLoading(true);

    if (data.contactType === "channel") {


      const res = await joinChanelByInvite(data._id);

      if (res.status === 200) {
        const contactWithOtherMembers = () => {
          const contact = res.data.contact;
          const contactOtherMembers = contact.members.filter(
            member => member._id._id !== res.data.user._id
          );
          return {
            ...contact,
            otherMember: contactOtherMembers, // Array of others
            lastMessage: contact.lastMessage
          };
        }
        setLoading(false);
        setIsJoinPopUpOpen(false);
        setJoinPopUpData(null);
        const contact = contactWithOtherMembers();
        window.history.pushState({}, '', `/#${contact._id}`);
        // UpdateSelecetdChat(contact)
        setSelectedChat(contact);
        setActiveChat(true)

      } else if (res.status === 202) {
        setLoading(false);
        window.history.pushState({}, '', `/`);
        setIsJoinPopUpOpen(false);
        setJoinPopUpData(null);
        toast.success(res.data.message)
      } else {
        setLoading(false);
        window.history.pushState({}, '', `/`);
        setIsJoinPopUpOpen(false);
        setJoinPopUpData(null);
        toast.error(res.response.data.message)
      }



      // setIsJoinPopUpOpen(false);
      // setJoinPopUpData(null);
    }
  }
  const contactInputRef = useRef(null);
  const focusScreenList = ["Contact", "Serch",];
  return (

    <div
      className="h-screen w-full flex overflow-hidden bg-gradient-to-br from-[#8faab9] via-[#a3c2ce] to-[#8faab9]">

      {/* Sidebar/card for navbar/screens */}
      <Card
        className={`h-full w-full md:min-w-[25rem] sm:w-[25rem] relative overflow-hidden shadow-2xl shadow-blue-gray-900/5 p-0
        ${activeChat && isSmMd ? "hidden" : "block"}`}
      >
        {prev && animating && (
          <motion.div key={prev} custom={direction} variants={variants} initial="initial" animate="exit" className="absolute w-full h-full">
            {getScreen(prev)}
          </motion.div>
        )}

        <motion.div key={current} custom={direction} variants={variants} initial={initialLoad.current ? "fadeInitial" : "initial"} animate={initialLoad.current ? "fadeAnimate" : "animate"}
          onAnimationComplete={() => {
            if (focusScreenList.includes(current) && contactInputRef.current) {
              contactInputRef.current.focus();
            }
          }} className="absolute w-full h-full">
          {focusScreenList.includes(current)
            ? React.createElement(screens[current], {
              Choose: handleInputPress,
              inputRef: contactInputRef,
            })
            : getScreen(current)}
        </motion.div>
      </Card>

      {/* Chat Area */}


      <div className={`h-full flex-1 max-h-screen overflow-y-auto`} style={{
        backgroundColor: "#8faab9",
        backgroundImage: `url('${bg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minWidth: activeChat ? "300px" : undefined
      }}>
        {isSmMd ? (
          <AnimatePresence initial={false} custom={direction}>
            {activeChat && (
              <motion.div
                key="chat"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute w-full h-full"
                style={{ willChange: "transform", zIndex: 50 }}
              >
                <ChatArea
                  choose={handleInputPress}
                  isChatSelected={isChatSelected}
                  chat={selectedChat}
                  contactData={selectedChat}
                  autoChatSendData={autoSendChat}
                  forwardMessagesData={forwardMessagesData}
                  setForwardMessagesData={setForwardMessagesData}
                  isNavbarHidden={activeChat && isSmMd}
                  resetAutoSentChat={(data) => {
                    setAutoSendChat("")


                  }}
                  back={() => {
                    setDirection("back");
                    window.history.pushState({}, '', `/`);
                    setActiveChat(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <ChatArea isChatSelected={isChatSelected} chat={selectedChat} contactData={selectedChat} back={handleBackFromChat} choose={handleInputPress} autoChatSendData={autoSendChat} forwardMessagesData={forwardMessagesData} setForwardMessagesData={setForwardMessagesData} isNavbarHidden={activeChat && isSmMd} resetAutoSentChat={(data) => {

            setAutoSendChat("")
          }} />
        )}
      </div>
      {(joinPopUpData !== null && isJoinPopUpOpen === true) && (
        <JoinPopUp isOpen={isJoinPopUpOpen} onClose={() => {
          setIsJoinPopUpOpen(false)
          window.history.pushState({}, '', `/`);
        }} profilePicture={joinPopUpData?.details?.profile} contactData={joinPopUpData} loading={loading} setLoading={(data) => setLoading(data)} onJoin={(data) => handleJoin(data)} />
      )}

    </div>)


}

export default AuthenticatedUser;
