"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { Music, Lock, User, ArrowRight, Loader, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, user, loading } = useContext(AuthContext);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      // Toast error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Ambient concert stage lighting background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/5 to-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 🍏 iOS Fluid Frosted Glass Login Sheet */}
      <div className="w-full max-w-md ui-card p-6 sm:p-8 space-y-5 relative z-10 my-auto shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] rounded-[2rem]">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/25">
            <Music size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>SẮC BAND ECOSYSTEM</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Đăng Nhập Hệ Thống</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cổng điều hành lịch diễn, tập ráp & sân khấu số</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                placeholder="Username hoặc email..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                Mật khẩu
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="ui-input w-full pl-11 pr-11 py-3 text-sm font-medium"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="ui-button-primary w-full flex items-center justify-center gap-2 mt-2 py-3.5 text-sm"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={16} /> Đang xác thực...
              </>
            ) : (
              <>
                Đăng Nhập Vào Ban Nhạc <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Helper for convenient access */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-left">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tài khoản truy cập nhanh</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setUsername("admin"); setPassword("admin123"); }}
              className="flex-1 py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition text-center shadow-2xs"
            >
              Trưởng Ban (admin)
            </button>
            <button
              type="button"
              onClick={() => { setUsername("member"); setPassword("member123"); }}
              className="flex-1 py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition text-center shadow-2xs"
            >
              Nhạc Công (member)
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center text-xs font-medium text-slate-500 pt-3 border-t border-slate-100">
          Nhạc công / thành viên mới?{" "}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold underline ml-1">
            Đăng ký gia nhập Sắc Band
          </Link>
        </div>

      </div>
    </div>
  );
}
