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
  isMenuOpen,
}: ChatHeaderProps) {
  return (
    <header className="chat-header-glass fixed top-0 left-0 right-0 z-30 px-2 pt-2 pb-2">
      <div className="flex items-center justify-between p-3 bg-white/[0.08] backdrop-blur-2xl border border-white/15 rounded-4xl shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
          >
            <FiArrowRight
              size={22}
              className="text-gray-300 group-hover:text-green-400 transition"
            />
          </Link>

          <Avatar
            username={otherUsername}
            size="md"
            online={otherUserOnline}
            lastSeen={otherUserLastSeen}
            showStatus={false}
          />
        </div>

        <div className="flex-1 text-right mr-3">
          <div className="font-bold text-lg text-white drop-shadow-lg">
            {otherUsername}
          </div>
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
    </header>
  );
}
