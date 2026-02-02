import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Calendar, Clock, MapPin, Trash2, CheckCircle, XCircle, AlertTriangle, Plus, DollarSign } from "lucide-react";
import toast from 'react-hot-toast';

const Rehearsals = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    date: "",
    time: "", 
    location: "",
    content: ""
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  // 1. Tải danh sách
  const fetchRehearsals = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/rehearsals`, getAuthHeader());
      setRehearsals(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRehearsals(); }, []);

  // 🔥 TÍNH TỔNG TIỀN PHẠT TỰ ĐỘNG 🔥
  const totalFines = useMemo(() => {
    return rehearsals.reduce((total, item) => {
      const sessionFines = item.attendees?.reduce((sum, member) => {
         if (member.status === 'late') return sum + 50000;   // Đi muộn 50k
         if (member.status === 'absent') return sum + 100000; // Vắng 100k
         return sum;
      }, 0) || 0;
      return total + sessionFines;
    }, 0);
  }, [rehearsals]);

  // Format tiền tệ
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);


  // 2. Tạo lịch tập mới
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.location) return toast.error("Nhập thiếu thông tin!");

    const toastId = toast.loading("Đang tạo lịch...");
    try {
      await axios.post(`${BASE_URL}/rehearsals`, formData, getAuthHeader());
      toast.success("Đã tạo lịch tập! 🎸", { id: toastId });
      setFormData({ date: "", time: "", location: "", content: "" }); // Reset form
      fetchRehearsals();
    } catch (error) {
      const message = error.response?.data?.message || "Lỗi không xác định";
      toast.error(`Toang rồi: ${message}`, { id: toastId });
    }
  };

  // 3. Xóa lịch
  const handleDelete = async (id) => {
    if(!window.confirm("Xóa buổi tập này?")) return;
    try {
      await axios.delete(`${BASE_URL}/rehearsals/${id}`, getAuthHeader());
      toast.success("Đã xóa");
      setRehearsals(rehearsals.filter(r => r._id !== id));
    } catch (error) { toast.error("Lỗi xóa"); }
  };

  // 4. Update điểm danh
  const handleAttendance = async (rehearsalId, userId, status) => {
    try {
      await axios.put(`${BASE_URL}/rehearsals/${rehearsalId}/attendance`, { userId, status }, getAuthHeader());
      toast.success("Đã lưu điểm danh");
      
      // Cập nhật UI ngay lập tức để tính lại tiền
      setRehearsals(prev => prev.map(r => {
        if (r._id === rehearsalId) {
          const newAttendees = r.attendees.map(a => a.user._id === userId ? { ...a, status } : a);
          // Nếu user chưa có trong attendees (lỗi logic hiếm gặp), ta bỏ qua xử lý phức tạp ở đây
          return { ...r, attendees: newAttendees };
        }
        return r;
      }));
      // (Mẹo: Để chắc ăn nhất thì gọi lại fetchRehearsals(), nhưng cập nhật local state thì nhanh hơn)
      fetchRehearsals(); 
    } catch (error) { toast.error("Lỗi điểm danh"); }
  };

  if (loading) return <div className="p-10 text-center">Đang tải lịch tập...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header & Tổng tiền phạt */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Calendar className="text-blue-600"/> Lịch Tập & Điểm Danh
           </h1>
           <p className="text-slate-500 text-sm">Kỷ luật là sức mạnh của Band!</p>
        </div>
        
        {/* Widget Tiền Phạt (Đã tính toán thật) */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
           <div className="bg-white p-2 rounded-full shadow-sm text-amber-600 font-bold"><DollarSign size={20}/></div>
           <div>
             <div className="text-[10px] font-bold uppercase opacity-70">QUỸ PHẠT (CHỜ THU)</div>
             <div className="text-xl font-black">{formatCurrency(totalFines)}</div>
           </div>
        </div>
      </div>

      {/* FORM TẠO LỊCH (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18}/> Lên Lịch Tập Mới</div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            
            <input type="time" className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />

            <input type="text" placeholder="Địa điểm (VD: 199 Xã Đàn)" className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            
            <input type="text" placeholder="Nội dung tập (VD: Chạy bài show)" className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
            
            <button className="md:col-span-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/30">
              + Tạo Lịch
            </button>
          </form>
        </div>
      )}

      {/* DANH SÁCH LỊCH TẬP */}
      <div className="space-y-6">
        {rehearsals.length === 0 ? <p className="text-center text-slate-400 py-10">Chưa có lịch tập nào.</p> : 
         rehearsals.map(item => (
          <div key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header Lịch */}
            <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-700 rounded-xl p-3 text-center min-w-[60px]">
                  <div className="text-xs font-bold uppercase">THÁNG {new Date(item.date).getMonth() + 1}</div>
                  <div className="text-2xl font-black">{new Date(item.date).getDate()}</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{item.content}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                    <span className="flex items-center gap-1 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Clock size={14} className="text-blue-500"/> {item.time}
                    </span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {item.location}</span>
                  </div>
                </div>
              </div>
              {user?.role === 'admin' && (
                <button onClick={() => handleDelete(item._id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
              )}
            </div>

            {/* Danh sách điểm danh */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {item.attendees?.map(att => (
                <div key={att._id} className={`flex items-center justify-between p-3 rounded-xl border ${att.status === 'absent' ? 'bg-red-50 border-red-100' : att.status === 'late' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {att.user?.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700">{att.user?.fullName}</div>
                      {att.status === 'late' && <div className="text-[10px] text-amber-600 font-bold">Phạt: 50.000đ</div>}
                      {att.status === 'absent' && <div className="text-[10px] text-red-600 font-bold">Phạt: 100.000đ</div>}
                    </div>
                  </div>

                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleAttendance(item._id, att.user._id, 'present')} title="Có mặt" className={`p-1.5 rounded-lg ${att.status === 'present' ? 'bg-green-500 text-white' : 'text-slate-300 hover:bg-slate-100'}`}><CheckCircle size={16}/></button>
                      <button onClick={() => handleAttendance(item._id, att.user._id, 'late')} title="Đi muộn" className={`p-1.5 rounded-lg ${att.status === 'late' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-100'}`}><AlertTriangle size={16}/></button>
                      <button onClick={() => handleAttendance(item._id, att.user._id, 'absent')} title="Vắng" className={`p-1.5 rounded-lg ${att.status === 'absent' ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-slate-100'}`}><XCircle size={16}/></button>
                    </div>
                  )}
                  {user?.role !== 'admin' && (
                    <div className="text-xs font-bold">
                       {att.status === 'present' && <span className="text-green-600">Có mặt</span>}
                       {att.status === 'late' && <span className="text-amber-600">Đi muộn</span>}
                       {att.status === 'absent' && <span className="text-red-600">Vắng</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
         ))
        }
      </div>
    </div>
  );
};

export default Rehearsals;