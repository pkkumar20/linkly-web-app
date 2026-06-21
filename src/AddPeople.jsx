// AddMembers.jsx
import {
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Checkbox from "./Checkbox";
import Chip from "./Chip";
import { useState, useMemo } from "react";

export default function AddMembers({ Back }) {
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Assign stable IDs to contacts once using useMemo
  const contacts = useMemo(
    () =>
      [
        {
          name: "Deleted Account",
          status: "last seen a long time ago",
          avatar: "https://via.placeholder.com/40?text=%F0%9F%91%BB",
        },
        {
          name: "Abhay",
          status: "last seen Jun 2 at 09:51",
          avatar: "https://via.placeholder.com/40?text=A",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
        {
          name: "+918279653243",
          status: "last seen Mar 22 at 19:08",
          avatar: "https://via.placeholder.com/40?text=%E2%9E%95",
        },
      ].map((contact) => ({ ...contact, id: uuidv4() })),
    []
  );

  const handleSelectChange = (checked, contact) => {
    if (checked) {
      setSelectedContacts((prev) => [...prev, contact]);
    } else {
      setSelectedContacts((prev) =>
        prev.filter((user) => user.id !== contact.id)
      );
    }
  };

  const removeUser = (id) => {
    setSelectedContacts((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white max-w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white  px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="text"
            onClick={() => Back("main")}
            className="p-2 min-w-0"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <Typography variant="h5" className="font-medium">
            Add Members
          </Typography>
        </div>

        {/* Chips */}
        <div className="flex gap-2 flex-wrap">
          {selectedContacts.map((user) => (
            <Chip
              key={user.id}
              name={user.name}
              avatar={user.avatar}
              onRemove={() => removeUser(user.id)}
            />
          ))}
        </div>

        <Input
          variant="static"
          placeholder="Add people..."
          className="w-full"
          labelProps={{ className: "hidden" }}
        />
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 thin-scrollbar">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all w-full"
          >
            <Checkbox
              checked={selectedContacts.some((u) => u.id === contact.id)}
              onChange={(checked) => handleSelectChange(checked, contact)}
            />
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-gray-900 truncate">
                {contact.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {contact.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
