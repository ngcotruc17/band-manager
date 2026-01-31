import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bell, Check } from 'lucide-react'; 
import Login from "./pages/Login";
import BookingManager from "./pages/BookingManager";
import EventDetail from "./pages/EventDetail";
import Register from './pages/Register';
import SongLibrary from "./pages/SongLibrary"; // <--- Đã import

// --- COMPONENT: NOTIFICATION BELL ---
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchNotis = async () => {
    if (!user) return;
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchNotis();
    const interval = setInterval(fetchNotis, 5000); 
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRead = async (noti) => {
    if (!noti.isRead) {
      try {
        await axios.put(`http://localhost:5000/api/notifications/${noti._id}/read`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
      } catch (err) {}
    }
    setIsOpen(false);
    if (noti.link) navigate(noti.link);
  };

  const handleReadAll = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  return (
    <div className="relative mr-4" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-300 hover:text-white transition">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1 border-2 border-gray-900 shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">Thông báo</h3>
            <button onClick={handleReadAll} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Check size={12}/> Đọc tất cả
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">Không có thông báo mới</p>
            ) : (
              notifications.map(noti => (
                <div 
                  key={noti._id} 
                  onClick={() => handleRead(noti)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${!noti.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <p className={`text-sm ${!noti.isRead ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                    {noti.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(noti.createdAt).toLocaleTimeString('vi-VN')} - {new Date(noti.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- NAVBAR ---
const Navbar = () => {
  const { user } = useContext(AuthContext);
  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <span className="text-xl font-bold text-yellow-500">🎸 BandManager</span>
            <Link to="/dashboard" className="hover:text-yellow-400 font-medium transition">🏠 Dashboard</Link>
            <Link to="/library" className="hover:text-yellow-400 font-medium transition">📚 Kho Nhạc</Link>
            {user?.role === 'admin' && (
              <Link to="/bookings" className="hover:text-yellow-400 font-medium transition">📅 Quản lý Booking</Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell /> 
            
            <div className="hidden md:block text-right mr-3">
               <div className="text-sm font-bold text-white">{user?.fullName || user?.username}</div>
               <div className="text-xs text-gray-400 uppercase">{user?.role}</div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-gray-300 hover:text-white text-sm border border-gray-600 px-3 py-1 rounded">Đăng xuất</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- DASHBOARD ---
const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  const getStatusColor = (booking) => {
    const status = booking?.status || 'pending';
    switch (status) {
      case 'pending': return 'border-l-yellow-400 bg-yellow-50';
      case 'approved': return 'border-l-blue-500 bg-white';
      case 'completed': return 'border-l-green-500 bg-green-50';
      case 'cancelled': return 'border-l-gray-400 bg-gray-100 opacity-70';
      default: return 'border-l-blue-500';
    }
  };

  const getStatusText = (booking) => {
    const status = booking?.status || 'pending';
    switch (status) {
      case 'pending': return <span className="text-yellow-700 font-bold text-xs uppercase tracking-wider">⏳ Chờ duyệt</span>;
      case 'approved': return <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">✅ Đang mở đăng ký</span>;
      case 'completed': return <span className="text-green-700 font-bold text-xs uppercase tracking-wider">🎉 Đã diễn xong</span>;
      case 'cancelled': return <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">🚫 Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">👋 Chào mừng, {user?.fullName || user?.username}!</h1>
        <p className="text-gray-600 mb-8">Trạng thái: 🟦 Đang mở | 🟨 Chờ duyệt | 🟩 Đã diễn | ⬜ Đã hủy</p>

        {loading ? ( <div className="text-center text-gray-500 mt-10">⏳ Đang tải...</div> ) : events.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow text-center border border-dashed border-gray-300">
            <h3 className="text-xl text-gray-400 mb-4">Chưa có lịch diễn nào</h3>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link
                to={`/events/${ev._id}`}
                key={ev._id}
                className={`block p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 relative overflow-hidden cursor-pointer group border-l-8 ${getStatusColor(ev.bookingRef)}`}
              >
                <div className="ml-1">
                  <div className="flex justify-between items-center mb-1">
                     <div className="text-sm font-bold text-gray-500">{new Date(ev.date).toLocaleDateString("vi-VN")}</div>
                     {getStatusText(ev.bookingRef)}
                  </div>
                  
                  <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
                    {ev.title}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <span>📍 {ev.location || "Chưa cập nhật địa điểm"}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
                    Khách: <span className="font-medium">{ev.bookingRef?.customerName || "N/A"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">⏳ Đang tải...</div>;
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/bookings" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><BookingManager /></div></ProtectedRoute>} />
          
          <Route path="/events/:id" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><EventDetail /></div></ProtectedRoute>} />

          {/* --- ĐÃ THÊM ROUTE KHO NHẠC Ở ĐÂY --- */}
          <Route path="/library" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><SongLibrary /></div></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;