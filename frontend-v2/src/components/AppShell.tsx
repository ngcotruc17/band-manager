"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import GlobalAudioPlayer from "./GlobalAudioPlayer";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  
  // Các trang xác thực / nhập thông tin độc lập không hiển thị Navbar hay AudioPlayer
  // và cần căn giữa chính xác 100% chiều cao màn hình (không chừa khoảng trống pt-16 / pb-20)
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/change-password";

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-20 sm:pt-24 pb-28 lg:pb-16 relative w-full max-w-full overflow-x-hidden min-w-0">
        {children}
      </main>
      <GlobalAudioPlayer />
    </>
  );
}
