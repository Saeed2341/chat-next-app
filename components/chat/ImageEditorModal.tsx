"use client";

import { useState, useEffect, useMemo } from "react";
import { FiX, FiCheck } from "react-icons/fi";

interface ImageEditorModalProps {
  file: File;
  onConfirm: (file: File, scale: number) => void;
  onCancel: () => void;
}

export default function ImageEditorModal({
  file,
  onConfirm,
  onCancel,
}: ImageEditorModalProps) {
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displaySize = useMemo(() => {
    const w = Math.round(naturalSize.w * scale);
    const h = Math.round(naturalSize.h * scale);
    const maxW = Math.min(320, window.innerWidth - 48);
    const ratio = naturalSize.w > 0 ? Math.min(1, maxW / w) : 1;
    return {
      w: Math.round(w * ratio),
      h: Math.round(h * ratio),
      outW: w,
      outH: h,
    };
  }, [naturalSize, scale]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[95] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiX size={22} className="text-white" />
        </button>
        <span className="text-white font-medium">ویرایش عکس</span>
        <button
          type="button"
          onClick={() => onConfirm(file, scale)}
          className="p-2 rounded-full bg-green-500/80 hover:bg-green-500"
        >
          <FiCheck size={22} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        {previewUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt="پیش‌نمایش"
            className="rounded-xl shadow-2xl object-contain max-h-[50vh] transition-all duration-150"
            style={{
              width: displaySize.w,
              height: displaySize.h,
            }}
            draggable={false}
          />
        )}
      </div>

      <div className="p-6 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <span>اندازه عکس</span>
          <span>
            {displaySize.outW} × {displaySize.outH} px
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={100}
          value={Math.round(scale * 100)}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>کوچک‌تر</span>
          <span>{Math.round(scale * 100)}%</span>
          <span>اصلی</span>
        </div>
      </div>
    </div>
  );
}
