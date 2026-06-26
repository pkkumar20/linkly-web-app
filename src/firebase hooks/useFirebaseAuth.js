// src/hooks/useFirebaseAuth.js - ✅ FIXED: Creates chat even when contactId NOT in recentChats
import { useEffect, useState, useCallback, useReducer, useRef, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import { set } from "date-fns";

function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [currentChatData, setCurrentChatData] = useState([]);
  const [newMessege, setNewMessege] = useState(null);
  const [messeges, setMesseges] = useState([]);
  const [backendUser, setBackendUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [notifiaction, setNotifiaction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isEror, setIsError] = useState(false);
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const [isNoInternet, setIsNoInternet] = useState(!navigator.onLine);
  const [isServerError, setIsServerError] = useState(false);
  const [selctedContact, setSelectedContact] = useState(null);
  // ✅ FIXED REDUCER: Proper chat creation + move to top logic
  const serverUrl = import.meta.env.VITE_SERVER_URL;


  const recentChatsReducer = (state, action) => {
    switch (action.type) {
      case "SET_ALL":
        return action.payload;

      case "ADD_UPDATE_MESSAGE":
        // ✅ chatId is STRING - NO .id needed
        let chatFound = false;
        const updatedChats = state.map((chat) => {
          if (
            chat.forContact?.toString() === action.chatId.toString() ||
            chat._id?.toString() === action.chatId.toString()
          ) {
            chatFound = true;
            const updatedChat = { ...chat };

            if (!updatedChat.messages) updatedChat.messages = [];
            const msgExists = updatedChat.messages.some(
              (m) => m._id === action.msg._id,
            );
            if (!msgExists) {
              updatedChat.messages = [...updatedChat.messages, action.msg];
            } else {
              // ✅ Update existing message only
              updatedChat.messages = updatedChat.messages.map((m) =>
                m._id.toString() === action.msg._id.toString() ? action.msg : m,
              );
            }
            return updatedChat;
          }
          return chat;
        });

        // ✅ FIXED: If chat NOT found, CREATE NEW with PROPER chatId
        if (!chatFound) {
          const newChat = {
            // ✅ Use chatId directly
            forContact: action.chatId, // ✅ Use chatId directly
            messages: [action.msg],
          };
          return [newChat, ...updatedChats]; // ✅ Add to TOP
        }
        return updatedChats;

      // ✅ Sort NEWEST first (DESCENDING)
      // return updatedChats.sort(
      //   (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt), // ✅ b - a = NEWEST first
      // );

      case "CREATE_NEW":
        const newChat = {
          forContact: action.chatId,

          messages: [action.msg],
        };
        return [
          newChat,
          ...state.filter(
            (chat) =>
              chat.forContact?.toString() !== action.chatId.toString() &&
              chat._id?.toString() !== action.chatId.toString(),
          ),
        ];
      // ✅ NEW REDUCER CASE for messageUpdated
      case "UPDATE_MESSAGES_BY_CHAT":
        const chatId = action.chatId;
        let chatUpdated = false;

        const updatedMessages = state.map((chat) => {
          if (
            chat.forContact?.toString() === chatId.toString() ||
            chat._id?.toString() === chatId.toString()
          ) {
            chatUpdated = true;
            // ✅ Replace ALL messages with new data from server
            return {
              ...chat,
              messages: action.messages, // ✅ Complete message list from server
            };
          }
          return chat;
        });

        // If chat not found, create new one with complete messages
        if (!chatUpdated) {
          return [
            {
              forContact: chatId,
              messages: action.messages,
            },
            ...updatedMessages,
          ];
        }
        return updatedMessages;
      // Move updated chat to top
      // return updatedMessages.sort(
      //   (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
      // );

      case "DELETE_MESSAGE":
        return state.map((chat) => {
          if (
            chat.forContact?.toString() === action.chatId.toString() ||
            chat._id?.toString() === action.chatId.toString()
          ) {
            return {
              ...chat,
              messages: chat.messages ? chat.messages.filter((m) => m._id !== action.msgId) : [],
            };
          }
          return chat;
        });

      case "DELETE_MULTIPLE_MESSAGES":
        return state.map((chat) => {
          if (
            chat.forContact?.toString() === action.chatId.toString() ||
            chat._id?.toString() === action.chatId.toString()
          ) {
            return {
              ...chat,
              messages: chat.messages ? chat.messages.filter((m) => !action.msgIds.includes(m._id)) : [],
            };
          }
          return chat;
        });

      case "RESET":
        return [];
      default:
        return state;
    }
  };

  const [recentChats, dispatchRecentChats] = useReducer(recentChatsReducer, []);

  const auth = getAuth();

  // ✅ Safe socket connection
  async function connectSocket() {


    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const token = await user.getIdToken();
    return io(serverUrl, {
      auth: { token, user },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });
  }

  // ✅ Refetch recent chats - DIRECT DISPATCH
  const refetchRecentChats = useCallback(async () => {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${serverUrl}/recentChats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        const serverChats = res.data.chats || [];
        dispatchRecentChats({ type: "SET_ALL", payload: serverChats });
      }
    } catch (error) {
      console.error("refetchRecentChats error:", error);
    }
  }, []);

  // Track pending→real ID mappings so we can detect duplicates regardless of event ordering
  const pendingToRealMap = useRef({});
  const realToPendingMap = useRef({});

  // ✅ FIXED handleMessageCreted - ALWAYS creates chat if missing
  const handleMessageCreted = useCallback((msg, chatId) => {

    dispatchRecentChats({
      type: "ADD_UPDATE_MESSAGE",
      chatId: chatId.id,
      msg,
    });

    setCurrentChatData((prev) => {
      // Check _id, _realId, AND the ref-based mapping to catch all duplicate cases
      const matchingPendingId = realToPendingMap.current[msg._id];
      const exists = prev.some((m) =>
        m._id === msg._id ||
        m._realId === msg._id ||
        (matchingPendingId && m._id === matchingPendingId)
      );
      if (exists) return prev;

      // Also check: is there a pending message for the same forContact?
      // This catches the case where socket arrives before HTTP response
      // (so the ref mappings are empty but we can match by forContact + _isPending)
      const hasPendingForSameContact = prev.some((m) =>
        m._isPending &&
        m.forContact?.toString() === msg.forContact?.toString()
      );
      if (hasPendingForSameContact) {
        // Socket arrived first — store the mapping so setCCd can find it later
        // and replace the pending message with this real one
        const pendingMsg = prev.find((m) =>
          m._isPending && m.forContact?.toString() === msg.forContact?.toString()
        );
        if (pendingMsg) {
          realToPendingMap.current[msg._id] = pendingMsg._id;
          pendingToRealMap.current[pendingMsg._id] = msg._id;
        }
        // Replace the pending message in-place — keep the pending _id so React key never changes
        return prev.map((m) =>
          m._isPending && m.forContact?.toString() === msg.forContact?.toString()
            ? { ...msg, _id: pendingMsg._id, _realId: msg._id, _isPending: false }
            : m
        );
      }

      return [...prev, msg].sort(
        (a, b) => new Date(a.time) - new Date(b.time),
      );
    });

  }, []); // Add deps
  // ✅ Removed dependency - reducer handles state internally
  // --- EFFECT 1: AUTH STATE & PROFILE FETCH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Trigger profile fetch which sets backendUser
        const res = await getorsetProfile();


        setIsProfileVerified(res);
      } else {
        setBackendUser(null);
        setContacts([]);
        setNotifiaction([]);
        setCurrentChatData([]);
        dispatchRecentChats({ type: "RESET" });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  // --- EFFECT 2: SOCKET CONNECTION (DEPENDS ON BACKEND USER) ---
  useEffect(() => {
    let currentSocket = null;

    if (user && isProfileVerified == true) {
      const initSocket = async () => {
        try {
          currentSocket = await connectSocket();
          if (!currentSocket) return;

          setSocket(currentSocket);

          currentSocket.on("connect", () => {

            refetchRecentChats();
          });

          currentSocket.on("receiveMessage", handleMessageCreted);
          currentSocket.on("messageCreted", (data, chatId) => {

            handleMessageCreted(data, chatId);
          });

          currentSocket.on("messageUp", (message, id) => {

            dispatchRecentChats({
              type: "ADD_UPDATE_MESSAGE",
              chatId: id.id,
              msg: message,
            });
            setCurrentChatData((prev) => {
              const msgId = message._id?.toString?.() || String(message._id);
              let found = false;
              const result = prev.map((m) => {
                const mId = m._id?.toString?.() || String(m._id);
                const mRealId = m._realId?.toString?.() || "";
                if (mId === msgId) {
                  found = true;
                  return message;
                }
                if (mRealId && mRealId === msgId) {
                  found = true;
                  return { ...message, _id: m._id, _realId: m._realId };
                }
                return m;
              });

              if (!found) {
                // Message not in current list — check if it belongs to the current chat
                const currentContactId =
                  prev[0]?.forContact?._id?.toString?.() ||
                  prev[0]?.forContact?.toString?.() ||
                  null;
                const msgContactId =
                  message.forContact?._id?.toString?.() ||
                  message.forContact?.toString?.() ||
                  null;

                // If the chat list is empty OR the message belongs to the current chat, append it
                if (!currentContactId || !msgContactId || currentContactId === msgContactId) {

                  return [...prev, message].sort((a, b) => new Date(a.time) - new Date(b.time));
                } else {

                }
              }

              return result;
            });
          });


          currentSocket.on("messageUpdated", (data, id) => {

            dispatchRecentChats({
              type: "UPDATE_MESSAGES_BY_CHAT",
              chatId: id.id,
              messages: data,
            });
            setCurrentChatData((prev) => {
              // Only replace if this event is for the currently viewed chat
              const currentContactId = prev[0]?.forContact?._id?.toString?.() || prev[0]?.forContact?.toString?.() || prev[0]?.forContact;
              const eventContactId = id.id?.toString?.() || id.id;
              if (currentContactId && eventContactId && currentContactId !== eventContactId) {
                return prev; // Not our chat, ignore
              }
              // Preserve any local pending messages that haven't finished sending
              const pendingMsgs = prev.filter(
                (m) => m._isPending || (String(m._id).startsWith("pending") && !m._realId)
              );
              return [...(data || []), ...pendingMsgs].sort(
                (a, b) => new Date(a.time) - new Date(b.time)
              );
            });
          });

          currentSocket.on("oneMessageUpdated", (data, id) => {

            dispatchRecentChats({
              type: "UPDATE_ONE_MESSAGE",
              chatId: id.id,
              msg: data,
            });
            // setCurrentChatData(data || []);
          });

          currentSocket.on("userStatusUpdate", (data) => {


            if (data.data) {
              setBackendUser(data.data);
              setContacts(data.data.contacts || []);
              setNotifiaction(data.data.notifiaction || []);
            }
          });

          currentSocket.on("userUpdated", (data) => {

            setBackendUser(data);
            setContacts(data.contacts || []);
            setNotifiaction(data.notifiaction || []);
            refetchRecentChats();
          });

          currentSocket.on("permissionUpdated", (data) => {
            setContacts((prev) =>
              prev.map((item) =>
                item._id === data._id ? { ...item, ...data } : item,
              ),
            );
          });

          currentSocket.on("groupCreated", (data) =>
            setContacts((prev) => [...prev, data]),
          );
          currentSocket.on("adminsUpdated", (data) => {
            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("MemberPermissionUpdated", (data) => {

            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("channelUpdated", (data) => {

            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("groupUpdated", (data) => {


            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("personUpdated", (data) => {


            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("contactUpdated", (data) => {


            setContacts((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("notificationUpdated", (data) => {

            setNotifiaction((prev) =>
              prev.map((item) =>
                item._id.toString() === data._id.toString()
                  ? { ...item, ...data }
                  : item,
              ),
            );
          });
          currentSocket.on("notificationDeleted", (data) => {

            setNotifiaction((prev) =>
              prev.filter((item) => item._id.toString() !== data.toString()),
            );
          });
          currentSocket.on("contactAdded", (data) => {


            setContacts((prev) => {
              // 1. Check if the contact already exists in the list
              const contactExists = prev.some(
                (item) => item._id.toString() === data._id.toString()
              );

              if (contactExists) {
                // 2. If it exists, update it (your original logic)
                return prev.map((item) =>
                  item._id.toString() === data._id.toString()
                    ? { ...item, ...data }
                    : item
                );
              } else {
                return [...prev, data];
              }
            });
            refetchRecentChats();
          });
          currentSocket.on("notification", (data) => {

            setNotifiaction((prev) => {
              // 1. Check if the contact already exists in the list
              const notificationExists = prev.some(
                (item) => item._id.toString() === data._id.toString()
              );

              if (notificationExists) {
                // 2. If it exists, update it (your original logic)
                return prev.map((item) =>
                  item._id.toString() === data._id.toString()
                    ? { ...item, ...data }
                    : item
                );
              } else {
                return [...prev, data];
              }
            });

          });
        } catch (err) {
          console.error("Socket Init Error:", err);
        }
      };

      initSocket();
    }

    return () => {
      if (currentSocket) {
        currentSocket.disconnect();
        setSocket(null);
      }
    };
  }, [user, isProfileVerified, refetchRecentChats, handleMessageCreted]);
  // ✅ MAIN EFFECT - DIRECT STATE ACCESS
  // useEffect(() => {
  //   let unsubscribe;
  //   let currentSocket = null;

  //   unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (currentSocket) {
  //       currentSocket.removeAllListeners();
  //       currentSocket.disconnect();
  //       currentSocket = null;
  //     }
  //       if (firebaseUser && !backendUser) {
  //         try {
  //           currentSocket = await connectSocket();
  //           setSocket(currentSocket);

  //           currentSocket.on("connect", async () => {
  //             
  //             await refetchRecentChats();
  //           });

  //           currentSocket.on("disconnect", () => {
  //             
  //           });

  //           currentSocket.on("connect_error", (err) => {
  //             console.error("Socket error:", err.message);
  //           });

  //           currentSocket.on("receiveMessage", handleMessageCreted, () => {
  //             
  //           });
  //           currentSocket.on("messageCreted", handleMessageCreted, () => {
  //             
  //           });
  //           // currentSocket.on("messageUp", handleMessageCreted);

  //           currentSocket.on("messageUp", (message, id) => {
  //             
  //             dispatchRecentChats({
  //               type: "ADD_UPDATE_MESSAGE",
  //               chatId: id.id,
  //               msg: message,
  //             });
  //             setCurrentChatData((prev) =>
  //               prev.map((item) => (item._id === message._id ? message : item)),
  //             );
  //           });

  //           currentSocket.on("userStatusUpdate", (data) => {
  //             if (data.data) {
  //               setBackendUser(data.data);
  //               setContacts(data.data.contacts || []);
  //             }
  //           });

  //           currentSocket.on("userUpdated", (data) => {
  //             setBackendUser(data);
  //             setContacts(data.contacts || []);
  //           });
  //           currentSocket.on("permissionUpdated", (data) => {
  //             
  //             
  //             setContacts((prev) =>
  //               prev.map((item) =>
  //                 item._id.toString() === data._id.toString()
  //                   ? { ...item, ...data }
  //                   : item,
  //               ),
  //             );
  //           });
  //           currentSocket.on("adminsUpdated", (data) => {
  //             
  //             setContacts((prev) =>
  //               prev.map((item) =>
  //                 item._id.toString() === data._id.toString()
  //                   ? { ...item, ...data }
  //                   : item,
  //               ),
  //             );
  //           });

  //           currentSocket.on("messageUpdated", (data, id) => {
  //             

  //             // ✅ Dispatch COMPLETE messages for this chatId
  //             dispatchRecentChats({
  //               type: "UPDATE_MESSAGES_BY_CHAT",
  //               chatId: id.id,
  //               messages: data, // ✅ Full message array from server
  //             });

  //             setCurrentChatData(data || []);
  //           });

  //           currentSocket.on("groupCreated", (data) => {
  //             

  //             setContacts((prev) => [...prev, data]);
  //           });
  //         } catch (error) {
  //           console.error("Socket failed:", error);
  //         }
  //       } else {
  //         setUser(null);
  //         setBackendUser(null);
  //         setContacts([]);
  //         setCurrentChatData([]);
  //         dispatchRecentChats({ type: "RESET" });
  //         setNewMessege(null);
  //         setMesseges([]);
  //       }

  //     setUser(firebaseUser);
  //     setLoading(false);
  //     setIsLoggingOut(false);
  //   });

  //   return () => {
  //     unsubscribe?.();
  //     if (currentSocket) {
  //       currentSocket.removeAllListeners();
  //       currentSocket.disconnect();
  //     }
  //   };
  // }, [refetchRecentChats, handleMessageCreted]);

  // ✅ handleChat - DIRECT recentChats ACCESS
  const handleChat = useCallback(
    (id) => {
      const targetChat = recentChats.find(
        (chat) =>
          chat.forContact?.toString() === id.toString() ||
          chat._id?.toString() === id.toString(),
      );

      if (targetChat?.messages) {
        setCurrentChatData(targetChat.messages);
      } else {
        setCurrentChatData([]);
      }
    },
    [recentChats],
  );

  const getorsetProfile = async () => {
    try {
      if (!auth.currentUser || !navigator.onLine) return false;
      const token = await auth.currentUser.getIdToken();
      const res = await axios.get(`${serverUrl}/isProfileSeted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 && res.data.profileSet === true) {
        setBackendUser(res.data.user);
        setContacts(res.data.user.contacts || []);
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      } else if (res.status === 200 && res.data.profileSet === false) {
        setBackendUser(res.data.user);
        setNotifiaction(res.data.user.notifiaction || []);
      }
      setIsNoInternet(false);
      setIsServerError(false);
      return res.data.profileSet;
    } catch (error) {
      if (navigator.onLine === false) {
        setIsNoInternet(true);
        setIsServerError(false);
      } else {
        setIsServerError(true);
        setIsNoInternet(false);
      }
      return false;
    }
  };

  // Connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsNoInternet(false);
      if (auth.currentUser) {
        getorsetProfile().then((res) => {
          setIsProfileVerified(res);
        });
      }
    };
    const handleOffline = () => {
      setIsNoInternet(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setIsNoInternet(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [auth.currentUser]);

  const newUserSetProfile = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/profile`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setBackendUser(res.data.user);
        setNotifiaction(res.data.user.notifiaction || []);

        setIsProfileVerified(res.data.user.isProfileVerified);

        setContacts(res.data.user.contacts || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/profile/update`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setBackendUser(res.data.user);
        setContacts(res.data.user.contacts || []);
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      throw error;
    }
  };

  const sendTextMessage = async (contactId, content) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-text`,
        { contactId, content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const sendLocationMessage = async (contactId, location) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-location`,
        { contactId, location },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const sendQrImage = async (contactIds, text, image) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-qr-image`,
        { contactIds, text, image },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendContactMessage = async (contactId, contactDetails) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-contact`,
        { contactId, ...contactDetails },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  // Keep old names as aliases for backward compat during transition
  const sendMessage = async (message, id, replyingToId = null) => {
    // person 1v1 — we now need the contactId, not the receiver userId
    // This is handled from ChatArea directly via sendTextMessage
    return null;
  };
  const sendMessageInGroup = async (message, contactId, replyingToId = null) => {
    return sendTextMessage(contactId, message);
  };
  const sendMessageInChannel = async (message, contactId, replyingToId = null) => {
    return sendTextMessage(contactId, message);
  };

  const addContact = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/addContact`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setBackendUser(res.data.user);
        setContacts(res.data.user.contacts || []);
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      return error;
    }
  };
  const getUserDetailsForContact = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/getdetails`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res;
    } catch (error) {
      return error;
    }
  };

  const addContactById = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/addContactById`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setBackendUser(res.data.user);
        setContacts(res.data.user.contacts || []);
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      return error;
    }
  };

  const addInGroupById = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/addInGroupById`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200 || res.status === 201) {
        setBackendUser(res.data.user);
        setContacts(res.data.user.contacts || []);
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      return error;
    }
  };

  const addManyUserInGroupById = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/addManyInGroupById`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200 || res.status === 201) {
        setBackendUser(res.data.user);
        setContacts((prev) =>
          prev.map((contact) =>
            contact._id?.toString() === res.data.contact?._id?.toString()
              ? res.data.contact
              : contact,
          ),
        );
        setNotifiaction(res.data.user.notifiaction || []);
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      return error;
    }
  };

  const get1v1messages = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/user/getChats`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) setCurrentChatData(res.data.data || []);
      return res;
    } catch (error) {
      return error;
    }
  };

  const getGroupMessages = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/user/getChatsGroup`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) setCurrentChatData(res.data.data || []);
      return res;
    } catch (error) {
      return error;
    }
  };

  const loadOlderMessages = async (contactId, skip, limit = 50) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(
        `${serverUrl}/chat/${contactId}?skip=${skip}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200 && res.data.success) {
        const olderMessages = res.data.messages || [];
        if (olderMessages.length > 0) {
          setCurrentChatData((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newMsgs = olderMessages.filter((m) => !existingIds.has(m._id));
            const updatedMsgs = [...newMsgs, ...prev].sort(
              (a, b) => new Date(a.time) - new Date(b.time)
            );

            // ✅ Dispatch to recentChats so older messages are cached
            dispatchRecentChats({
              type: "UPDATE_MESSAGES_BY_CHAT",
              chatId: contactId,
              messages: updatedMsgs,
            });

            return updatedMsgs;
          });
        }
        return { messages: olderMessages, hasMore: res.data.hasMore };
      }
      return { messages: [], hasMore: false };
    } catch (error) {
      console.error("loadOlderMessages error:", error);
      return { messages: [], hasMore: false };
    }
  };
  const createGroup = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/createGroup`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) => [...prev, res.data.data]);
      }
      return res;
    } catch (error) {
      return error;
    }
  };
  const updateGroupInfo = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/updateGroupInfo`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        toast.success("Updated Sucessfully");
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const updateGroupPermissions = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/changepermissions`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const dismissAdmin = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/dismissAdmin`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const addAdmin = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/group/addAdmin`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const blockUser = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/blockUser`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const blockPerson = async (contactId, blockedUserId) => {
    try {
      const token = await auth.currentUser?.getIdToken();



      const res = await axios.post(
        `${serverUrl}/person/block`,
        { contactId, blockedUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );


      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const unBlockPerson = async (contactId, userId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/person/unblock`,
        { contactId, userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const deletePerson = async (contactId, alsoDeleteForOther) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/person/delete`,
        { contactId, alsoDeleteForOther },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) => prev.filter((item) => item._id.toString() !== contactId.toString()));
      }
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const unBlockUser = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/unblockUser`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const removeUser = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/removeUser`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const leaveGroup = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/leaveGroup`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const deleteAndLeaveGroup = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/deleteGroup`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        toast.success("Deleted Sucessfully");
        const groupId = fd.get("groupId");
        setContacts((prev) =>
          prev.filter((item) => item._id.toString() !== groupId.toString())
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      toast.error("Somthing went wrong");
      return error;
    }
  };
  const leaveChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/leave-channel`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        toast.success("Left Channel successfully");
        setContacts((prev) =>
          prev.filter((item) => item._id.toString() !== res.data.channel._id.toString())
        );
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
      return error;
    }
  };
  const getLeftOwnedGroups = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`${serverUrl}/group/left-owned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const joinGroupAgain = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/group/join-again`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const joinedGroup = res.data.contact;
        setContacts((prev) => {
          if (prev.some((item) => item._id.toString() === joinedGroup._id.toString())) {
            return prev;
          }
          return [...prev, joinedGroup];
        });
      }
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const getLeftOwnedChannels = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`${serverUrl}/chanel/left-owned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const joinChannelAgain = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(`${serverUrl}/chanel/join-again`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const joinedChannel = res.data.contact;
        setContacts((prev) => {
          if (prev.some((item) => item._id.toString() === joinedChannel._id.toString())) {
            return prev;
          }
          return [...prev, joinedChannel];
        });
      }
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const updateGroupMembersPermissions = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/group/updatePermissions`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.data._id.toString()
              ? { ...item, ...res.data.data }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const getGroupDetailById = async (id) => {
    try {
      const res = await axios.get(`${serverUrl}/group/${id}`);

      if (res.status === 200) {
        return res;
      }
    } catch (error) {
      console.log(err);
    }
  };
  const getUserDetailByUserName = async (id) => {
    try {
      const res = await axios.get(`${serverUrl}/profile/${id}`);

      if (res.status === 200) {
        return res;
      }
    } catch (error) {
      console.log(err);
    }
  };
  const setCCd = (msg) => {
    setCurrentChatData((prev) => {
      if (typeof msg === "function") {
        return msg(prev);
      }
      if (msg._replaced) {
        const pendingId = msg._replaced;
        const { _replaced, ...cleanMsg } = msg;

        // Store the mapping for future socket events
        pendingToRealMap.current[pendingId] = cleanMsg._id;
        realToPendingMap.current[cleanMsg._id] = pendingId;

        // Case A: Socket already delivered the real message before HTTP response
        const realAlreadyExists = prev.some((m) => m._id === cleanMsg._id);
        if (realAlreadyExists) {
          // Just remove the pending message, real one is already there
          return prev.filter((m) => m._id !== pendingId);
        }

        // Case B: HTTP arrived first — update pending in-place
        const hasPending = prev.some((m) => m._id === pendingId);
        if (hasPending) {
          return prev.map((m) =>
            m._id === pendingId
              ? { ...cleanMsg, _id: pendingId, _realId: cleanMsg._id, _isPending: false }
              : m
          );
        }

        // Pending was already removed somehow, just add the real message
        const exists2 = prev.some((m) => m._id === cleanMsg._id);
        if (!exists2) {
          return [...prev, cleanMsg].sort(
            (a, b) => new Date(a.time) - new Date(b.time),
          );
        }
        return prev;
      }

      // Normal message (from socket or direct)
      // Check: is this the real version of a pending message we already have?
      const matchingPendingId = realToPendingMap.current[msg._id];
      const exists = prev.some((m) =>
        m._id === msg._id ||
        m._realId === msg._id ||
        (matchingPendingId && m._id === matchingPendingId)
      );
      if (!exists) {
        return [...prev, msg].sort(
          (a, b) => new Date(a.time) - new Date(b.time),
        );
      }
      return prev;
    });
  };

  const addIdToSeenBy = useCallback(
    (chatId, userId) => {
      socket?.emit("addIdToSeenBy", { chatId, userId });
    },
    [socket],
  );

  const rstUnread = useCallback(
    (cntId, memberId) => {
      socket?.emit("removeUnread", { cntId, memberId });
    },
    [socket],
  );
  const markAllAsRead = useCallback(
    (cntId, memberId) => {
      socket?.emit("markAllAsRead", { cntId, memberId });
    },
    [socket],
  );

  const deleteMsg = async (msg) => {
    console.log(msg)
    const resolvedId = msg._realId || msg._id;
    const contactId = msg.forContact;

    // 1. Optimistically remove from currentChatData
    setCurrentChatData((prev) => prev.filter((m) => m._id !== msg._id));

    // 2. Optimistically remove from recentChats
    dispatchRecentChats({
      type: "DELETE_MESSAGE",
      chatId: contactId,
      msgId: msg._id,
    })
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete`,
        { chatId: resolvedId, contactId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res || (res.status !== 200 && res.status !== 204)) {
        console.log(res)
        // Restore in currentChatData
        setCurrentChatData((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg].sort((a, b) => new Date(a.time) - new Date(b.time));
        });
        // Restore in recentChats
        dispatchRecentChats({
          type: "ADD_UPDATE_MESSAGE",
          chatId: contactId,
          msg,
        });
        toast.error("Failed to delete message");
      }
      return res;
    } catch (error) {
      console.log(error);
      // Restore in currentChatData
      setCurrentChatData((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg].sort((a, b) => new Date(a.time) - new Date(b.time));
      });
      // Restore in recentChats
      dispatchRecentChats({
        type: "ADD_UPDATE_MESSAGE",
        chatId: contactId,
        msg,
      });
      toast.error("Failed to delete message");
      return error;
    }
  };

  const deleteMultipleMessages = async (messages, contactId) => {
    const chatIds = messages.map((m) => m._realId || m._id);
    const messageIds = messages.map((m) => m._id);

    // 1. Optimistically remove from currentChatData
    setCurrentChatData((prev) => prev.filter((m) => !messageIds.includes(m._id)));

    // 2. Optimistically remove from recentChats
    dispatchRecentChats({
      type: "DELETE_MULTIPLE_MESSAGES",
      chatId: contactId,
      msgIds: messageIds,
    });

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete-multiple`,
        { chatIds, contactId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res || (res.status !== 200 && res.status !== 204)) {
        // Restore in currentChatData
        setCurrentChatData((prev) => {
          const next = [...prev];
          messages.forEach((msg) => {
            if (!next.some((m) => m._id === msg._id)) next.push(msg);
          });
          return next.sort((a, b) => new Date(a.time) - new Date(b.time));
        });
        // Restore in recentChats
        messages.forEach((msg) => {
          dispatchRecentChats({
            type: "ADD_UPDATE_MESSAGE",
            chatId: contactId,
            msg,
          });
        });
        toast.error("Failed to delete messages");
      }
      return res;
    } catch (error) {
      console.log(error);
      // Restore in currentChatData
      setCurrentChatData((prev) => {
        const next = [...prev];
        messages.forEach((msg) => {
          if (!next.some((m) => m._id === msg._id)) next.push(msg);
        });
        return next.sort((a, b) => new Date(a.time) - new Date(b.time));
      });
      // Restore in recentChats
      messages.forEach((msg) => {
        dispatchRecentChats({
          type: "ADD_UPDATE_MESSAGE",
          chatId: contactId,
          msg,
        });
      });
      toast.error("Failed to delete messages");
      return error;
    }
  };
  const deleteOneFile = async (messageId, contactId, fileId, type) => {
    // 
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete-one`,
        { messageId, contactId, fileId, type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const toggleReaction = async (chatId, contactId, reaction) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/reaction`,
        { chatId, contactId, reaction },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const createChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/create`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) => [...prev, res.data.data]);
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const addMemberInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/add-member`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.contact._id.toString()
              ? { ...item, ...res.data.contact }
              : item,
          ),
        );
        await refetchRecentChats();
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const typeUpdateinChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/change-type`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
        await refetchRecentChats();
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const profileUpdateinChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/update-channel`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const addAdminInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/add-admin`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const removeAdminInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/remove-admin`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const blockUserInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/block-user`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const unBlockUserInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/unblock-user`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {

        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const removeUserInChanel = async (fd) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/remove-user`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 200) {
        c
        setContacts((prev) =>
          prev.map((item) =>
            item._id.toString() === res.data.channel._id.toString()
              ? { ...item, ...res.data.channel }
              : item,
          ),
        );
      }

      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const sendImagesInChanel = async (fd, config) => {
    try {
      if (!auth.currentUser) return;
      const idToken = await auth.currentUser.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/send-images`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
          ...config,
        },
      );
      return res;
    } catch (error) {
      console.log(error);
    }
  };

  const sendReply = async (fd, config) => {
    try {
      if (!auth.currentUser) return;
      const idToken = await auth.currentUser.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/reply`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
          ...config,
        },
      );
      return res;
    } catch (error) {
      console.log(error);
    }
  };
  const sendVideosInChanel = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/send-videos`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      if (res.status === 200) {

        return res;
      }
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendDocumentsInChanel = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chanel/send-documents`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      if (res.status === 200) {

        return res;
      }
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendImagesInChat = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-images`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendBulkQrImage = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-qr-image`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendVideosInChat = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-videos`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const sendDocumentsInChat = async (fd, config = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/send-documents`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          ...(config.onUploadProgress && { onUploadProgress: config.onUploadProgress }),
        },
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const forwardMessages = async (contactId, messageIds) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward`,
        { contactId, messageIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const forwardOneMedia = async (contactId, messageId, mediaType, media) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward-one-media`,
        { contactId, messageId, mediaType, media },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const forwardMultipleOneMedia = async (contactId, messageData,) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward-multiple-media`,
        { contactId, messageData, },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const forwardSelectedMedia = async (contactId, messageData,) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward-selected-media`,
        { contactId, messageData, },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const deleteSelectedMedia = async (contactId, messageData,) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete-selected-media`,
        { contactId, messageData, },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        await refetchRecentChats();
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const joinChanelByInvite = async (contactId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/channel`,
        { id: contactId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const declineInvite = async (contactiId, notifiactionId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/decline`,
        { contactiId, notifiactionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const approveInvite = async (contactiId, notifiactionId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/approve`,
        { contactiId, notifiactionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  const removeNotification = async (contactiId, notifiactionId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/remove`,
        { contactiId, notifiactionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  // Contacts enriched with otherMember for person-type chats
  const contactsWithOtherMember = useMemo(() => {
    if (!contacts || !backendUser) return [];
    return contacts.map((contact) => {
      if (contact.contactType === "person") {
        const otherMember = contact.members?.filter(
          (member) => member._id?._id?.toString() !== backendUser._id?.toString()
        ) || [];
        return { ...contact, otherMember };
      }
      return contact;
    });
  }, [contacts, backendUser]);

  return {
    isNoInternet,
    isServerError,
    handleChat,
    addManyUserInGroupById,
    addInGroupById,
    addContactById,
    addContact,
    user,
    messeges,
    loading,
    isLoggingOut,
    backendUser,
    notifiaction,
    contacts,
    contactsWithOtherMember,
    currentChatData,
    newMessege,
    setIsLoggingOut,
    getorsetProfile,
    newUserSetProfile,
    updateProfile,
    sendMessage,
    sendMessageInGroup,
    sendTextMessage,
    sendLocationMessage,
    sendQrImage,
    sendContactMessage,
    get1v1messages,
    getGroupMessages,
    setCCd,
    rstUnread,
    markAllAsRead,
    addIdToSeenBy,
    deleteMsg,
    recentChats,
    refetchRecentChats,
    updateGroupPermissions,
    createGroup,
    updateGroupInfo,
    dismissAdmin,
    addAdmin,
    getUserDetailsForContact,
    updateGroupMembersPermissions,
    blockUser,
    unBlockUser,
    blockPerson,
    unBlockPerson,
    deletePerson,
    removeUser,
    leaveGroup,
    deleteAndLeaveGroup,
    leaveChanel,
    getLeftOwnedGroups,
    joinGroupAgain,
    getLeftOwnedChannels,
    joinChannelAgain,
    getGroupDetailById,
    getUserDetailByUserName,
    createChanel,
    addMemberInChanel,
    typeUpdateinChanel,
    profileUpdateinChanel,
    addAdminInChanel,
    removeAdminInChanel,
    blockUserInChanel,
    unBlockUserInChanel,
    removeUserInChanel,
    sendMessageInChannel,
    loadOlderMessages,
    sendImagesInChanel,
    sendVideosInChanel,
    sendDocumentsInChanel,
    sendReply,
    forwardMessages,
    forwardOneMedia,
    forwardMultipleOneMedia,
    forwardSelectedMedia,
    deleteSelectedMedia,
    deleteMultipleMessages,
    deleteOneFile,
    toggleReaction,
    sendImagesInChat,
    sendBulkQrImage,
    sendVideosInChat,
    sendDocumentsInChat,
    joinChanelByInvite,
    approveInvite,
    declineInvite,
    removeNotification
  };
}

export default useFirebaseAuth;
