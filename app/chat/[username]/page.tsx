"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";
import { connectSocket, restoreSocketSession } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import ReplyPreview from "@/components/chat/ReplyPreview";
import MessageMenu from "@/components/chat/MessageMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useChatStore } from "@/store/chatStore";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { prepareImageForUpload } from "@/lib/compressImage";
import type { Message, MessageAttachment } from "@/types";

export default function ChatPage() {
  // ========== دیالوگ تایید ==========
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonColor?: "red" | "green" | "blue" | "yellow"; // ← رنگ زرد هم اضافه شد
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "تایید",
    cancelText: "انصراف",
    confirmButtonColor: "red",
  });

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "تایید",
    cancelText: string = "انصراف",
    confirmButtonColor: "red" | "green" | "blue" | "yellow" = "red",
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      confirmButtonColor,
    });
  };

  // ========== بقیه state‌ها ==========
  const router = useRouter();
  const params = useParams();
  const otherUsername = params.username as string;
  const chatId = otherUsername;

  const {
    username: currentUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [messages, setMessagesLocal] = useState<Message[]>(() =>
    useChatStore.getState().getMessages(chatId),
  );
  const setMessages = useCallback(
    (value: Message[] | ((prev: Message[]) => Message[])) => {
      const next =
        typeof value === "function"
          ? value(useChatStore.getState().getMessages(chatId))
          : value;
      useChatStore.getState().setChatMessages(chatId, next);
      setMessagesLocal(next);
    },
    [chatId],
  );

  useVisualViewport();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => useChatStore.getState().getMessages(chatId).length === 0,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(
    () => useChatStore.getState().getMessages(chatId).length > 0,
  );
  const [showMessages, setShowMessages] = useState(
    () => useChatStore.getState().getMessages(chatId).length > 0,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchedForChatRef = useRef<string | null>(null);

  // ========== useEffectها ==========
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

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  const markMessagesAsSeen = useCallback(
    (messageList: Message[]) => {
      if (!socketRef.current || !currentUser || !otherUsername) return;

      const unreadIds = messageList
        .filter(
          (m) =>
            m.sender === otherUsername &&
            m.receiver === currentUser &&
            m._id &&
            !/^\d+$/.test(m._id) &&
            !m.seen &&
            m.status !== "seen",
        )
        .map((m) => m._id as string);

      if (unreadIds.length === 0) return;

      socketRef.current.emit(
        "message_seen",
        {
          messageIds: unreadIds,
          sender: otherUsername,
          receiver: currentUser,
        },
        (response: { success?: boolean }) => {
          if (!response?.success || !isMountedRef.current) return;

          setMessages((prev) =>
            prev.map((m) =>
              unreadIds.includes(m._id || "") ? { ...m, seen: true } : m,
            ),
          );
        },
      );
    },
    [currentUser, otherUsername],
  );

  const loadMessages = useCallback(
    (pageNum: number, isLoadMore = false, silent = false) => {
      if (
        !isSocketReady ||
        !socketRef.current ||
        !currentUser ||
        !otherUsername
      ) {
        return;
      }

      if (isLoadMore) {
        if (isLoadingMoreRef.current || !hasMoreRef.current) return;
        setIsLoadingMore(true);
        isLoadingMoreRef.current = true;

        if (messagesContainerRef.current) {
          previousScrollHeightRef.current =
            messagesContainerRef.current.scrollHeight;
        }
      } else if (!silent) {
        setIsLoading(true);
        setShowMessages(false);
        initialScrollDoneRef.current = false;
      }

      socketRef.current.emit(
        "load_messages",
        {
          user1: currentUser,
          user2: otherUsername,
          page: pageNum,
          limit: 20,
        },
        (msgs: Message[]) => {
          if (!isMountedRef.current) return;

          if (isLoadMore) {
            useChatStore.getState().prependChatMessages(chatId, msgs);
            setMessagesLocal(useChatStore.getState().getMessages(chatId));

            requestAnimationFrame(() => {
              if (
                messagesContainerRef.current &&
                previousScrollHeightRef.current
              ) {
                const newScrollHeight =
                  messagesContainerRef.current.scrollHeight;
                const diff = newScrollHeight - previousScrollHeightRef.current;
                messagesContainerRef.current.scrollTop = diff;
              }
            });

            hasMoreRef.current = msgs.length === 20;
            useChatStore.getState().setMessagesMeta(chatId, {
              page: pageNum,
              hasMore: msgs.length === 20,
            });
            setIsLoadingMore(false);
            isLoadingMoreRef.current = false;
          } else {
            if (silent) {
              setMessages((prev) => {
                const serverMap = new Map(
                  msgs.filter((m) => m._id).map((m) => [m._id!, m]),
                );
                const existingIds = new Set(prev.map((m) => m._id));
                const updated = prev.map((m) => {
                  if (m._id && serverMap.has(m._id)) {
                    return { ...m, ...serverMap.get(m._id)! };
                  }
                  return m;
                });
                const newMsgs = msgs.filter(
                  (m) => m._id && !existingIds.has(m._id),
                );
                return [...updated, ...newMsgs];
              });
            } else {
              setMessages(msgs);
            }
            hasMoreRef.current = msgs.length === 20;
            useChatStore.getState().setMessagesMeta(chatId, {
              page: pageNum,
              hasMore: msgs.length === 20,
              isInitialLoadDone: true,
            });
            if (!silent) {
              setIsLoading(false);
            }
            setIsInitialLoadDone(true);
            markMessagesAsSeen(silent ? useChatStore.getState().getMessages(chatId) : msgs);
          }

          pageRef.current = pageNum;
        },
      );
    },
    [currentUser, otherUsername, chatId, isSocketReady, markMessagesAsSeen, setMessages],
  );

  useEffect(() => {
    const cached = useChatStore.getState().getMessages(chatId);
    const meta = useChatStore.getState().getMessagesMeta(chatId);

    setMessagesLocal(cached);
    setReplyTo(null);
    setIsLoadingMore(false);

    if (cached.length > 0) {
      setIsLoading(false);
      setIsInitialLoadDone(meta?.isInitialLoadDone ?? true);
      setShowMessages(true);
      pageRef.current = meta?.page ?? 0;
      hasMoreRef.current = meta?.hasMore ?? true;
      initialScrollDoneRef.current = true;
    } else {
      setIsLoading(true);
      setIsInitialLoadDone(false);
      setShowMessages(false);
      pageRef.current = 0;
      hasMoreRef.current = true;
      initialScrollDoneRef.current = false;
    }

    isLoadingMoreRef.current = false;
    fetchedForChatRef.current = null;
  }, [chatId]);

  useLayoutEffect(() => {
    if (!isInitialLoadDone || initialScrollDoneRef.current) return;

    if (messages.length === 0) {
      initialScrollDoneRef.current = true;
      setShowMessages(true);
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    initialScrollDoneRef.current = true;
    setShowMessages(true);
  }, [isInitialLoadDone, messages]);

  useEffect(() => {
    if (!isSocketReady || !currentUser || !otherUsername) return;
    if (fetchedForChatRef.current === chatId) return;
    fetchedForChatRef.current = chatId;

    const cached = useChatStore.getState().getMessages(chatId);
    const hasCache = cached.length > 0;
    loadMessages(0, false, hasCache);
  }, [isSocketReady, currentUser, otherUsername, chatId, loadMessages]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    if (isLoadingMoreRef.current || !hasMoreRef.current || !isInitialLoadDone) {
      return;
    }

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 200) {
      loadMessages(pageRef.current + 1, true);
    }
  }, [isInitialLoadDone, loadMessages]);

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !currentUser || !otherUsername) return;
      socketRef.current.emit(isTyping ? "typing_start" : "typing_stop", {
        sender: currentUser,
        receiver: otherUsername,
      });
    },
    [currentUser, otherUsername],
  );

  const handleTyping = () => {
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 2000);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("متن کپی شد");
  };

  const handleEditMessage = (msg: Message, newText: string) => {
    if (!socketRef.current) return;
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id ? { ...m, text: newText, editedAt: new Date() } : m,
      ),
    );
    socketRef.current.emit("edit_message", {
      messageId: msg._id,
      sender: currentUser,
      receiver: otherUsername,
      newText,
    });
    toast.success("پیام ویرایش شد");
  };

  // ========== حذف پیام با دیالوگ ==========
  const handleDeleteMessage = (messageId: string) => {
    showConfirmDialog(
      "حذف پیام",
      "آیا از حذف این پیام اطمینان دارید؟",
      () => {
        if (!socketRef.current) return;
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        socketRef.current.emit("delete_message", {
          messageId,
          sender: currentUser,
          receiver: otherUsername,
        });
        toast.success("پیام حذف شد");
      },
      "حذف",
      "انصراف",
      "red",
    );
  };

  const handlePinMessage = (messageId: string) => {
    if (!socketRef.current) return;
    const isPinned = messages.find((m) => m._id === messageId)?.isPinned;
    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg._id === messageId ? { ...msg, isPinned: !isPinned } : msg,
      );
      return updated.sort((a, b) =>
        a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1,
      );
    });
    socketRef.current.emit("pin_message", {
      messageId,
      sender: currentUser,
      receiver: otherUsername,
      isPinned: !isPinned,
    });
    toast.success(isPinned ? "سنجاق لغو شد" : "پیام سنجاق شد");
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleMessageClick = (msg: Message, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    let x = event.clientX + 10;
    let y = event.clientY - 10;

    const menuWidth = 180;
    const menuHeight = 220;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x + menuWidth > windowWidth) x = windowWidth - menuWidth - 10;
    if (x < 10) x = 10;
    if (y + menuHeight > windowHeight) y = windowHeight - menuHeight - 10;
    if (y < 10) y = 10;

    setMenuVisible({ message: msg, x, y });
  };

  // ========== پاک کردن تاریخچه با دیالوگ ==========
  const handleClearHistory = () => {
    if (!socketRef.current || !currentUser || !otherUsername) return;

    setIsMenuOpen(false);

    showConfirmDialog(
      "پاک کردن تاریخچه",
      "آیا از پاک کردن تمام پیام‌های این چت اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
      () => {
        socketRef.current.emit(
          "clear_chat_history",
          { user1: currentUser, user2: otherUsername },
          (response: { success?: boolean }) => {
            if (response?.success) {
              useChatStore.getState().clearChatMessages(chatId);
              setMessagesLocal([]);
              toast.success("تاریخچه پیام‌ها پاک شد");
            } else {
              toast.error("خطا در پاک کردن تاریخچه");
            }
          },
        );
      },
      "پاک کردن",
      "انصراف",
      "red",
    );
  };

  const sendMessage = (text: string) => {
    if (!text || !socketRef.current) return;

    sendTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const currentReply = replyTo;
    const tempId = Date.now().toString();
    const newMessage: Message = {
      _id: tempId,
      clientKey: tempId,
      sender: currentUser!,
      receiver: otherUsername,
      text,
      time: new Date(),
      status: "sending",
      seen: false,
      replyTo: currentReply
        ? {
            messageId: currentReply._id!,
            text: currentReply.text,
            sender: currentReply.sender,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setReplyTo(null);
    requestAnimationFrame(scrollToBottom);

    socketRef.current.emit(
      "private_message",
      {
        sender: currentUser,
        receiver: otherUsername,
        text,
        tempId,
        replyTo: currentReply
          ? {
              messageId: currentReply._id,
              text: currentReply.text,
              sender: currentReply.sender,
            }
          : null,
      },
      (response: { success?: boolean; messageId?: string }) => {
        if (response?.success && isMountedRef.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === tempId
                ? {
                    ...m,
                    status: "sent" as const,
                    _id: response.messageId,
                  }
                : m,
            ),
          );
        }
      },
    );
  };

  const sendImage = async (file: File) => {
    if (!socketRef.current || !currentUser || isUploading) return;

    setIsUploading(true);
    sendTypingStatus(false);

    try {
      const prepared = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append(
        "file",
        prepared.full.blob,
        file.name.replace(/\.[^.]+$/, ".jpg"),
      );
      formData.append(
        "preview",
        prepared.preview.blob,
        file.name.replace(/\.[^.]+$/, "-preview.jpg"),
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const attachment: MessageAttachment = {
        type: "image",
        url: data.url,
        previewUrl: data.previewUrl,
        fileName: file.name,
        fileSize: data.fileSize,
        previewFileSize: data.previewFileSize,
        mimeType: data.mimeType,
        width: prepared.originalWidth,
        height: prepared.originalHeight,
      };

      const currentReply = replyTo;
      const tempId = Date.now().toString();
      const newMessage: Message = {
        _id: tempId,
        clientKey: tempId,
        sender: currentUser,
        receiver: otherUsername,
        text: "",
        time: new Date(),
        status: "sending",
        seen: false,
        attachment,
        replyTo: currentReply
          ? {
              messageId: currentReply._id!,
              text: currentReply.text || "📷 عکس",
              sender: currentReply.sender,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, newMessage]);
      setReplyTo(null);
      requestAnimationFrame(scrollToBottom);

      socketRef.current.emit(
        "private_message",
        {
          sender: currentUser,
          receiver: otherUsername,
          text: "",
          tempId,
          attachment,
          replyTo: currentReply
            ? {
                messageId: currentReply._id,
                text: currentReply.text || "📷 عکس",
                sender: currentReply.sender,
              }
            : null,
        },
        (response: { success?: boolean; messageId?: string }) => {
          if (response?.success && isMountedRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === tempId
                  ? {
                      ...m,
                      status: "sent" as const,
                      _id: response.messageId,
                    }
                  : m,
              ),
            );
          }
        },
      );
    } catch {
      toast.error("خطا در ارسال عکس");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!isAuthenticated || !currentUser) {
      if (!authLoading) router.push("/login");
      return;
    }

    let active = true;
    let cleanupSocket: (() => void) | undefined;

    restoreSocketSession().then(() => {
      if (!active) return;

      const socket = connectSocket();
      socketRef.current = socket;

      const onConnect = () => {
        setIsSocketReady(true);
      };

      const onConnectError = () => {
        setIsSocketReady(false);
      };

      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);

      if (socket.connected) {
        setIsSocketReady(true);
      }

      const onReceiveMessage = (msg: Message) => {
        if (!isMountedRef.current) return;
        if (
          (msg.sender === currentUser && msg.receiver === otherUsername) ||
          (msg.sender === otherUsername && msg.receiver === currentUser)
        ) {
          setMessages((prev) => {
            const next = [
              ...prev,
              { ...msg, status: "delivered" as const },
            ];
            if (msg.sender === otherUsername) {
              markMessagesAsSeen(next);
            }
            return next;
          });
          requestAnimationFrame(scrollToBottom);
        }
      };

      const onMessageEdited = ({ messageId, newText }: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: newText, editedAt: new Date() }
              : msg,
          ),
        );
      };

      const onMessageDeleted = ({ messageId }: any) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      };

      const onMessagePinned = ({ messageId, isPinned }: any) => {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg._id === messageId ? { ...msg, isPinned } : msg,
          );
          return updated.sort((a, b) =>
            a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1,
          );
        });
      };

      const onMessagesSeen = ({ messageIds, sender }: any) => {
        if (sender === currentUser) {
          setMessages((prev) =>
            prev.map((msg) =>
              messageIds.includes(msg._id)
                ? { ...msg, seen: true, status: "seen" as const }
                : msg,
            ),
          );
        }
      };

      const onMessageDelivered = ({ messageId }: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, status: "delivered" as const }
              : msg,
          ),
        );
      };

      const onUsersList = (users: any[]) => {
        if (!isMountedRef.current) return;
        const user = users.find((u) => u.username === otherUsername);
        if (user) {
          setOtherUserOnline(user.online || false);
        }
      };

      const onUserTyping = ({ sender, receiver, isTyping }: any) => {
        if (sender === otherUsername && receiver === currentUser) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }

          if (isTyping) {
            setOtherUserTyping(true);
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
              typingTimeoutRef.current = null;
            }, 3000);
          } else {
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
              typingTimeoutRef.current = null;
            }, 2000);
          }
        }
      };

      socket.on("receive_private_message", onReceiveMessage);
      socket.on("message_edited", onMessageEdited);
      socket.on("message_deleted", onMessageDeleted);
      socket.on("message_pinned", onMessagePinned);
      socket.on("messages_seen", onMessagesSeen);
      socket.on("message_delivered", onMessageDelivered);
      socket.on("users_list", onUsersList);
      socket.on("user_typing", onUserTyping);

      socket.emit("get_users");

      cleanupSocket = () => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onConnectError);
        socket.off("receive_private_message", onReceiveMessage);
        socket.off("message_edited", onMessageEdited);
        socket.off("message_deleted", onMessageDeleted);
        socket.off("message_pinned", onMessagePinned);
        socket.off("messages_seen", onMessagesSeen);
        socket.off("message_delivered", onMessageDelivered);
        socket.off("users_list", onUsersList);
        socket.off("user_typing", onUserTyping);
      };
    });

    return () => {
      active = false;
      isMountedRef.current = false;
      setIsSocketReady(false);
      cleanupSocket?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [
    isAuthenticated,
    currentUser,
    otherUsername,
    authLoading,
    router,
    scrollToBottom,
    markMessagesAsSeen,
  ]);

  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return (
    <div className="chat-screen h-[100dvh] text-white flex flex-col overflow-hidden relative keyboard-aware">
      {/* عکس پس‌زمینه */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/images/chat-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* لایه تاریک ملایم */}
      <div className="absolute inset-0 z-0 bg-black/50" />

      <div className="relative z-10 flex flex-col h-full">
        {/* دیالوگ تایید */}
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={dialogState.onConfirm}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          confirmButtonColor={dialogState.confirmButtonColor}
        />

        {menuVisible && (
          <MessageMenu
            message={menuVisible.message}
            isOwnMessage={menuVisible.message.sender === currentUser}
            onCopy={handleCopyMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onPin={handlePinMessage}
            onReply={handleReply}
            onClose={() => setMenuVisible(null)}
            position={{ x: menuVisible.x, y: menuVisible.y }}
          />
        )}

        <ChatHeader
          otherUsername={otherUsername}
          otherUserOnline={otherUserOnline}
          otherUserTyping={otherUserTyping}
          menu={
            isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute top-full left-0 mt-2 w-48 bg-[#202c33] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-2 z-20"
              >
                <button
                  onClick={handleClearHistory}
                  className="w-full px-4 py-2.5 text-right hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-red-400 hover:text-red-300"
                >
                  <FiTrash2 size={18} />
                  <span>پاک کردن تاریخچه</span>
                </button>
              </div>
            )
          }
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />

        <div
          ref={messagesContainerRef}
          className={`absolute inset-0 overflow-y-auto p-4 pt-[84px] pb-28 space-y-2 chat-messages-area ${
            showMessages ? "opacity-100" : "opacity-0"
          } [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent`}
          onScroll={handleScroll}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-3 sticky top-[72px] z-10">
              <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center py-10 text-gray-400">
              پیامی وجود ندارد
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.clientKey ?? msg._id}
                message={msg}
                isOwnMessage={msg.sender === currentUser}
                currentUser={currentUser}
                onReplyClick={handleReply}
                onMessageClick={handleMessageClick}
              />
            ))
          )}
        </div>

        <div className="relative z-20 mt-auto shrink-0">
          <ReplyPreview
            replyTo={replyTo}
            currentUser={currentUser}
            onCancel={cancelReply}
          />

          <ChatInput
            onSendMessage={sendMessage}
            onSendImage={sendImage}
            onTyping={handleTyping}
            replyTo={replyTo}
            isUploading={isUploading}
          />
        </div>

        <style jsx global>{`
          .highlight-message {
            animation: highlight 2s ease-out;
          }
          @keyframes highlight {
            0% {
              background-color: rgba(34, 197, 94, 0.3);
            }
            100% {
              background-color: transparent;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
