import React, { useState } from 'react'

function ChatInfo() {
    const [panelOpen, setPanelOpen] = useState(false);

    return (
        <div>
            
            <header onClick={() => setPanelOpen(true)} className="cursor-pointer">Chat Header</header>
            <div className={`fixed inset-0 z-30 ${panelOpen ? '' : 'pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${panelOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setPanelOpen(false)}
                />
                {/* Slide Panel */}
                <div
                    className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40
          ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <button onClick={() => setPanelOpen(false)} className="p-2">Close</button>
                    {/* Panel Content Here */}
                </div>
                 <div className='mt-4 mb-4 flex flex-col items-center justify-center'>
                              
                </div>
            </div>
        </div>
    )

}

export default ChatInfo