const FULL_MAX_WIDTH = 1280;
const FULL_MAX_HEIGHT = 1280;
const FULL_QUALITY = 0.82;
const PREVIEW_MAX = 320;
const PREVIEW_QUALITY = 0.55;
const PREVIEW_BLUR = 14;

export interface CompressedImage {
  blob: Blob;
  fileSize: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface PreparedImageUpload {
  full: CompressedImage;
  preview: CompressedImage;
  originalWidth: number;
  originalHeight: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      "image/jpeg",
      quality,
    );
  });
}

function fitDimensions(
  width: number,
  height: number,
  maxW: number,
  maxH: number,
) {
  const ratio = Math.min(maxW / width, maxH / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function prepareImageForUpload(
  file: File,
): Promise<PreparedImageUpload> {
  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  const fullSize = fitDimensions(
    originalWidth,
    originalHeight,
    FULL_MAX_WIDTH,
    FULL_MAX_HEIGHT,
  );

  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = fullSize.width;
  fullCanvas.height = fullSize.height;
  const fullCtx = fullCanvas.getContext("2d");
  if (!fullCtx) throw new Error("Canvas not supported");
  fullCtx.drawImage(bitmap, 0, 0, fullSize.width, fullSize.height);

  const fullBlob = await canvasToBlob(fullCanvas, FULL_QUALITY);
  const full: CompressedImage = {
    blob: fullBlob,
    fileSize: fullBlob.size,
    width: fullSize.width,
    height: fullSize.height,
    mimeType: "image/jpeg",
  };

  const previewSize = fitDimensions(
    originalWidth,
    originalHeight,
    PREVIEW_MAX,
    PREVIEW_MAX,
  );

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = previewSize.width;
  previewCanvas.height = previewSize.height;
  const previewCtx = previewCanvas.getContext("2d");
  if (!previewCtx) throw new Error("Canvas not supported");
  previewCtx.filter = `blur(${PREVIEW_BLUR}px)`;
  previewCtx.drawImage(
    bitmap,
    0,
    0,
    previewSize.width,
    previewSize.height,
  );

  bitmap.close();

  const previewBlob = await canvasToBlob(previewCanvas, PREVIEW_QUALITY);
  const preview: CompressedImage = {
    blob: previewBlob,
    fileSize: previewBlob.size,
    width: previewSize.width,
    height: previewSize.height,
    mimeType: "image/jpeg",
  };

  return {
    full,
    preview,
    originalWidth,
    originalHeight,
  };
}

/** @deprecated Use prepareImageForUpload */
export async function compressImage(file: File): Promise<CompressedImage> {
  const prepared = await prepareImageForUpload(file);
  return prepared.full;
}

export function getImageDisplaySize(
  width: number,
  height: number,
  maxWidth = 280,
  maxHeight = 360,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: Math.round(maxWidth * 0.75) };
  }
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
