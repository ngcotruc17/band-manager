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
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <AudioProvider>
            <ProtectedRoute>
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
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
