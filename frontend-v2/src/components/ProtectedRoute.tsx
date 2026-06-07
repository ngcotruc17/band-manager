"use client";

import React, { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-indigo-650" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang kiểm tra bảo mật...</span>
      </div>
    );
  }

  // Cho phép render nếu đã có user, hoặc đang truy cập trang login/register
  if (user || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return null;
}
