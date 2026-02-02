import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Clock, Calendar, Phone, User, X, CheckCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BookingManager = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    contactInfo: '',
    date: '',
    time: '',
    status: 'pending'
  });

  const API_URL = (import.meta.env.VITE_API_URL || 'https://band-manager-s9tm.onrender.com/api') + '/bookings';
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchBookings = async () => {
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setBookings(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.date) return alert("Nhập thiếu thông tin!");
    try {
      await axios.post(API_URL, formData, getAuthHeader());
      alert("✅ Đã tạo Booking và Event!");
      setFormData({ customerName: '', contactInfo: '', date: '', time: '', status: 'pending' });
      fetchBookings();
    } catch (error) { alert("Lỗi khi tạo"); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/${id}`, { status: newStatus }, getAuthHeader());
      fetchBookings();
    } catch (error) { alert("Lỗi cập nhật"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Xóa booking này sẽ xóa luôn Event tương ứng. Chắc chưa?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeader());
      fetchBookings();
    } catch (error) { alert("Lỗi xóa"); }
  };

  // Badge trạng thái (Thêm completed)
  const renderStatus = (status) => {
    if (status === 'approved') return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã duyệt</span>;
    if (status === 'pending') return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Chờ duyệt</span>;
    // 👇 Thêm cái này
    if (status === 'completed') return <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCheck size={12}/> Đã diễn xong</span>;
    
    return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Đã hủy/Khác</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Quản lý Booking</h1>

      {/* FORM TẠO BOOKING */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-blue-600 mb-4 flex items-center gap-2"><Plus size={20}/> Tạo Booking Mới</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none" placeholder="Tên khách hàng / Tên Show" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
          </div>
          <div className="md:col-span-3">
            <input className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none" placeholder="SĐT / Liên hệ" value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <input type="date" className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
          </div>
          <div className="md:col-span-2">
            <input type="time" className="w-full border p-3 rounded-lg focus:ring-2 ring-blue-500 outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg">Tạo Booking</button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {bookings.map(b => (
                <tr key={b._id} className="hover:bg-blue-50/30 transition">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{b.customerName}</div>
                    <div className="text-gray-400 text-xs">{b.contactInfo}</div>
                  </td>
                  <td className="p-4 font-medium text-gray-600">
                     {new Date(b.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4">{renderStatus(b.status)}</td>
                  <td className="p-4 text-right">
                    {user?.role === 'admin' && (
                      <div className="flex justify-end gap-2">
                        <select 
                          className="border p-1.5 rounded text-xs bg-white cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b._id, e.target.value)}
                        >
                          <option value="pending">⏳ Chờ duyệt</option>
                          <option value="approved">✅ Duyệt</option>
                          <option value="completed">🏁 Đã diễn</option> {/* 👈 Thêm option này */}
                          <option value="rejected">❌ Từ chối</option>
                        </select>
                        <button onClick={() => handleDelete(b._id)} className="text-gray-300 hover:text-red-500 p-1 transition"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <div className="p-8 text-center text-gray-400">Chưa có booking nào.</div>}
        </div>
      </div>
    </div>
  );
};

export default BookingManager;