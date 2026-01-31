import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  // Thêm fullName vào state
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    fullName: '' // <--- MỚI
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://band-api.onrender.co/api/auth/register', formData);
      alert("✅ Đăng ký thành công! Hãy đăng nhập.");
      navigate('/'); 
    } catch (err) {
      alert("Lỗi đăng ký: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Đăng Ký Thành Viên</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* --- Ô NHẬP HỌ TÊN (MỚI) --- */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Họ và Tên</label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn A"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Tên đăng nhập</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
            />
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
            Đăng Ký
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          Đã có tài khoản? <Link to="/" className="text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;