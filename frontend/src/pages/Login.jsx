import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Music, Lock, User, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      {/* Background Động Ảo Diệu */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-600 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000"></div>

      {/* Box Đăng nhập */}
      <div className="relative w-full max-w-md glass-dark rounded-3xl p-8 sm:p-10 z-10 animate-fade-in">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] mb-6 transform rotate-3 hover:rotate-6 transition duration-300">
            <Music size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Sắc Band
          </h2>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5 font-medium">
            Hệ sinh thái quản lý ban nhạc <Sparkles size={14} className="text-fuchsia-400" />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-fuchsia-400 transition" size={20} />
            <input
              type="text"
              placeholder="Tên đăng nhập hoặc Email"
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-white placeholder-slate-500 transition font-medium"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-fuchsia-400 transition" size={20} />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-white placeholder-slate-500 transition font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-violet-600 hover:from-violet-500 to-fuchsia-600 hover:to-fuchsia-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.4)] transform active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Đang mở cửa..." : <><span className="tracking-wide">VÀO HỆ THỐNG</span> <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Thành viên mới?{" "}
          <Link to="/register" className="text-fuchsia-400 font-bold hover:text-fuchsia-300 hover:underline transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;