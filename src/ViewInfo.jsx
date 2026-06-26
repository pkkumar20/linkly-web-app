import React, { useState,useEffect,useContext } from 'react'
import { ViewInfoNavbar } from './ViewInfoNavbar'
import bg from "./background/bg1.png";
import JoinGroupCard from './JoinGroupCard';

function ViewInfo() {
   
 
    return (
      <div className='h-[100dvh] w-screen overflow-hidden' style={{
          background: `url('${bg}')`, backgroundSize: "cover",
          backgroundPosition: "center",
      }}>
          <ViewInfoNavbar />
          <JoinGroupCard/>
    </div>
  )
}

export default ViewInfo