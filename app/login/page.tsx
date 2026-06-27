"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { emitWithAck, markSessionRestored } from "@/lib/socket";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getCookie("token");
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      router.push("/chat");
    }
    setIsChecking(false);
  }, [router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("لطفاً نام کاربری و رمز عبور را وارد کنید");
      return;
    }

    setLoading(true);

    try {
      const res: any = await emitWithAck("login", { username, password });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      setCookie("token", res.token, 7);
      localStorage.setItem("username", res.username);
      markSessionRestored();

      toast.success("ورود موفقیت‌آمیز بود");
      router.push("/chat");
    } catch (error: any) {
      toast.error(error?.message || "خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("لطفاً نام کاربری و رمز عبور را وارد کنید");
      return;
    }

    if (username.length < 3) {
      toast.error("نام کاربری باید حداقل ۳ کاراکتر باشد");
      return;
    }

    if (password.length < 4) {
      toast.error("رمز عبور باید حداقل ۴ کاراکتر باشد");
      return;
    }

    setLoading(true);

    try {
      const res: any = await emitWithAck("register", { username, password });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("ثبت‌نام موفقیت‌آمیز بود. حالا وارد شوید");
      setIsRegister(false);
      setPassword("");
      setUsername("");
    } catch (error: any) {
      toast.error(error?.message || "خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-[#0b141a] text-white">
      <div className="w-[360px] bg-[#111b21] p-6 rounded-2xl shadow-xl">
        <h1 className="text-center text-2xl font-bold mb-6">
          {isRegister ? "ثبت‌نام" : "ورود"}
        </h1>

        <input
          type="text"
          className="w-full p-3 mb-3 rounded-xl bg-[#202c33] text-right outline-none focus:ring-2 focus:ring-green-500 transition-all"
          placeholder="نام کاربری"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !loading &&
            (isRegister ? handleRegister() : handleLogin())
          }
          autoComplete="off"
          disabled={loading}
        />

        <input
          type="password"
          className="w-full p-3 mb-5 rounded-xl bg-[#202c33] text-right outline-none focus:ring-2 focus:ring-green-500 transition-all"
          placeholder="رمز عبور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !loading &&
            (isRegister ? handleRegister() : handleLogin())
          }
          disabled={loading}
        />

        <button
          onClick={isRegister ? handleRegister : handleLogin}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed p-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isRegister ? "ثبت‌نام" : "ورود"}
        </button>

        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setUsername("");
            setPassword("");
          }}
          disabled={loading}
          className="w-full mt-3 text-gray-400 hover:text-white disabled:opacity-50 text-sm transition-all duration-200"
        >
          {isRegister
            ? "قبلاً ثبت‌نام کرده‌اید؟ ورود"
            : "ثبت‌نام نکرده‌اید؟ عضویت"}
        </button>
      </div>
    </div>
  );
}
