"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface ImageFullscreenViewerProps {
  src: string;
  fileName?: string;
  onClose: () => void;
}

export default function ImageFullscreenViewer({
  src,
  fileName,
  onClose,
}: ImageFullscreenViewerProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation(); // جلوگیری از انتشار به عناصر پایین‌تر
        onClose();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // جلوگیری از انتشار
          onClose();
        }}
        className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
        aria-label="بستن"
      >
        <FiX size={24} className="text-white" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveMediaUrl(src)}
        alt={fileName || "عکس"}
        className="max-w-full max-h-full object-contain select-none"
        onClick={(e) => e.stopPropagation()} // جلوگیری از بسته‌شدن هنگام کلیک روی خود عکس
        draggable={false}
      />
    </div>
  );
}