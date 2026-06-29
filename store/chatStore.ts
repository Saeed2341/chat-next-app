import { create } from "zustand";
import type { Message, User } from "@/types";

interface MessagesMeta {
  page: number;
  hasMore: boolean;
  isInitialLoadDone: boolean;
}

interface ChatState {
  users: User[];
  usersLoaded: boolean;
  messages: Record<string, Message[]>;
  messagesMeta: Record<string, MessagesMeta>;

  setUsers: (users: User[]) => void;
  setUsersLoaded: (loaded: boolean) => void;

  getMessages: (chatId: string) => Message[];
  getMessagesMeta: (chatId: string) => MessagesMeta | undefined;
  setChatMessages: (
    chatId: string,
    messages: Message[],
    meta?: Partial<MessagesMeta>,
  ) => void;
  prependChatMessages: (chatId: string, messages: Message[]) => void;
  updateMessages: (
    chatId: string,
    updater: (prev: Message[]) => Message[],
  ) => void;
  clearChatMessages: (chatId: string) => void;
  setMessagesMeta: (chatId: string, meta: Partial<MessagesMeta>) => void;
}

const defaultMeta: MessagesMeta = {
  page: 0,
  hasMore: true,
  isInitialLoadDone: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  usersLoaded: false,
  messages: {},
  messagesMeta: {},

  setUsers: (users) => set({ users, usersLoaded: true }),

  setUsersLoaded: (loaded) => set({ usersLoaded: loaded }),

  getMessages: (chatId) => get().messages[chatId] || [],

  getMessagesMeta: (chatId) => get().messagesMeta[chatId],

  setChatMessages: (chatId, messages, meta) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
      messagesMeta: {
        ...state.messagesMeta,
        [chatId]: { ...defaultMeta, ...state.messagesMeta[chatId], ...meta },
      },
    })),

  prependChatMessages: (chatId, newMessages) =>
    set((state) => {
      const existing = state.messages[chatId] || [];
      const existingIds = new Set(existing.map((m) => m._id));
      const filtered = newMessages.filter((m) => !existingIds.has(m._id));
      return {
        messages: {
          ...state.messages,
          [chatId]: [...filtered, ...existing],
        },
      };
    }),

  updateMessages: (chatId, updater) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: updater(state.messages[chatId] || []),
      },
    })),

  clearChatMessages: (chatId) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: [] },
      messagesMeta: {
        ...state.messagesMeta,
        [chatId]: { ...defaultMeta },
      },
    })),

  setMessagesMeta: (chatId, meta) =>
    set((state) => ({
      messagesMeta: {
        ...state.messagesMeta,
        [chatId]: { ...defaultMeta, ...state.messagesMeta[chatId], ...meta },
      },
    })),
}));
