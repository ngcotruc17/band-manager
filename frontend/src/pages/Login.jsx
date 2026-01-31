import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Chặn hành động reload trang mặc định của Form
    try {
      const res = await axios.post('https://band-api.onrender.co/api/auth/login', formData);
      
      // Lưu token và thông tin user
      login(res.data.token, res.data); 
      
      // Thông báo và chuyển hướng
      alert("✅ Đăng nhập thành công!");
      navigate('/dashboard'); 
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || "Sai tài khoản hoặc mật khẩu"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-2">Band Manager</h2>
        <p className="text-center text-gray-500 mb-6">Đăng nhập hệ thống</p>
        
        {/* --- QUAN TRỌNG: Thẻ form giúp ấn Enter để submit --- */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Tên đăng nhập</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Nhập username..."
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Nhập mật khẩu..."
            />
          </div>
          
          {/* Nút submit mặc định của form */}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
            Đăng Nhập
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;