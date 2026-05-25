import { useState, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, Loader, Key } from "lucide-react";

const ChangePassword = () => {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp!");
    }
    
    if (formData.newPassword.length < 6) {
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      // Dùng service api đã cấu hình sẵn thay vì axios chưa import
      await api.put(
        "/auth/change-password-first-time", 
        { newPassword: formData.newPassword }
      );

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", { id: toastId });
      
      // Đăng xuất để user đăng nhập lại với pass mới
      logout(); 
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi đổi mật khẩu", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8fafc] font-sans">
      {/* Premium Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>

      {/* Background Blobs (Premium Light Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-200/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-8 sm:p-10 z-10 shadow-[0_30px_60px_rgba(15,23,42,0.08)] animate-fade-in text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100/50">
          <Key size={26} />
        </div>
        
        <h2 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent tracking-tight">
          ĐỔI MẬT KHẨU LẦN ĐẦU
        </h2>
        <p className="text-slate-500 text-xs mt-2.5 mb-8 leading-relaxed font-semibold">
          Vì lý do an toàn bảo mật, vui lòng thay đổi mật khẩu mặc định được cấp ban đầu để bắt đầu sử dụng hệ thống.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Mật khẩu mới</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full pl-12 pr-10 py-3.5 bg-white/90 border border-slate-200/80 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold text-sm shadow-sm focus:shadow-md"
                placeholder="Tối thiểu 6 ký tự..."
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Xác nhận mật khẩu mới</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-slate-200/80 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold text-sm shadow-sm focus:shadow-md"
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
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex justify-center items-center text-xs tracking-wider uppercase mt-8"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="animate-spin" size={16} /> Đang cập nhật...
              </span>
            ) : "Cập Nhật Mật Khẩu 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;