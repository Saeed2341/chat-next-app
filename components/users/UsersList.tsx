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
      <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
        <MdOutlineMessage size={50} className="mb-3 opacity-50" />
        <p>هیچ کاربر دیگری وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {users.map((user) => (
        <UserItem key={user.username} user={user} currentUser={currentUser} />
      ))}
    </div>
  );
}