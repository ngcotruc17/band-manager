import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, User, ChevronRight, PlusCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar'; // Đảm bảo bạn có file Navbar hoặc bỏ dòng này nếu Navbar nằm ở App.jsx

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Lấy danh sách Show diễn
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        // 👇 LINK SERVER RENDER CỦA BẠN (Đã chỉnh chuẩn)
        const res = await axios.get("https://band-manager-s9tm.onrender.com/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(res.data);
      } catch (err) { 
        console.error("Lỗi tải events:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    
    if (user) fetchEvents();
  }, [user]);

  // Hàm render cái nhãn trạng thái (Màu mè cho đẹp)
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
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Nếu bạn để Navbar ở App.jsx rồi thì xóa dòng dưới đi */}
      {/* <Navbar /> */} 
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header chào mừng */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user?.fullName || user?.username}</span> 👋
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Hôm nay bạn có lịch diễn nào không?</p>
          </div>
          
          {/* Nút tạo show nhanh (Chỉ hiện cho Admin) */}
          {user?.role === 'admin' && (
            <Link to="/bookings" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition transform hover:-translate-y-1">
              <PlusCircle size={20}/> Tạo Show Mới
            </Link>
          )}
        </header>

        {/* Nội dung chính */}
        {loading ? ( 
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div> 
        ) : events.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-3xl border border-dashed border-gray-300 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
            <h3 className="text-lg font-medium text-gray-900">Chưa có lịch diễn nào</h3>
            <p className="text-gray-500 mt-1">Hệ thống đang trống, hãy chờ Admin lên đơn nhé.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {events.map((ev) => (
              <Link
                to={`/events/${ev._id}`} // Link bấm vào chi tiết
                key={ev._id}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Cái vạch màu bên trái */}
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

export default Dashboard;