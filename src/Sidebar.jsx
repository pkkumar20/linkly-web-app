import React, { useState } from "react";
import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Drawer,
  Card,
  Avatar,
  Button,
} from "@material-tailwind/react";

import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  PowerIcon,
  UsersIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import Menu from "./Menu";
import AddPeople from "./AddPeople"; // Import if needed
import Profile from "./Profile";

export function Sidebar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState("main"); // "main" or "submenu"
  const [menuText, setMenuText] = useState(null);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    setCurrentMenu("main");
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setCurrentMenu("main");
    setMenuText(null);
  };

  const handleShowMenu = (text) => {
    setMenuText(text);
    setCurrentMenu("submenu");
  };

  const handleBack = () => {
    setCurrentMenu("main");
    setMenuText(null);
  };

  // Mapping menu text to components and props
  const submenuComponentMap = {
    "My Profile": <Profile Back={handleBack} Text={menuText} />,
    "New Group": <AddPeople Back={handleBack}  />,
    "Contacts": <Menu Back={handleBack} Text={menuText} />,
    "Settings": <Menu Back={handleBack} Text={menuText} />,
  };

  return (
    <>
      <IconButton variant="text" size="lg" onClick={openDrawer}>
        {isDrawerOpen ? (
          <XMarkIcon className="h-8 w-8 stroke-2" />
        ) : (
          <Bars3Icon className=" h-8 w-8 stroke-2" />
        )}
      </IconButton>

      <Drawer open={isDrawerOpen} onClose={closeDrawer} className="">
        <Card className={`${isDrawerOpen?"right-0":"right-20"} w-[100%] h-screen  p-4 overflow-y-auto shadow-xl rounded-none `}>
          {/* Header */}
          {currentMenu === "main" && (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Avatar
                  src="https://docs.material-tailwind.com/img/face-2.jpg"
                  alt="avatar"
                  size="xl"
                />
                <div>
                  <Typography variant="h5" color="blue-gray">
                    Priyanshu Singh
                  </Typography>
                </div>
              </div>

              <hr className="my-2 border-blue-gray-50" />

              {/* Main Menu List */}
              <List>
                <ListItem onClick={() => handleShowMenu("My Profile")}>
                  <ListItemPrefix>
                    <UserCircleIcon className="h-6 w-6" />
                  </ListItemPrefix>
                  My Profile
                </ListItem>
                <hr className="my-2 border-blue-gray-50" />
                <ListItem onClick={() => handleShowMenu("New Group")}>
                  <ListItemPrefix>
                    <UsersIcon className="h-6 w-6" />
                  </ListItemPrefix>
                  New Group
                </ListItem>
                <ListItem onClick={() => handleShowMenu("Contacts")}>
                  <ListItemPrefix>
                    <UserIcon className="h-6 w-6" />
                  </ListItemPrefix>
                  Contacts
                </ListItem>
                <ListItem onClick={() => handleShowMenu("Settings")}>
                  <ListItemPrefix>
                    <Cog6ToothIcon className="h-6 w-6" />
                  </ListItemPrefix>
                  Settings
                </ListItem>
                {/* <ListItem>
                  <ListItemPrefix>
                    <PowerIcon className="h-6 w-6" />
                  </ListItemPrefix>
                  Log Out
                </ListItem> */}
              </List>
            </>
          )}

          {/* Submenu Rendering */}
          {currentMenu === "submenu" && (
            <>
              {/* <Button
                variant="text"
                onClick={handleBack}
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back
              </Button> */}

              {submenuComponentMap[menuText] || (
                <div className="text-gray-600">Coming soon: {menuText}</div>
              )}
            </>
          )}
        </Card>
      </Drawer>
    </>
  );
}
