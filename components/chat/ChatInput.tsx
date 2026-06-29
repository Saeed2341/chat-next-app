"use client";

import { useRef } from "react";
import { useVisualViewport } from "@/hooks/useVisualViewport";

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
  useVisualViewport();

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
    <div className="chat-input-bar p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl mx-2 mb-2 shadow-2xl shadow-black/40">
      <div className="flex flex-row-reverse gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          enterKeyHint="send"
          className="flex-1 p-3 rounded-full bg-white/10 backdrop-blur-sm text-right outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-white placeholder:text-gray-400 border border-white/5"
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
          className="bg-green-500/70 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-600/70 transition-all duration-200 shrink-0 border border-white/10 shadow-lg shadow-green-500/20"
        >
          <svg
            className="w-5 h-5 rotate-180 text-white"
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
    </div>
  );
}