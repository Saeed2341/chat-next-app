"use client";

interface MessageSkeletonProps {
  count?: number;
}

export default function MessageSkeleton({ count = 6 }: MessageSkeletonProps) {
  return (
    <div className="space-y-3 px-2">
      {Array.from({ length: count }).map((_, i) => {
        // پیام‌های خودی و دیگران به‌صورت متناوب
        const isOwn = i % 2 === 0;
        return (
          <div
            key={i}
            className={`flex ${isOwn ? "justify-start" : "justify-end"} animate-pulse`}
          >
            <div
              className={`px-4 py-3 rounded-2xl ${
                isOwn
                  ? "bg-green-500/20 rounded-bl-none"
                  : "bg-white/10 rounded-br-none"
              } max-w-[75%] space-y-2 shimmer-container`}
              style={{ width: `${60 + Math.random() * 25}%` }}
            >
              {/* متن (اختیاری) */}
              <div className="h-4 w-full bg-white/10 rounded shimmer" />
              <div className="h-4 w-3/4 bg-white/10 rounded shimmer" />
              
              {/* زمان */}
              <div className="flex justify-end">
                <div className="h-3 w-12 bg-white/10 rounded shimmer" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}