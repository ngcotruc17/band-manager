import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const ChangePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user, login } = useContext(AuthContext); // Lấy hàm login để cập nhật lại user state
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://band-manager-s9tm.onrender.com/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Mật khẩu xác nhận không khớp!");
    if (password.length < 6) return alert("Mật khẩu phải trên 6 ký tự!");

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/auth/change-password`, 
        { newPassword: password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("✅ Đổi mật khẩu thành công!");
      
      // Cập nhật lại trạng thái user ở context (để tắt cờ requireChangePassword)
      // Cách nhanh nhất: Giả vờ login lại hoặc điều hướng
      // Ở đây ta điều hướng về dashboard, logic ở App.js sẽ lo phần còn lại
      // Nhưng ta cần sửa tay user trong localStorage để nó không bị chặn nữa
      const updatedUser = { ...user, requireChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Force reload để App nhận state mới
      window.location.href = '/dashboard'; 

    } catch (error) {
      alert(error.response?.data?.message || "Lỗi đổi mật khẩu");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
           <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-blue-600">
             <Lock size={32} />
           </div>
           <h2 className="text-2xl font-bold text-gray-800">Đổi Mật Khẩu Lần Đầu</h2>
           <p className="text-gray-500 text-sm mt-2">
             Chào <b>{user?.fullName}</b>,<br/>
             Vì lý do bảo mật, vui lòng đổi mật khẩu mặc định (123456) sang mật khẩu mới của riêng bạn.
           </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
            <input 
              type="password" 
              className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu..."
              required
            />
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg mt-2">
            Cập Nhật Mật Khẩu
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;