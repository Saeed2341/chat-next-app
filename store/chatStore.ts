// src/store/chatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt?: Date;
  seen?: boolean;
  isPinned?: boolean;
  editedAt?: Date | null;
  status?: "sending" | "sent" | "delivered" | "seen";  // ← این خط را اضافه کنید
  replyTo?: {
    messageId: string;
    text: string;
    sender: string;
  };
}

export interface User {
  username: string;
  online: boolean;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageId?: string;
  unread: number;
  isTyping?: boolean;
}

interface ChatState {
  currentUser: string | null;
  users: User[];
  messages: Record<string, Message[]>;
  onlineUsers: Set<string>;
  setCurrentUser: (username: string | null) => void;
  setUsers: (users: User[]) => void;
  updateUserStatus: (username: string, online: boolean) => void;
  setTypingStatus: (username: string, isTyping: boolean) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  clearMessages: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: null,
  users: [],
  messages: {},
  onlineUsers: new Set(),

  setCurrentUser: (username) => set({ currentUser: username }),

  setUsers: (users) => set({ users }),

  updateUserStatus: (username, online) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.username === username ? { ...user, online } : user
      ),
    })),

  setTypingStatus: (username, isTyping) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.username === username ? { ...user, isTyping } : user
      ),
    })),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  updateMessageStatus: (chatId, messageId, status) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((msg) =>
          msg._id === messageId ? { ...msg, ...status } : msg
        ),
      },
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter((msg) => msg._id !== messageId),
      },
    })),

  clearMessages: (chatId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [],
      },
    })),
}));