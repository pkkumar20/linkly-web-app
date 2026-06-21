import "./hide.css"
import React, { useState } from "react";
import toast from 'react-hot-toast';
import OTpInput from 'react-otp-input';
import { useNavigate, useLocation } from "react-router";
import { GrFormEdit } from "react-icons/gr";
import { Spinner } from "@material-tailwind/react";
// You can replace this with your own SVG or logo image if desired
function TelegramLogo() {

    return (
        <div className="flex justify-center items-center">
            <div className="bg-[#8763ea] rounded-full w-48 h-48 flex items-center justify-center mb-6 mt-10">
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


            </div>
        </div>
    );
}

function OtpInput({ phone, onBack }) {
    const [isloading, setIsLoading] = useState(false);
    const inputStyle = {
        width: "3rem",
        height: "3rem",
        margin: "0 0.5rem",
        fontSize: "2rem",
        borderRadius: "0.5rem",
        border: "1px solid #ddd",
        background: "#f8fafc",
        textAlign: "center",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s"
    };

    const focusStyle = {
        border: "1.5px solid #6366f1",
        boxShadow: "0 0 0 2px #dbeafe"
    };
    const [otp, setOtp] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (otp.length == 6) {
            setIsLoading(true)
            window.confirmationResult.confirm(otp).then(async (res) => {
                
                setIsLoading(false);
                toast.success("Loged in sucessfully")
            }).catch((err) => {
                console.log(err)
                setIsLoading(false);
                toast.error("Invalid otp")
            })


        } else {
            toast.error("Invalid otp")
            setIsLoading(false)
        }


    }
    return (
        <>
            <div className="flex flex-row items-center justify-center ">
                <h1 className="text-3xl font-semibold text-center text-black mb-2 cursor-pointer">+91 {phone}  </h1>
                <GrFormEdit size={33} onClick={() => onBack(true)} className="cursor-pointer text-gray-700" />
            </div>


            <p className="text-md text-gray-400 text-center mb-8 cursor-default">
                We have sent you a message on that no <br />
                with the code.
            </p>
            <form className="flex flex-col items-center w-full max-w-md" onSubmit={(e) => handleSubmit(e)}>
                <div className="w-full mb-8">

                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <OTpInput
                            value={otp}
                            onChange={setOtp}
                            numInputs={6}
                            inputType={"tel"}
                            renderInput={(props) => <input {...props} className="no-spinner" />}
                            shouldAutoFocus={true}
                            inputStyle={inputStyle}
                            focusStyle={focusStyle}
                            containerStyle={{}}
                            separator={<span style={{ width: '0.5em' }} />}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isloading}
                    className="w-full py-3 mb-2 bg-[#8763ea] hover:bg-[#7f5feb] text-white font-semibold text-lg rounded-lg transition"
                >
                    <div className="flex flex-row items-center justify-center gap-2">
                        {isloading == true ? (<Spinner />) : (" NEXT")}

                    </div>

                </button>
            </form>
        </>
    )
}

export default OtpInput