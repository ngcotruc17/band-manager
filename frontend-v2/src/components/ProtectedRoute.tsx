"use client";

import React, { useContext, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { Loader } from "lucide-react";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import IdleTimeoutModal from "./IdleTimeoutModal";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const handleIdleTimeout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const { isWarningOpen, countdown, resetTimer } = useIdleTimeout({
    idleTimeMs: 15 * 60 * 1000,
    countdownSeconds: 60,
    onIdleTimeout: handleIdleTimeout,
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (pathname !== "/login" && pathname !== "/register") {
          router.push("/login");
        }
      } else if (user.mustChangePassword && pathname !== "/change-password") {
        router.push("/change-password");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading && pathname !== "/login" && pathname !== "/register") {
    return (
      <div className="min-h-screen bg-transparent text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-[#F27024]" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang kiểm tra bảo mật...</span>
      </div>
    );
  }

  // Nếu người dùng được yêu cầu đổi mật khẩu lần đầu và không ở trang đổi mật khẩu, chặn render trang khác
  if (user && user.mustChangePassword && pathname !== "/change-password") {
    return (
      <div className="min-h-screen bg-transparent text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-[#F27024]" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang chuyển đến trang đổi mật khẩu lần đầu...</span>
      </div>
    );
  }

  // Cho phép render nếu đã có user, hoặc đang truy cập trang login/register
  if (user || pathname === "/login" || pathname === "/register") {
    return (
      <>
        {user && (
          <IdleTimeoutModal
            isOpen={isWarningOpen}
            countdown={countdown}
            onContinue={resetTimer}
            onLogout={() => {
              logout();
              router.push("/login");
            }}
          />
        )}
        {children}
      </>
    );
  }

  return null;
}
