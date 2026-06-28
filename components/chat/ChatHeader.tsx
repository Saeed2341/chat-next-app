"use client";

import Link from "next/link";
import { FiArrowRight, FiMoreVertical } from "react-icons/fi";
import Avatar from "@/components/ui/Avatar";

interface ChatHeaderProps {
  otherUsername: string;
  otherUserOnline: boolean;
  otherUserLastSeen?: Date;
  otherUserTyping: boolean;
  menu?: React.ReactNode;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function ChatHeader({ 
  otherUsername, 
  otherUserOnline, 
  otherUserLastSeen,
  otherUserTyping,
  menu,
  onMenuToggle,
  isMenuOpen
}: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl mx-2 mt-2 shadow-2xl shadow-black/40">
      {/* بخش چپ: دکمه برگشت + آواتار */}
      <div className="flex items-center gap-3">
        <Link
          href="/chat"
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
        >
          <FiArrowRight size={22} className="text-gray-300 group-hover:text-green-400 transition" />
        </Link>
        
        <Avatar 
          username={otherUsername} 
          size="md"
          online={otherUserOnline}
          lastSeen={otherUserLastSeen}
          showStatus={false}
        />
      </div>
      
      {/* بخش وسط: نام کاربر + وضعیت */}
      <div className="flex-1 text-right mr-3">
        <div className="font-bold text-lg text-white drop-shadow-lg">{otherUsername}</div>
        <div className="text-xs">
          {otherUserTyping ? (
            <div className="flex items-center gap-1 text-green-300 justify-start">
              <span>در حال نوشتن...</span>
            </div>
          ) : (
            <span className="text-gray-400">
              {otherUserOnline ? "آنلاین" : "آخرین بازدید به تازگی"}
            </span>
          )}
        </div>
      </div>
      
      {/* دکمه سه نقطه با منو */}
      <div className="relative">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200"
        >
          <FiMoreVertical size={20} className="text-gray-400" />
        </button>
        {isMenuOpen && menu}
      </div>
    </div>
  );
}