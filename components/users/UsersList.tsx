"use client";

import { MdOutlineMessage } from "react-icons/md";
import UserItem from "./UserItem";

interface User {
  username: string;
  online: boolean;
  lastSeen?: Date;
  lastMessage?: string;
  lastMessageStatus?: "sending" | "sent" | "delivered" | "seen";
  lastMessageSender?: string;
  unread: number;
  isTyping?: boolean;
}

interface UsersListProps {
  users: User[];
  currentUser: string;
}

export default function UsersList({ users, currentUser }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
        <MdOutlineMessage size={48} className="opacity-30" />
        <p className="text-sm">هیچ کاربری موجود نیست</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
      {users.map((user) => (
        <UserItem key={user.username} user={user} currentUser={currentUser} />
      ))}
    </div>
  );
}