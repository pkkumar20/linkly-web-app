import React, { useEffect, useState } from 'react'
import ViewInfo from "./ViewInfo";
import { useNavigate, useLocation } from "react-router";
import toast from 'react-hot-toast';
function HandleViewInfo() {
        const [isInviteOrProfileLink, setIsInviteOrProfileLink] = useState(false);
    const [userId, setUserId] = useState(null);
    let navigate = useNavigate();
    let location = useLocation();
    useEffect(() => {
        const checkUrl = () => {
            const path = location.pathname;
            const params = new URLSearchParams(location.search);

            // 1) Pathname links ONLY → ViewInfo
            const isGroupJoinLink = path.startsWith("/+");
            const isViewProfileLink = path.startsWith("/@");

            if (isGroupJoinLink || isViewProfileLink) {
                setIsInviteOrProfileLink(true);
                setUserId(null);
                return;
            } else {
                toast.error("invalid serch key")
                navigate("/")
            }

            // 2) Query param → extract ID but DON'T show ViewInfo
            const queryUserId = params.get('userID');
            if (queryUserId) {
                console.log(`user id is ${queryUserId}`);
                setUserId(queryUserId);
                setIsInviteOrProfileLink(false);
              
                navigate("/")
                // Key: Don't show ViewInfo
                
            }

            // 3) Normal URL
            setIsInviteOrProfileLink(false);
            setUserId(null);
        };

        checkUrl();
        
    }, [location, navigate]);
    return <ViewInfo/>
}

export default HandleViewInfo