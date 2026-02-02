import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // 👈 Lấy BrowserRouter từ đây
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

// Import Navbar
import Navbar from "./components/Navbar";

// Component bảo vệ (Chưa login -> Đá về /login)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">⏳ Đang tải...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Layout chung (Có Navbar)
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 1. Navbar dính trên cùng */}
      <Navbar />
      
      {/* 2. Nội dung chính (Đẩy Footer xuống dưới) */}
      <div className="pt-20 flex-1"> 
        {children}
      </div>

      {/* 3. Footer (Chân trang) */}
      <footer className="py-6 text-center text-xs text-gray-400 italic border-t border-gray-100 mt-8">
        <p>
          Phát triển bởi <span className="font-bold text-gray-500">Nguyễn Công Trực</span> 
          <span className="mx-2">•</span> 
          Made with <span className="text-red-400">❤</span> for Music
        </p>
        <p className="mt-1">
          Copyright © {new Date().getFullYear()} <span className="font-bold text-blue-600">Sắc Band Manager</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      {/* 👇 BẬT LẠI CÁI NÀY LÀ HẾT LỖI TRẮNG TRANG NGAY */}
      <BrowserRouter> 
        
        <Toaster 
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              icon: '🎉',
              style: { borderLeft: '4px solid #10B981' },
            },
            error: {
              icon: '😥',
              style: { borderLeft: '4px solid #EF4444' },
            },
          }}
        />

        <Routes>
          {/* 1. Trang Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 👇 Route gốc: Vào trang chủ tự chuyển về Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 2. Trang Private */}
          <Route path="/change-password" element={<ProtectedRoute><Layout><ChangePassword /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Layout><BookingManager /></Layout></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Layout><SongLibrary /></Layout></ProtectedRoute>} />
          <Route path="/rehearsals" element={<ProtectedRoute><Layout><RehearsalManager /></Layout></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Layout><MemberManager /></Layout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Layout><FinanceManager /></Layout></ProtectedRoute>} />

          {/* Bắt link sai -> Về Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;