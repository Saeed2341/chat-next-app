"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSocket,
  restoreSocketSession,
  disconnectSocket,
} from "@/lib/socket";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export const useAuth = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getCookie("token");
    const savedUsername = localStorage.getItem("username");

    if (token && savedUsername) {
      setUsername(savedUsername);
      setIsAuthenticated(true);

      restoreSocketSession().then((res) => {
        if (res?.ok) {
          getSocket().emit("get_users");
        }
      });
    } else {
      router.push("/login");
    }

    setLoading(false);
  }, [router]);

  const logout = () => {
    deleteCookie("token");
    localStorage.removeItem("username");
    disconnectSocket();
    setIsAuthenticated(false);
    router.push("/login");
  };

  return {
    username,
    isAuthenticated,
    loading,
    logout,
  };
};
