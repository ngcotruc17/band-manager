import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Music, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Lưu ID để update toast sau này
    const toastId = toast.loading('Đang kết nối tới server...');

    try {
      // 🛠️ SỬA ĐỔI: Gọi login và hứng lấy kết quả trả về
      // (Lưu ý: Hàm login trong AuthContext phải return res.data)
      const userData = await login(formData);

      toast.success("Chào mừng trở lại! 🎉", { id: toastId });

      // 👇👇👇 LOGIC KIỂM TRA ĐỔI MẬT KHẨU LẦN ĐẦU 👇👇👇
      if (userData && userData.requireChangePassword) {
          // Nếu Admin bắt đổi pass -> Chuyển sang trang đổi pass
          navigate("/change-password");
      } else {
          // Bình thường -> Vào Dashboard
          navigate("/dashboard");
      }
      
    } catch (err) {
      // Lấy tin nhắn lỗi chính xác từ Backend
      const msg = err.response?.data?.message || "Lỗi kết nối hoặc sai thông tin! 😭";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      {/* Background Animation */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg mb-4 transform rotate-3 hover:rotate-6 transition">
            <Music size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Chào mừng!</h2>
          <p className="text-gray-500 mt-2 text-sm flex items-center justify-center gap-1">
            Quản lý Band nhạc chuyên nghiệp <Sparkles size={14} className="text-yellow-500"/>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition" size={20} />
            <input
              type="text"
              placeholder="Tên đăng nhập"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-sm font-medium"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition" size={20} />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-sm font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          
          <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? "Đang xử lý..." : <>Đăng Nhập <ArrowRight size={20}/></>}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-600 font-bold hover:text-purple-600 transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;