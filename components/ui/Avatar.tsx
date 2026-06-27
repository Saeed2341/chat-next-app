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

  const getColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-amber-500", "bg-lime-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "";
    if (online) return null; // اگر آنلاین است، متن آخرین بازدید نمایش داده نشود
    
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
    <div className="relative">
      <div className={`${sizeClasses[size]} ${getColor(username)} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}>
        {getInitials(username)}
      </div>
      
      {/* فقط دایره آنلاین - بدون متن اضافی */}
      {showStatus && online && (
        <div className={`absolute bottom-0 right-0 ${statusSize[size]} bg-green-500 rounded-full border-2 border-[#111b21] ring-2 ring-green-400/50`} />
      )}
      
      {/* متن آخرین بازدید - فقط در صورتی که آنلاین نباشد */}
      {showStatus && !online && lastSeenText && (
        <div className="absolute -bottom-6 right-0 text-[10px] text-gray-400 whitespace-nowrap">
          {lastSeenText}
        </div>
      )}
    </div>
  );
}