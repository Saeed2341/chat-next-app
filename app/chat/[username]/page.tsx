"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { connectSocket, restoreSocketSession } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import ReplyPreview from "@/components/chat/ReplyPreview";
import MessageMenu from "@/components/chat/MessageMenu";

type MessageStatus = "sending" | "sent" | "delivered" | "seen";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  text: string;
  time?: Date;
  createdAt?: Date;
  status?: MessageStatus;
  seen?: boolean;
  isPinned?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    text: string;
    sender: string;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherUsername = params.username as string;

  const {
    username: currentUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const socketRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

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
    (pageNum: number, isLoadMore = false) => {
      if (!isSocketReady || !socketRef.current || !currentUser || !otherUsername) {
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
      } else {
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
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m._id));
              const newMessages = msgs.filter((m) => !existingIds.has(m._id));
              return [...newMessages, ...prev];
            });

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
            setIsLoadingMore(false);
            isLoadingMoreRef.current = false;
          } else {
            setMessages(msgs);
            hasMoreRef.current = msgs.length === 20;
            setIsLoading(false);
            setIsInitialLoadDone(true);
            markMessagesAsSeen(msgs);
          }

          pageRef.current = pageNum;
        },
      );
    },
    [currentUser, otherUsername, isSocketReady, markMessagesAsSeen],
  );

  useEffect(() => {
    setMessages([]);
    setReplyTo(null);
    setIsLoading(true);
    setIsLoadingMore(false);
    setIsInitialLoadDone(false);
    setShowMessages(false);
    pageRef.current = 0;
    hasMoreRef.current = true;
    initialScrollDoneRef.current = false;
    isLoadingMoreRef.current = false;
  }, [otherUsername]);

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
    if (isSocketReady && currentUser && otherUsername && !isInitialLoadDone) {
      loadMessages(0, false);
    }
  }, [
    isSocketReady,
    currentUser,
    otherUsername,
    isInitialLoadDone,
    loadMessages,
  ]);

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

  const handleDeleteMessage = (messageId: string) => {
    if (!socketRef.current) return;
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    socketRef.current.emit("delete_message", {
      messageId,
      sender: currentUser,
      receiver: otherUsername,
    });
    toast.success("پیام حذف شد");
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

  const sendMessage = (text: string) => {
    if (!text || !socketRef.current) return;

    sendTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const currentReply = replyTo;
    const tempId = Date.now().toString();
    const newMessage: Message = {
      _id: tempId,
      sender: currentUser,
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
      (response: any) => {
        if (response?.success && isMountedRef.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === tempId
                ? {
                    ...m,
                    status: "sent" as MessageStatus,
                    _id: response.messageId,
                  }
                : m,
            ),
          );
        }
      },
    );
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
              { ...msg, status: "delivered" as MessageStatus },
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
                ? { ...msg, seen: true, status: "seen" as MessageStatus }
                : msg,
            ),
          );
        }
      };

      const onMessageDelivered = ({ messageId }: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, status: "delivered" as MessageStatus }
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
    <div className="chat-screen h-[100dvh] text-white flex flex-col overflow-hidden relative">
      {/* عکس پس‌زمینه */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/images/chat-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* لایه تاریک ملایم */}
      <div className="absolute inset-0 z-0 bg-black/50" />

      <div className="relative z-10 flex flex-col h-full">
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
        />

        <div
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto p-4 space-y-2 min-h-0 ${
            showMessages ? "opacity-100" : "opacity-0"
          } [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent`}
          onScroll={handleScroll}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-3 sticky top-0 z-10">
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
                key={msg._id}
                message={msg}
                isOwnMessage={msg.sender === currentUser}
                currentUser={currentUser}
                onReplyClick={handleReply}
                onMessageClick={handleMessageClick}
              />
            ))
          )}
        </div>

        <ReplyPreview
          replyTo={replyTo}
          currentUser={currentUser}
          onCancel={cancelReply}
        />

        <ChatInput
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
        />

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