import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check, LogOut } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext';

// --- NOTIFICATION BELL ---
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

// --- COMPONENT NAVBAR CHÍNH ---
const Navbar = () => {
  const { user } = useContext(AuthContext);
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-80 transition">
              🎸 BandManager
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">Dashboard</Link>
              <Link to="/library" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">Kho Nhạc</Link>
              {user?.role === 'admin' && (
                <Link to="/bookings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5">Quản lý Booking</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell /> 
            <div className="hidden md:flex flex-col items-end border-r border-gray-200 pr-3 mr-1">
               <div className="text-sm font-bold text-gray-800 leading-tight">{user?.fullName || user?.username}</div>
               <div className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-1.5 rounded uppercase mt-0.5">{user?.role}</div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Đăng xuất">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;