import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { Toaster } from 'react-hot-toast'; 

// Import các trang
import Login from "./pages/Login";
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import BookingManager from "./pages/BookingManager"; // Trang quản lý Show
import EventDetail from "./pages/EventDetail";
import SongLibrary from "./pages/SongLibrary"; 
import RehearsalManager from "./pages/RehearsalManager"; // Trang lịch tập
import MemberManager from "./pages/MemberManager"; // Trang nhân sự

// Import Navbar
import Navbar from "./components/Navbar";

// Component bảo vệ (Chặn người chưa đăng nhập)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">⏳ Đang tải...</div>;
  return user ? children : <Navigate to="/" />;
};

// Layout chung (Có Navbar ở trên)
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20"> {/* Thêm padding top để không bị Navbar che mất nội dung */}
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* CẤU HÌNH THÔNG BÁO POPUP */}
        <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#333',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              fontWeight: '600',
              fontSize: '14px',
            },
            success: {
              icon: '✅',
              style: { borderLeft: '4px solid #10B981' },
            },
            error: {
              icon: '❌',
              style: { borderLeft: '4px solid #EF4444' },
            },
          }}
        />

        <Routes>
          {/* 1. Trang Public */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 2. Trang Private (Đã sửa lại path cho chuẩn với Dashboard) */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          
          {/* Sửa /bookings -> /booking-manager */}
          <Route path="/bookings" element={<ProtectedRoute><Layout><BookingManager /></Layout></ProtectedRoute>} />
          
          <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
          
          {/* Sửa /library -> /song-library (Nếu cần) hoặc giữ nguyên nếu Navbar đang để library */}
          <Route path="/library" element={<ProtectedRoute><Layout><SongLibrary /></Layout></ProtectedRoute>} />
          
          {/* 🔥 QUAN TRỌNG: Sửa /rehearsals -> /rehearsal-manager để khớp Dashboard */}
          <Route path="/rehearsals" element={<ProtectedRoute><Layout><RehearsalManager /></Layout></ProtectedRoute>} />
          
          {/* Sửa /members -> /human-resources (Hoặc /member-manager tùy ý bạn, miễn là khớp Navbar) */}
          <Route path="/members" element={<ProtectedRoute><Layout><MemberManager /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;