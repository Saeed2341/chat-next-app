"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  text: string;
  time?: Date;
  createdAt?: Date;
  status?: "sending" | "sent" | "delivered" | "seen";
  seen?: boolean;
  isPinned?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    text: string;
    sender: string;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onReplyClick: (message: Message) => void;
  onMessageClick: (message: Message, event: React.MouseEvent) => void;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  onScrollToBottom?: () => void;
}

export default function MessageList({ 
  messages, 
  currentUser, 
  onReplyClick, 
  onMessageClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onScrollToBottom
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);

  // اسکرول به پایین
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // تشخیص اسکرول برای لود بیشتر
  const handleScroll = useCallback(async () => {
    if (!containerRef.current) return;
    if (isLoadingMoreRef.current) return;
    
    const { scrollTop } = containerRef.current;
    // وقتی کاربر به بالای صفحه رسید (حداکثر 50px مانده)
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      isLoadingMoreRef.current = true;
      const previousHeight = containerRef.current.scrollHeight;
      
      await onLoadMore();
      
      // حفظ موقعیت اسکرول بعد از لود پیام‌های جدید
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const newHeight = containerRef.current.scrollHeight;
          const diff = newHeight - previousHeight;
          containerRef.current.scrollTop = scrollTop + diff;
        }
        isLoadingMoreRef.current = false;
      });
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // بعد از لود اولیه، به پایین اسکرول کن
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      // با تاخیر کم برای اطمینان از رندر شدن DOM
      setTimeout(() => {
        scrollToBottom("auto");
        onScrollToBottom?.();
      }, 100);
    }
  }, [messages.length, scrollToBottom, onScrollToBottom]);

  // بعد از ارسال پیام جدید، به پایین اسکرول کن
  useEffect(() => {
    if (!isInitialLoadRef.current && messages.length > previousMessagesLengthRef.current) {
      // فقط اگه پیام جدید اضافه شده باشه
      setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2"
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
      
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwnMessage={msg.sender === currentUser}
          currentUser={currentUser}
          onReplyClick={onReplyClick}
          onMessageClick={onMessageClick}
        />
      ))}
    </div>
  );
}