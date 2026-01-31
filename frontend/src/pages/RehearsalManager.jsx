import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, DollarSign, UserCheck, Clock, XCircle, Trash2, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RehearsalManager = () => {
  const [rehearsals, setRehearsals] = useState([]);
  const [formData, setFormData] = useState({ date: '', location: '', content: '' });
  const { user } = useContext(AuthContext);

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchRehearsals = async () => {
    try {
      // SỬA LINK RENDER NẾU CẦN
      const res = await axios.get('https://band-manager-s9tm.onrender.com/api/rehearsals', getHeaders());
      setRehearsals(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRehearsals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.content) return toast.error("Điền ngày và nội dung tập!");
    const toastId = toast.loading("Đang tạo lịch...");
    try {
      await axios.post('https://band-manager-s9tm.onrender.com/api/rehearsals', formData, getHeaders());
      toast.success("Đã lên lịch tập! 📅", { id: toastId });
      setFormData({ date: '', location: '', content: '' });
      fetchRehearsals();
    } catch (err) { toast.error("Lỗi tạo lịch", { id: toastId }); }
  };

  const handleCheckIn = async (rehearsalId, userId, status) => {
    try {
      await axios.put(`https://band-manager-s9tm.onrender.com/api/rehearsals/${rehearsalId}/checkin`, { userId, status }, getHeaders());
      toast.success("Đã cập nhật trạng thái!");
      fetchRehearsals();
    } catch (err) { toast.error("Lỗi điểm danh"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa buổi tập này?")) return;
    try {
      await axios.delete(`https://band-manager-s9tm.onrender.com/api/rehearsals/${id}`, getHeaders());
      toast.success("Đã xóa");
      fetchRehearsals();
    } catch (err) { toast.error("Lỗi xóa"); }
  };

  // Tính tổng quỹ phạt
  const totalFund = rehearsals.reduce((sum, r) => sum + r.attendees.reduce((s, a) => s + a.fine, 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">📅 Lịch Tập & Điểm Danh</h1>
          <p className="text-gray-500">Kỷ luật là sức mạnh của Band!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl shadow border border-yellow-200 text-right">
          <span className="text-gray-500 text-xs font-bold uppercase block">💰 Quỹ nhóm (Từ tiền phạt)</span>
          <span className="text-2xl font-black text-yellow-600">{totalFund.toLocaleString()} đ</span>
        </div>
      </div>

      {/* FORM TẠO LỊCH (CHỈ ADMIN) */}
      {user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 mb-8">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><PlusCircle/> Lên Lịch Tập Mới</h3>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
            <input type="date" className="border p-3 rounded-lg flex-1 outline-none focus:ring-2 ring-blue-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input type="text" placeholder="Địa điểm (VD: 199 Xã Đàn)" className="border p-3 rounded-lg flex-1 outline-none focus:ring-2 ring-blue-500" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            <input type="text" placeholder="Nội dung tập (VD: Chạy bài show Tết)" className="border p-3 rounded-lg flex-[2] outline-none focus:ring-2 ring-blue-500" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow transition">Tạo Lịch</button>
          </form>
        </div>
      )}

      {/* DANH SÁCH LỊCH TẬP */}
      <div className="space-y-6">
        {rehearsals.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header của thẻ */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={20}/> {new Date(r.date).toLocaleDateString('vi-VN')}
                  <span className="text-gray-400 font-normal text-sm">|</span>
                  <span className="text-gray-600 text-sm font-medium flex items-center gap-1"><MapPin size={14}/> {r.location}</span>
                </h3>
                <p className="text-blue-600 font-medium mt-1 ml-7">{r.content}</p>
              </div>
              {user?.role === 'admin' && (
                <button onClick={() => handleDelete(r._id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20}/></button>
              )}
            </div>

            {/* Danh sách thành viên điểm danh */}
            <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {r.attendees.map(a => (
                <div key={a._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  a.status === 'late' ? 'bg-yellow-50 border-yellow-200' : 
                  a.status === 'absent' ? 'bg-red-50 border-red-200' : 
                  a.status === 'present' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div>
                    <span className="font-bold text-gray-700 block">{a.user?.fullName || "Thành viên"}</span>
                    {a.fine > 0 && <span className="text-xs font-bold text-red-500">Phạt: {a.fine.toLocaleString()}đ</span>}
                  </div>

                  {/* Nút điểm danh (Chỉ Admin mới bấm được) */}
                  {user?.role === 'admin' ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleCheckIn(r._id, a.user._id, 'present')} title="Có mặt" className={`p-1.5 rounded ${a.status === 'present' ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-200'}`}><UserCheck size={16}/></button>
                      <button onClick={() => handleCheckIn(r._id, a.user._id, 'late')} title="Muộn (50k)" className={`p-1.5 rounded ${a.status === 'late' ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:bg-gray-200'}`}><Clock size={16}/></button>
                      <button onClick={() => handleCheckIn(r._id, a.user._id, 'absent')} title="Vắng (100k)" className={`p-1.5 rounded ${a.status === 'absent' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-200'}`}><XCircle size={16}/></button>
                    </div>
                  ) : (
                    // Member chỉ xem được trạng thái
                    <span className="text-sm font-bold opacity-80">
                      {a.status === 'present' && <span className="text-green-600">✅ Có mặt</span>}
                      {a.status === 'late' && <span className="text-yellow-600">⚠️ Muộn</span>}
                      {a.status === 'absent' && <span className="text-red-600">❌ Vắng</span>}
                      {a.status === 'pending' && <span className="text-gray-400">⏳ Chưa chốt</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {rehearsals.length === 0 && <div className="text-center text-gray-400 italic py-10">Chưa có lịch tập nào. Admin ơi lên lịch đi! 😴</div>}
      </div>
    </div>
  );
};

export default RehearsalManager;