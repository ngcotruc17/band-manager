import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 Sửa lại tên biến cho thống nhất
  const API_URL = "https://band-manager-s9tm.onrender.com/api/auth";

  // Hàm load user khi F5 trang
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi xác thực:", error.response?.data?.message);
      localStorage.removeItem("token");
      setUser(null);
      if (error.response?.status === 403) {
        toast.error("Phiên đăng nhập hết hạn hoặc tài khoản chưa được duyệt!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // 👇 HÀM LOGIN QUAN TRỌNG
  const login = async (formData) => {
    setLoading(true);
    try {
      // 🛠️ FIX LỖI: Dùng API_URL (không phải BASE_URL)
      const res = await axios.post(`${API_URL}/login`, formData);

      // Lưu token & User
      localStorage.setItem("token", res.data.token);
      setUser(res.data);

      // 👇 BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ TRANG LOGIN NHẬN DIỆN
      return res.data; 
      
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Đã đăng xuất");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};