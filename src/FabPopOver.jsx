import React, { useState } from "react";
import {
    Popover,
    PopoverHandler,
    PopoverContent,
    Typography,
} from "@material-tailwind/react";
import { MdClose, MdModeEditOutline, MdOutlineGroupAdd, MdOutlinePersonAdd, MdCampaign } from "react-icons/md";

export default function FabPopover({ choose }) {
    const [openPopover, setOpenPopover] = useState(false);


    return (
        <div className="absolute bg-transparent bottom-6 right-6 z-10">
            <Popover
                className="min-w-[100px] max-w-[220px]"
                placement="top-end"
                open={openPopover}
                handler={setOpenPopover}

                dismiss={{ enabled: true, outsidePress: true }}
            >
                <PopoverHandler>
                    <div


                        className="p-0 bg-[#8763ea] hover:bg-[#7c56eb] w-14 h-14 rounded-full shadow-lg flex items-center justify-center  "
                        onClick={() => setOpenPopover((v) => !v)}

                    >
                        {openPopover ? (<MdClose size={28} color="white" />) : (< MdModeEditOutline size={28} color="white" />)}

                    </div>
                </PopoverHandler>
                <PopoverContent className="min-w-[100px]  max-w-[220px] px-2 py-2 rounded-xl">
                    <div className="">
                        <button className="flex items-center gap-4 px-4 py-2 hover:bg-gray-100 w-full rounded-lg transition"
                            onClick={() => choose({ Screen: 'NewChanel' })}>
                            <MdCampaign size={22} />
                            <Typography variant="small" color="blue-gray" className="font-medium">
                                New Channel
                            </Typography>
                        </button>
                        <button className="flex items-center gap-4 px-4 py-2 hover:bg-gray-100 w-full rounded-lg transition"
                            onClick={() => choose({ Screen: 'NewGroup' })}>
                            <MdOutlineGroupAdd size={22} />
                            <Typography variant="small" color="blue-gray" className="font-medium">
                                New Group
                            </Typography>
                        </button>
                        <button className="flex items-center gap-4 px-4 py-2 hover:bg-gray-100 w-full rounded-lg transition"
                            onClick={() => choose({ Screen: 'Contact', redirectData: true })}>
                            <MdOutlinePersonAdd size={22} />
                            <Typography variant="small" color="blue-gray" className="font-medium">
                                New Contact
                            </Typography>
                        </button>
                    </div>

                    {/* <List className="p-0 max-w-[200px] "  >
                        <ListItem  selected={false} className=" max-w-[200px] gap-2 px-2 py-2 rounded-lg hover:bg-blue-gray-50 cursor-pointer">
                            <ListItemPrefix>
                                <MdCampaign size={22} />
                            </ListItemPrefix>
                            <Typography className="font-medium text-sm">New Channel</Typography>
                        </ListItem>
                        <ListItem className="max-w-[200px] gap-2 px-2 py-2 rounded-lg hover:bg-blue-gray-50 cursor-pointer">
                            <ListItemPrefix>
                                <MdOutlineGroupAdd size={22} />
                            </ListItemPrefix>
                            <Typography className="font-medium text-sm">New Group</Typography>
                        </ListItem>
                        <ListItem className="max-w-[200px] gap-2 px-2 py-2 rounded-lg hover:bg-blue-gray-50 cursor-pointer">
                            <ListItemPrefix>
                                <MdOutlinePersonAdd size={22} />
                            </ListItemPrefix>
                            <Typography className="font-medium text-sm whitespace-nowrap">New Private Chat</Typography>
                        </ListItem>
                    </List> */}
                </PopoverContent>
            </Popover>
        </div>
    );
}
