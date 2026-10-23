"use client";

import React, { useState, useEffect } from "react";
import api from "../services/api";
import { X, User, Mail, Phone, Music, Save, Loader, ShieldCheck } from "lucide-react";
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md overflow-hidden animate-slide-up border border-indigo-500/30 neon-glow-indigo">
        
        {/* Modal Header */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 p-4">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-xl text-white transition-colors"
          >
            <X size={18}/>
          </button>
          
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 p-1 border border-white/20 shadow-2xl">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-14 space-y-4">
          <div>
            <h3 className="text-lg font-black text-white">Cài đặt Hồ sơ Cá nhân</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Cập nhật thông tin chi tiết để ban nhạc liên hệ</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Họ và tên</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16}/>
                </div>
                <input 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-500 outline-none transition-colors" 
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
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-500 outline-none transition-colors" 
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
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-500 outline-none transition-colors" 
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
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-500 outline-none transition-colors" 
                    placeholder="Guitar, Vocal..."
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader className="animate-spin" size={16}/> : <><Save size={16}/> Lưu thay đổi</>}
          </button>
        </form>

      </div>
    </div>
  );
}
