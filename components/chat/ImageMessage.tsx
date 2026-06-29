"use client";

import { useState, useEffect, useCallback } from "react";
import { FiDownload } from "react-icons/fi";
import type { MessageAttachment } from "@/types";
import { formatFileSize } from "@/lib/formatFileSize";
import { getImageDisplaySize } from "@/lib/compressImage";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import ImageActionMenu from "@/components/chat/ImageActionMenu";
import ImageFullscreenViewer from "@/components/chat/ImageFullscreenViewer";

const DOWNLOADED_KEY = "chat_downloaded_images";

function readDownloadedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DOWNLOADED_KEY);
    return new Set(JSON.parse(raw || "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markDownloaded(messageId: string) {
  const ids = readDownloadedIds();
  ids.add(messageId);
  localStorage.setItem(DOWNLOADED_KEY, JSON.stringify(Array.from(ids)));
}

interface ImageMessageProps {
  attachment: MessageAttachment;
  messageId?: string;
  isOwnMessage: boolean;
}

export default function ImageMessage({
  attachment,
  messageId,
  isOwnMessage,
}: ImageMessageProps) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [fullRevealed, setFullRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);

  const hasPreview = Boolean(attachment.previewUrl);
  const showFull =
    isOwnMessage || !hasPreview || (messageId ? isDownloaded : false);

  useEffect(() => {
    if (messageId && readDownloadedIds().has(messageId)) {
      setIsDownloaded(true);
      setFullRevealed(true);
    }
  }, [messageId]);

  useEffect(() => {
    if (isOwnMessage) setFullRevealed(true);
  }, [isOwnMessage]);

  const srcWidth = attachment.width || 280;
  const srcHeight = attachment.height || 210;
  const { width: displayW, height: displayH } = getImageDisplaySize(
    srcWidth,
    srcHeight,
  );

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(true);
  }, []);

  const handleDownloadComplete = useCallback(() => {
    if (messageId) markDownloaded(messageId);
    setIsDownloaded(true);
    setFullRevealed(true);
  }, [messageId]);

  const previewSrc = resolveMediaUrl(attachment.previewUrl || attachment.url);
  const fullSrc = resolveMediaUrl(attachment.url);

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden bg-black/20 cursor-pointer"
        style={{ width: displayW, height: displayH }}
        onClick={handleImageClick}
        data-image-message
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showFull && fullRevealed ? "opacity-0" : "opacity-100"
          }`}
          style={
            !attachment.previewUrl && !showFull
              ? { filter: "blur(18px)", transform: "scale(1.05)" }
              : undefined
          }
          loading="lazy"
        />

        {showFull && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fullSrc}
            alt={attachment.fileName || "عکس"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              fullRevealed ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setFullRevealed(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = previewSrc;
            }}
          />
        )}

        {!showFull && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center mb-2 border border-white/20">
              <FiDownload size={22} className="text-white" />
            </div>
            {attachment.fileSize != null && (
              <span className="text-xs text-white/90 font-medium drop-shadow">
                {formatFileSize(attachment.fileSize)}
              </span>
            )}
          </div>
        )}
      </div>

      {menuOpen && (
        <ImageActionMenu
          attachment={attachment}
          isOwnMessage={isOwnMessage}
          isDownloaded={isDownloaded}
          onClose={() => setMenuOpen(false)}
          onDownloadComplete={handleDownloadComplete}
          onOpenFullscreen={(url) => {
            setMenuOpen(false);
            setFullscreenSrc(url);
          }}
        />
      )}

      {fullscreenSrc && (
        <ImageFullscreenViewer
          src={fullscreenSrc}
          fileName={attachment.fileName}
          onClose={() => {
            if (fullscreenSrc.startsWith("blob:")) {
              URL.revokeObjectURL(fullscreenSrc);
            }
            setFullscreenSrc(null);
          }}
        />
      )}
    </>
  );
}
