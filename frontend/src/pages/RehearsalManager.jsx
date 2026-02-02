import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, Clock, MapPin, Music, Plus, 
  CheckCircle, XCircle, DollarSign, 
  Users, ChevronDown, ChevronUp, Trash2, Save, Loader
} from "lucide-react";
import toast from "react-hot-toast";

const RehearsalManager = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // State form tạo mới
  const [newForm, setNewForm] = useState({ date: "", time: "", location: "", content: "" });
  
  // State chỉnh sửa điểm danh
  const [expandedId, setExpandedId] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState([]);

  // URL API
  const API_URL = "https://band-manager-s9tm.onrender.com/api/rehearsals";
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // 1. Tải dữ liệu
  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL, getHeaders());
      setRehearsals(res.data || []); // Bảo vệ nếu data null
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải lịch tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Tạo lịch tập mới
  const handleCreate = async () => {
    if (!newForm.date || !newForm.time || !newForm.location) return toast.error("Vui lòng nhập đủ thông tin");
    
    try {
      await axios.post(API_URL, newForm, getHeaders());
      toast.success("Đã tạo lịch tập! 🎉");
      setShowModal(false);
      setNewForm({ date: "", time: "", location: "", content: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo lịch");
    }
  };

  // 3. Xóa lịch tập
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa lịch này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getHeaders());
      toast.success("Đã xóa");
      fetchData();
    } catch (err) {
      toast.error("Lỗi xóa");
    }
  };

  // 4. Xử lý logic điểm danh (Ở Client)
  const toggleExpand = (item) => {
    if (expandedId === item._id) {
      setExpandedId(null);
    } else {
      setExpandedId(item._id);
      // 👇 FIX LỖI: Thêm || [] để tránh crash nếu attendance bị null
      const safeAttendance = item.attendance || [];
      setEditingAttendance(JSON.parse(JSON.stringify(safeAttendance)));
    }
  };

  const changeStatus = (memberId, newStatus) => {
    setEditingAttendance(prev => prev.map(m => {
      if (m._id === memberId) {
        let fine = 0;
        if (newStatus === 'late') fine = 50000;   // Phạt 50k đi trễ
        if (newStatus === 'absent') fine = 100000; // Phạt 100k vắng
        return { ...m, status: newStatus, fine };
      }
      return m;
    }));
  };

  // 5. Lưu điểm danh lên Server
  const saveAttendance = async (rehearsalId) => {
    try {
      await axios.put(`${API_URL}/${rehearsalId}/attendance`, { attendance: editingAttendance }, getHeaders());
      toast.success("Đã lưu điểm danh! 💾");
      fetchData(); 
      setExpandedId(null);
    } catch (err) {
      toast.error("Lỗi lưu điểm danh");
    }
  };

  // 👇 FIX LỖI QUAN TRỌNG: Tính toán thống kê an toàn
  const totalRehearsals = rehearsals.length;
  const totalFine = rehearsals.reduce((acc, curr) => {
    // Nếu attendance không tồn tại, coi như mảng rỗng để không bị lỗi .reduce
    const attendanceList = curr.attendance || []; 
    return acc + attendanceList.reduce((sum, m) => sum + (m.fine || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200"><Calendar size={28} /></span>
              Lịch Tập & Điểm Danh
            </h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
              <Plus size={20}/> Lên Lịch Mới
            </button>
          )}
        </div>

        {/* THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Tổng buổi tập</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{totalRehearsals}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Music size={24}/></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between border border-red-100">
            <div>
              <p className="text-red-400 text-xs font-bold uppercase">Quỹ phạt chờ thu</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-1">{totalFine.toLocaleString()}đ</h3>
            </div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><DollarSign size={24}/></div>
          </div>
        </div>

        {/* DANH SÁCH */}
        <div className="space-y-6">
          {loading ? <div className="text-center py-10"><Loader className="animate-spin mx-auto text-blue-500"/></div> : 
           rehearsals.length === 0 ? <p className="text-center text-gray-400 py-10">Chưa có lịch tập nào.</p> :
           rehearsals.map((item) => (
            <div key={item._id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${expandedId === item._id ? 'ring-2 ring-blue-500/20' : ''}`}>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Ngày tháng */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <span className="text-xs font-bold uppercase">{new Date(item.date).toLocaleString('vi', { month: 'short' })}</span>
                  <span className="text-2xl font-extrabold">{new Date(item.date).getDate()}</span>
                </div>

                {/* Nội dung */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-gray-800">{item.content || "Buổi tập thường kỳ"}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Clock size={16} className="text-orange-500"/> {item.time}</div>
                    <div className="flex items-center gap-1"><MapPin size={16} className="text-purple-500"/> {item.location}</div>
                  </div>
                </div>

                {/* Nút thao tác */}
                <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100">
                  <button onClick={() => toggleExpand(item)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition">
                    <Users size={16}/> {user?.role === 'admin' ? "Điểm danh" : "Xem chi tiết"}
                    {expandedId === item._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>
              </div>

              {/* Phần điểm danh mở rộng */}
              {expandedId === item._id && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-fade-in">
                  <div className="grid gap-3">
                    {/* 👇 FIX LỖI: Nếu không có attendance thì map mảng rỗng */}
                    {(editingAttendance || []).map((m) => (
                      <div key={m._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {m.user?.fullName?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-gray-700">{m.user?.fullName || "Thành viên cũ"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           {user?.role === 'admin' ? (
                             <>
                               <button onClick={() => changeStatus(m._id, 'present')} className={`p-1.5 rounded-lg transition ${m.status === 'present' ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:bg-gray-100'}`} title="Có mặt"><CheckCircle size={20}/></button>
                               <button onClick={() => changeStatus(m._id, 'late')} className={`p-1.5 rounded-lg transition ${m.status === 'late' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:bg-gray-100'}`} title="Đi trễ"><Clock size={20}/></button>
                               <button onClick={() => changeStatus(m._id, 'absent')} className={`p-1.5 rounded-lg transition ${m.status === 'absent' ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:bg-gray-100'}`} title="Vắng mặt"><XCircle size={20}/></button>
                             </>
                           ) : (
                             <span className={`text-xs font-bold px-2 py-1 rounded ${m.status === 'present' ? 'text-green-600 bg-green-50' : m.status === 'late' ? 'text-yellow-600 bg-yellow-50' : m.status === 'absent' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                                {m.status === 'present' ? 'Có mặt' : m.status === 'late' ? 'Đi trễ' : m.status === 'absent' ? 'Vắng' : 'Chưa điểm danh'}
                             </span>
                           )}

                           {m.fine > 0 && (
                             <span className="ml-2 px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">
                               -{m.fine.toLocaleString()}đ
                             </span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="mt-4 text-right">
                       <button onClick={() => saveAttendance(item._id)} className="flex items-center gap-2 ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                         <Save size={18}/> Lưu Điểm Danh
                       </button>
                    </div>
                  )}
                </div>
              )}
            </div>
           ))
          }
        </div>
      </div>

      {/* MODAL TẠO LỊCH */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Lên Lịch Tập Mới 📅</h3>
              <div className="space-y-4">
                 <div className="flex gap-2">
                    <input type="date" className="flex-1 p-3 border rounded-xl" onChange={e => setNewForm({...newForm, date: e.target.value})}/>
                    <input type="time" className="w-1/3 p-3 border rounded-xl" onChange={e => setNewForm({...newForm, time: e.target.value})}/>
                 </div>
                 <input type="text" placeholder="Địa điểm" className="w-full p-3 border rounded-xl" onChange={e => setNewForm({...newForm, location: e.target.value})}/>
                 <textarea rows="3" placeholder="Nội dung tập" className="w-full p-3 border rounded-xl" onChange={e => setNewForm({...newForm, content: e.target.value})}></textarea>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                 <button onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-xl">Hủy</button>
                 <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Tạo Lịch</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RehearsalManager;