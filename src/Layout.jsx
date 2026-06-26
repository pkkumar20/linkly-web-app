import React, { useState } from "react";
import Navbar from "./Navbar"; // your sidebar
import ChatArea from "./ChatArea"; // you’ll create this

export default function Layout() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          w-full md:w-1/3 lg:w-1/4 
          border-r border-gray-200 
          ${activeChat ? "hidden md:block" : "block"}
        `}
      >
        <Navbar Choose={(chat) => setActiveChat(chat)} />
      </div>

      {/* Chat Area */}
      <div
        className={`
          flex-1 
          ${activeChat ? "block" : "hidden md:block"}
        `}
      >
        {activeChat ? (
          <ChatArea
            chat={activeChat}
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <div className="hidden md:flex h-full items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
