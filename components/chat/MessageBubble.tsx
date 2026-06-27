"use client";

import { BsCheck, BsCheckAll } from "react-icons/bs";
import { HiOutlineClock } from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";

interface Message {
  _id?: string;
  sender: string;
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

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUser: string;
  onReplyClick: (message: Message) => void;
  onMessageClick: (message: Message, event: React.MouseEvent) => void;
}

export default function MessageBubble({ 
  message, 
  isOwnMessage, 
  currentUser, 
  onReplyClick, 
  onMessageClick 
}: MessageBubbleProps) {
  
  const formatTime = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getMessageStatusIcon = (status?: string, seen?: boolean) => {
    if (seen || status === "seen") {
      return <BsCheckAll size={16} className="text-blue-400 font-bold" />;
    }
    switch (status) {
      case "sending":
        return <HiOutlineClock size={14} className="text-gray-400 animate-pulse" />;
      case "sent":
        return <BsCheck size={16} className="text-gray-300 font-bold" />;
      case "delivered":
        return <BsCheckAll size={16} className="text-gray-300 font-bold" />;
      default:
        return null;
    }
  };

  const scrollToRepliedMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => element.classList.remove("highlight-message"), 2000);
    }
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-fade-in group`}
      onClick={(e) => onMessageClick(message, e)}
    >
      <div
        className={`relative px-4 py-2 max-w-[75%] break-words cursor-pointer transition hover:brightness-95 ${
          isOwnMessage
            ? "bg-[#005c4b] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
            : "bg-[#202c33] rounded-tr-2xl rounded-bl-2xl rounded-tl-2xl"
        } ${message.isPinned ? "ring-2 ring-yellow-500/50" : ""}`}
      >
        {message.isPinned && (
          <div className="absolute -top-2 -right-2">
            <FiMapPin size={12} className="text-yellow-500 rotate-45" />
          </div>
        )}
        
        {/* بخش پاسخ به پیام */}
        {message.replyTo && message.replyTo.messageId && (
          <div 
            className={`mb-1 pb-1 pr-2 cursor-pointer hover:opacity-80 transition ${
              isOwnMessage 
                ? "border-r-2 border-r-green-400" 
                : "border-r-2 border-r-green-600"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              scrollToRepliedMessage(message.replyTo!.messageId);
            }}
          >
            <div className="text-xs text-green-400 font-bold">
              {message.replyTo.sender === currentUser ? "پاسخ به خودتان" : `پاسخ به ${message.replyTo.sender}`}
            </div>
            <div className="text-xs text-gray-400 truncate max-w-[200px]">
              {message.replyTo.text}
            </div>
          </div>
        )}
        
        <div className="text-right text-sm pr-2">{message.text}</div>
        
        {message.editedAt && (
          <div className="text-xs text-gray-400 text-left mt-0.5">(ویرایش شده)</div>
        )}
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-300">
            {formatTime(message.time || message.createdAt)}
          </span>
          {isOwnMessage && (
            <span className="inline-flex">
              {getMessageStatusIcon(message.status, message.seen)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}