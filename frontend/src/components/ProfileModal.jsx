import { useState, useEffect } from "react";
import api from "../services/api";
import { X, User, Mail, Phone, Music, Save, Camera } from "lucide-react";
import toast from "react-hot-toast";

const ProfileModal = ({ user, onClose, onUpdateSuccess }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/profile", formData);
      toast.success("Hồ sơ đã được cập nhật! ✨");
      onUpdateSuccess(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        <div className="relative h-32 bg-gradient-to-r from-violet-600 to-fuchsia-600">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition"><X size={20}/></button>
           <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[32px] bg-white p-1.5 shadow-xl">
                   <div className="w-full h-full rounded-[26px] bg-slate-100 flex items-center justify-center text-3xl font-black text-violet-600">
                      {user?.fullName?.charAt(0)}
                   </div>
                </div>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-16 space-y-5">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Cài đặt hồ sơ</h3>
            <p className="text-sm text-slate-500 font-medium">Cập nhật thông tin để band liên lạc dễ hơn</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition" size={18}/>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-violet-500 outline-none font-bold text-slate-800 transition" placeholder="Họ và tên..."/>
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition" size={18}/>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-violet-500 outline-none font-bold text-slate-800 transition" placeholder="Email nhận thông báo..."/>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition" size={18}/>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-violet-500 outline-none font-bold text-slate-800 transition text-sm" placeholder="SĐT..."/>
               </div>
               <div className="relative group">
                  <Music className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition" size={18}/>
                  <input value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-violet-500 outline-none font-bold text-slate-800 transition text-sm" placeholder="Nhạc cụ..."/>
               </div>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition transform active:scale-95 flex items-center justify-center gap-2 mt-4 uppercase tracking-widest text-xs">
            {loading ? "Đang lưu..." : <><Save size={18}/> Lưu Thay Đổi</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;