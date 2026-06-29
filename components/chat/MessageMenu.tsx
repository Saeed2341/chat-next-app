"use client";

import { useState } from "react";
import { FiCopy, FiEdit2, FiTrash2, FiMapPin, FiCornerUpLeft, FiSave } from "react-icons/fi";
import type { MessageAttachment } from "@/types";

interface Message {
  _id?: string;
  sender: string;
  text: string;
  isPinned?: boolean;
}

interface MessageMenuProps {
  message: Message;
  isOwnMessage: boolean;
  onCopy: (text: string) => void;
  onEdit: (message: Message, newText: string) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onReply: (message: Message) => void;
  onClose: () => void;
  position: { x: number; y: number };
  attachment?: MessageAttachment; // جدید
  onSaveToGallery?: (attachment: MessageAttachment) => void; // جدید
}

export default function MessageMenu({ 
  message, 
  isOwnMessage, 
  onCopy, 
  onEdit, 
  onDelete, 
  onPin, 
  onReply, 
  onClose, 
  position,
  attachment,
  onSaveToGallery,
}: MessageMenuProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const getAdjustedPosition = () => {
    const menuWidth = 180;
    const menuHeight = 260; // افزایش ارتفاع به خاطر گزینه جدید
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = position.x;
    let y = position.y;
    
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    if (x < 10) x = 10;
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }
    if (y < 10) y = 10;
    
    return { x, y };
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message, editText.trim());
    }
    setIsEditing(false);
    onClose();
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-[#111b21] rounded-2xl p-4 w-96 mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-3 text-right">ویرایش پیام</h3>
          <textarea
            className="w-full p-3 rounded-lg bg-[#202c33] text-right outline-none focus:ring-2 focus:ring-green-600 resize-none"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition">
              انصراف
            </button>
            <button onClick={handleEdit} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition">
              ذخیره
            </button>
          </div>
        </div>
      </div>
    );
  }

  const adjustedPos = getAdjustedPosition();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-[#202c33] rounded-xl shadow-lg py-2 min-w-[180px]"
        style={{ top: adjustedPos.y, left: adjustedPos.x }}
      >
        <button
          onClick={() => { onReply(message); onClose(); }}
          className="w-full px-4 py-2.5 text-right hover:bg-[#2a3942] flex items-center gap-3 transition"
        >
          <FiCornerUpLeft size={16} />
          <span>پاسخ</span>
        </button>
        
        <button
          onClick={() => { onCopy(message.text); onClose(); }}
          className="w-full px-4 py-2.5 text-right hover:bg-[#2a3942] flex items-center gap-3 transition"
        >
          <FiCopy size={16} />
          <span>کپی متن</span>
        </button>
        
        {isOwnMessage && (
          <>
            <button
              onClick={() => { setIsEditing(true); }}
              className="w-full px-4 py-2.5 text-right hover:bg-[#2a3942] flex items-center gap-3 transition"
            >
              <FiEdit2 size={16} />
              <span>ویرایش</span>
            </button>
            
            <button
              onClick={() => { onDelete(message._id!); onClose(); }}
              className="w-full px-4 py-2.5 text-right hover:bg-red-600/20 text-red-400 flex items-center gap-3 transition"
            >
              <FiTrash2 size={16} />
              <span>حذف</span>
            </button>
          </>
        )}
        
        <button
          onClick={() => { onPin(message._id!); onClose(); }}
          className="w-full px-4 py-2.5 text-right hover:bg-[#2a3942] flex items-center gap-3 transition"
        >
          <FiMapPin size={16} />
          <span>{message.isPinned ? "لغو سنجاق" : "سنجاق کردن"}</span>
        </button>

        {/* گزینه ذخیره در گالری در صورت وجود عکس */}
        {attachment && onSaveToGallery && (
          <button
            onClick={() => { onSaveToGallery(attachment); onClose(); }}
            className="w-full px-4 py-2.5 text-right hover:bg-[#2a3942] flex items-center gap-3 transition"
          >
            <FiSave size={16} />
            <span>ذخیره در گالری</span>
          </button>
        )}
      </div>
    </>
  );
}