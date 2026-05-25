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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Navbar cho Desktop */}
      <Navbar />

      {/* Nội dung chính: Thêm padding bottom (pb-24) trên mobile để không bị che bởi Bottom Nav */}
      <div className="pt-16 pb-24 md:pb-6 flex-1">
        {children}
      </div>

      {/* Footer cho Desktop */}
      <footer className="hidden md:block py-6 text-center text-xs text-slate-400 italic border-t border-slate-200/50 mt-8">
        <p>Phát triển bởi <span className="font-extrabold text-slate-500">Nguyễn Công Trực</span> • Made with <span className="text-red-400">❤</span> for Music</p>
        <p className="mt-1">Copyright © {new Date().getFullYear()} <span className="font-black text-indigo-600">Sắc Band Manager</span>. All rights reserved.</p>
      </footer>

      {/* --- BOTTOM NAVIGATION CHO MOBILE --- */}
      <div className="md:hidden fixed bottom-4 inset-x-4 bg-white/80 backdrop-blur-xl border border-slate-200/40 rounded-2xl z-50 shadow-lg shadow-slate-200/30 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                  isActive ? "text-indigo-650" : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <div className={`${isActive ? "scale-115 -translate-y-1 drop-shadow-md" : "scale-100"} transition-transform duration-200`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-200 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90 h-0 overflow-hidden"}`}>
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