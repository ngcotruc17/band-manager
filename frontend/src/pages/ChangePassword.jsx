import { useState, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background gradients for premium look */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md text-center relative z-10">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Lock size={28} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Đổi Mật Khẩu Lần Đầu</h2>
        <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
          Vì lý do bảo mật, vui lòng thay đổi mật khẩu mặc định khởi tạo ban đầu để bảo vệ tài khoản của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full p-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Nhập mật khẩu mới..."
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
            <input 
              type={showPassword ? "text" : "password"}
              className="w-full p-3.5 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              placeholder="Nhập lại mật khẩu mới..."
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/15 transition duration-200 hover:shadow-indigo-600/25 active:scale-[0.98] mt-6 flex justify-center items-center text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : "Cập Nhật Mật Khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;