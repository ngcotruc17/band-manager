import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // Import

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({ customerName: '', contactInfo: '', date: '' });
  const { user } = useContext(AuthContext);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchBookings = async () => {
    try {
      const res = await axios.get('https://band-manager-s9tm.onrender.com/api/bookings', getHeaders());
      setBookings(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCreate = async () => {
    if (!formData.customerName || !formData.date) return toast.error("Vui lòng điền đủ thông tin ⚠️");
    const toastId = toast.loading("Đang tạo...");
    try {
      await axios.post('https://band-manager-s9tm.onrender.com/api/bookings', formData, getHeaders());
      toast.success('Đã tạo booking thành công! 📅', { id: toastId });
      setFormData({ customerName: '', contactInfo: '', date: '' });
      fetchBookings();
    } catch (error) { toast.error('Lỗi khi tạo booking', { id: toastId }); }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.put(`https://band-manager-s9tm.onrender.com/api/bookings/${id}/status`, { status: newStatus }, getHeaders());
      toast.success(`Đã cập nhật: ${newStatus}`);
      fetchBookings();
    } catch (error) { toast.error('Lỗi cập nhật'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ CẢNH BÁO: Bạn chắc chắn muốn xóa vĩnh viễn booking này?")) return;
    try {
      await axios.delete(`https://band-manager-s9tm.onrender.com/api/bookings/${id}`, getHeaders());
      toast.success('Đã xóa booking vào thùng rác 🗑️');
      fetchBookings();
    } catch (error) { toast.error('Lỗi khi xóa'); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold"><Clock size={14}/> Chờ duyệt</span>;
      case 'approved': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold"><CheckCircle size={14}/> Đã duyệt</span>;
      case 'completed': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold"><PlayCircle size={14}/> Đã diễn</span>;
      case 'cancelled': return <span className="flex items-center gap-1 bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-bold"><XCircle size={14}/> Đã hủy</span>;
      default: return status;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Quản lý Booking</h1>

      {user?.role === 'admin' ? (
        <div className="bg-white p-6 rounded-lg shadow mb-8 border border-blue-100">
          <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2">➕ Tạo Booking Mới</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input className="border p-2 rounded flex-1 focus:ring-2 ring-blue-500 outline-none" placeholder="Tên khách hàng" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
            <input className="border p-2 rounded flex-1 focus:ring-2 ring-blue-500 outline-none" placeholder="SĐT / Liên hệ" value={formData.contactInfo} onChange={e => setFormData({ ...formData, contactInfo: e.target.value })} />
            <input type="date" className="border p-2 rounded focus:ring-2 ring-blue-500 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition shadow-md">Tạo Booking</button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded text-blue-800 mb-6 border border-blue-200">ℹ️ Bạn đang xem danh sách Booking.</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Ngày diễn</th>
              <th className="p-4">Trạng thái</th>
              {user?.role === 'admin' && <th className="p-4 text-center">Hành động</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map(item => (
              <tr key={item._id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{item.customerName}<div className="text-xs text-gray-400 font-normal mt-1">{item.contactInfo}</div></td>
                <td className="p-4 text-gray-600">{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                <td className="p-4">{getStatusBadge(item.status)}</td>
                {user?.role === 'admin' && (
                  <td className="p-4"><div className="flex justify-center items-center gap-2">
                      <select className="text-sm border rounded p-1 bg-white hover:border-blue-500 cursor-pointer outline-none" value={item.status} onChange={(e) => handleChangeStatus(item._id, e.target.value)}>
                        <option value="pending">⏳ Chờ duyệt</option>
                        <option value="approved">✅ Duyệt</option>
                        <option value="completed">🎉 Đã diễn</option>
                        <option value="cancelled">🚫 Đã hủy</option>
                      </select>
                      <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition"><Trash2 size={18} /></button>
                    </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <div className="p-10 text-center text-gray-400 italic">Chưa có booking nào.</div>}
      </div>
    </div>
  );
};

export default BookingManager;