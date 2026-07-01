import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./firebase hooks/AuthContext";
import IsProfileSetted from "./IsProfileSetted";
import { Routes, Route, Navigate, useLocation } from "react-router"
import Lottie from "lottie-react";
import myAnimation from "./lottie/Cute Tiger.json";
import noInternetAnimation from "./lottie/no internet.json";
import serverErrorAnimation from "./lottie/cat 404.json";
import Login$Signup from "./Login$Signup";
import HandleViewInfo from "./HandleViewInfo";
import DownloadPage from "./DownloadPage";
import InfoPage from "./InfoPage";
import toast from "react-hot-toast";


function AuthHandler() {
    const { user, loading, isNoInternet, isServerError, getorsetProfile } = useContext(AuthContext);
    const location = useLocation();
    const [isInviteOrProfileLink, setIsInviteOrProfileLink] = useState(false);
    const [userId, setUserId] = useState(null);
    // useEffect(() => {
    //     const checkUrl = () => {
    //         const url = new URL(window.location.href);
    //         const path = url.pathname;
    //         const params = new URLSearchParams(url.search);

    //         // 1) Pathname links ONLY → ViewInfo
    //         const isGroupJoinLink = path.startsWith("/+");
    //         const isViewProfileLink = path.startsWith("/$");

    //         if (isGroupJoinLink || isViewProfileLink) {
    //             setIsInviteOrProfileLink(true);
    //             setUserId(null);
    //             return;
    //         }

    //         // 2) Query param → extract ID but DON'T show ViewInfo
    //         const queryUserId = params.get('userID');
    //         if (queryUserId) {
    //             
    //             setUserId(queryUserId);
    //             setIsInviteOrProfileLink(false); // Key: Don't show ViewInfo
    //             return;
    //         }

    //         // 3) Normal URL
    //         setIsInviteOrProfileLink(false);
    //         setUserId(null);
    //     };

    //     checkUrl();
    //     window.addEventListener('popstate', checkUrl);
    //     return () => window.removeEventListener('popstate', checkUrl);
    // }, []);

    // Public routes bypass auth flow entirely
    if (location.pathname === '/download') {
        return <DownloadPage />;
    }

    if (location.pathname === '/info') {
        return <InfoPage />;
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[100vh]">
                <Lottie animationData={myAnimation} loop style={{ height: 300, width: 300 }} />
            </div>
        );
    }

    if (isNoInternet) {
        return (
            <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-50 px-4 select-none">
                <Lottie animationData={noInternetAnimation} loop style={{ height: 350, width: 350 }} />
                <h2 className="text-2xl font-bold text-gray-800 -mt-10">No Internet Connection</h2>
                <p className="text-gray-500 text-center max-w-sm mt-2">
                    Please check your network cables, modem, and router.
                </p>
                <button
                    onClick={async () => {
                        toast.loading("Retrying...", { id: "retry-toast" });
                        const res = await getorsetProfile();
                        if (res !== undefined && navigator.onLine) {
                            toast.success("Connected!", { id: "retry-toast" });
                        } else {
                            toast.error("Still offline.", { id: "retry-toast" });
                        }
                    }}
                    className="mt-6 px-6 py-2.5 bg-[#8763ea] text-white font-medium rounded-lg shadow-md hover:bg-[#7652d9] transition-all duration-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (isServerError) {
        return (
            <div className="flex flex-col items-center justify-center h-[100vh] bg-white px-4 select-none">
                <Lottie animationData={serverErrorAnimation} loop style={{ height: 350, width: 350 }} />
                <h2 className="text-2xl font-bold text-gray-800 -mt-10">Server Connection Error</h2>
                <p className="text-gray-500 text-center max-w-sm mt-2">
                    We're having trouble connecting to the server. Please try again later.
                </p>
                <button
                    onClick={async () => {
                        toast.loading("Retrying...", { id: "retry-toast" });
                        const res = await getorsetProfile();
                        if (res !== undefined && !isServerError) {
                            toast.success("Connected!", { id: "retry-toast" });
                        } else {
                            toast.error("Could not connect to server.", { id: "retry-toast" });
                        }
                    }}
                    className="mt-6 px-6 py-2.5 bg-[#8763ea] text-white font-medium rounded-lg shadow-md hover:bg-[#7652d9] transition-all duration-200"
                >
                    Try Again
                </button>
            </div>
        );
    }


    return (

        <Routes>
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/" element={user ? <IsProfileSetted /> : <Login$Signup />} />
            <Route path="/:id" element={<HandleViewInfo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

    )

    // 2) Otherwise, normal auth flow

}

export default AuthHandler;
