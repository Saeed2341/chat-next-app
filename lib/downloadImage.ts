import { resolveMediaUrl } from "./mediaUrl";

export async function downloadImageWithProgress(
  url: string,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const resolved = resolveMediaUrl(url);
  const response = await fetch(resolved, { credentials: "include" });
  if (!response.ok) throw new Error("Download failed");

  const total = Number(response.headers.get("content-length") || 0);
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    onProgress(100);
    return blob;
  }

  const chunks: BlobPart[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) {
      onProgress(Math.min(100, Math.round((received / total) * 100)));
    } else {
      onProgress(Math.min(95, Math.round(received / 1024)));
    }
  }

  onProgress(100);
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return new Blob(chunks, { type: mimeType });
}

export async function saveImageBlob(blob: Blob, fileName: string): Promise<void> {
  const name = fileName || "image.jpg";
  const file = new File([blob], name, { type: blob.type || "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
