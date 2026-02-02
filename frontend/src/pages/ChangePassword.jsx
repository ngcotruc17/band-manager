import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";

const ChangePassword = () => {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // API URL (Lấy từ context hoặc env, tạm thời hardcode cho chắc)
  const API_URL = "https://band-manager-s9tm.onrender.com/api/auth";

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
      const token = localStorage.getItem("token");

      // 👇 SỬA LẠI ĐƯỜNG DẪN API CHO ĐÚNG BACKEND 👇
      await axios.put(
        `${API_URL}/change-password-first-time`, 
        { newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Đổi Mật Khẩu Lần Đầu</h2>
        <p className="text-gray-500 text-sm mt-2 mb-6">
           Vì lý do bảo mật, vui lòng đổi mật khẩu mặc định (123456) sang mật khẩu mới của riêng bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
            <input 
              type="password"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none"
              placeholder="••••••"
              value={formData.newPassword}
              onChange={e => setFormData({...formData, newPassword: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input 
              type="password"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none"
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition active:scale-95 mt-4"
          >
            {loading ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;