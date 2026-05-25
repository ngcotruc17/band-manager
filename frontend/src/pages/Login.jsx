import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Music, Lock, User, ArrowRight, Sparkles, Loader } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang kết nối tới server...");

    try {
      const userData = await login(formData);
      toast.success("Chào mừng trở lại! 🎉", { id: toastId });
      if (userData && userData.mustChangePassword) navigate("/change-password");
      else navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi kết nối hoặc sai thông tin! 😭";
      toast.error(msg, { id: toastId });
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

      {/* Box Đăng nhập */}
      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-8 sm:p-10 z-10 shadow-[0_30px_60px_rgba(15,23,42,0.08)] animate-fade-in">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20 mb-5 transform rotate-3 hover:rotate-6 transition duration-300">
            <Music size={30} />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent tracking-tight uppercase">
            CHÀO MỪNG TRỞ LẠI
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1.5">HỆ THỐNG QUẢN TRỊ SẮC BAND</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Tên đăng nhập hoặc Email</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition" size={18} />
              <input
                type="text"
                placeholder="Nhập username hoặc email..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold text-sm shadow-sm focus:shadow-md"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Mật khẩu</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition" size={18} />
              <input
                type="password"
                placeholder="Nhập mật khẩu của bạn..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all font-semibold text-sm shadow-sm focus:shadow-md"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
                <Loader className="animate-spin" size={16} /> Đang kết nối...
              </span>
            ) : (
              <>
                <span className="tracking-widest text-xs">ĐĂNG NHẬP HỆ THỐNG</span> 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-xs font-bold uppercase tracking-wider">
          Thành viên mới?{" "}
          <Link to="/register" className="text-indigo-600 font-extrabold hover:text-indigo-700 hover:underline transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;