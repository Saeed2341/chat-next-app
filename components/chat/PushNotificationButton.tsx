"use client";

import { usePushNotification } from "@/hooks/usePushNotification";
import { useAuth } from "@/hooks/useAuth";
import { FiBell, FiBellOff, FiLoader } from "react-icons/fi";

interface PushNotificationButtonProps {
  className?: string;
}

export default function PushNotificationButton({
  className = "",
}: PushNotificationButtonProps) {
  const { username } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotification(username || undefined);

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <button
        className={`w-full px-4 py-2.5 text-right hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-red-400 hover:text-red-300 cursor-not-allowed opacity-60 ${className}`}
        disabled
      >
        <FiBellOff size={18} />
        <span>اعلان‌ها مسدود شده</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <button
        className={`w-full px-4 py-2.5 text-right hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 text-gray-400 ${className}`}
        disabled
      >
        <FiLoader size={18} className="animate-spin" />
        <span>در حال پردازش...</span>
      </button>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      className={`w-full px-4 py-2.5 text-right hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 ${
        isSubscribed
          ? "text-green-400 hover:text-green-300"
          : "text-white/90 hover:text-white"
      } ${className}`}
    >
      {isSubscribed ? (
        <>
          <FiBell size={18} className="text-green-400" />
          <span>اعلان‌ها فعال است ✅</span>
        </>
      ) : (
        <>
          <FiBell size={18} className="text-white/60" />
          <span>فعال‌سازی اعلان‌ها</span>
        </>
      )}
    </button>
  );
}