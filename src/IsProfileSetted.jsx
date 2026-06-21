import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from './firebase hooks/AuthContext';
import ProfileSet from './ProfileSet';
import AuthenticatedUser from './AuthenticatedUser';
import Lottie from 'lottie-react';
import myAnimation from "./lottie/Cute Tiger.json"
import toast from 'react-hot-toast';

function IsProfileSetted() {
    const { getorsetProfile } = useContext(AuthContext) // removed backendUser as it wasn't used
    const [isProfileSet, setIsProfileSet] = useState(false);
    const [loading, setLoading] = useState(true);

    const getisProfileSet = async () => {
        // Prevent running if we already know it's set
        if (isProfileSet) return;

        setLoading(true);
        try {
            const res = await getorsetProfile();
            setIsProfileSet(res);
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Error checking profile status");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getisProfileSet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);  // ✅ FIXED: Empty array ensures this runs only once on mount

    useEffect(() => {
        if (!loading && !isProfileSet) {
            toast("Please complete your profile", { id: 'profile-toast' }); // Added ID to prevent duplicates
        }
    }, [isProfileSet, loading]);

    if (loading) {
        return (
            <div className='flex flex-col items-center justify-center h-[100vh]'>
                <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
            </div>
        );
    }

    if (isProfileSet) {
        return <AuthenticatedUser />;
    }

    return <ProfileSet onProfileset={(e) => setIsProfileSet(e)} />;
}

export default IsProfileSetted;