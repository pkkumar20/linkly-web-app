import { useState, useContext, useEffect } from 'react';
import { AuthContext } from "./firebase hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@material-tailwind/react";
import toast from 'react-hot-toast';
// import { Input } from "@material-tailwind/react";
export default function EditProfileInputs({ file, emoji, isChanged, Choose, loading, setLoading }) {
    // const [loading, setLoading] = useState(false);
    const { backendUser, updateProfile } = useContext(AuthContext);
    const cnvDate = (date) => {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const inputValue = `${year}-${month}-${day}`;
        return inputValue;
    }
    // Initial values
    const initial = {
        firstname: backendUser != null ? (backendUser.name) : (""),
        lastName: backendUser != null ? (backendUser.lastName) : (""),
        bio: backendUser != null ? (backendUser.bio) : (""),
        username: backendUser != null ? (backendUser.username) : (""),
        dob: backendUser != null ? (cnvDate(backendUser.dob)) : ("")
    };
    const [values, setValues] = useState(initial);
    const [showFab, setShowFab] = useState(false);
    useEffect(() => {
        setShowFab(isChanged);
    }, [isChanged])

    const fabVariants = {
        hidden: {
            opacity: 0,
            scale: 0.7,
            y: 80,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.30
            }
        }
    };
    // Check if any value was changed
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "dob") {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);  // Remove time portion for pure date comparison

            if (selectedDate > today) {
                // Reject or correct future date entry
                toast("Future dates are not allowed.");
                return; // skip updating state
            }
        }
        const updated = { ...values, [name]: value };
        setValues(updated);
        // Show FAB if any field has a different value than initial
        const changed =
            updated.firstname !== initial.firstname ||
            updated.lastName !== initial.lastName ||
            updated.dob !== initial.dob ||
            updated.bio !== initial.bio;

        setShowFab(changed);
        if (isChanged == true) {
            setShowFab(isChanged);
        }
    };

    const handleFabClick = async () => {
        const check = values.firstname.length > 0 && values.dob.length > 0;
        if (check) {
            setLoading(true);
            try {
                const fd = new FormData();
                if (file !== null) {
                    fd.append("file", file);
                    fd.append('profileType', 'image')
                } else if (emoji !== null) {
                    fd.append("emoji", emoji.emoji);
                    fd.append("color", emoji.color);
                    fd.append('profileType', 'emoji')
                } else {
                    fd.append('profileType', backendUser.profile.type)
                    fd.append("color", backendUser.profile.bgColor);
                }
                fd.append("name", values.firstname);
                fd.append("lastName", values.lastName);
                fd.append("bio", values.bio);
                fd.append("dob", values.dob);
                const res = await updateProfile(fd);
                if (res.status === 200) {
                    Choose("Profile")
                    setLoading(false)
                }
            } catch (error) {
                setLoading(false)
                toast.error("somthing went wrong")
                console.log(error);
            }
        }
    };

    const today = new Date().toISOString().split("T")[0];
    return (
        <div className="px-5 py-2">
            <div className="my-6">
                <div class="relative">
                    <input disabled={loading} onChange={handleChange} name='firstname' value={values.firstname} type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                    <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Name</label>
                </div>
            </div>
            <div className="my-6">
                <div class="relative">
                    <input disabled={loading} onChange={handleChange} name='lastName' value={values.lastName} type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                    <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Last Name</label>
                </div>
            </div>
            <div className="my-6">
                <div class="relative">
                    <input disabled={loading} onChange={handleChange} name='bio' value={values.bio} type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                    <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Bio (Optional)</label>
                </div>
            </div>
            <div className="my-6">
                <div class="relative">
                    <input disabled name='firstName' value={values.username} type="text" id="floating_outlined" class="select-none h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                    <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Username</label>
                </div>
            </div>
            <div className="my-6">
                <div className="relative">
                    <input
                        disabled={loading}
                        onChange={handleChange}
                        name="dob"
                        value={values.dob}
                        type="date"
                        max={today}             // Restricts future dates
                        id="floating_dob"
                        className="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                        placeholder=" "
                    />
                    <label
                        htmlFor="floating_dob"
                        className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2
                 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500
                 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2
                 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75
                 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
                    >
                        Date of Birth
                    </label>
                </div>
            </div>
            {showFab && (
                <div className="flex justify-end">
                    <AnimatePresence exitBeforeEnter>
                        <motion.button
                            disabled={loading}
                            onClick={handleFabClick}
                            className="fixed bottom-7  w-14 h-14 bg-[#8763ea] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7c56eb]" // removed transition
                            aria-label="Save"
                            variants={fabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ willChange: "transform, opacity", zIndex: 50 }}
                        >
                            {loading ? (<Spinner />) : (<svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-7 h-7 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>)}

                        </motion.button>
                    </AnimatePresence>

                </div>
            )}

        </div>

    )
}