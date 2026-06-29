"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiMoreVertical, FiLogOut } from "react-icons/fi";
import { connectSocket, restoreSocketSession } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UsersList from "@/components/users/UsersList";
import { useChatStore } from "@/store/chatStore";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import UserListSkeleton from "@/components/skeletons/UserListSkeleton";
import type { User } from "@/types";

export default function ChatListPage() {
  const router = useRouter();
  const { username, isAuthenticated, loading: authLoading, logout } = useAuth();
  const cachedUsers = useChatStore((state) => state.users);
  const usersLoaded = useChatStore((state) => state.usersLoaded);
  const [users, setUsersState] = useState<User[]>(cachedUsers);
  const [isLoading, setIsLoading] = useState(!usersLoaded);

  const setUsers = useCallback(
    (updater: User[] | ((prev: User[]) => User[])) => {
      setUsersState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        useChatStore.getState().setUsers(next);
        return next;
      });
    },
    [],
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const socketRef = useRef<any>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);

  useVisualViewport();

  // ریدایرکت به لاگین (با useEffect)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const updateUsersList = useCallback((data: User[]) => {
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

    setUsersState((prevUsers) => {
      if (JSON.stringify(prevUsers) === JSON.stringify(newUsers)) return prevUsers;
      useChatStore.getState().setUsers(newUsers);
      return newUsers;
    });
  }, [username]);

  // بستن منو با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // همگام‌سازی با کش هنگام بازگشت به صفحه
  useEffect(() => {
    if (cachedUsers.length > 0) {
      setUsersState(cachedUsers.filter((u) => u.username !== username));
      setIsLoading(false);
    }
  }, [cachedUsers, username]);

  // تنظیم Socket
  useEffect(() => {
    if (!isAuthenticated || !username) return;

    let active = true;
    const socket = connectSocket();
    socketRef.current = socket;

    restoreSocketSession().then(() => {
      if (active) {
        socket.emit("get_users");
        if (usersLoaded) {
          setIsLoading(false);
        }
      }
    });

    const onUsersList = (data: User[]) => {
      if (!active) return;
      updateUsersList(data);
      setIsLoading(false);
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
        const existingTimeout = typingTimeoutsRef.current.get(sender);
        if (existingTimeout) clearTimeout(existingTimeout);
        
        if (isTyping) {
          setUsers((prev) =>
            prev.map((u) =>
              u.username === sender ? { ...u, isTyping: true } : u
            )
          );
          const timeout = setTimeout(() => {
            setUsers((prev) =>
              prev.map((u) =>
                u.username === sender ? { ...u, isTyping: false } : u
              )
            );
            typingTimeoutsRef.current.delete(sender);
          }, 3000);
          typingTimeoutsRef.current.set(sender, timeout);
        } else {
          const timeout = setTimeout(() => {
            setUsers((prev) =>
              prev.map((u) =>
                u.username === sender ? { ...u, isTyping: false } : u
              )
            );
            typingTimeoutsRef.current.delete(sender);
          }, 2000);
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
  }, [isAuthenticated, username, updateUsersList, usersLoaded]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  // اگر در حال بارگذاری احراز هویت هستیم، اسپینر نشان بده
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // اگر احراز هویت نشده، چیزی نمایش نده (useEffect ریدایرکت می‌کند)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#0a0a0a] via-[#14141e] to-[#1a1a2e] text-white flex flex-col overflow-hidden keyboard-aware">
      {/* هدر شیشه‌ای */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white/5 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
        <div className="text-xl font-bold text-white/90 tracking-wide">
          Chat App
        </div>

        <div className="flex items-center gap-3 relative">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-300 hover:text-white">
            <FiSearch size={20} />
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-300 hover:text-white relative"
          >
            <FiMoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 mt-2 w-48 bg-[#202c33] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-2 z-20"
            >
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-right hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-red-400 hover:text-red-300"
              >
                <FiLogOut size={18} />
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <UserListSkeleton count={8} />
        </div>
      ) : (
        <UsersList users={users} currentUser={username} />
      )}
    </div>
  );
}