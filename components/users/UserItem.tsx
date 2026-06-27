"use client";

import Link from "next/link";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import Avatar from "@/components/ui/Avatar";

interface UserItemProps {
  user: {
    username: string;
    online: boolean;
    lastSeen?: Date;
    lastMessage?: string;
    lastMessageStatus?: "sending" | "sent" | "delivered" | "seen";
    lastMessageSender?: string;
    unread: number;
    isTyping?: boolean;
  };
  currentUser: string;
}

export default function UserItem({ user, currentUser }: UserItemProps) {
  
  const getLastMessageStatusIcon = (status?: string, lastMessageSender?: string) => {
    // فقط برای پیام‌های ارسالی خودمان
    if (lastMessageSender !== currentUser) return null;
    
    switch (status) {
      case "sending":
        return <BsCheck size={14} className="text-gray-500 ml-1" />;
      case "sent":
        return <BsCheck size={14} className="text-gray-400 ml-1" />;
      case "delivered":
        return <BsCheckAll size={14} className="text-gray-400 ml-1" />;
      case "seen":
        return <BsCheckAll size={14} className="text-blue-400 ml-1" />;
      default:
        return <BsCheck size={14} className="text-gray-400 ml-1" />;
    }
  };

  return (
    <Link
      href={`/chat/${user.username}`}
      className="block p-4 border-b border-gray-800 hover:bg-[#202c33] transition-all duration-200 group"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <Avatar 
            username={user.username} 
            size="md" 
            online={user.online}
            lastSeen={user.lastSeen}
            showStatus={false}
          />
          <div className="text-right flex-1">
            <div className="font-bold group-hover:text-green-400 transition">
              {user.username}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {user.isTyping ? (
                <div className="flex items-center gap-1 text-green-400">
                  <span>در حال نوشتن...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  {getLastMessageStatusIcon(user.lastMessageStatus, user.lastMessageSender)}
                  <span className="truncate max-w-[150px]">
                    {user.lastMessage || "هیچ پیامی نیست"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* فقط دایره تعداد پیام‌های نخوانده - حذف دایره سفید */}
        {user.unread > 0 && (
          <div className="bg-green-600 text-xs min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full font-bold">
            {user.unread}
          </div>
        )}
      </div>
    </Link>
  );
}