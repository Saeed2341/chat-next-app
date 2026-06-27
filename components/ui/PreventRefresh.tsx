"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function PreventRefresh() {
  const refreshAttemptRef = useRef(0);

  useEffect(() => {
    // 1. جلوگیری از رفرش با کیبورد
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5, Ctrl+R, Ctrl+Shift+R, Cmd+R
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.ctrlKey && e.shiftKey && e.key === "R") ||
        (e.metaKey && e.key === "r")
      ) {
        e.preventDefault();
        
        refreshAttemptRef.current++;
        
        if (refreshAttemptRef.current === 1) {
          toast.error("رفرش صفحه مجاز نیست!", {
            duration: 2000,
          });
        } else if (refreshAttemptRef.current >= 3) {
          toast.error("لطفاً از دکمه خروج استفاده کنید!", {
            duration: 3000,
          });
        }
        
        return false;
      }
    };

    // 2. جلوگیری از کشیدن صفحه برای رفرش در موبایل
    let touchStartY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      if (window.scrollY === 0 && touchStartY < 50) {
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      const touchEndY = e.touches[0].clientY;
      const diff = touchEndY - touchStartY;
      
      if (diff > 50 && window.scrollY === 0) {
        e.preventDefault();
        
        refreshAttemptRef.current++;
        
        if (refreshAttemptRef.current <= 2) {
          toast.error("کشیدن صفحه برای رفرش مجاز نیست!", {
            duration: 1500,
          });
        }
        
        return false;
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
      touchStartY = 0;
    };

    // 3. جلوگیری از کلیک راست
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. نمایش اخطار هنگام خروج از برنامه
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "آیا مطمئن هستید؟ خروج از برنامه باعث قطع اتصال می‌شود.";
      return e.returnValue;
    };

    // اعمال همه preventions
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return null;
}