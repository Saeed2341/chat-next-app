"use client";

import { FiX } from "react-icons/fi";

interface ReplyPreviewProps {
  replyTo: {
    _id?: string;
    sender: string;
    text: string;
  } | null;
  currentUser: string;
  onCancel: () => void;
}

export default function ReplyPreview({ replyTo, currentUser, onCancel }: ReplyPreviewProps) {
  if (!replyTo) return null;
  
  const isOwnReply = replyTo.sender === currentUser;
  
  return (
    <div className="mx-2 bg-white/5 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center justify-between border-r-4 border-green-400/60 shadow-lg shadow-black/20">
      <div className="flex-1 text-right">
        <div className="text-xs text-green-300 font-bold">
          {isOwnReply ? "پاسخ به خودتان" : `پاسخ به ${replyTo.sender}`}
        </div>
        <div className="text-sm text-gray-300 truncate max-w-[200px]">
          {replyTo.text}
        </div>
      </div>
      <button onClick={onCancel} className="text-gray-400 hover:text-white transition p-1">
        <FiX size={18} />
      </button>
    </div>
  );
}