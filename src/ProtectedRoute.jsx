import React, { useContext,useEffect,useRef } from 'react';
import { AuthContext } from "./firebase hooks/AuthContext"
import Lottie from 'lottie-react';
import myAnimation from "./lottie/Cute Tiger.json"
import AuthenticatedUser from "./AuthenticatedUser"
import { useNavigate, useLocation } from "react-router";
import toast from 'react-hot-toast';


function ProtectedRoute() {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (!loading && !user && !hasRedirected.current) {
            hasRedirected.current = true;
            // Skip toast error if redirected after logout
            if (!location.state?.fromLogout) {
                toast.error('Please login to access this page');
            }
            navigate("/u", { replace: true });
        }
    }, [user, loading, navigate, location.state]);

    if (loading)
        return (
            <div className='flex flex-col items-center justify-center h-[100vh]'>
                <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />
            </div>
        );

    if (user) {
        return <AuthenticatedUser />;
    }

    return null;
}

export default ProtectedRoute