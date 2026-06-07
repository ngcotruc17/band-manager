import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AudioProvider } from "../context/AudioContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";
import GlobalAudioPlayer from "../components/GlobalAudioPlayer";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sắc Band Manager v2.0",
  description: "Hệ thống tự động hóa quản lý nội bộ & biểu diễn Sắc Band",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-850">
        <AuthProvider>
          <AudioProvider>
            <ProtectedRoute>
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  className: "bg-white text-slate-800 border border-slate-200 shadow-xl rounded-2xl font-bold text-xs uppercase tracking-wide",
                }}
              />
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
              <GlobalAudioPlayer />
            </ProtectedRoute>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

