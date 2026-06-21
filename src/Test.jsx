import React, { useState,useContext } from 'react'
import { Button } from "@material-tailwind/react";
import { AuthContext } from './firebase hooks/AuthContext';
function Notification() {
  const { sendMessage, messeges } = useContext(AuthContext);
  console.log(messeges);
  const [messege, setMessege] = useState("")
  const [id, setId] = useState("")
  const handleClick = async() => {
    try {
      const res = await sendMessage(messege,id);
      console.log(res);
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className='px-3'>
      <div className="my-8 ">
        <div class="relative">
          <input name='id' value={id} onChange={e => { setId(e.target.value); console.log(id.length)}}  type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
          <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Id</label>
        </div>
      </div>
      <div className="my-8 ">
        <div class="relative">
          <input  name='firstname' value={messege} onChange={e=>setMessege(e.target.value)}  type="text" id="floating_outlined" class="h-14 block px-2.5 pb-2.5 pt-4 w-full text-md text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
          <label htmlFor="floating_outlined" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Name</label>
        </div>
      </div>
      <Button disabled={messege.length <= 0 && id.length == 24} onClick={handleClick}> Send</Button>
    </div>
  )
}

export default Notification