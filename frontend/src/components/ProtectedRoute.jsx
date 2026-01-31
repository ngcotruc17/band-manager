import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  // 1. Chưa đăng nhập -> Về Login
  if (!user) {
    return <Navigate to="/" />;
  }

  // 2. 🔥 QUAN TRỌNG: Check Status 🔥
  // Nếu status là pending -> Xóa token và đá về Login ngay
  if (user.status === 'pending') {
    localStorage.removeItem('token');
    alert("Tài khoản của bạn đang chờ duyệt! Vui lòng quay lại sau.");
    return <Navigate to="/" />;
  }

  // Nếu bị khóa
  if (user.status === 'banned') {
    localStorage.removeItem('token');
    alert("Tài khoản đã bị KHÓA!");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;