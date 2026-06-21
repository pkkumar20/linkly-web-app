import React, { useState } from "react";
import {
  Card,
  List,
  ListItem,
  ListItemPrefix,
  Input,
} from "@material-tailwind/react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import TestSidebar from "./TestSidebar";
import SettingMenu from "./Setting";

export default function MenuLayout({ onContactClick }) {
  const [menuType, setMenuType] = useState(""); // '', 'Main-menu', 'Sub-menu'

  const goToSubMenu = () => setMenuType("Sub-menu");
  const goToMainMenu = () => setMenuType("Main-menu");
  const closeAll = () => setMenuType("");

  return (
    <div className="relative h-full">
      {/* Sidebar */}
      <Card className="h-full w-full max-w-[30rem] p-4 shadow-xl shadow-blue-gray-900/5">
        <div className="mb-2 flex items-center gap-4 p-4">
          <TestSidebar
            isOpen={menuType === "Main-menu"}
            openMenu={goToMainMenu}
            closeMenu={closeAll}
            goToSetting={goToSubMenu} // This should only be called when profile is clicked
          />
          <Input icon={<MagnifyingGlassIcon className="h-5 w-5" />} label="Search" />
        </div>

        <List>
          {["Alice", "Bob", "Charlie", "Diana"].map((contact, index) => (
            <ListItem key={index} onClick={() => onContactClick(contact)}>
              <ListItemPrefix>
                <UserCircleIcon className="h-6 w-6" />
              </ListItemPrefix>
              {contact}
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Settings menu overlay - only shown when menuType is "Sub-menu" */}
      {menuType === "Sub-menu" && (
        <div className="absolute top-0 left-0 h-full w-full bg-white z-10">
          <div className="p-4 flex items-center gap-2">
            <button
              onClick={goToMainMenu}
              className="text-blue-600 font-semibold flex items-center gap-1"
            >
              ⬅ Back
            </button>
          </div>
          <SettingMenu />
        </div>
      )}
    </div>
  );
}