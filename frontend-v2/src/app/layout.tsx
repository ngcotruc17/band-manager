import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AudioProvider } from "../context/AudioContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AppShell from "../components/AppShell";
import { Toaster } from "react-hot-toast";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPTU Band Manager - CLB Âm Nhạc Đại Học FPT",
  description: "Hệ thống quản lý ban nhạc sinh viên FPT University & biểu diễn thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-[#F27024] selection:text-white relative">
        {/* 🍏 Fluid iOS Ambient Gradient Mesh Glow - Warm FPT Orange & Amber Mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-500/15 via-amber-400/12 to-transparent rounded-full blur-[110px]" />
          <div className="absolute top-1/4 -right-32 w-[34rem] h-[34rem] bg-gradient-to-bl from-orange-400/12 via-amber-300/10 to-transparent rounded-full blur-[130px]" />
          <div className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] bg-gradient-to-tr from-rose-400/10 via-orange-400/10 to-transparent rounded-full blur-[130px]" />
        </div>

        <AuthProvider>
          <AudioProvider>
            <ProtectedRoute>
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  style: {
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    color: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '1rem',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.12)'
                  }
                }}
              />
              <AppShell>{children}</AppShell>
            </ProtectedRoute>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
