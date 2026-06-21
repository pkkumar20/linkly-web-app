
import {

    Typography,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AddMembers from "./AddMember"
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./firebase hooks/AuthContext";
import getColor from "../src/helper/getColor"
import toast from "react-hot-toast";
function AddMemberForChanel({ Choose, rdData }) {
    console.log(rdData);

    const [channelData, setChannelData] = useState(rdData);
    const { addMemberInChanel, contacts } = useContext(AuthContext);
    const [isFabPressed, setIsFabPressed] = useState(false);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleAdd = async () => {
        setLoading(true);
        const getUnjoinedUsers = () => {
            // Extract member IDs from current group (subdocument array)
            const currentMemberIds = channelData.members
                .map(member =>
                    member._id._id || member._id // Handle populated vs raw ObjectId
                ).map(id => id.toString());

            // Filter selected users who are NOT in current group
            return members.filter(user =>
                !currentMemberIds.includes(user.otherMember
                [0]._id
                    ._id.toString())
            );
        };
        const unJoinedUsers = getUnjoinedUsers();
        const getUnjoinedUsersIds = () => {
            return unJoinedUsers.map(user => user.otherMember[0]._id._id)
        };
        const unJoinedUsersIds = getUnjoinedUsersIds();
        if (unJoinedUsersIds.length > 0) {
            const fd = new FormData();
            unJoinedUsersIds.forEach(id => fd.append("memberIds[]", id));
            fd.append("channelId", rdData._id);
            const res = await addMemberInChanel(fd);
            if (res.status == 200) {
                setLoading(false);
                toast.success("Member added successfully")
                console.log("hello", res.data);

                Choose("Home", null, null, null, res.data.contact)
            } else if (res.status == 409) {
                setLoading(false);
                toast.error("Already joined the channel")
            }
        } else {
            setLoading(false);
            toast.success("Already added")
        }

    }
    useEffect(() => {
        if (contacts !== null) {
            const contactData = contacts.find((contact) => contact._id.toString() === rdData._id.toString());
            console.log(contactData)
            setChannelData(contactData)
        }
    }, [contacts, rdData])
    useEffect(() => {
        const executeAdd = async () => {
            if (isFabPressed === true) {
                console.log(members);
                if (members.length > 0) {
                    await handleAdd();
                } else {
                    Choose("Home")
                }

                // Don't need extra setLoading here; handleAdd manages its own


                // Reset flag so button can be pressed again later
                setIsFabPressed(false);
            }
        };

        executeAdd();
    }, [isFabPressed]);
    const fabHandler = (value) => {
        setIsFabPressed(value)
    }
    const MemberHandler = (value) => {
        setMembers(value);
    }
    return (
        <>
            <div className="select-none bg-white w-full flex items-center gap-4 px-4 py-3 m">
                <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                </button>
                <div>
                    <Typography variant="h5" color="blue-gray">
                        Add Susbcribers
                    </Typography>
                </div>

            </div>
            <div className='mt-4 mb-4 flex flex-col items-center justify-center'>
                <AddMembers Choose={(e) => Choose(e)} handler={fabHandler} members={MemberHandler} loading={loading} />
            </div>
        </>
    )
}

export default AddMemberForChanel