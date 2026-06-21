import React, { useContext, useEffect, useMemo } from 'react';
import { AuthContext } from './firebase hooks/AuthContext';

function MessegeLabel({ chat, messege }) {
  if (chat == null) {
    return;
  }
  if (messege.forContact.toString() !== chat._id.toString()
  ) {
    return;
  }
  const { backendUser } = useContext(AuthContext);



  // ✅ Fix 1: Use useMemo (no state needed, prevents re-renders)
  const otherMembers = useMemo(() =>
    chat.members?.filter(member => member._id?._id !== backendUser?._id) || []
    , [chat.members, backendUser?._id]);

  // ✅ Fix 2: Compute text with useMemo (runs once, no side effects)
  const systemText = useMemo(() => {
    const isYou = messege.systemMessage.creatorId._id === backendUser?._id?.toString();

    if (messege.systemMessage?.type === "groupCreated") {


      if (isYou) {
        return "You created the group";
      }

      // ✅ Fix 3: Safe find with optional chaining


      // ✅ Fix 4: Safe property access

      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} created the group`.trim();
    }
    if (messege.systemMessage?.type === "memberAdded") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You Added ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} added you`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} added ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "memberRemoved") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You removed ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} removed you`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} removed ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "memberBlocked") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You blocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `You are blocked by ${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} `;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} blocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "memberUnBlocked") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You unblock ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `You are unblocked by ${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} `;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} unblocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "memberLeft") {
      if (isYou) {
        return `You left the group`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} left the group`.trim();


    }
    if (messege.systemMessage?.type === "channelJoined") {
      if (isYou) {
        return `You joined the channel`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} Joined the channel`.trim();


    }
    if (messege.systemMessage.type == "channelCreated") {
      const isYou = messege.systemMessage.
        creatorId._id.toString() == backendUser._id.toString();
      if (isYou === true) {
        return "You created the channel"
      }
      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} created the channel`

    }
    if (messege.systemMessage?.type === "channelMemberAdded") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You Added ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} added you`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} added ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "channelMemberRemoved") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You removed ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} removed you`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} removed ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "channelMemberBlocked") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You blocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `You are blocked by ${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} `;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} blocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "channelMemberUnBlocked") {
      const isYouMember = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (isYou) {
        return `You unblock ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`;
      }
      if (isYouMember) {
        return `You are unblocked by ${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} `;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} unblocked ${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''}`.trim();


    }
    if (messege.systemMessage?.type === "channelMemberLeft") {
      if (isYou) {
        return `You left the channel`;
      }


      return `${messege.systemMessage.creatorId.name} ${messege.systemMessage.creatorId.lastName || ''} left the group`.trim();


    }
    if (messege.systemMessage?.type === "groupJoinedByLink") {
      const youJoined = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (youJoined) {
        return `You joined the group by invitation link`;
      }


      return `${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''} Joined the group by invitation link`.trim();


    }
    if (messege.systemMessage?.type === "channelJoinedByLink") {
      const youJoined = messege.systemMessage.memberId._id.toString() === backendUser?._id?.toString();
      if (youJoined) {
        return `You joined the channel by invitation link`;
      }


      return `${messege.systemMessage.memberId.name} ${messege.systemMessage.memberId.lastName || ''} Joined the channel by invitation link`.trim();


    }


  }, [otherMembers, messege.systemMessage, backendUser?._id]);

  return (
    <div className="select-none w-full flex justify-center my-3">
      <div
        className=" bg-white/10 backdrop-blur-xl rounded-full px-4 py-[3px] text-[14px] tracking-wide font-medium text-white max-w-[85%] text-center leading-tight"

      >
        {systemText}
      </div>
    </div>
  );
}

export default MessegeLabel;
