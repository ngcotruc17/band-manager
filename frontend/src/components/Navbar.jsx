import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Music, LogOut, Menu, X, Bell, CheckCircle, Info, ChevronDown, Settings } from "lucide-react";
import api from "../services/api";
import ProfileModal from "./ProfileModal";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications"); 
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length); 
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotiClick = async (noti) => {
    try {
      if (!noti.isRead) {
        await api.put(`/notifications/${noti._id}/read`);
        setNotifications((prev) => prev.map((n) => (n._id === noti._id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsNotiOpen(false);
      if (noti.link) navigate(noti.link);
    } catch (error) { console.error(error); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put(`/notifications/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) { console.error(error); }
  };

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

  const handleUpdateSuccess = () => window.location.reload();
  if (!user) return null;

  const navItems = [
    { name: "Tổng quan", path: "/dashboard" },
    { name: "Menu Bài", path: "/repertoire" },
    { name: "Kho Nhạc", path: "/library" },
    { name: "Booking", path: "/bookings" },
    { name: "Lịch Tập", path: "/rehearsals" },
    { name: "Nhân sự", path: "/members" },
    { name: "Tài Chính", path: "/finance" },
  ];

  const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <>
      <nav className="fixed top-0 w-full z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex justify-between items-center h-full">
            
            {/* LOGO */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 mr-4 sm:mr-8 group">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg transition-transform group-hover:rotate-12">
                  <Music size={22} />
                </div>
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-850 bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Sắc Band</span>
              </Link>
              
              {/* DESKTOP MENU */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-extrabold transition-all duration-200 ${
                      isActive(item.path) 
                      ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50" 
                      : "text-slate-500 hover:text-slate-850 hover:bg-white/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-1 sm:gap-4">
                  {/* CHUÔNG THÔNG BÁO */}
              <div className="relative" ref={notiRef}>
                <button
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={`relative p-2 rounded-xl transition ${isNotiOpen ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </button>

                {isNotiOpen && (
                  /* FIX LỖI HIỂN THỊ MOBILE TẠI ĐÂY: fixed trên mobile, absolute trên desktop */
                  <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-sm">Thông báo ({unreadCount})</h3>
                      <span onClick={handleMarkAllRead} className="text-[10px] text-indigo-600 font-black uppercase cursor-pointer hover:underline">Đã đọc hết</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto bg-white">
                      {notifications.length > 0 ? (
                        notifications.map((noti) => (
                          <div key={noti._id} onClick={() => handleNotiClick(noti)} className={`p-4 border-b border-slate-50 transition cursor-pointer flex gap-3 items-start hover:bg-slate-50 ${noti.isRead ? "opacity-60" : "bg-indigo-50/30"}`}>
                            <div className="mt-0.5 p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                              <Info size={14} />
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs leading-relaxed ${noti.isRead ? "text-slate-500" : "text-slate-900 font-bold"}`}>{noti.message}</p>
                              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{new Date(noti.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                            {!noti.isRead && <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>}
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-slate-400 text-xs italic">Không có thông báo mới</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* USER DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform ${isProfileOpen ? "rotate-180" : ""}`}/>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 animate-fade-in">
                    <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tài khoản</p>
                      <p className="font-bold text-slate-800 text-xs truncate">{user.fullName}</p>
                    </div>
                    <button 
                      onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    >
                      <Settings size={16} className="text-slate-400"/> Hồ sơ của tôi
                    </button>
                    <button 
                      onClick={logout} 
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"
                    >
                      <LogOut size={16}/> Đăng xuất
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 z-40 p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-bold transition ${
                  isActive(item.path) 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

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