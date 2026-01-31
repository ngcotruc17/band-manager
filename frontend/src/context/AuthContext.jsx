import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Tự động nạp user từ bộ nhớ khi F5
  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Lỗi parse user:", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  // 2. Hàm Đăng nhập (ĐÃ SỬA: Gọi API Render)
  const login = async (username, password) => {
    // Gọi API thật để lấy token và thông tin user
    // LƯU Ý: Đây là link server Render của bạn
    const res = await axios.post('https://band-manager-s9tm.onrender.com/api/auth/login', { 
      username, 
      password 
    });

    // API trả về: { token, user: { ... } }
    const { token, user } = res.data;

    // Lưu vào bộ nhớ máy
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Cập nhật trạng thái ứng dụng
    setUser(user);
  };

  // 3. Hàm Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = "/"; // Quay về trang chủ
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};