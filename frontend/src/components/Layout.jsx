import { useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import { LayoutDashboard, Music, Calendar, BookOpen } from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();

  // Danh sách các tab cho Mobile Bottom Navigation
  const bottomNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={22} /> },
    { name: "Lịch Diễn", path: "/bookings", icon: <Calendar size={22} /> },
    { name: "Menu Bài", path: "/repertoire", icon: <BookOpen size={22} /> },
    { name: "Kho Nhạc", path: "/library", icon: <Music size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar cho Desktop */}
      <Navbar />

      {/* Nội dung chính: Thêm padding bottom (pb-20) trên mobile để không bị che bởi Bottom Nav */}
      <div className="pt-16 pb-20 md:pb-6 flex-1">
        {children}
      </div>

      {/* Footer cho Desktop */}
      <footer className="hidden md:block py-6 text-center text-xs text-gray-400 italic border-t border-gray-100 mt-8">
        <p>Phát triển bởi <span className="font-bold text-gray-500">Nguyễn Công Trực</span> • Made with <span className="text-red-400">❤</span> for Music</p>
        <p className="mt-1">Copyright © {new Date().getFullYear()} <span className="font-bold text-blue-600">Sắc Band Manager</span>. All rights reserved.</p>
      </footer>

      {/* --- BOTTOM NAVIGATION CHO MOBILE --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                  isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className={`${isActive ? "scale-110 mb-0.5 drop-shadow-md" : "scale-100"} transition-transform duration-200`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-0 h-0"} transition-all duration-200`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;