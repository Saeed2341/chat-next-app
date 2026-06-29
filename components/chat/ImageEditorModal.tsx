"use client";

import { useState, useRef, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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
  const [previewUrl, setPreviewUrl] = useState("");
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) {
      onConfirm(file, 1);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const image = imgRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.92);
      });

      const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
      // scale را 1 می‌فرستیم چون برش انجام شده و نیازی به تغییر اندازه نیست
      onConfirm(croppedFile, 1);
    } catch (error) {
      console.error("Crop error:", error);
      onConfirm(file, 1); // در صورت خطا، فایل اصلی را برگردان
    }
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/90 flex flex-col">
      {/* هدر */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiX size={22} className="text-white" />
        </button>
        <span className="text-white font-medium">برش عکس</span>
        <button
          type="button"
          onClick={handleConfirm}
          className="p-2 rounded-full bg-green-500/80 hover:bg-green-500"
        >
          <FiCheck size={22} className="text-white" />
        </button>
      </div>

      {/* منطقه برش */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {previewUrl && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined} // نسبت ابعاد آزاد
            className="max-h-full max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={previewUrl}
              alt="پیش‌نمایش"
              className="object-contain max-h-[60vh]"
            />
          </ReactCrop>
        )}
      </div>

      {/* راهنما */}
      <div className="p-4 text-center text-gray-400 text-sm border-t border-white/10">
        برای برش، ناحیه مورد نظر را روی تصویر انتخاب کنید.
      </div>
    </div>
  );
}