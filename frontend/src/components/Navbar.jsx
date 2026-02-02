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
} from "lucide-react";
import axios from "axios";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // State lưu thông báo thật
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy URL API từ biến môi trường
  const API_URL =
    (import.meta.env.VITE_API_URL || "http://localhost:5000/api") +
    "/notifications";
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // 1. Hàm tải thông báo từ Server
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setNotifications(res.data);
      // Đếm số lượng chưa đọc (read === false)
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Lỗi tải thông báo", error);
    }
  };

  // Gọi API khi component load
  useEffect(() => {
    fetchNotifications();
    // (Optional) Có thể set interval để tự động reload mỗi 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 2. Hàm xử lý khi bấm vào 1 thông báo
  const handleNotiClick = async (noti) => {
    try {
      // Gọi API đánh dấu đã đọc
      if (!noti.read) {
        await axios.put(`${API_URL}/${noti._id}/read`, {}, getAuthHeader());
        // Cập nhật giao diện ngay lập tức (giảm lag)
        setNotifications((prev) =>
          prev.map((n) => (n._id === noti._id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      // Đóng dropdown và chuyển trang
      setIsNotiOpen(false);
      if (noti.link) navigate(noti.link);
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Hàm đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    try {
      // 1. Gọi API báo server lưu lại
      // 👇 Dùng biến API_URL thay vì link cứng để tránh lỗi khi deploy
      await axios.put(
        `${API_URL}/mark-all-read`,
        {}, // ✅ Đã có body rỗng (Chuẩn)
        getAuthHeader(), // ✅ Tận dụng hàm getAuthHeader cho gọn
      );

      // 2. Cập nhật giao diện ngay lập tức
      setNotifications(
        (prev) => prev.map((n) => ({ ...n, read: true })), // 👈 SỬA 'isRead' THÀNH 'read'
      );
      setUnreadCount(0); // Về 0 ngay
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };
  // Xử lý đóng menu khi click ra ngoài
  const notiRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Helper tính thời gian (VD: 2 phút trước)
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // giây
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <nav className="bg-white border-b border-gray-100 fixed top-0 w-full z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LOGO */}
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-blue-600 font-extrabold text-xl mr-8"
            >
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
          <div className="flex items-center gap-4">
            {/* 🔥 CHUÔNG THÔNG BÁO REAL-TIME 🔥 */}
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
                    <h3 className="font-bold text-gray-800">
                      Thông báo ({unreadCount})
                    </h3>
                    <span
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                    >
                      Đánh dấu đã đọc hết
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((noti) => (
                        <div
                          key={noti._id}
                          onClick={() => handleNotiClick(noti)}
                          className={`p-3 border-b border-gray-50 transition cursor-pointer flex gap-3 items-start ${noti.read ? "bg-white" : "bg-blue-50/40"}`}
                        >
                          <div
                            className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${
                              noti.type === "success"
                                ? "bg-green-100 text-green-600"
                                : noti.type === "error"
                                  ? "bg-red-100 text-red-600"
                                  : noti.type === "warning"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {noti.type === "success" ? (
                              <CheckCircle size={14} />
                            ) : noti.type === "error" ? (
                              <X size={14} />
                            ) : noti.type === "warning" ? (
                              <AlertTriangle size={14} />
                            ) : (
                              <Info size={14} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm ${noti.read ? "text-gray-600" : "text-gray-900 font-semibold"} line-clamp-2`}
                            >
                              {noti.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {timeAgo(noti.createdAt)}
                            </p>
                          </div>
                          {!noti.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center text-gray-400">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <span className="text-sm">
                          Bạn không có thông báo nào
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800">
                  {user.fullName}
                </span>
                <span className="text-[10px] uppercase text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-500"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Giữ nguyên phần này) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 space-y-1">
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
