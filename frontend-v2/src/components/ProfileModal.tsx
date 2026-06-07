"use client";
 
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { X, User, Mail, Phone, Music, Save, Loader } from "lucide-react";
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
      toast.success("Hồ sơ đã được cập nhật! ✨");
      onUpdateSuccess(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border border-slate-200/50">
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-fuchsia-600">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition"><X size={20}/></button>
           <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[32px] bg-white p-1.5 shadow-xl">
                   <div className="w-full h-full rounded-[26px] bg-slate-100 flex items-center justify-center text-3xl font-black text-indigo-600">
                      {user?.fullName?.charAt(0)}
                   </div>
                </div>
              </div>
           </div>
        </div>
 
        <form onSubmit={handleSubmit} className="p-8 pt-16 space-y-5 text-xs">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Cài đặt hồ sơ</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Cập nhật thông tin để band liên lạc dễ hơn</p>
          </div>
 
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={18}/>
              <input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-850 transition focus:bg-white" 
                placeholder="Họ và tên..."
                required
              />
            </div>
 
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={18}/>
              <input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-850 transition focus:bg-white" 
                placeholder="Email nhận thông báo..."
                required
              />
            </div>
 
            <div className="grid grid-cols-2 gap-3">
               <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={18}/>
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-850 transition text-xs focus:bg-white" 
                    placeholder="SĐT..."
                    required
                  />
               </div>
               <div className="relative group">
                  <Music className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={18}/>
                  <input 
                    value={formData.instrument} 
                    onChange={e => setFormData({...formData, instrument: e.target.value})} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-850 transition text-xs focus:bg-white" 
                    placeholder="Nhạc cụ..."
                  />
               </div>
            </div>
          </div>
 
          <button disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition active:scale-[0.98] flex items-center justify-center gap-2 mt-4 uppercase tracking-widest text-xs">
            {loading ? <Loader className="animate-spin" size={18}/> : <><Save size={18}/> Lưu Thay Đổi</>}
          </button>
        </form>
      </div>
    </div>
  );
}
