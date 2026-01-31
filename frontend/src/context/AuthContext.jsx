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
          console.error("Lỗi dữ liệu user:", e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  // 2. Hàm Đăng nhập (GỌI API SERVER THẬT)
  const login = async (username, password) => {
    // Gọi API để lấy token
    const res = await axios.post('https://band-manager-s9tm.onrender.com/api/auth/login', { 
      username, 
      password 
    });

    // Server trả về token và thông tin user
    const { token, user } = res.data;

    // Lưu vào máy
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Cập nhật trạng thái để Web biết là đã đăng nhập
    setUser(user);
  };

  // 3. Hàm Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Chuyển hướng về trang login
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};