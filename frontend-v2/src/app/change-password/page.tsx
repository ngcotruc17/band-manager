"use client";

import React, { useState, useContext } from "react";
import api from '../../services/api';
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, Loader, Key, Shield, GraduationCap, User } from "lucide-react";

export default function ChangePassword() {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      await api.put(
        "/auth/change-password-first", 
        { newPassword: formData.newPassword }
      );

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", { id: toastId });
      logout(); 
      router.push("/login");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const errMsg = errorObj.response?.data?.message || "Lỗi khi đổi mật khẩu";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden bg-transparent font-sans">
      {/* Ambient concert stage lighting background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-500/12 to-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/8 to-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md ui-card rounded-3xl p-5 sm:p-6 z-10 shadow-[0_20px_50px_-15px_rgba(242,112,36,0.15)] text-center my-auto space-y-3.5">
        <div className="w-12 h-12 bg-orange-50 text-[#F27024] rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-orange-500/20 border border-orange-200/80">
          <Key size={22} />
        </div>
        
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Đổi Mật Khẩu Lần Đầu
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
            Vui lòng thay đổi mật khẩu mặc định để kích hoạt và bảo mật tài khoản của bạn.
          </p>
        </div>

        {user && (
          <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Tài khoản đăng nhập</div>
            <div className="text-xs font-black text-slate-800">{user.fullName} <span className="text-slate-400 font-medium">(@{user.username})</span></div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold">
              <span className="text-slate-400 font-medium">Vai trò:</span>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-[10px]">
                  <Shield size={11} /> Quản trị viên
                </span>
              ) : user.role === 'lecturer' ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px]">
                  <GraduationCap size={11} /> Giảng viên
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[10px]">
                  <User size={11} /> Sinh viên
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={17} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                className="ui-input w-full pl-10 pr-10 py-2.5 text-sm font-medium"
                placeholder="Tối thiểu 6 ký tự..."
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={17} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                className="ui-input w-full pl-10 pr-4 py-2.5 text-sm font-medium"
                placeholder="Nhập lại mật khẩu mới..."
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="ui-button-primary w-full flex justify-center items-center gap-2 mt-3 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="animate-spin" size={16} /> Đang cập nhật...
              </span>
            ) : "Đổi Mật Khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
