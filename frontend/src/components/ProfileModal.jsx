import { useState, useEffect } from "react";
import axios from "axios";
import { X, User, Mail, Phone, Music, Save } from "lucide-react";
import toast from "react-hot-toast";

const ProfileModal = ({ user, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    instrument: ""
  });
  const [loading, setLoading] = useState(false);

  // Điền dữ liệu cũ vào form
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        instrument: user.instrument || ""
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Gọi API cập nhật
      const res = await axios.put(
        "https://band-manager-s9tm.onrender.com/api/users/profile", 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Cập nhật hồ sơ thành công!");
      onUpdateSuccess(res.data); // Báo cho Navbar biết để cập nhật giao diện
      onClose(); // Đóng modal
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <User size={20}/> Cập nhật Hồ Sơ
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20}/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Họ và Tên</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full pl-10 p-2.5 border rounded-xl focus:ring-2 ring-purple-500 outline-none bg-gray-50 transition" placeholder="Nhập họ tên..." required />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email (Quan trọng)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full pl-10 p-2.5 border rounded-xl focus:ring-2 ring-purple-500 outline-none bg-gray-50 transition" placeholder="email@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full pl-10 p-2.5 border rounded-xl focus:ring-2 ring-purple-500 outline-none bg-gray-50 transition" placeholder="090..." />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nhạc cụ / Vai trò</label>
            <div className="relative">
              <Music className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input name="instrument" value={formData.instrument} onChange={handleChange} type="text" className="w-full pl-10 p-2.5 border rounded-xl focus:ring-2 ring-purple-500 outline-none bg-gray-50 transition" placeholder="Guitar, Drum, Vocal..." />
            </div>
          </div>

          <div className="pt-2">
            <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition active:scale-95">
              {loading ? "Đang lưu..." : <><Save size={18}/> Lưu Thay Đổi</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProfileModal;