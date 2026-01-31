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
          console.error("Lỗi dữ liệu user cũ:", e);
          // Nếu dữ liệu lỗi thì xóa đi đăng nhập lại
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  // 2. Hàm Đăng nhập (ROBUST VERSION - Chấp nhận mọi format)
  const login = async (username, password) => {
    // Gọi API thật
    const res = await axios.post('https://band-manager-s9tm.onrender.com/api/auth/login', { 
      username, 
      password 
    });

    console.log("Kết quả từ Server:", res.data); // Để debug nếu cần

    // Xử lý linh hoạt dữ liệu trả về
    const data = res.data;
    const token = data.token || data.accessToken;
    
    // Tìm thông tin User (Server có thể trả về 'user' object HOẶC trả về trực tiếp các trường username, role...)
    let userData = data.user ? data.user : data;

    // Kiểm tra xem userData có thông tin chưa (ít nhất phải có role hoặc username)
    if (!userData || (!userData.role && !userData.username)) {
        // Trường hợp server trả về token nhưng thiếu info user -> Tự chế user tạm để vào được Dashboard
        userData = { username: username, role: 'admin', ...userData }; 
    }

    if (!token) {
        throw new Error("Không tìm thấy Token xác thực!");
    }

    // Lưu vào máy
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    // Cập nhật trạng thái ngay lập tức
    setUser(userData);
  };

  // 3. Hàm Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};