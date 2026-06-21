import {

  Typography,
  List,
  ListItem,
  ListItemPrefix,
 Avatar
} from "@material-tailwind/react";
import {

  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  ArrowLeftIcon,
  AtSymbolIcon,
  PhoneIcon
} from "@heroicons/react/24/outline";
export default function Profile({ Choose, Text }) {
  return (
    <>
      <div className=" bg-white w-full flex items-center gap-4 px-4 py-3 shadow-sm">
        <button className="p-2 rounded-full hover:bg-gray-200 transition duration-150" onClick={() => Choose("Home")}>
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        <div>
          <Typography variant="h5" color="blue-gray">
            Profile
          </Typography>
        </div>
      </div>
      <div className="mt-4 mb-4 flex flex-col items-center justify-center">
        <Avatar
          src="https://docs.material-tailwind.com/img/face-2.jpg"
          alt="avatar"
          size="xxl"

        />
        <div>
          <Typography variant="h5" color="blue-gray">
            Priyanshu Singh
          </Typography>
        </div>
      </div>
      {/* <hr className="my-2 border-blue-gray-50" /> */}
      <List className="p-4">
        <ListItem>
          <ListItemPrefix>
            <PhoneIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              7900550682
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Phone
            </Typography>
          </div>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            < AtSymbolIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              MrHACCER
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Username
            </Typography>
          </div>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <InboxIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              7900550682
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Phone
            </Typography>
          </div>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <UserCircleIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              7900550682
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Phone
            </Typography>
          </div>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              7900550682
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Phone
            </Typography>
          </div>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <PowerIcon className="h-5 w-5" />
          </ListItemPrefix>
          <div>
            <Typography variant="h7" color="blue-gray">
              7900550682
            </Typography>
            <Typography variant="small" color="gray" className="text-sm">
              Phone
            </Typography>
          </div>
        </ListItem>
      </List>
    </>
  );
}