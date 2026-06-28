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
    if (lastMessageSender !== currentUser) return null;
    
    switch (status) {
      case "sending":
        return <BsCheck size={14} className="text-gray-500" />;
      case "sent":
        return <BsCheck size={14} className="text-gray-400" />;
      case "delivered":
        return <BsCheckAll size={14} className="text-gray-400" />;
      case "seen":
        return <BsCheckAll size={14} className="text-blue-400" />;
      default:
        return <BsCheck size={14} className="text-gray-400" />;
    }
  };

  return (
    <Link
      href={`/chat/${user.username}`}
      className="block py-3 border-b border-white/5 hover:bg-white/5 transition-colors duration-150"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Avatar 
            username={user.username} 
            size="md"
            online={user.online}
            showStatus={true}
          />
          <div className="text-right flex-1 min-w-0">
            <div className="text-lg font-semibold text-white/90 truncate">
              {user.username}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              {user.isTyping ? (
                <span className="text-green-400">در حال نوشتن...</span>
              ) : (
                <>
                  {getLastMessageStatusIcon(user.lastMessageStatus, user.lastMessageSender)}
                  <span className="truncate">
                    {user.lastMessage || "هیچ پیامی نیست"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {user.unread > 0 && (
          <div className="bg-green-500/80 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm shadow-green-500/20">
            {user.unread}
          </div>
        )}
      </div>
    </Link>
  );
}