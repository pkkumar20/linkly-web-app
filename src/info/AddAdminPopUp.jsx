import { useEffect, useState,useContext } from "react";
import UserAvatar2 from "../UserAvatar2";
import toast from "react-hot-toast";
import {
    Typography,
    List,
    ListItem,
    ListItemPrefix,
} from "@material-tailwind/react";
import UserAvatar from "../UserAvatar"
import { AuthContext } from "../firebase hooks/AuthContext";
import { IoMdClose } from "react-icons/io";
import Lottie from 'lottie-react';
import myAnimation from "../lottie/404 errornotfound.json"
export default function AddAdminsPopUp({ onShare, isOpen, onClose, onSendInviteLink,chat }) {
    if (!isOpen) return null;
    const { contacts, backendUser } = useContext(AuthContext);
     const [userContacts, setUserContacts] = useState([])
  const [shortedContacts, setShortedContacts] = useState([])
  
  
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
      useEffect(() => {
        if (contacts.length !== 0 && backendUser != null) {
          // Suppose `contacts` is the array received from the backend
          const processedContacts = contacts.filter(contact => contact.isGroup === false).map(contact => {
            const otherMembers = contact.members.filter(
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
    },[userContacts])

  const getContactDisplayName = (member) => {
    if (!member) return "";
    if (member.nickName) {
      return member.nickLastName
        ? member.nickName + " " + member.nickLastName
        : member.nickName;
    }
    const otherPerson = member.otherMember?.[0]?._id;
    if (otherPerson) {
      return otherPerson.lastName
        ? otherPerson.name + " " + otherPerson.lastName
        : (otherPerson.name || "");
    }
    return member.name || "";
  };

  const filterContacts2 = (keyWord) => {
    if (!keyWord) return shortedContacts;
    return shortedContacts.filter(member => {
      const displayName = getContactDisplayName(member);
      return displayName.toLowerCase().includes(keyWord.toLowerCase());
    });
  };

  const handleSerch = (value) => {
    setSearch(value);
    if (value.trim().length < 1) {
      setIsSearching(false);
      setFiltered([]);
    } else {
      let fliter = filterContacts2(value);
      fliter.sort((a, b) => {
        const nameA = getContactDisplayName(a);
        const nameB = getContactDisplayName(b);
        return nameA.localeCompare(nameB);
      });
      setFiltered(fliter);
      setIsSearching(true);
    }
  };
  
    const formatName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
    function formatLastSeen(isoDate) {
        const lastSeenDate = new Date(isoDate);
        const now = new Date();

        const diffMs = now - lastSeenDate; // difference in milliseconds
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        const zeroPad = (num) => num.toString().padStart(2, "0");

        const formatTime = (date) => `${zeroPad(date.getHours())}:${zeroPad(date.getMinutes())}`;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Helper to check if two dates are same day
        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        // Helper to check if d1 is yesterday of d2
        const isYesterday = (d1, d2) => {
            const yesterday = new Date(d2);
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(d1, yesterday);
        };

        if (diffSeconds < 5) {
            return "last seen just now";
        } else if (diffMinutes < 1) {
            return `last seen ${diffSeconds} seconds ago`;
        } else if (diffMinutes < 60) {
            return `last seen ${diffMinutes} minutes ago`;
        } else if (isSameDay(lastSeenDate, now)) {
            return `last seen today at ${formatTime(lastSeenDate)}`;
        } else if (isYesterday(lastSeenDate, now)) {
            return `last seen yesterday at ${formatTime(lastSeenDate)}`;
        } else if (diffHours < 24 * 7) { // within last week
            return `last seen on ${daysOfWeek[lastSeenDate.getDay()]} at ${formatTime(lastSeenDate)}`;
        } else {
            // format date DD/MM/YYYY
            const d = lastSeenDate.getDate();
            const m = lastSeenDate.getMonth() + 1;
            const y = lastSeenDate.getFullYear();
            return `last seen on ${zeroPad(d)}/${zeroPad(m)}/${y} at ${formatTime(lastSeenDate)}`;
        }
    }
    return (
        <div className=" select-none fixed inset-0 z-50 flex items-center  justify-center bg-black bg-opacity-40 p-2">
            <div className="relative min-h-60 bg-white rounded-2xl p-4 w-[350px] max-w-full">
                <div className="flex items-center  mb-6">
                    <IoMdClose size={27} onClick={onClose} className="  cursor-pointer text-gray-700 hover:text-gray-600"/>
            <input type="text" className="border-none text-lg caret-[1px] focus:caret-gray-600  focus:outline-none px-2 " placeholder="Search..." value={search} onChange={(e) => handleSerch(e.target.value)} />
                </div>
                <div id="scrollable-content" className="scrollbar-telegram overflow-y-auto ">
                    {(contacts != null && contacts != 'undefined' && contacts.length > 0&& isSearching===false) && (
                         <List>
                       
                                     {shortedContacts.map((user) => 
                                       user.contactType == "person"&&(
                                         <ListItem
                                 
                       
                                                 onClick={() => {
                                                     onShare(chat._id, user.otherMember[0]._id._id)
                                             onClose();
                                            //  window.history.pushState({}, '', `/#${user._id}`);
                                            //  setSelectedChat({ _id: user._id });
                                            //  goToChatArea(user)
                                            //  rstUnread(user._id, user.otherMember[0]._id._id)
                                           }}
                                           key={user._id}
                                           className={`flex justify-between items-center
                          
                         `}
                                         >
                                           {/* Left side - Icon + Text */}
                       
                                           <div className="flex items-center gap-3">
                                             <ListItemPrefix>
                                               <UserAvatar    {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'image' && {
                                                 image: user.otherMember[0]._id.profile.imageUrl,
                                               })}
                                                 {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'emoji' && {
                                                   emoji: user.otherMember[0]._id.profile
                                                     .emoji,
                                                   simpleBg: user.otherMember[0]._id.profile
                                                     .bgColor,
                                                   emojiSize: "text-3xl"
                                                 })}
                                                 {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'initials' && {
                                                   simpleBg: user.otherMember[0]._id.profile
                                                     .bgColor,
                                                             text: user.otherMember[0]._id.profile.initials
                       
                                                 })} />
                                             </ListItemPrefix>
                       
                                             <div className="flex flex-col">
                                               {/* Name */}
                                               <Typography className={`font-semibold text-lg`}>
                                                             {user.otherMember[0]._id.name ? (user.otherMember[0]._id.lastName ? (formatName(user.otherMember[0]._id.name) + " " + formatName(user.otherMember[0]._id.lastName)) : (formatName(user.otherMember[0]._id.name))):(null)}
                                               </Typography>
                       
                                               <Typography
                                                 variant="small"
                                                 
                                                 className={`text-sm  font-medium max-w-[180px] truncate text-gray-700`}
                                               >
                                                             {user.contactType == "person" && (user.otherMember[0]._id.isOnline ? "Online" : formatLastSeen(user.otherMember[0]._id.lastSeen))} 
                                               </Typography>
                       
                                             </div>
                                           </div>
                       
                                           {/* Right side - Time + Unread bubble */}
                                        
                                         </ListItem>
                                       ) 
                                             
                                    
                       
                                     )}
                                   </List> 
            )}
            {isSearching === true && (
              <>
              <List>

                {filtered.map((user) =>
                  user.contactType == "person" && (
                    <ListItem


                      onClick={() => {
                        onShare(chat._id, user.otherMember[0]._id._id)
                        onClose();
                        //  window.history.pushState({}, '', `/#${user._id}`);
                        //  setSelectedChat({ _id: user._id });
                        //  goToChatArea(user)
                        //  rstUnread(user._id, user.otherMember[0]._id._id)
                      }}
                      key={user._id}
                      className={`flex justify-between items-center
                          
                         `}
                    >
                      {/* Left side - Icon + Text */}

                      <div className="flex items-center gap-3">
                        <ListItemPrefix>
                          <UserAvatar    {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'image' && {
                            image: user.otherMember[0]._id.profile.imageUrl,
                          })}
                            {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'emoji' && {
                              emoji: user.otherMember[0]._id.profile
                                .emoji,
                              simpleBg: user.otherMember[0]._id.profile
                                .bgColor,
                              emojiSize: "text-3xl"
                            })}
                            {...(user.otherMember[0]._id !== null && user.otherMember[0]._id.profile.type === 'initials' && {
                              simpleBg: user.otherMember[0]._id.profile
                                .bgColor,
                              text: user.otherMember[0]._id.profile.initials

                            })} />
                        </ListItemPrefix>

                        <div className="flex flex-col">
                          {/* Name */}
                          <Typography className={`font-semibold text-lg`}>
                            {user.otherMember[0]._id.name ? (user.otherMember[0]._id.lastName ? (formatName(user.otherMember[0]._id.name) + " " + formatName(user.otherMember[0]._id.lastName)) : (formatName(user.otherMember[0]._id.name))) : (null)}
                          </Typography>

                          <Typography
                            variant="small"

                            className={`text-sm  font-medium max-w-[180px] truncate text-gray-700`}
                          >
                            {user.contactType == "person" && (user.otherMember[0]._id.isOnline ? "Online" : formatLastSeen(user.otherMember[0]._id.lastSeen))}
                          </Typography>

                        </div>
                      </div>

                      {/* Right side - Time + Unread bubble */}

                    </ListItem>
                  )



                  )}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center  h-full">
                      <Lottie animationData={myAnimation} loop={true} style={{ height: 110, width: 110 }} />
                      <div className="flex flex-col items-center">
                        {/* Name */}
                        <Typography className="font-medium text-lg text-center">
                          No Result
                        </Typography>

                        {/* Message preview with ellipsis */}
                        <Typography
                          variant="small"
                          color="gray"
                          className="text-sm max-w-[180px]  text-center font-normal"
                        >
                          There were no result for "{search}".
                        </Typography>
                        <Typography
                          variant="small"
                          color="gray"
                          className="text-sm max-w-[180px] truncate text-center font-normal"
                        >
                          Try a new search.
                        </Typography>
                      </div>
                    </div>




                  )}
              </List> 
              </>
            )}
                </div>
            </div>

        </div>
    );
}
