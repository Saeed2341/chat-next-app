"use client";

interface AvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  lastSeen?: Date;
  showStatus?: boolean;
}

export default function Avatar({ 
  username, 
  size = "md", 
  online = false,
  lastSeen,
  showStatus = true 
}: AvatarProps) {
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGradient = (name: string) => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-red-500 to-rose-500",
      "from-indigo-500 to-blue-500",
      "from-teal-500 to-green-500",
      "from-pink-500 to-rose-500",
      "from-amber-500 to-yellow-500",
      "from-violet-500 to-purple-500",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "";
    if (online) return null;
    
    const now = new Date();
    const last = new Date(lastSeen);
    const diff = now.getTime() - last.getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    
    if (diff < 60000) return "آنلاین";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
    if (lastDate.getTime() === today.getTime()) {
      return `امروز در ${last.getHours().toString().padStart(2, "0")}:${last.getMinutes().toString().padStart(2, "0")}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate.getTime() === yesterday.getTime()) {
      return `دیروز در ${last.getHours().toString().padStart(2, "0")}:${last.getMinutes().toString().padStart(2, "0")}`;
    }
    return `${last.getMonth() + 1}/${last.getDate()} در ${last.getHours().toString().padStart(2, "0")}:${last.getMinutes().toString().padStart(2, "0")}`;
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  };

  const statusSize = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const lastSeenText = getLastSeenText();

  return (
    <div className="relative group">
      {/* آواتار با گرادیان و حلقه‌های تزئینی */}
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br ${getGradient(username)} 
        rounded-full flex items-center justify-center 
        font-bold text-white 
        shadow-lg shadow-black/30 
        ring-2 ring-white/20 ring-offset-2 ring-offset-black/50 
        transition-all duration-300 
        group-hover:scale-105 group-hover:shadow-xl group-hover:ring-white/40
      `}>
        {getInitials(username)}
      </div>
      
      {/* دایره آنلاین با انیمیشن چشمک‌زن */}
      {showStatus && online && (
        <div className={`
          absolute bottom-0 right-0 
          ${statusSize[size]} 
          bg-green-500 rounded-full 
          border-2 border-[#111b21] 
          ring-2 ring-green-400/50 
          animate-pulse
        `} />
      )}
      
      {/* متن آخرین بازدید (در صورت عدم آنلاین بودن) */}
      {showStatus && !online && lastSeenText && (
        <div className="absolute -bottom-6 right-0 text-[10px] text-gray-400 whitespace-nowrap">
          {lastSeenText}
        </div>
      )}
    </div>
  );
}