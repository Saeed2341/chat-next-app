// components/ui/ConfirmDialog.tsx
"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "red" | "green" | "blue";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تایید",
  cancelText = "انصراف",
  confirmButtonColor = "red",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // بستن با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // غیرفعال کردن اسکرول صفحه
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // بستن با کلید Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getButtonColor = () => {
    switch (confirmButtonColor) {
      case "red":
        return "bg-red-500/80 hover:bg-red-600/80 border-red-500/30 shadow-red-500/20";
      case "green":
        return "bg-green-500/80 hover:bg-green-600/80 border-green-500/30 shadow-green-500/20";
      case "blue":
        return "bg-blue-500/80 hover:bg-blue-600/80 border-blue-500/30 shadow-blue-500/20";
      default:
        return "bg-red-500/80 hover:bg-red-600/80 border-red-500/30 shadow-red-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/50 max-w-md w-full p-6 animate-scale-up"
      >
        {/* هدر */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white/90">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-400 hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* پیام */}
        <p className="text-gray-300 text-right text-sm leading-relaxed mb-6">
          {message}
        </p>

        {/* دکمه‌ها */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200 text-gray-300 hover:text-white text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl border backdrop-blur-sm transition-all duration-200 text-white text-sm font-medium shadow-lg ${getButtonColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}