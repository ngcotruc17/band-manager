import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL Backend của bạn (Sửa lại localhost hoặc render tùy lúc test)
  const API_URL = "https://band-manager-s9tm.onrender.com/api";

  // Hàm load user khi F5 trang
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Gọi lên Server hỏi: "Token này của ai? Trạng thái thế nào?"
      const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Nếu Server trả về OK -> Lưu user
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi xác thực:", error.response?.data?.message);

      // 🔥 NẾU LỖI (VÍ DỤ: 403 PENDING) -> ĐÁ VĂNG LUÔN 🔥
      localStorage.removeItem("token");
      setUser(null);

      // Nếu lỗi là do chưa duyệt hoặc bị khóa thì thông báo
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

  // Hàm Login
  const login = async (formData) => {
    const res = await axios.post(`${API_URL}/login`, formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  };

  // Hàm Logout
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
