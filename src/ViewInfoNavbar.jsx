import React, { useEffect } from "react";
import {
    Navbar,
    Typography,
   Button
} from "@material-tailwind/react";

function NavList() {

    return (
        <ul className="my-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
          
            <Button className="rounded-full bg-[#8763ea]" >Download</Button>
            
          </ul>
    );
}

export function ViewInfoNavbar() {
    const [openNav, setOpenNav] = React.useState(false);

    const handleWindowResize = () =>
        window.innerWidth >= 960 && setOpenNav(false);

    React.useEffect(() => {
        window.addEventListener("resize", handleWindowResize);

        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, []);

    return (
        <Navbar className="mx-auto max-w-screen-3xl px-6 py-3">
            <div className="flex items-center justify-between text-blue-gray-900">
                {/* Logo + Linkly - Start */}
                <div className="flex items-center space-x-4 cursor-pointer">
                    <TelegramLogo />
                    <Typography
                       
                        variant="h5"
                        className="cursor-pointer py-1.5 font-bold"
                    >
                        Linkly
                    </Typography>
                </div>

                {/* Button - End */}
                <div className="ml-auto">
                    <NavList />
                </div>
            </div>
        </Navbar>
    );
}

function TelegramLogo() {
    return (
            <div className="bg-[#8763ea] rounded-full w-12 h-12 flex items-center justify-center p-1 ">
                <svg
                    fill="#000000"
                    viewBox="0 0 24 24"
                    id="messenger"
                    data-name="Line Color"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon line-color w-16 h-16"
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
     
    );
}