import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; 
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { AudioProvider } from "./context/AudioContext"; // 👈 MỚI: Import AudioProvider
import { ThemeProvider } from "./context/ThemeContext"; // 👈 MỚI: Import ThemeProvider
import { useContext } from "react";
import { Toaster } from 'react-hot-toast'; 

import Login from "./pages/Login";
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import BookingManager from "./pages/BookingManager"; 
import EventDetail from "./pages/EventDetail";
import SongLibrary from "./pages/SongLibrary"; 
import Repertoire from "./pages/Repertoire"; 
import RehearsalManager from "./pages/RehearsalManager"; 
import MemberManager from "./pages/MemberManager"; 
import FinanceManager from "./pages/FinanceManager";
import ChangePassword from './pages/ChangePassword';
import BookingDetail from './pages/BookingDetail'; 
import CheckIn from "./pages/CheckIn";
import AdminNotifications from "./pages/AdminNotifications";

import Layout from "./components/Layout"; 
import GlobalAudioPlayer from "./components/GlobalAudioPlayer"; // 👈 MỚI: Import Player

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-800 font-bold">⏳ Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (!user.mustChangePassword && location.pathname === '/change-password') return <Navigate to="/dashboard" replace />;

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider> {/* 👈 MỚI: Bọc ngoài ứng dụng */}
          <BrowserRouter> 
            <Toaster 
              position="bottom-right" 
              reverseOrder={false}
              toastOptions={{
                className: 'bg-white text-slate-800 border-slate-200/80 border shadow-xl rounded-2xl font-bold text-xs uppercase tracking-wide',
              }}
            />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Layout><BookingManager /></Layout></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><Layout><BookingDetail /></Layout></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
            
            <Route path="/library" element={<ProtectedRoute><Layout><SongLibrary /></Layout></ProtectedRoute>} />
            <Route path="/repertoire" element={<ProtectedRoute><Layout><Repertoire /></Layout></ProtectedRoute>} />
            
            <Route path="/rehearsals" element={<ProtectedRoute><Layout><RehearsalManager /></Layout></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><Layout><CheckIn /></Layout></ProtectedRoute>} />
            <Route path="/checkin/:rehearsalId" element={<ProtectedRoute><Layout><CheckIn /></Layout></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><Layout><MemberManager /></Layout></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><Layout><FinanceManager /></Layout></ProtectedRoute>} />
            <Route path="/admin-notifications" element={<ProtectedRoute><Layout><AdminNotifications /></Layout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* 👈 MỚI: Trình phát nhạc hiển thị ở mọi nơi */}
          <GlobalAudioPlayer /> 
          
        </BrowserRouter>
      </AudioProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;