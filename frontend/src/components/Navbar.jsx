import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Music,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Settings,
  User
} from "lucide-react";
import axios from "axios";
import ProfileModal from "./ProfileModal"; // 👇 Import Modal mới

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  
  // 👇 State mới cho Profile
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // State lưu thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = (import.meta.env.VITE_API_URL || "https://band-manager-s9tm.onrender.com/api") + "/notifications";
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (error) { console.error("Lỗi tải thông báo", error); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotiClick = async (noti) => {
    try {
      if (!noti.read) {
        await axios.put(`${API_URL}/${noti._id}/read`, {}, getAuthHeader());
        setNotifications((prev) => prev.map((n) => (n._id === noti._id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsNotiOpen(false);
      if (noti.link) navigate(noti.link);
    } catch (error) { console.error(error); }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_URL}/mark-all-read`, {}, getAuthHeader());
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) { console.error("Lỗi đánh dấu đã đọc:", error); }
  };

  // Click outside handler
  const notiRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) setIsNotiOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 👇 Hàm xử lý khi update thành công (Reload trang để cập nhật context)
  const handleUpdateSuccess = () => {
    window.location.reload();
  };

  if (!user) return null;

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Kho Nhạc", path: "/library" },
    { name: "Lịch Tập", path: "/rehearsals" },
    { name: "Quản lý Booking", path: "/bookings" },
    { name: "Nhân sự", path: "/members" },
    { name: "Tài Chính", path: "/finance" },
  ];

  const isActive = (path) => location.pathname === path;
  const closeMenu = () => setIsMenuOpen(false);
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 fixed top-0 w-full z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* LOGO */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-extrabold text-xl mr-8">
                <Music size={28} className="fill-blue-600" /> Sắc Band
              </Link>
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(item.path) ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* CHUÔNG THÔNG BÁO */}
              <div className="relative" ref={notiRef}>
                <button
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={`transition relative p-2 rounded-full ${isNotiOpen ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-blue-600"}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotiOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">Thông báo ({unreadCount})</h3>
                      <span onClick={handleMarkAllRead} className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Đánh dấu đã đọc hết</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((noti) => (
                          <div key={noti._id} onClick={() => handleNotiClick(noti)} className={`p-3 border-b border-gray-50 transition cursor-pointer flex gap-3 items-start ${noti.read ? "bg-white" : "bg-blue-50/40"}`}>
                            <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${noti.type === "success" ? "bg-green-100 text-green-600" : noti.type === "error" ? "bg-red-100 text-red-600" : noti.type === "warning" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>
                              {noti.type === "success" ? <CheckCircle size={14} /> : noti.type === "error" ? <X size={14} /> : noti.type === "warning" ? <AlertTriangle size={14} /> : <Info size={14} />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${noti.read ? "text-gray-600" : "text-gray-900 font-semibold"} line-clamp-2`}>{noti.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(noti.createdAt)}</p>
                            </div>
                            {!noti.read && <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>}
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center flex flex-col items-center text-gray-400">
                          <Bell size={32} className="mb-2 opacity-20" />
                          <span className="text-sm">Bạn không có thông báo nào</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 👇 USER DROPDOWN (MỚI) */}
              <div className="relative border-l pl-3 md:pl-4 border-gray-200" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 md:gap-3 p-1 rounded-full hover:bg-gray-50 transition group"
                >
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition">{user.fullName}</span>
                    <span className="text-[10px] uppercase text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{user.role}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {user.fullName.charAt(0)}
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}/>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                      <p className="font-bold text-gray-800 text-sm">Xin chào, {user.username}!</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.email || "Chưa cập nhật email"}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                      >
                        <Settings size={18}/> Cập nhật hồ sơ
                      </button>
                      <button 
                        onClick={logout} 
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <LogOut size={18}/> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Toggle */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-500">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 z-40">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{user.fullName.charAt(0)}</div>
                 <div>
                   <p className="font-bold text-gray-800">{user.fullName}</p>
                   <button onClick={() => { setShowProfileModal(true); setIsMenuOpen(false); }} className="text-xs text-blue-600 font-bold hover:underline">Cập nhật hồ sơ</button>
                 </div>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`block px-3 py-3 rounded-xl text-base font-medium ${isActive(item.path) ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
                >
                  {item.name}
                </Link>
              ))}
              <button onClick={logout} className="w-full text-left px-3 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl flex items-center gap-2 mt-2">
                <LogOut size={20}/> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 👇 Hiển thị Modal Cập nhật */}
      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onUpdateSuccess={handleUpdateSuccess} 
        />
      )}
    </>
  );
};

export default Navbar;