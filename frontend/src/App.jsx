import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; 
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { Toaster } from 'react-hot-toast'; 

// Import các trang
import Login from "./pages/Login";
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import BookingManager from "./pages/BookingManager"; 
import EventDetail from "./pages/EventDetail";
import SongLibrary from "./pages/SongLibrary"; 
import RehearsalManager from "./pages/RehearsalManager"; 
import MemberManager from "./pages/MemberManager"; 
import FinanceManager from "./pages/FinanceManager";
import ChangePassword from './pages/ChangePassword';
import BookingDetail from './pages/BookingDetail'; // 👈 Import trang chi tiết

// Import Navbar
import Navbar from "./components/Navbar";

// --- 🛡️ COMPONENT BẢO VỆ ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">⏳ Đang tải...</div>;
  
  // 1. Chưa đăng nhập -> Đá về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Bắt buộc đổi mật khẩu
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // 3. Đã đổi xong mà cố vào lại trang đổi pass -> Đá về Dashboard
  if (!user.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout chung (Navbar + Content + Footer)
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="pt-20 flex-1"> 
        {children}
      </div>
      <footer className="py-6 text-center text-xs text-gray-400 italic border-t border-gray-100 mt-8">
        <p>Phát triển bởi <span className="font-bold text-gray-500">Nguyễn Công Trực</span> • Made with <span className="text-red-400">❤</span> for Music</p>
        <p className="mt-1">Copyright © {new Date().getFullYear()} <span className="font-bold text-blue-600">Sắc Band Manager</span>. All rights reserved.</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter> 
        <Toaster position="bottom-right" reverseOrder={false} />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* --- PRIVATE ROUTES --- */}
          
          {/* 1. Trang Đổi Mật Khẩu (Không có Navbar/Footer) */}
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePassword /> 
              </ProtectedRoute>
            } 
          />

          {/* 2. Các trang chính (Có Navbar/Footer) */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Layout><BookingManager /></Layout></ProtectedRoute>} />
          
          {/* 👇 ĐÃ SỬA: Thêm <Layout> để hiện Navbar ở trang chi tiết */}
          <Route path="/bookings/:id" element={<ProtectedRoute><Layout><BookingDetail /></Layout></ProtectedRoute>} />
          
          <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Layout><SongLibrary /></Layout></ProtectedRoute>} />
          <Route path="/rehearsals" element={<ProtectedRoute><Layout><RehearsalManager /></Layout></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Layout><MemberManager /></Layout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Layout><FinanceManager /></Layout></ProtectedRoute>} />
          
          {/* 404 - Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;