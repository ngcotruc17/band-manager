import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Calendar, Clock, MapPin, Trash2, CheckCircle, XCircle, AlertTriangle, Plus, DollarSign } from "lucide-react";
import toast from 'react-hot-toast';

const RehearsalManager = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form tạo mới
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newContent, setNewContent] = useState("");

  const API_URL = "https://band-manager-s9tm.onrender.com/api/rehearsals";

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 1. Tải danh sách
  const fetchRehearsals = async () => {
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setRehearsals(res.data);
    } catch (error) {
      toast.error("Không thể tải lịch tập!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRehearsals();
  }, []);

  // 2. Tạo lịch tập mới (Chỉ Admin)
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime || !newLocation || !newContent) return toast.error("Vui lòng điền đủ thông tin!");

    const toastId = toast.loading("Đang tạo lịch...");
    try {
      await axios.post(API_URL, {
        date: newDate,
        time: newTime,
        location: newLocation,
        content: newContent
      }, getAuthHeader());

      toast.success("Đã lên lịch tập mới! 📅", { id: toastId });
      setNewContent(""); setNewDate(""); setNewTime(""); setNewLocation("");
      fetchRehearsals();
    } catch (error) {
      toast.error("Lỗi khi tạo lịch", { id: toastId });
    }
  };

  // 3. Xóa lịch tập
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy buổi tập này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeader());
      toast.success("Đã xóa lịch tập");
      setRehearsals(rehearsals.filter(r => r._id !== id));
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  // 4. Điểm danh (Check-in)
  const handleCheckIn = async (rehearsalId, userId, status) => {
    try {
      await axios.put(`${API_URL}/${rehearsalId}/checkin`, {
        userId,
        status
      }, getAuthHeader());
      
      toast.success(status === 'present' ? "Đã điểm danh ✅" : status === 'late' ? "Đánh dấu đi muộn ⚠️" : "Đánh dấu vắng ❌");
      fetchRehearsals(); // Load lại để cập nhật tiền phạt
    } catch (error) {
      toast.error("Lỗi điểm danh");
    }
  };

  // Tính tổng quỹ phạt
  const totalFine = rehearsals.reduce((sum, r) => {
    return sum + (r.attendees?.reduce((s, a) => s + (a.fine || 0), 0) || 0);
  }, 0);

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header & Quỹ Nhóm */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Lịch Tập & Điểm Danh
          </h1>
          <p className="text-gray-500">Kỷ luật là sức mạnh của Band!</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-full text-yellow-600"><DollarSign size={20}/></div>
          <div>
            <p className="text-xs text-yellow-600 font-bold uppercase">Quỹ nhóm (Từ tiền phạt)</p>
            <p className="text-xl font-extrabold text-yellow-700">{totalFine.toLocaleString()} đ</p>
          </div>
        </div>
      </div>

      {/* Form tạo lịch (Chỉ Admin thấy) */}
      {user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PlusCircle size={18}/> Lên Lịch Tập Mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="Địa điểm (VD: 199 Xã Đàn)" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="Nội dung tập (VD: Chạy bài show Tết)" value={newContent} onChange={e => setNewContent(e.target.value)} className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <button className="md:col-span-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
              <Plus size={20}/> Tạo Lịch
            </button>
          </form>
        </div>
      )}

      {/* Danh sách lịch tập */}
      <div className="space-y-6">
        {rehearsals.length === 0 ? (
           <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             Chưa có lịch tập nào sắp tới.
           </div>
        ) : (
          rehearsals.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Info Bar */}
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-100 text-blue-600 p-2 rounded-lg font-bold text-center min-w-[50px]">
                      <div className="text-xs">THÁNG {new Date(item.date).getMonth() + 1}</div>
                      <div className="text-xl">{new Date(item.date).getDate()}</div>
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-gray-800">{item.content}</h3>
                      <div className="text-gray-500 text-sm flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock size={14}/> {item.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> {item.location}</span>
                      </div>
                   </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500 transition p-2">
                    <Trash2 size={20}/>
                  </button>
                )}
              </div>

              {/* Danh sách điểm danh */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.attendees?.map((att) => (
                  <div key={att._id} className={`flex items-center justify-between p-3 rounded-xl border ${
                    att.status === 'absent' ? 'bg-red-50 border-red-100' : 
                    att.status === 'late' ? 'bg-yellow-50 border-yellow-100' : 'bg-white border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">
                        {att.user?.fullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{att.user?.fullName || "Thành viên cũ"}</div>
                        {att.fine > 0 && <div className="text-xs text-red-600 font-bold">Phạt: {att.fine.toLocaleString()}đ</div>}
                      </div>
                    </div>

                    {/* Nút điểm danh (Chỉ Admin thấy) */}
                    {user?.role === 'admin' ? (
                      <div className="flex gap-1">
                        <button title="Có mặt" onClick={() => handleCheckIn(item._id, att.user._id, 'present')} className={`p-1.5 rounded-lg transition ${att.status === 'present' ? 'bg-green-500 text-white' : 'hover:bg-green-100 text-green-500'}`}>
                          <CheckCircle size={16}/>
                        </button>
                        <button title="Đi muộn" onClick={() => handleCheckIn(item._id, att.user._id, 'late')} className={`p-1.5 rounded-lg transition ${att.status === 'late' ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-100 text-yellow-500'}`}>
                          <AlertTriangle size={16}/>
                        </button>
                        <button title="Vắng mặt" onClick={() => handleCheckIn(item._id, att.user._id, 'absent')} className={`p-1.5 rounded-lg transition ${att.status === 'absent' ? 'bg-red-500 text-white' : 'hover:bg-red-100 text-red-500'}`}>
                          <XCircle size={16}/>
                        </button>
                      </div>
                    ) : (
                      // User thường chỉ xem trạng thái
                      <div className="text-sm">
                        {att.status === 'present' && <span className="text-green-600 font-bold">Có mặt</span>}
                        {att.status === 'late' && <span className="text-yellow-600 font-bold">Đi muộn</span>}
                        {att.status === 'absent' && <span className="text-red-600 font-bold">Vắng</span>}
                        {att.status === 'pending' && <span className="text-gray-400">Chưa điểm danh</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Import component icon nếu thiếu
import { PlusCircle } from "lucide-react";

export default RehearsalManager;