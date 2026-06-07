"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { Music, Lock, User, ArrowRight, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, user, loading } = useContext(AuthContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Nếu đã đăng nhập rồi, tự động chuyển về dashboard hoặc change-password
  useEffect(() => {
    if (!loading && user) {
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập và mật khẩu!");
      return;
    }

    setSubmitting(true);
    try {
      await login({ username: username.trim(), password: password.trim() });
      router.push("/dashboard");
    } catch (err) {
      // Lỗi đã được xử lý hiển thị Toast trong AuthContext, không cần in log đỏ ở console
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Nền lưới công nghệ (Tech Grid Background) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
      
      {/* Điểm sáng phát quang (Glow blobs) */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-200/30 rounded-full filter blur-[100px] opacity-75"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-200/20 rounded-full filter blur-[100px] opacity-65"></div>
 
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-[36px] border border-slate-200/60 p-8 md:p-10 shadow-2xl shadow-slate-200/20 space-y-8 relative z-10">
        
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-tr from-indigo-650 to-fuchsia-650 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 transform rotate-6 hover:rotate-12 transition">
            <Music size={26} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight uppercase text-slate-800">Sắc Band Manager</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hệ thống quản lý thời gian thực v2.0</p>
          </div>
        </div>
 
        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên đăng nhập hoặc Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                placeholder="Nhập username hoặc email..."
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mật khẩu</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
 
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/15 transition transform active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={16} /> Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập hệ thống <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">
          Thành viên mới?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline">
            Đăng ký tham gia ngay
          </Link>
        </p>
 
        {/* Footer quy định */}
        <div className="text-center text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-6">
          SẮC BAND - LIVE PERFORMANCE HUB
        </div>
 
      </div>
    </div>
  );
}
