import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from './firebase hooks/AuthContext';
import { RiMessage2Line } from "react-icons/ri";
import { HiUsers } from "react-icons/hi";
import Avatar from "./UserAvatar";
import { useNavigate } from "react-router"
function JoinGroupCard() {
    const { getUserDetailByUserName, getGroupDetailById } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [err, setErr] = useState(false);
    const [userName, setUserName] = useState("");
    const [type, setType] = useState("")
    let navigate = useNavigate();
    useEffect(() => {
        const getData = async () => {
            const url = new URL(window.location.href);
            const path = url.pathname; // e.g. "/+nOU1yhQ3_WtiMmQ1"
            let code = path;
            if (path.startsWith("/+")) {
                setType("group");
                code = path.slice(2);
                if (code.length == 0) {

                    navigate("/");;
                } else {
                    try {
                        const res = await getGroupDetailById(code);
                        
                        if (res.status === 200) {
                            
                            setData(res.data.user);
                            setType(res.data.user.contactType)
                        }
                    } catch (error) {
                        console.log(error)
                        setErr(true);
                    }

                }// "66666695uypj"
            }
            if (path.startsWith("/@")) {
                setType("user");
                code = path.slice(1);
                
                if (code.length == 0) {
                    navigate("/");

                } else {
                    setUserName(code);
                    try {
                        const res = await getUserDetailByUserName(code);
                        
                        if (res.status === 200) {
                            
                            setData(res.data.user);
                            setErr(false);
                        }
                    } catch (error) {
                        console.log(error)
                        setData(null);
                        setErr(true);
                    }

                }
            }

        }
        getData();

    }, []);
    return (
        <div className="flex items-center justify-center ">
            <div className="bg-white space-y-5 rounded-3xl p-6 mt-5 items-center shadow-md px-10 py-10 w-[370px] text-center">
                {data !== null && err !== true && (
                    <>
                        <div className=" flex mx-auto items-center justify-center mb-6 ">
                            {type == "user" ? (
                                <Avatar textSize="text-5xl" size="w-32 h-32" emojiSize={'text-5xl'} {...(data.profile !== null && data.profile.type === 'image' && {
                                    image: data.profile
                                        .imageUrl,
                                })}
                                    {...(data.profile !== null && data.profile.type === 'emoji' && {
                                        emoji: data.profile
                                            .emoji,
                                        simpleBg: data.profile
                                            .bgColor,
                                    })}
                                    {...(data.profile !== null && data.profile.type === 'initials' && {
                                        simpleBg: data.profile
                                            .bgColor,
                                        text: data.profile.initials,

                                    })} />
                            ) : (
                                <Avatar textSize="text-5xl" size="w-32 h-32" emojiSize={'text-5xl'} {...(data.details.profile !== null && data.details.profile.type === 'image' && {
                                    image: data.details.profile
                                        .imageUrl,
                                })}
                                    {...(data.details.profile !== null && data.details.profile.type === 'emoji' && {
                                        emoji: data.details.profile
                                            .emoji,
                                        simpleBg: data.details.profile
                                            .bgColor,
                                    })}
                                    {...(data.details.profile !== null && data.details.profile.type === 'initials' && {
                                        simpleBg: data.details.profile
                                            .bgColor,
                                        text: data.details.profile.initials,

                                    })} />
                            )}

                            {/* <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#74b7ff] to-[#3f8bff] flex items-center justify-center">
                                <span className="text-white text-3xl font-semibold">PM</span>
                            </div> */}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {data.name} {" "}{data.lastName}
                        </h2>

                        {/* Subtitle */}
                        <p className="text-sm text-gray-500 mt-1">{type == "user" ? (data.username) : (data.members.length > 1 ? (data.members.length + " " + "subscribers") : (data.members.length + " " + "subscriber"))}</p>
                        {type == "user" && (
                            <p className="text-md  text-gray-900">
                                {data.bio}
                            </p>
                        )}

                        {/* Buttons */}

                        <button
                            onClick={() => {
                                // const url = new URL(window.location);
                                // url.pathname = '/'; // Reset to root
                                // url.searchParams.set('userID', data._id);
                                // window.history.pushState({}, '', url.toString());
                                if (type == "user") {
                                    navigate(`/?userID=${data._id}`)
                                } else if (type == "group") {
                                    navigate(`/?groupId=${data._id}`, { state: { context: data } });
                                }

                            }}
                            className="p-4 mt-14 text-md rounded-full bg-[#8763ea] text-white font-semibold py-2.5  hover:bg-[#6647bc] transition"
                        >
                            {type == "user" && (
                                "Send Message"
                            )}
                            {type == "group" && (
                                "Join Group"
                            )}
                            {type == "channel" && (
                                "Join Channel"
                            )}
                        </button>


                    </>
                )}
                {data == null && (
                    <>
                        <div className=" flex mx-auto items-center justify-center mb-6 ">
                            {/* <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#74b7ff] to-[#3f8bff] flex items-center justify-center">
                                <span className="text-white text-3xl font-semibold">PM</span>
                            </div> */}
                            {type == "user" && (
                                <RiMessage2Line size={44} color="#8763ea" />
                            )}
                            {type == "group" && (
                                <HiUsers size={44} color="#8763ea" />
                            )}

                        </div>

                        {/* Title */}
                        <p className="text-xl  text-gray-900">
                            {type == "group" && (
                                "Expired invitation Link or Group or Chanel does not exits or deleted"
                            )}
                            {type == "user" && (
                                `No user exits with ${userName}`
                            )}
                        </p>

                        {/* Subtitle */}
                        {/* <p className="text-sm text-gray-500 mt-1">2 subscribers</p> */}

                        {/* Buttons */}
                        {/* <div className="mt-6 space-y-3">
                            <button
                                className="w-full rounded-full bg-[#3f8bff] text-white font-semibold py-2.5 text-sm hover:bg-[#3274d1] transition"
                            >
                                JOIN GROUP
                            </button>

                            <button
                                className="w-full rounded-full border border-[#3f8bff] text-[#3f8bff] font-semibold py-2.5 text-sm hover:bg-[#e9f2ff] transition"
                            >
                                OPEN IN WEB
                            </button>
                        </div> */}
                    </>
                )}

            </div>
        </div>

    );
}

export default JoinGroupCard;
