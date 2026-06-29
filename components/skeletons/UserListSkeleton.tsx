"use client";

interface UserListSkeletonProps {
  count?: number;
}

export default function UserListSkeleton({ count = 8 }: UserListSkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 animate-pulse"
        >
          {/* آواتار */}
          <div className="w-12 h-12 rounded-full bg-white/10 shimmer" />
          
          {/* اطلاعات */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded shimmer" />
            <div className="h-3 w-48 bg-white/10 rounded shimmer" />
          </div>
          
          {/* زمان و نشان‌دهنده */}
          <div className="flex flex-col items-end gap-1">
            <div className="h-3 w-12 bg-white/10 rounded shimmer" />
            <div className="h-5 w-5 bg-white/10 rounded-full shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}