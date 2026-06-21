import React, { useContext } from 'react';
import { Navigate } from 'react-router';
import { AuthContext } from "./firebase hooks/AuthContext"
import Lottie from 'lottie-react';
import myAnimation from "./lottie/Cute Tiger.json"
import Login$Signup from './Login$Signup';
import toast from 'react-hot-toast';
function LoginPage() {
    const { user, loading } = useContext(AuthContext);

    if (loading)
        return (
            <div className='flex flex-col items-center justify-center  h-[100vh] '>
                <Lottie animationData={myAnimation} loop={true} style={{ height: 300, width: 300 }} />

            </div>);

    if (user) {
        toast('You are already Loged in', {
            icon: '☹️',
        });
        // If logged in, redirect to home/dashboard page
        return (<Navigate to="/a" replace />
            
        );
    }

    // Show login form if not logged in
    return (
    <Login$Signup/>
    );
}

export default LoginPage;
