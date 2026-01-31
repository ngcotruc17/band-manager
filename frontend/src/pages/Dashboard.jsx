import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom"; // Import Link
import axios from "axios";
import { Calendar, MapPin, Clock, PlusCircle, Music, ArrowRight, AlertCircle, Phone, CheckCircle, Hourglass, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [events, setEvents] = useState([]); // Đổi tên state từ bookings -> events
  const [loading, setLoading] = useState(true);

  // Đổi API Booking -> API Events
  const API_URL_REHEARSAL = "https://band-manager-s9tm.onrender.com/api/rehearsals";
  const API_URL_EVENTS = "https://band-manager-s9tm.onrender.com/api/events"; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [resRehearsal, resEvents] = await Promise.all([
          axios.get(API_URL_REHEARSAL, config),
          axios.get(API_URL_EVENTS, config)
        ]);

        setRehearsals(resRehearsal.data.slice(0, 3));
        setEvents(resEvents.data.slice(0, 3)); // Lấy 3 show gần nhất

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hàm render trạng thái (Lấy từ bookingRef)
  const renderStatusBadge = (status) => {
    if (status === 'approved') return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1"><CheckCircle size={10}/> Mở đăng ký</span>;
    if (status === 'pending') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded flex items-center gap-1"><Hourglass size={10}/> Chờ duyệt</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">{status || "Mới"}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Xin chào, <span className="text-blue-600">{user?.fullName || "Bạn"}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2">Hôm nay bạn có lịch trình gì không?</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/booking-manager" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition">
            <PlusCircle size={18} /> Tạo Show Mới
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: LỊCH DIỄN (EVENTS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Music className="text-pink-500"/> Lịch Diễn Sắp Tới
            </h2>
          </div>

          {loading ? <div className="text-center py-10 text-gray-400">Đang tải...</div> : 
           events.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-64">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300"><Calendar size={32}/></div>
               <p className="text-gray-500">Chưa có lịch diễn nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                // 🔥 THẺ LINK BAO QUANH ĐỂ CLICK ĐƯỢC 🔥
                <Link to={`/events/${event._id}`} key={event._id} className="block group">
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-blue-200 transition flex items-center gap-5 relative overflow-hidden">
                    
                    {/* Hiệu ứng hover */}
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition transform translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="text-blue-500" />
                    </div>

                    {/* Ngày tháng */}
                    <div className="bg-pink-50 text-pink-600 rounded-2xl p-4 text-center min-w-[80px]">
                      <div className="text-xs font-bold uppercase">Tháng {new Date(event.date).getMonth() + 1}</div>
                      <div className="text-3xl font-extrabold">{new Date(event.date).getDate()}</div>
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">
                            {event.title || "Show chưa đặt tên"}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                             <span className="flex items-center gap-1"><MapPin size={14}/> {event.location || "Chưa có địa điểm"}</span>
                          </div>
                        </div>
                        {/* Trạng thái lấy từ bookingRef */}
                        {renderStatusBadge(event.bookingRef?.status)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: LỊCH TẬP (Giữ nguyên) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Clock className="text-blue-500"/> Lịch Tập</h2>
            <Link to="/rehearsals" className="text-sm text-blue-600 hover:underline flex items-center">Xem tất cả <ArrowRight size={14}/></Link>
          </div>
          <div className="space-y-3">
            {rehearsals.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-500">Chưa có lịch tập.</div>
            ) : (
              rehearsals.map((item) => (
                <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                   <div className="bg-blue-50 text-blue-700 rounded-xl p-2 text-center min-w-[50px]">
                      <div className="text-sm font-bold">{new Date(item.date).getDate()}/{new Date(item.date).getMonth()+1}</div>
                   </div>
                   <div>
                      <div className="font-bold text-gray-800 text-sm">{item.content}</div>
                      <div className="text-xs text-gray-500">{item.time} • {item.location}</div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;