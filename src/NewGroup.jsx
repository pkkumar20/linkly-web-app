
import {

    Typography,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import AddMembers from "./AddMember"
import { useEffect, useState } from "react";
function NewGroup({ Choose,selectedMembers }) {
    const [isFabPressed, setIsFabPressed] = useState(false);
    const [members, setMembers] = useState([]);
    useEffect(() => {
        if (isFabPressed === true) {
            Choose("NewGroupFinalPage", null, members);
        }
    },[isFabPressed])
    const fabHandler = (value) => {
        setIsFabPressed(value)
    }
    const MemberHandler = (value) => {
        setMembers(value);
    }
  return (
      <>
          <div className=" bg-white w-full flex items-center gap-4 px-4 py-3 m">
              <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
                  <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
              </button>
              <div>
                  <Typography variant="h5" color="blue-gray">
                     Add Member
                  </Typography>
              </div>
              
          </div>
          <div className='mt-4 mb-4 flex flex-col items-center justify-center'>
              <AddMembers Choose={(data)=>Choose(data)} handler={fabHandler} members={MemberHandler} />
          </div>
      </>
  )
}

export default NewGroup