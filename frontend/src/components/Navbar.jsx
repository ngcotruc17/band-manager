import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Music, LogOut, Menu, X, Bell, CheckCircle, Info, ChevronDown, Settings } from "lucide-react";
import api from "../services/api"; // 👈 Dùng api thay cho axios
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
    const interval = setInterval(fetchNotifications, 30000); // Tự động load mỗi 30s
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
      <nav className="fixed top-0 w-full z-40 glass border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 mr-8 group">
                <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white p-1.5 rounded-lg group-hover:rotate-12 transition"><Music size={22} /></div>
                <span className="font-extrabold text-xl tracking-tight text-slate-800">Sắc Band</span>
              </Link>
              <div className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive(item.path) ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}>{item.name}</Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative" ref={notiRef}>
                <button onClick={() => setIsNotiOpen(!isNotiOpen)} className={`relative p-2 rounded-xl transition ${isNotiOpen ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse ring-2 ring-white"></span>}
                </button>
                {isNotiOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 glass rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                      <h3 className="font-bold text-slate-800 text-sm">Thông báo ({unreadCount})</h3>
                      <span onClick={handleMarkAllRead} className="text-[10px] text-violet-600 font-bold cursor-pointer hover:underline">Đã đọc hết</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto bg-white/80">
                      {notifications.length > 0 ? (
                        notifications.map((noti) => (
                          <div key={noti._id} onClick={() => handleNotiClick(noti)} className={`p-4 border-b border-slate-50 transition cursor-pointer flex gap-3 items-start hover:bg-slate-50/80 ${noti.isRead ? "opacity-60" : "bg-violet-50/30 font-bold"}`}>
                            <div className="mt-0.5"><Info size={14} className="text-violet-500"/></div>
                            <div className="flex-1 text-xs">
                              <p className="text-slate-900 leading-tight">{noti.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(noti.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                            {!noti.isRead && <div className="h-2 w-2 bg-violet-500 rounded-full mt-2"></div>}
                          </div>
                        ))
                      ) : ( <div className="p-8 text-center text-slate-400 text-xs">Không có thông báo</div> )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition border border-transparent hover:border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs">{user.fullName.charAt(0)}</div>
                  <div className="hidden sm:flex flex-col items-start"><span className="text-sm font-bold text-slate-800 leading-none">{user.fullName}</span><span className="text-[10px] font-bold uppercase text-violet-600 mt-0.5">{user.role}</span></div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}/>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-xl z-50 p-2">
                    <button onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"><Settings size={16}/> Cài đặt hồ sơ</button>
                    <button onClick={logout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"><LogOut size={16}/> Đăng xuất</button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl absolute w-full left-0 z-40 animate-fade-in p-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-bold ${isActive(item.path) ? "bg-violet-50 text-violet-600" : "text-slate-600"}`}>{item.name}</Link>
            ))}
          </div>
        )}
      </nav>
      {showProfileModal && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdateSuccess={handleUpdateSuccess} />}
    </>
  );
};

export default Navbar;