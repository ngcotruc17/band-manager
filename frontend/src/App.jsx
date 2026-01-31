import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bell, Check, Calendar, MapPin, User, Music, LogOut, ChevronRight } from 'lucide-react'; 
import Login from "./pages/Login";
import BookingManager from "./pages/BookingManager";
import EventDetail from "./pages/EventDetail";
import Register from './pages/Register';
import SongLibrary from "./pages/SongLibrary"; 
import CommentSection from './components/CommentSection'; // Đảm bảo đã import component này nếu dùng
import Dashboard from "./pages/Dashboard";

// --- COMPONENT: NOTIFICATION BELL (Giữ nguyên logic, chỉnh style) ---
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
      const res = await axios.get('https://band-manager-s9tm.onrender.com/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchNotis();
    const interval = setInterval(fetchNotis, 10000); 
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
        await axios.put(`https://band-manager-s9tm.onrender.com/api/notifications/${noti._id}/read`, {}, {
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
      await axios.put(`https://band-manager-s9tm.onrender.com/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm">
            <h3 className="font-bold text-gray-700 text-sm">Thông báo</h3>
            <button onClick={handleReadAll} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
              <Check size={12}/> Đọc tất cả
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm">Không có thông báo mới</p>
            ) : (
              notifications.map(noti => (
                <div 
                  key={noti._id} 
                  onClick={() => handleRead(noti)}
                  className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!noti.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <p className={`text-sm ${!noti.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    {noti.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{new Date(noti.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} • {new Date(noti.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- NAVBAR HIỆN ĐẠI ---
const Navbar = () => {
  const { user } = useContext(AuthContext);
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-80 transition">
              🎸 BandManager
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-1">
              <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">
                Dashboard
              </Link>
              <Link to="/library" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">
                Kho Nhạc
              </Link>
              {user?.role === 'admin' && (
                <Link to="/bookings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">
                   Quản lý Booking
                </Link>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell /> 
            
            <div className="hidden md:flex flex-col items-end border-r border-gray-200 pr-3 mr-1">
               <div className="text-sm font-bold text-gray-800 leading-tight">{user?.fullName || user?.username}</div>
               <div className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-1.5 rounded uppercase mt-0.5">{user?.role}</div>
            </div>

            <button 
              onClick={() => { localStorage.clear(); window.location.href = "/"; }} 
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition"
              title="Đăng xuất"
            >
              <LogOut size={20}/>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- DASHBOARD CARD STYLE ---
const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        // SỬA LINK RENDER CỦA BẠN
        const res = await axios.get("https://band-manager-s9tm.onrender.com/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⏳ Chờ duyệt' },
      approved: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: '🔥 Đang mở' },
      completed: { color: 'bg-green-100 text-green-700 border-green-200', label: '✅ Hoàn thành' },
      cancelled: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: '🚫 Đã hủy' }
    };
    const config = configs[s] || configs.pending;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user?.fullName || user?.username}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Hôm nay bạn có lịch diễn nào không?</p>
        </header>

        {loading ? ( 
          <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div> 
        ) : events.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-3xl border border-dashed border-gray-300 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
            <h3 className="text-lg font-medium text-gray-900">Chưa có lịch diễn nào</h3>
            <p className="text-gray-500 mt-1">Hãy chờ Admin tạo show mới nhé.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {events.map((ev) => (
              <Link
                to={`/events/${ev._id}`}
                key={ev._id}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Decorative Side Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ev.bookingRef?.status === 'approved' ? 'bg-blue-500' : ev.bookingRef?.status === 'completed' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>

                <div className="flex justify-between items-start mb-4 pl-2">
                  <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-1">
                    <Calendar size={12}/> {new Date(ev.date).toLocaleDateString("vi-VN")}
                  </div>
                  {getStatusBadge(ev.bookingRef?.status)}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2 pl-2 line-clamp-2 group-hover:text-blue-600 transition">
                  {ev.title}
                </h3>
                
                <div className="pl-2 space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <MapPin size={16} className="text-gray-400"/>
                    <span className="truncate">{ev.location || "Chưa cập nhật địa điểm"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <User size={16} className="text-gray-400"/>
                    <span className="truncate">{ev.bookingRef?.customerName || "Khách lẻ"}</span>
                  </div>
                </div>

                <div className="pl-2 pt-4 border-t border-gray-50 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  Xem chi tiết <ChevronRight size={16}/>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">⏳ Đang tải...</div>;
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><Dashboard /></div></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/bookings" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><BookingManager /></div></ProtectedRoute>} />
          
          <Route path="/events/:id" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><EventDetail /></div></ProtectedRoute>} />

          <Route path="/library" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><SongLibrary /></div></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;