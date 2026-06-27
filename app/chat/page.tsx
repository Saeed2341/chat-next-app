"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiLogOut, FiUsers } from "react-icons/fi";
import { connectSocket, restoreSocketSession } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UsersList from "@/components/users/UsersList";

interface User {
  username: string;
  online: boolean;
  lastSeen?: Date;
  lastMessage?: string;
  lastMessageStatus?: "sending" | "sent" | "delivered" | "seen";
  lastMessageSender?: string;
  lastMessageId?: string; // اضافه شد
  unread: number;
  isTyping?: boolean;
}

export default function ChatListPage() {
  const router = useRouter();
  const { username, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<any>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateUsersList = useCallback((data: User[]) => {
    setUsers(prevUsers => {
      const newUsers = data
        .filter((u) => u.username !== username)
        .map((u) => ({
          ...u,
          unread: u.unread || 0,
          lastMessageStatus: u.lastMessageStatus,
          lastMessageSender: u.lastMessageSender,
          lastMessageId: u.lastMessageId,
          isTyping: false,
        }));
      
      if (JSON.stringify(prevUsers) === JSON.stringify(newUsers)) return prevUsers;
      return newUsers;
    });
  }, [username]);

  useEffect(() => {
    if (!isAuthenticated || !username) return;

    let active = true;
    setIsLoading(false);
    const socket = connectSocket();
    socketRef.current = socket;

    restoreSocketSession().then(() => {
      if (active) {
        socket.emit("get_users");
      }
    });

    const onUsersList = (data: User[]) => {
      updateUsersList(data);
    };

    const onReceiveMessage = (msg: any) => {
      const other = msg.sender === username ? msg.receiver : msg.sender;
      const isOwnMessage = msg.sender === username;
      
      setUsers((prev) =>
        prev.map((u) =>
          u.username === other
            ? {
                ...u,
                lastMessage: msg.text,
                lastMessageStatus: isOwnMessage ? "sent" : undefined,
                lastMessageSender: msg.sender,
                lastMessageId: msg._id,
                unread: !isOwnMessage ? (u.unread || 0) + 1 : u.unread,
                isTyping: false
              }
            : u
        )
      );
    };

    const onMessageDelivered = ({ messageId, sender, receiver }: any) => {
      if (sender === username) {
        setUsers((prev) =>
          prev.map((u) =>
            u.username === receiver && u.lastMessageId === messageId
              ? { ...u, lastMessageStatus: "delivered" }
              : u
          )
        );
      }
    };

    const onMessagesSeen = ({ sender, receiver }: any) => {
      if (sender === username) {
        setUsers((prev) =>
          prev.map((u) =>
            u.username === receiver
              ? { ...u, lastMessageStatus: "seen" }
              : u,
          ),
        );
      }

      if (receiver === username) {
        setUsers((prev) =>
          prev.map((u) =>
            u.username === sender ? { ...u, unread: 0 } : u,
          ),
        );
      }
    };

    const onUserTyping = ({ sender, receiver, isTyping }: any) => {
      if (receiver === username) {
        setUsers((prev) =>
          prev.map((u) =>
            u.username === sender ? { ...u, isTyping } : u
          )
        );
        
        if (isTyping) {
          const existingTimeout = typingTimeoutsRef.current.get(sender);
          if (existingTimeout) clearTimeout(existingTimeout);
          
          const timeout = setTimeout(() => {
            setUsers((prev) =>
              prev.map((u) =>
                u.username === sender ? { ...u, isTyping: false } : u
              )
            );
            typingTimeoutsRef.current.delete(sender);
          }, 3000);
          
          typingTimeoutsRef.current.set(sender, timeout);
        }
      }
    };

    socket.on("users_list", onUsersList);
    socket.on("receive_private_message", onReceiveMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("messages_seen", onMessagesSeen);
    socket.on("user_typing", onUserTyping);

    return () => {
      active = false;
      socket.off("users_list", onUsersList);
      socket.off("receive_private_message", onReceiveMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("messages_seen", onMessagesSeen);
      socket.off("user_typing", onUserTyping);
      
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [isAuthenticated, username, updateUsersList]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="h-[100dvh] bg-[#0b141a] text-white flex flex-col overflow-hidden">
      <div className="p-4 bg-[#111b21] border-b border-gray-800 flex justify-between items-center">
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-lg transition-all duration-200"
        >
          <FiLogOut size={20} />
          <span className="text-sm">خروج</span>
        </button>
        
        <div className="flex items-center gap-2">
          <FiUsers size={20} className="text-green-500" />
          <span className="font-bold">لیست کاربران</span>
        </div>
        
        <div className="w-20" />
      </div>

      <UsersList users={users} currentUser={username} />
    </div>
  );
}