"use client";

import React, { useState, useEffect } from "react";
import api from "../services/api";
import { X, User, Mail, Phone, Music, Save, Loader, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: any) => void;
}

export default function ProfileModal({ user, onClose, onUpdateSuccess }: ProfileModalProps) {
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", instrument: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        instrument: user.instrument || ""
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/profile", formData);
      toast.success("Hồ sơ cá nhân đã được cập nhật thành công!");
      onUpdateSuccess(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      {/* 🍏 iOS Liquid Frosted Glass Sheet */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-3xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] rounded-[2rem] overflow-hidden animate-slide-up transition-all">
        
        {/* Modal Header */}
        <div className="relative h-28 bg-gradient-to-tr from-[#F27024] via-[#FA8C16] to-[#EA580C] p-4">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-all cursor-pointer backdrop-blur-md"
            aria-label="Đóng"
          >
            <X size={18}/>
          </button>
          
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-3xl bg-white p-1 shadow-xl border border-white/60">
              <div className="w-full h-full rounded-[1.25rem] bg-gradient-to-tr from-[#F27024] to-[#EA580C] flex items-center justify-center text-2xl font-black text-white shadow-inner">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-12 space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Cài đặt Hồ sơ Cá nhân</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Thông tin liên hệ & vai trò biểu diễn FPTU Band (Bộ môn & Phòng CTSV ĐH FPT TP.HCM)</p>
          </div>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Họ và tên</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16}/>
                </div>
                <input 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#F27024] outline-none transition-all shadow-2xs" 
                  placeholder="Họ và tên..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16}/>
                </div>
                <input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#F27024] outline-none transition-all shadow-2xs" 
                  placeholder="Email..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Số điện thoại</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16}/>
                  </div>
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#F27024] outline-none transition-all shadow-2xs" 
                    placeholder="SĐT..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Nhạc cụ chính</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Music size={16}/>
                  </div>
                  <input 
                    value={formData.instrument} 
                    onChange={e => setFormData({...formData, instrument: e.target.value})} 
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#F27024] outline-none transition-all shadow-2xs" 
                    placeholder="Guitar, Vocal, Drum..."
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F27024] via-orange-500 to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-5 cursor-pointer"
          >
            {loading ? <Loader className="animate-spin" size={16}/> : <><Save size={16}/> Lưu thay đổi hồ sơ</>}
          </button>
        </form>

      </div>
    </div>
  );
}
