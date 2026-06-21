import "./hide.css";
import React, { useEffect, useState, useRef } from "react";
import toast from 'react-hot-toast';
import { Spinner } from "@material-tailwind/react";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth } from "./firebase/firebse.config";
import { motion, AnimatePresence } from "framer-motion";
import OtpInput from "./OtpInput";

// Floating logo with gentle pulse & bob animation
function TelegramLogo() {
    return (
        <motion.div
            className="flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.5, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
        >
            <motion.div
                className="bg-[#8763ea] rounded-full w-48 h-48 flex items-center justify-center mb-6 mt-10"
                animate={{
                    y: [0, -8, 0],
                    boxShadow: [
                        "0 8px 30px rgba(135, 99, 234, 0.25)",
                        "0 16px 40px rgba(135, 99, 234, 0.4)",
                        "0 8px 30px rgba(135, 99, 234, 0.25)",
                    ],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                whileHover={{ scale: 1.05, rotate: 5 }}
            >
                <svg
                    fill="#000000"
                    viewBox="0 0 24 24"
                    id="messenger"
                    data-name="Line Color"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon line-color w-36 h-36"
                >
                    <polyline
                        id="secondary"
                        points="16 11 13 13 11 11 8 13"
                        style={{
                            fill: "none",
                            stroke: "rgb(255, 255, 255)",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                        }}
                    />
                    <path
                        id="primary"
                        d="M20.88,13.46A9,9,0,0,1,7.88,20L3,21l1-4.88a9,9,0,1,1,16.88-2.66Z"
                        style={{
                            fill: "none",
                            stroke: "#fff",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                        }}
                    />
                </svg>
            </motion.div>
        </motion.div>
    );
}

// Smooth page transition variants with scale + fade + slide
const pageVariants = {
    initial: {
        opacity: 0,
        x: 60,
        scale: 0.96,
        filter: "blur(6px)",
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: 0.08,
            delayChildren: 0.15,
        },
    },
    exit: {
        opacity: 0,
        x: -60,
        scale: 0.96,
        filter: "blur(6px)",
        transition: {
            duration: 0.35,
            ease: [0.55, 0.06, 0.68, 0.19],
        },
    },
};

// Staggered children for form elements
const childVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

// Button spring animation on hover/tap
const buttonVariants = {
    idle: { scale: 1 },
    hover: {
        scale: 1.02,
        boxShadow: "0 6px 24px rgba(135, 99, 234, 0.45)",
        transition: { type: "spring", stiffness: 400, damping: 17 },
    },
    tap: {
        scale: 0.97,
        transition: { type: "spring", stiffness: 500, damping: 20 },
    },
};

export default function LoginSignup() {
    const [phone, setPhone] = useState("");
    const [isloading, setIsLoading] = useState(false);
    const [isMain, setIsMain] = useState(true);
    const recaptchaVerifierRef = useRef(null);

    // Helper: create a fresh RecaptchaVerifier (without calling render)
    const createRecaptchaVerifier = () => {
        return new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "invisible",
                callback: () => {
                    console.log("reCAPTCHA solved!");
                },
                "expired-callback": () => {
                    console.log("reCAPTCHA expired. Try again.");
                    toast.error("Security check expired. Please try again.");
                },
            }
        );
    };

    // Helper: reset the recaptcha DOM container to a clean state
    const resetRecaptchaContainer = () => {
        const oldContainer = document.getElementById("recaptcha-container");
        if (oldContainer && oldContainer.parentNode) {
            const newContainer = document.createElement("div");
            newContainer.id = "recaptcha-container";
            oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        }
    };

    useEffect(() => {
        if (recaptchaVerifierRef.current) return;

        console.log("Initializing RecaptchaVerifier...");
        try {
            resetRecaptchaContainer();
            recaptchaVerifierRef.current = createRecaptchaVerifier();
        } catch (error) {
            console.error("Error initializing reCAPTCHA:", error);
            toast.error("Failed to load security check. Refreshing may help.");
        }

        return () => {
            if (recaptchaVerifierRef.current) {
                console.log("Clearing RecaptchaVerifier on unmount.");
                try { recaptchaVerifierRef.current.clear(); } catch (_) { }
                recaptchaVerifierRef.current = null;
            }
            
            // Ensure any left-over Recaptcha DOM elements (badges/iframes) are completely removed
            const badges = document.querySelectorAll('.grecaptcha-badge');
            badges.forEach(badge => {
                const parent = badge.parentElement;
                if (parent && parent.tagName === 'DIV' && parent.parentElement === document.body) {
                    parent.remove();
                } else if (badge) {
                    badge.remove();
                }
            });

            // Also clean up any lingering recaptcha iframes (e.g. the invisible challenge iframes)
            const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
            iframes.forEach(iframe => {
                const parent = iframe.parentElement;
                if (parent && parent.tagName === 'DIV' && parent.parentElement === document.body) {
                    parent.remove();
                } else if (iframe) {
                    iframe.remove();
                }
            });
        };
    }, []);

    const handleBack = () => {
        setPhone("");
        setIsLoading(false);
        setIsMain(true);
        window.confirmationResult = null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (phone.length !== 10) {
            toast.error("Phone no must be 10 digit");
            return;
        }

        if (!recaptchaVerifierRef.current) {
            toast.error("Security check not ready. Please wait a moment.");
            return;
        }

        setIsLoading(true);

        const formtPhone = '+91' + phone;

        try {
            const confirmationResult = await signInWithPhoneNumber(
                auth,
                formtPhone,
                recaptchaVerifierRef.current
            );
            window.confirmationResult = confirmationResult;
            setIsMain(false);
            toast.success("OTP sent successfully");
        } catch (error) {
            console.log(error);

            console.error(error);
            toast.error("Failed to send OTP. Please check your number or try again.");
            // Fully reset: clear old verifier, replace DOM element, create fresh verifier
            try { recaptchaVerifierRef.current?.clear(); } catch (_) { }
            recaptchaVerifierRef.current = null;
            resetRecaptchaContainer();
            try {
                recaptchaVerifierRef.current = createRecaptchaVerifier();
            } catch (reinitError) {
                console.error("Failed to re-init reCAPTCHA:", reinitError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="select-none login-signup-wrapper bg-white min-h-screen flex flex-col justify-center items-center px-5 md:px-0 overflow-hidden">
            {/* Subtle animated background gradient orbs */}
            <motion.div
                className="fixed inset-0 pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
            >
                <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(135,99,234,0.08) 0%, transparent 70%)",
                        top: "-10%",
                        right: "-10%",
                    }}
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
                        bottom: "-10%",
                        left: "-10%",
                    }}
                    animate={{
                        x: [0, -20, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>

            <div id="recaptcha-container"></div>

            <TelegramLogo />

            <AnimatePresence mode="wait">
                {isMain ? (
                    <motion.div
                        key="login"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-md relative z-10"
                    >
                        <motion.h1
                            variants={childVariants}
                            className="text-3xl font-semibold text-center text-black mb-2"
                        >
                            Sign in to Linkly
                        </motion.h1>

                        <motion.p
                            variants={childVariants}
                            className="text-md text-gray-400 text-center mb-8"
                        >
                            Linkly Only Available For India Now <br />
                            Sorry For Inconvenience
                        </motion.p>

                        <motion.form
                            variants={childVariants}
                            className="flex flex-col items-center w-full max-w-md"
                            onSubmit={handleSubmit}
                        >
                            <motion.div
                                className="w-full mb-8"
                                variants={childVariants}
                            >
                                <label className="block mb-2 text-sm text-gray-400" htmlFor="phone">Phone Number</label>
                                <motion.div
                                    className="flex items-center"
                                    whileFocus={{ scale: 1.01 }}
                                >
                                    <span className="px-4 py-3 bg-transparent border border-gray-700 rounded-l-lg select-none transition-colors duration-300">+91</span>
                                    <input
                                        autoFocus={true}
                                        id="phone"
                                        type="tel"
                                        className="no-spinner flex-1 px-4 py-3 border-t border-b border-r border-gray-700 bg-transparent rounded-r-lg focus:outline-none focus:border-[#8763ea] transition-all duration-300"
                                        value={phone}
                                        onChange={(e) => {
                                            if (/^\d{0,10}$/.test(e.target.value)) {
                                                setPhone(e.target.value);
                                            }
                                        }}
                                        placeholder=" -----------"
                                        style={{ transition: "border-color 0.3s ease, box-shadow 0.3s ease" }}
                                    />
                                </motion.div>
                            </motion.div>

                            <motion.button
                                type="submit"
                                disabled={isloading}
                                className="w-full py-3 mb-2 bg-[#8763ea] hover:bg-[#7f5feb] text-white font-semibold text-lg rounded-lg transition-colors duration-300 cursor-pointer"
                                variants={buttonVariants}
                                initial="idle"
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <div className="flex flex-row items-center justify-center gap-2">
                                    <AnimatePresence mode="wait">
                                        {isloading ? (
                                            <motion.div
                                                key="spinner"
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Spinner />
                                            </motion.div>
                                        ) : (
                                            <motion.span
                                                key="text"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                NEXT
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.button>
                        </motion.form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="otp"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-md relative z-10"
                    >
                        <OtpInput phone={phone} onBack={handleBack} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
