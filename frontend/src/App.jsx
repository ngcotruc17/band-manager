import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";

// Import các trang (Pages)
import Login from "./pages/Login";
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard"; // <-- Lấy từ file Dashboard xịn
import BookingManager from "./pages/BookingManager";
import EventDetail from "./pages/EventDetail";
import SongLibrary from "./pages/SongLibrary"; 

// Import Component Navbar (đã tách ra ở Bước 1)
import Navbar from "./components/Navbar";

// Component bảo vệ (Chỉ cho user đã đăng nhập vào)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">⏳ Đang tải...</div>;
  return user ? children : <Navigate to="/" />;
};

// Layout chung cho các trang có Navbar (Dashboard, Booking...)
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Trang Public */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Trang Private (Cần đăng nhập) */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          
          <Route path="/bookings" element={<ProtectedRoute><Layout><BookingManager /></Layout></ProtectedRoute>} />
          
          <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />

          <Route path="/library" element={<ProtectedRoute><Layout><SongLibrary /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;