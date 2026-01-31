import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Biến này để chờ load xong mới cho hiện web

  // 1. Tự động kiểm tra đăng nhập khi vừa vào web (F5)
  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        // Nếu có lưu trong máy -> Set lại user ngay
        setUser(JSON.parse(userData));
      }
      setLoading(false); // Báo là đã load xong
    };
    checkLogin();
  }, []);

  // 2. Hàm Đăng nhập (Sửa lại để lưu cả User object)
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); // Lưu thông tin user để F5 không mất
    setUser(userData);
  };

  // 3. Hàm Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};