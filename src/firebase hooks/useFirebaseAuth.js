// src/hooks/useFirebaseAuth.js - ✅ FIXED: Creates chat even when contactId NOT in recentChats
import { useEffect, useState, useCallback, useReducer, useRef, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';
import { resolvePath } from "react-router";

function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [currentChatData, setCurrentChatData] = useState([]);
  const [tempMesseges, setTempMesseges] = useState([]);
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
        const targetChatIdStr = action.chatId?.toString();
        const updatedChats = state.map((chat) => {
          const chatForContactId = (chat.forContact?._id || chat.forContact)?.toString();
          const chatIdStr = chat._id?.toString();
          if (
            chatForContactId === targetChatIdStr ||
            chatIdStr === targetChatIdStr
          ) {
            chatFound = true;
            let messages = chat.messages ? [...chat.messages] : [];
            let pendingId = action.pendingId || action.msg?._replaced;
            const realId = action.msg._id?.toString();

            if (!pendingId && action.msg._isPending !== true) {
              // Automatically find matching pending message in this chat
              const foundPending = messages.find((m) => {
                if (!m._isPending) return false;
                if (action.msg.ForwardedDetails?.isForwarded && m.ForwardedDetails?.isForwarded) {
                  const msgFwdId = (action.msg.ForwardedDetails?.forwardedMessage?._id || action.msg.ForwardedDetails?.forwardedMessage)?.toString();
                  const mFwdId = (m.ForwardedDetails?.forwardedMessage?._id || m.ForwardedDetails?.forwardedMessage)?.toString();
                  if (msgFwdId && mFwdId && msgFwdId === mFwdId) {
                    return true;
                  }
                  return false;
                }
                if (m.content && action.msg.content && m.content === action.msg.content) {
                  return true;
                }
                return false;
              });
              if (foundPending) {
                pendingId = foundPending._id?.toString();
              }
            }

            const realIndex = messages.findIndex((m) => m._id?.toString() === realId);
            const pendingIndex = pendingId ? messages.findIndex((m) => m._id?.toString() === pendingId.toString()) : -1;

            if (realIndex !== -1 && pendingIndex !== -1 && realIndex !== pendingIndex) {
              // Both exist! Update the pending message in-place to real, keep pending position and time
              messages[pendingIndex] = { ...messages[pendingIndex], ...action.msg, _isPending: false, time: messages[pendingIndex].time };
              messages.splice(realIndex, 1);
            } else if (pendingIndex !== -1) {
              // Only pending exists: update pending message in-place with real msg properties and keep original time
              messages[pendingIndex] = { ...messages[pendingIndex], ...action.msg, _isPending: false, time: messages[pendingIndex].time };
            } else if (realIndex !== -1) {
              // Only real exists: update real message, but preserve local media if local has fewer items (optimistic delete)
              const existing = messages[realIndex];
              const mergeArr = (local, server) => {
                if (!Array.isArray(server)) return local || [];
                if (Array.isArray(local) && local.length < server.length) return local;
                return server;
              };
              messages[realIndex] = {
                ...existing,
                ...action.msg,
                images: mergeArr(existing.images, action.msg.images),
                videos: mergeArr(existing.videos, action.msg.videos),
                documents: mergeArr(existing.documents, action.msg.documents),
              };
            } else {
              messages.push(action.msg);
            }

            // Deduplicate by _id to guarantee uniqueness
            const seenIds = new Set();
            const uniqueMessages = [];
            for (const m of messages) {
              const idStr = m._id?.toString();
              if (idStr && !seenIds.has(idStr)) {
                seenIds.add(idStr);
                uniqueMessages.push(m);
              } else if (!idStr) {
                uniqueMessages.push(m);
              }
            }

            return {
              ...chat,
              messages: uniqueMessages,
            };
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

      case "REMOVE_ONE_FILE":
        return state.map((chat) => {
          const cContactId = (chat.forContact?._id || chat.forContact)?.toString();
          const cId = chat._id?.toString();
          if (cContactId === action.chatId?.toString() || cId === action.chatId?.toString()) {
            let messageIsLast = false;
            const updatedMsgs = (chat.messages || []).map((m) => {
              const mainStr = (m._id?._id || m._id)?.toString();
              const realStr = (m._realId?._id || m._realId)?.toString();
              if (mainStr === action.messageId?.toString() || realStr === action.messageId?.toString()) {
                const files = m[action.fileType] || m.images || m.videos || m.documents || [];
                const updatedFiles = files.filter((f) => {
                  const fIds = [(f._id?._id || f._id)?.toString(), (f.id?._id || f.id)?.toString(), f.public_id?.toString(), f.cloudinaryPublicId?.toString(), f.url?.toString()].filter(Boolean);
                  return !fIds.includes(action.fileId?.toString());
                });
                const noText = !m.content || m.content === "Image" || m.content === "Video" || m.content === "Document";
                if (updatedFiles.length === 0 && noText) {
                  messageIsLast = true;
                }
                return {
                  ...m,
                  [action.fileType || "images"]: updatedFiles,
                };
              }
              return m;
            });

            const finalMsgs = messageIsLast
              ? updatedMsgs.filter((m) => {
                const mainStr = (m._id?._id || m._id)?.toString();
                const realStr = (m._realId?._id || m._realId)?.toString();
                return mainStr !== action.messageId?.toString() && realStr !== action.messageId?.toString();
              })
              : updatedMsgs;

            return {
              ...chat,
              messages: finalMsgs,
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
  const recentChatsRef = useRef(recentChats);
  useEffect(() => {
    recentChatsRef.current = recentChats;
  }, [recentChats]);

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

  // Track current user ID via ref so handleMessageCreted (with empty deps) can access it
  const backendUserIdRef = useRef(null);
  useEffect(() => {
    backendUserIdRef.current = backendUser?._id?.toString() || null;
  }, [backendUser]);

  const mergePendingWithReal = (m, incoming) => {
    const mergeMedia = (incomingArr, localArr) => {
      if (!Array.isArray(incomingArr)) return localArr || [];
      // If local has fewer items than incoming, it means user optimistically
      // deleted files locally before the server responded — trust local state.
      if (Array.isArray(localArr) && localArr.length < incomingArr.length) {
        return localArr;
      }
      return incomingArr.map((item) => {
        const itemId = (item._id?._id || item._id || item.id)?.toString();
        const localMatch = (localArr || []).find(
          (loc) => (loc._id?._id || loc._id || loc.id)?.toString() === itemId || loc.url === item.url
        );
        return {
          ...item,
          url: localMatch?._localBlob ? localMatch.url : item.url,
        };
      });
    };

    return {
      ...m,
      ...incoming,
      images: mergeMedia(incoming.images, m.images),
      videos: mergeMedia(incoming.videos, m.videos),
      documents: mergeMedia(incoming.documents, m.documents),
      _clientKey: m._clientKey || m._id,
      _isPending: false,
      time: incoming.time || m.time,
    };
  };

  // ✅ handleMessageCreted — updates pending in-place, never adds duplicates for own messages
  const handleMessageCreted = useCallback((msg, chatId) => {
    const msgContactId = (msg?.forContact?._id || msg?.forContact)?.toString();
    const cId = chatId?.id?.toString() || chatId?.toString() || msgContactId;

    dispatchRecentChats({
      type: "ADD_UPDATE_MESSAGE",
      chatId: cId,
      msg,
    });

    setCurrentChatData((prev) => {
      const msgIdStr = msg._id?.toString();
      const incomingSenderId = (msg.sender?._id || msg.sender)?.toString();
      const currentUserId = backendUserIdRef.current;
      const isOwnMessage = currentUserId && incomingSenderId && currentUserId === incomingSenderId;

      // Helper: sort messages by time after any modification
      const sortByTime = (arr) => arr.sort((a, b) => new Date(a.time) - new Date(b.time));

      // 1. Exact _id match — update in-place and re-sort
      const exactIdx = prev.findIndex((m) => m._id?.toString() === msgIdStr);
      if (exactIdx !== -1) {
        return sortByTime(prev.map((m, i) =>
          i === exactIdx ? mergePendingWithReal(m, msg) : m
        ));
      }

      // 2. Check via pendingToRealMap (mapping established by HTTP response)
      const matchingPendingId = realToPendingMap.current[msg._id];
      if (matchingPendingId) {
        const mappedIdx = prev.findIndex((m) =>
          m._id?.toString() === matchingPendingId.toString() ||
          m._clientKey?.toString() === matchingPendingId.toString()
        );
        if (mappedIdx !== -1) {
          return sortByTime(prev.map((m, i) =>
            i === mappedIdx ? mergePendingWithReal(m, msg) : m
          ));
        }
      }

      // 3. Find pending message for the same contact FROM THE SAME SENDER and update it
      //    Only match own pending messages — never merge another user's message into a pending
      const pendingIdx = prev.findIndex((m) => {
        if (!m._isPending) return false;
        if (!isOwnMessage) return false; // B's message must NEVER match A's pending
        const mContactId = (m.forContact?._id || m.forContact)?.toString();
        if (mContactId && cId && mContactId !== cId) return false;
        // For forwarded messages, match by forwarded message ID
        if (msg.ForwardedDetails?.isForwarded && m.ForwardedDetails?.isForwarded) {
          const msgFwdId = (msg.ForwardedDetails?.forwardedMessage?._id || msg.ForwardedDetails?.forwardedMessage)?.toString();
          const mFwdId = (m.ForwardedDetails?.forwardedMessage?._id || m.ForwardedDetails?.forwardedMessage)?.toString();
          return msgFwdId && mFwdId && msgFwdId === mFwdId;
        }
        return true;
      });

      if (pendingIdx !== -1) {
        const pendingMsg = prev[pendingIdx];
        realToPendingMap.current[msg._id] = pendingMsg._id;
        pendingToRealMap.current[pendingMsg._id] = msg._id;
        return sortByTime(prev.map((m, i) =>
          i === pendingIdx ? mergePendingWithReal(m, msg) : m
        ));
      }

      // 4. If this is the current user's OWN message and no pending was found,
      //    DON'T add it as new — the HTTP response will handle the pending→real
      //    transition with the explicit pendingId. Adding here causes the flash.
      if (isOwnMessage) {
        return prev;
      }

      // 5. Message from another user — add as new and sort
      return sortByTime([...prev, msg]);
    });

  }, []); // Uses refs only — no deps needed
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

            const cId = (id?.id?._id || id?.id || id)?.toString();
            const msgId = (message._id?._id || message._id)?.toString();

            const mediaProp = message.chatType ? `${message.chatType}s` : "images";
            const files = message[mediaProp] || message.images || message.videos || message.documents || [];
            const isMediaEmpty = Array.isArray(files) && files.length === 0;
            const hasNoText = !message.content || message.content === "Image" || message.content === "Video" || message.content === "Document";

            if (isMediaEmpty && hasNoText) {
              dispatchRecentChats({
                type: "DELETE_MESSAGE",
                chatId: cId,
                msgId: msgId,
              });
              setCurrentChatData((prev) => prev.filter((m) => {
                const mainStr = (m._id?._id || m._id)?.toString();
                const realStr = (m._realId?._id || m._realId)?.toString();
                return mainStr !== msgId && realStr !== msgId;
              }));
            } else {
              dispatchRecentChats({
                type: "ADD_UPDATE_MESSAGE",
                chatId: cId,
                msg: message,
              });

              setCurrentChatData((prev) => {
                return prev.map((m) => {
                  const mainStr = (m._id?._id || m._id)?.toString();
                  const realStr = (m._realId?._id || m._realId)?.toString();
                  if (mainStr === msgId || realStr === msgId) {
                    return mergePendingWithReal(m, message);
                  }
                  return m;
                });
              });
            }
          });


          currentSocket.on("messageUpdated", (data, id) => {

            const targetChatId = (id?.id?._id || id?.id || id)?.toString();

            dispatchRecentChats({
              type: "UPDATE_MESSAGES_BY_CHAT",
              chatId: targetChatId,
              messages: data,
            });
            setCurrentChatData((prev) => {
              if (!data || !Array.isArray(data)) return prev;
              const currentContactId = (prev[0]?.forContact?._id || prev[0]?.forContact)?.toString();
              if (currentContactId && targetChatId && currentContactId !== targetChatId) {
                return prev;
              }
              return data;
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

  // ✅ handleChat - STABLE REFERENCE
  const handleChat = useCallback(
    (id) => {
      const targetChat = recentChatsRef.current.find(
        (chat) =>
          chat.forContact?.toString() === id?.toString() ||
          chat._id?.toString() === id?.toString(),
      );

      if (targetChat?.messages) {
        setCurrentChatData(targetChat.messages);
      } else {
        setCurrentChatData([]);
      }
    },
    [],
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
      const msgIdStr = msg._id?.toString();
      if (msg._replaced) {
        const pendingId = msg._replaced?.toString();
        const { _replaced, ...cleanMsg } = msg;

        // Store the mapping for future socket events
        pendingToRealMap.current[pendingId] = cleanMsg._id;
        realToPendingMap.current[cleanMsg._id] = pendingId;

        // Case A: Socket already delivered the real message before HTTP response
        // Update the PENDING message in-place with real data, then remove the duplicate real entry
        const realAlreadyExists = prev.some((m) => m._id?.toString() === cleanMsg._id?.toString());
        if (realAlreadyExists) {
          // First: update the pending message in-place with real data (keeps position, no flash)
          const merged = prev.map((m) => {
            if (m._id?.toString() === pendingId || m._clientKey?.toString() === pendingId) {
              return mergePendingWithReal(m, cleanMsg);
            }
            return m;
          });
          // Then: remove the duplicate real message that was added separately by socket
          const seenIds = new Set();
          return merged.filter((m) => {
            const id = m._id?.toString();
            if (id && seenIds.has(id)) return false;
            if (id) seenIds.add(id);
            return true;
          });
        }

        // Case B: HTTP arrived first — update pending in-place with real _id
        const hasPending = prev.some((m) => m._id?.toString() === pendingId || m._clientKey?.toString() === pendingId);
        if (hasPending) {
          return prev.map((m) =>
            (m._id?.toString() === pendingId || m._clientKey?.toString() === pendingId)
              ? mergePendingWithReal(m, cleanMsg)
              : m
          );
        }

        // Pending was already removed somehow, just add the real message
        const exists2 = prev.some((m) => m._id?.toString() === cleanMsg._id?.toString());
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
      const hasMatchingPending = prev.some((m) =>
        m._isPending && (
          m._id?.toString() === msgIdStr ||
          m._clientKey?.toString() === matchingPendingId?.toString() ||
          m._id?.toString() === matchingPendingId?.toString()
        )
      );

      if (hasMatchingPending) {
        return prev.map((m) =>
          (m._isPending && (m._id?.toString() === msgIdStr || m._clientKey?.toString() === matchingPendingId?.toString() || m._id?.toString() === matchingPendingId?.toString()))
            ? mergePendingWithReal(m, msg)
            : m
        );
      }

      const exists = prev.some((m) =>
        m._id?.toString() === msgIdStr ||
        m._realId?.toString() === msgIdStr ||
        (matchingPendingId && m._id?.toString() === matchingPendingId.toString())
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
    const msgIdStr = (messageId?._id || messageId)?.toString();
    const fIdStr = (fileId?._id || fileId || fileId?.url)?.toString();
    const cIdStr = (contactId?._id || contactId)?.toString();

    const matchesFileId = (f) => {
      if (!f) return false;
      const fIds = [
        (f._id?._id || f._id)?.toString(),
        (f.id?._id || f.id)?.toString(),
        f.public_id?.toString(),
        f.cloudinaryPublicId?.toString(),
        f.url?.toString()
      ].filter(Boolean);
      return fIds.includes(fIdStr);
    };

    const checkIsLast = (msgFiles, msgContent) => {
      const remaining = msgFiles.filter((f) => !matchesFileId(f));
      const noText = !msgContent || msgContent === "Image" || msgContent === "Video" || msgContent === "Document";
      return remaining.length === 0 && noText;
    };

    // 1. BEFORE sending request, INSTANTLY update currentChatData
    setCurrentChatData((prev) => {
      let isLast = false;
      const updated = prev.map((msg) => {
        const mainStr = (msg._id?._id || msg._id)?.toString();
        const realStr = (msg._realId?._id || msg._realId)?.toString();
        if (mainStr === msgIdStr || realStr === msgIdStr) {
          const targetKey = type || (msg.chatType ? `${msg.chatType}s` : "images");
          const files = msg[targetKey] || msg.images || msg.videos || msg.documents || [];
          if (checkIsLast(files, msg.content)) {
            isLast = true;
          }
          const updatedFiles = files.filter((f) => !matchesFileId(f));
          return {
            ...msg,
            [targetKey]: updatedFiles,
          };
        }
        return msg;
      });

      if (isLast) {
        return updated.filter((msg) => {
          const mainStr = (msg._id?._id || msg._id)?.toString();
          const realStr = (msg._realId?._id || msg._realId)?.toString();
          return mainStr !== msgIdStr && realStr !== msgIdStr;
        });
      }
      return updated;
    });

    // 2. BEFORE sending request, INSTANTLY update recentChats reducer
    dispatchRecentChats({
      type: "REMOVE_ONE_FILE",
      chatId: cIdStr,
      messageId: msgIdStr,
      fileId: fIdStr,
      fileType: type || "images",
    });

    // 3. NOW send HTTP delete request
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete-one`,
        { messageId: msgIdStr, contactId: cIdStr, fileId: fIdStr, type },
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
  const forwardMessages = async (contactId, messageIds, originalContactId) => {
    try {

      const targetChat = recentChats.find(
        (chat) =>
          chat.forContact?.toString() === originalContactId?.toString() ||
          chat._id?.toString() === originalContactId?.toString()
      );
      let allSourceMessages = targetChat?.messages || [];
      if (!allSourceMessages.length) {
        allSourceMessages = currentChatData || [];
      }

      // Map in exact order of messageIds array sent by user
      const findMesseges = messageIds
        .map((id) => allSourceMessages.find((msg) => msg._id?.toString() === id?.toString()))
        .filter(Boolean);

      const baseTime = Date.now();
      const mappedMesseges = findMesseges.map((msg, idx) => {
        let fwdFromId = msg.sender;
        if (msg.ForwardedDetails && msg.ForwardedDetails.isForwarded) {
          fwdFromId = msg.ForwardedDetails.forwardedFrom;
        }
        const tempId = uuidv4();
        return {
          ...msg,
          _id: tempId,
          sender: backendUser,
          forContact: contactId,
          ForwardedDetails: {
            isForwarded: true,
            forwardedFrom: fwdFromId,
            forwardedMessage: msg._id || msg,
          },
          time: new Date(baseTime + idx * 10).toISOString(),
          _isPending: true,
        };
      });

      const targetContactId = contactId?.toString();
      // Check if target chat is currently open in currentChatData
      const isCurrentChatOpen =
        !currentChatData.length ||
        currentChatData.some((m) => {
          const mContactId = (m.forContact?._id || m.forContact)?.toString();
          return mContactId === targetContactId;
        });

      // Optimistically add temporary messages to recentChats and currentChatData
      mappedMesseges.forEach((tempMsg) => {
        dispatchRecentChats({
          type: "ADD_UPDATE_MESSAGE",
          chatId: targetContactId,
          msg: tempMsg,
        });
        if (isCurrentChatOpen) {
          setCCd(tempMsg);
        }
      });

      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward`,
        { contactId, messageIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        const serverMessages = res.data?.messages;
        if (serverMessages && Array.isArray(serverMessages)) {
          serverMessages.forEach((permMsg, idx) => {
            const tempMsg = mappedMesseges[idx];
            const pendingId = tempMsg?._id;

            dispatchRecentChats({
              type: "ADD_UPDATE_MESSAGE",
              chatId: targetContactId,
              msg: permMsg,
              pendingId: pendingId,
            });

            if (isCurrentChatOpen && pendingId) {
              setCCd({ ...permMsg, _replaced: pendingId });
            }
          });
        }
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const forwardOneMedia = async (contactId, messageId, mediaType, media) => {
    try {
      const pendingId = `pending_fwd_media_${Date.now()}`;
      let cType = "text";
      if (mediaType === "images") cType = "image";
      else if (mediaType === "videos") cType = "video";
      else if (mediaType === "documents") cType = "document";

      const pendingMsg = {
        _id: pendingId,
        sender: backendUser,
        forContact: contactId,
        chatType: cType,
        _isPending: true,
        time: new Date().toISOString(),
        [mediaType]: [media],
      };

      const targetContactId = contactId?.toString();
      const isCurrentChatOpen =
        !currentChatData.length ||
        currentChatData.some((m) => {
          const mContactId = (m.forContact?._id || m.forContact)?.toString();
          return mContactId === targetContactId;
        });

      dispatchRecentChats({
        type: "ADD_UPDATE_MESSAGE",
        chatId: targetContactId,
        msg: pendingMsg,
      });

      if (isCurrentChatOpen) {
        setCCd(pendingMsg);
      }

      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward-one-media`,
        { contactId, messageId, mediaType, media },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        const serverMessage = res.data?.message;
        if (serverMessage) {
          dispatchRecentChats({
            type: "ADD_UPDATE_MESSAGE",
            chatId: targetContactId,
            msg: serverMessage,
            pendingId: pendingId,
          });

          if (isCurrentChatOpen) {
            setCCd({ ...serverMessage, _replaced: pendingId });
          }
        } else {
          await refetchRecentChats();
        }
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
  const forwardSelectedMedia = async (contactId, messageData) => {
    try {
      const targetContactId = contactId?.toString();
      const isCurrentChatOpen =
        !currentChatData.length ||
        currentChatData.some((m) => {
          const mContactId = (m.forContact?._id || m.forContact)?.toString();
          return mContactId === targetContactId;
        });

      const baseTime = Date.now();

      const pendingMessages = messageData.map((msgData, idx) => {
        const pendingId = `pending_fwd_selected_${baseTime}_${idx}`;
        const cType = msgData.type; // "image", "video", or "document"
        let mediaProp = "images";
        if (cType === "video") mediaProp = "videos";
        if (cType === "document") mediaProp = "documents";

        let fwdFromId = msgData.sender;
        if (msgData.ForwardedDetails && msgData.ForwardedDetails.isForwarded) {
          fwdFromId = msgData.ForwardedDetails.forwardedFrom;
        }

        return {
          _id: pendingId,
          sender: backendUser,
          forContact: contactId,
          chatType: cType,
          _isPending: true,
          time: new Date(baseTime + idx * 10).toISOString(),
          [mediaProp]: [msgData.media],
          caption: msgData.caption || "",
          ForwardedDetails: {
            isForwarded: true,
            forwardedFrom: fwdFromId,
            forwardedMessage: msgData._id,
          },
        };
      });

      pendingMessages.forEach((pendingMsg) => {
        dispatchRecentChats({
          type: "ADD_UPDATE_MESSAGE",
          chatId: targetContactId,
          msg: pendingMsg,
        });

        if (isCurrentChatOpen) {
          setCCd(pendingMsg);
        }
      });

      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/forward-selected-media`,
        { contactId, messageData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );


      if (res.status === 200) {
        const serverMessages = res.data?.message;
        if (serverMessages && Array.isArray(serverMessages)) {
          serverMessages.forEach((serverMsg, idx) => {
            const pendingId = pendingMessages[idx]?._id;

            dispatchRecentChats({
              type: "ADD_UPDATE_MESSAGE",
              chatId: targetContactId,
              msg: serverMsg,
              pendingId: pendingId,
            });

            if (isCurrentChatOpen && pendingId) {
              setCCd({ ...serverMsg, _replaced: pendingId });
            }
          });
        } else {
          await refetchRecentChats();
        }
      }
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  const deleteSelectedMedia = async (contactId, messageData) => {
    try {
      // 1. Optimistic Update: Immediately remove the media from the UI
      setCurrentChatData((prev) => {
        let next = prev.map((m) => {
          // Find all delete instructions for this message
          const deletionsForMsg = messageData.filter((d) => d.msg?._id === m._id);

          if (deletionsForMsg.length > 0) {
            const newMsg = { ...m };

            deletionsForMsg.forEach((d) => {
              const type = d.msg?.chatType || m.chatType;
              const arrayName = type + "s"; // "images", "videos", "documents"

              if (newMsg[arrayName]) {
                newMsg[arrayName] = newMsg[arrayName].filter((file) => {
                  const fileId = file._id?._id || file._id || file.id;
                  return fileId?.toString() !== d.mediaItemId?.toString();
                });
              }
            });

            // If the message has no media left, it should be completely removed
            const finalArrayName = m.chatType + "s";
            if (newMsg[finalArrayName] && newMsg[finalArrayName].length === 0) {
              return null;
            }
            return newMsg;
          }
          return m;
        });

        return next.filter(Boolean); // Filter out the nulls (fully deleted messages)
      });

      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/chat/delete-selected-media`,
        { contactId, messageData },
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
  const joinGroupInvite = async (contactId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/group`,
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
  const changeRequiresApproval = async (contactiId, value) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.post(
        `${serverUrl}/invite/change-approval`,
        { contactiId, value },
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
    joinGroupInvite,
    approveInvite,
    declineInvite,
    removeNotification,
    changeRequiresApproval
  };
}

export default useFirebaseAuth;
