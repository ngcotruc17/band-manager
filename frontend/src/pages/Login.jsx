import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom"; // 👈 Thêm useLocation
import { Music, Lock, User, ArrowRight, Sparkles, CheckCircle, X } from "lucide-react"; // 👈 Thêm icon cho Toast
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Hook để lấy dữ liệu từ trang Register
  const [loading, setLoading] = useState(false);
  
  // State cho Popup thông báo từ trang Register
  const [registerSuccessToast, setRegisterSuccessToast] = useState(null);

  // 👇 1. HIỆU ỨNG: Kiểm tra nếu có tin nhắn từ trang Register gửi sang
  useEffect(() => {
    if (location.state?.message) {
      setRegisterSuccessToast(location.state.message);
      
      // Xóa state lịch sử để F5 không hiện lại
      window.history.replaceState({}, document.title);

      // Tự tắt sau 5 giây
      const timer = setTimeout(() => setRegisterSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // 👇 2. XỬ LÝ ĐĂNG NHẬP (Giữ nguyên logic cũ của bạn)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Đang kết nối tới server...');

    try {
      const userData = await login(formData);

      toast.success("Chào mừng trở lại! 🎉", { id: toastId });

      if (userData && userData.requireChangePassword) {
          navigate("/change-password");
      } else {
          navigate("/dashboard");
      }
      
    } catch (err) {
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
            Quản lý band nhạc chuyên "nghiệp" <Sparkles size={14} className="text-yellow-500"/>
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

      {/* 👇👇👇 3. PHẦN CUSTOM TOAST (GÓC PHẢI DƯỚI) 👇👇👇 */}
      {registerSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-in-right">
          <div className="bg-white border-l-4 border-green-500 shadow-2xl rounded-lg p-4 flex items-start gap-3 max-w-sm">
             <div className="text-green-500 mt-0.5">
                <CheckCircle size={24} />
             </div>
             <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm">Thành công!</h4>
                <p className="text-gray-600 text-sm mt-1">{registerSuccessToast}</p>
             </div>
             <button onClick={() => setRegisterSuccessToast(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;