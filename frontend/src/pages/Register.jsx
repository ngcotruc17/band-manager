import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, User, Lock, Mail, ArrowRight } from "lucide-react";
import toast from 'react-hot-toast'; // Import thông báo

const Register = () => {
  const [formData, setFormData] = useState({ fullName: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Đang tạo tài khoản...');

    try {
      // LINK RENDER CỦA BẠN (Sửa nếu cần thiết)
      await axios.post('https://band-manager-s9tm.onrender.com/api/auth/register', formData);
      toast.success("Đăng ký thành công! Vui lòng chờ Admin duyệt tài khoản nhé ⏳");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error("Lỗi: " + msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-10 left-10 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-500 to-teal-500 text-white shadow-lg mb-4 transform -rotate-3 hover:rotate-0 transition">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Tạo tài khoản</h2>
          <p className="text-gray-500 mt-2 text-sm">Tham gia cùng ban nhạc của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
            <input type="text" placeholder="Họ và Tên" className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition shadow-sm font-medium"
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
            <input type="text" placeholder="Tên đăng nhập" className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition shadow-sm font-medium"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
            <input type="password" placeholder="Mật khẩu" className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition shadow-sm font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          
          <button disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? "Đang đăng ký..." : <>Đăng Ký Ngay <ArrowRight size={20}/></>}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Đã có tài khoản?{" "}
          <Link to="/" className="text-teal-600 font-bold hover:text-emerald-700 transition">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;