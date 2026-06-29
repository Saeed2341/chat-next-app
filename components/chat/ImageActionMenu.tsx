"use client";

import { useState, useCallback } from "react";
import {
  FiDownload,
  FiMaximize2,
  FiSave,
  FiX,
} from "react-icons/fi";
import type { MessageAttachment } from "@/types";
import { formatFileSize } from "@/lib/formatFileSize";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import {
  downloadImageWithProgress,
  saveImageBlob,
} from "@/lib/downloadImage";
import toast from "react-hot-toast";

interface ImageActionMenuProps {
  attachment: MessageAttachment;
  isOwnMessage: boolean;
  isDownloaded: boolean;
  onClose: () => void;
  onDownloadComplete: () => void;
  onOpenFullscreen: (url: string) => void;
}

export default function ImageActionMenu({
  attachment,
  isOwnMessage,
  isDownloaded,
  onClose,
  onDownloadComplete,
  onOpenFullscreen,
}: ImageActionMenuProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadedBlob, setDownloadedBlob] = useState<Blob | null>(null);

  const needsDownload =
    !isOwnMessage && Boolean(attachment.previewUrl) && !isDownloaded;

  const ensureFullImage = useCallback(async (): Promise<Blob | null> => {
    if (downloadedBlob) return downloadedBlob;
    if (!needsDownload && attachment.url) {
      try {
        setProgress(0);
        const blob = await downloadImageWithProgress(
          attachment.url,
          setProgress,
        );
        setDownloadedBlob(blob);
        onDownloadComplete();
        return blob;
      } catch {
        toast.error("خطا در بارگذاری عکس");
        return null;
      } finally {
        setProgress(null);
      }
    }
    if (needsDownload && attachment.url) {
      try {
        setProgress(0);
        const blob = await downloadImageWithProgress(
          attachment.url,
          setProgress,
        );
        setDownloadedBlob(blob);
        onDownloadComplete();
        return blob;
      } catch {
        toast.error("خطا در دانلود عکس");
        return null;
      } finally {
        setProgress(null);
      }
    }
    return null;
  }, [
    attachment.url,
    downloadedBlob,
    needsDownload,
    onDownloadComplete,
  ]);

  const handleDownload = async () => {
    const blob = await ensureFullImage();
    if (blob) toast.success("عکس دانلود شد");
  };

  const handleSave = async () => {
    const blob = await ensureFullImage();
    if (!blob) return;
    try {
      await saveImageBlob(blob, attachment.fileName || "image.jpg");
      toast.success("عکس ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره عکس");
    }
  };

  const handleFullscreen = async () => {
    if (needsDownload && !downloadedBlob && !isDownloaded) {
      const blob = await ensureFullImage();
      if (blob) {
        onOpenFullscreen(URL.createObjectURL(blob));
      }
      return;
    }
    onOpenFullscreen(resolveMediaUrl(attachment.url));
  };

  const isBusy = progress !== null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1f2c34] border border-white/10 rounded-t-2xl p-4 pb-6 shadow-2xl animate-slide-up-menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-medium">عکس</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10"
          >
            <FiX size={20} className="text-gray-400" />
          </button>
        </div>

        {attachment.fileSize != null && (
          <p className="text-xs text-gray-400 mb-3 text-right">
            حجم: {formatFileSize(attachment.fileSize)}
          </p>
        )}

        {isBusy && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>در حال دانلود...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-200"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          {needsDownload && (
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDownload}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-right disabled:opacity-50"
            >
              <FiDownload size={20} className="text-green-400 shrink-0" />
              <span className="text-white">دانلود عکس</span>
            </button>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-right disabled:opacity-50"
          >
            <FiSave size={20} className="text-blue-400 shrink-0" />
            <span className="text-white">ذخیره در دستگاه</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={handleFullscreen}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-right disabled:opacity-50"
          >
            <FiMaximize2 size={20} className="text-purple-400 shrink-0" />
            <span className="text-white">نمایش تمام‌صفحه</span>
          </button>
        </div>
      </div>
    </div>
  );
}
