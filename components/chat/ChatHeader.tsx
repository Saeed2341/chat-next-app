"use client";

import Link from "next/link";
import { FiArrowRight, FiMoreVertical } from "react-icons/fi";
import Avatar from "@/components/ui/Avatar";

interface ChatHeaderProps {
  otherUsername: string;
  otherUserOnline: boolean;
  otherUserLastSeen?: Date;
  otherUserTyping: boolean;
}

export default function ChatHeader({ 
  otherUsername, 
  otherUserOnline, 
  otherUserLastSeen,
  otherUserTyping 
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#111b21] border-b border-gray-800 sticky top-0 z-10">
      <Link
        href="/chat"
        className="p-2 hover:bg-[#202c33] rounded-full transition-all duration-200 group"
      >
        <FiArrowRight size={22} className="group-hover:text-green-500 transition" />
      </Link>
      
      <div className="flex items-center gap-3">
        <Avatar 
          username={otherUsername} 
          size="sm" 
          online={otherUserOnline}
          lastSeen={otherUserLastSeen}
          showStatus={true}
        />
        <div>
          <div className="font-bold text-lg">{otherUsername}</div>
          <div className="text-xs">
            {otherUserTyping ? (
              <div className="flex items-center gap-1 text-green-400">
                <span>در حال نوشتن...</span>
              </div>
            ) : (
              <span className="text-gray-400">
                {otherUserOnline ? "آنلاین" : "آفلاین"}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <button className="p-2 hover:bg-[#202c33] rounded-full transition-all duration-200">
        <FiMoreVertical size={20} className="text-gray-400" />
      </button>
    </div>
  );
}