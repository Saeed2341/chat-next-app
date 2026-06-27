"use client";

import { useRef } from "react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  replyTo: any;
}

export default function ChatInput({
  onSendMessage,
  onTyping,
  replyTo,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (!inputRef.current) return;
    const text = inputRef.current.value.trim();
    if (!text) return;

    inputRef.current.value = "";
    onSendMessage(text);

    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const keepFocus = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="chat-input-bar p-3 bg-[#111b21] flex flex-row-reverse gap-2 border-t border-gray-800 shrink-0">
      <input
        ref={inputRef}
        type="text"
        enterKeyHint="send"
        className="flex-1 p-3 rounded-full bg-[#202c33] text-right outline-none focus:ring-2 focus:ring-green-600 transition-all text-white placeholder:text-gray-400"
        placeholder={replyTo ? "پاسخ خود را بنویسید..." : "پیامت را بنویس..."}
        onChange={onTyping}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <button
        type="button"
        onMouseDown={keepFocus}
        onTouchStart={keepFocus}
        onClick={handleSendMessage}
        className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-700 transition-all duration-200 shrink-0"
      >
        <svg
          className="w-5 h-5 rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
