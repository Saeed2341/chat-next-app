"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiLogOut, FiUsers, FiSearch, FiMoreVertical } from "react-icons/fi";
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
  lastMessageId?: string;
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
    <div className="h-[100dvh] bg-gradient-to-br from-[#0a0a0a] via-[#14141e] to-[#1a1a2e] text-white flex flex-col overflow-hidden">
      {/* هدر شیشه‌ای با ارتفاع بیشتر */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white/5 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
        {/* سمت چپ: نام برنامه */}
        <div className="text-xl font-bold text-white/90 tracking-wide">
          Chat App
        </div>

        {/* سمت راست: دو آیکون */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-300 hover:text-white">
            <FiSearch size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-300 hover:text-white">
            <FiMoreVertical size={20} />
          </button>
        </div>
      </div>

      <UsersList users={users} currentUser={username} />
    </div>
  );
}