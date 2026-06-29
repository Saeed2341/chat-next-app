"use client";

import { useRef, useCallback } from "react";
import { FiPaperclip } from "react-icons/fi";
import { useVisualViewport } from "@/hooks/useVisualViewport";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onImageSelected: (file: File) => void;
  onTyping: () => void;
  replyTo: unknown;
  isUploading?: boolean;
}

const MAX_TEXTAREA_HEIGHT = 120;

export default function ChatInput({
  onSendMessage,
  onImageSelected,
  onTyping,
  replyTo,
  isUploading = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useVisualViewport();

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  const handleSendMessage = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value.trim();
    if (!text) return;

    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
    onSendMessage(text);

    requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = () => {
    adjustHeight();
    onTyping();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file);
    }
    e.target.value = "";
  };

  const keepFocus = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="chat-input-bar p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl mx-2 mb-2 shadow-2xl shadow-black/40">
      <div className="flex flex-row-reverse gap-2 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          enterKeyHint="enter"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-gramm="false"
          data-form-type="other"
          className="chat-textarea flex-1 p-3 rounded-4xl bg-white/10 backdrop-blur-sm text-right outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-white placeholder:text-gray-400 border border-white/5 resize-none overflow-y-auto leading-relaxed"
          placeholder={
            replyTo ? "پاسخ خود را بنویسید..." : "پیامت را بنویس..."
          }
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          disabled={isUploading}
          onMouseDown={keepFocus}
          onTouchStart={keepFocus}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/10 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 shrink-0 border border-white/10 disabled:opacity-50"
          aria-label="ارسال عکس"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiPaperclip size={20} className="text-gray-300" />
          )}
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onTouchStart={keepFocus}
          onClick={handleSendMessage}
          className="bg-green-500/70 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-600/70 transition-all duration-200 shrink-0 border border-white/10 shadow-lg shadow-green-500/20"
          aria-label="ارسال پیام"
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
