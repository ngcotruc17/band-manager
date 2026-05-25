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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8fafc] font-sans">
      {/* Background Blobs (Premium Light Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-violet-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-fuchsia-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-blob animation-delay-4000"></div>

      {/* Box Đăng nhập */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 sm:p-10 z-10 shadow-2xl shadow-slate-200/50 animate-fade-in">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-650 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20 mb-6 transform rotate-3 hover:rotate-6 transition duration-300">
            <Music size={32} />
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent tracking-tight mb-2 uppercase">
            CHÀO MỪNG TRỞ LẠI SẮC BAND
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={20} />
            <input
              type="text"
              placeholder="Tên đăng nhập hoặc Email"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-800 placeholder-slate-400 transition font-medium"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition" size={20} />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-slate-800 placeholder-slate-400 transition font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transform active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "ĐANG ĐĂNG NHẬP" : <><span className="tracking-widest text-xs">ĐĂNG NHẬP</span> <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-sm font-medium">
          Thành viên mới?{" "}
          <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;