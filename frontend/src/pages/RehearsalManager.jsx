import { useState, useEffect, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { Calendar, Clock, MapPin, Music, Plus, CheckCircle, XCircle, DollarSign, Users, ChevronDown, ChevronUp, Trash2, Save, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const RehearsalManager = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({ date: "", time: "", location: "", content: "" });
  const [expandedId, setExpandedId] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState([]);

  const fetchData = async () => {
    try {
      const res = await api.get("/rehearsals");
      setRehearsals(res.data || []);
    } catch (err) { toast.error("Lỗi tải lịch tập"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newForm.date || !newForm.time || !newForm.location) return toast.error("Vui lòng nhập đủ thông tin");
    try {
      await api.post("/rehearsals", newForm);
      toast.success("Đã lên lịch tập mới! 🎸");
      setShowModal(false);
      setNewForm({ date: "", time: "", location: "", content: "" });
      fetchData();
    } catch (err) { toast.error("Lỗi tạo lịch"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch tập này?")) return;
    try {
      await api.delete(`/rehearsals/${id}`);
      toast.success("Đã xóa");
      fetchData();
    } catch (err) { toast.error("Lỗi xóa"); }
  };

  const toggleExpand = (item) => {
    if (expandedId === item._id) {
      setExpandedId(null);
    } else {
      setExpandedId(item._id);
      setEditingAttendance(JSON.parse(JSON.stringify(item.attendance || [])));
    }
  };

  const changeStatus = (memberId, newStatus) => {
    setEditingAttendance(prev => prev.map(m => {
      if (m._id === memberId) {
        let fine = 0;
        if (newStatus === 'late') fine = 50000;
        if (newStatus === 'absent') fine = 100000;
        return { ...m, status: newStatus, fine };
      }
      return m;
    }));
  };

  const saveAttendance = async (rehearsalId) => {
    try {
      await api.put(`/rehearsals/${rehearsalId}/attendance`, { attendance: editingAttendance });
      toast.success("Đã cập nhật điểm danh!");
      fetchData(); 
      setExpandedId(null);
    } catch (err) { toast.error("Lỗi lưu điểm danh"); }
  };

  const totalFine = rehearsals.reduce((acc, curr) => {
    const list = curr.attendance || []; 
    return acc + list.reduce((sum, m) => sum + (m.fine || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-violet-600 to-purple-600 text-white p-2.5 rounded-2xl shadow-lg shadow-violet-200"><Calendar size={28} /></span>
              Lịch Tập & Điểm Danh
            </h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl hover:bg-black transition transform active:scale-95">
              <Plus size={20}/> Lên Lịch Tập
            </button>
          )}
        </div>

        {/* THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-[32px] flex items-center justify-between card-hover">
            <div>
              <p className="text-violet-500 text-xs font-bold uppercase tracking-widest">Số buổi tập</p>
              <h3 className="text-4xl font-black text-slate-800 mt-1">{rehearsals.length}</h3>
            </div>
            <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner"><Music size={28}/></div>
          </div>
          <div className="glass p-6 rounded-[32px] flex items-center justify-between border-rose-100 card-hover">
            <div>
              <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">Quỹ phạt chờ thu</p>
              <h3 className="text-4xl font-black text-rose-600 mt-1">{totalFine.toLocaleString()}đ</h3>
            </div>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><DollarSign size={28}/></div>
          </div>
        </div>

        {/* LIST REHEARSALS */}
        <div className="space-y-5">
          {loading ? <div className="text-center py-10"><Loader className="animate-spin mx-auto text-violet-600" size={32}/></div> : 
           rehearsals.length === 0 ? <p className="text-center text-slate-400 py-10 font-medium">Chưa có lịch tập được ghi nhận.</p> :
           rehearsals.map((item) => (
            <div key={item._id} className={`glass rounded-[32px] transition-all duration-300 overflow-hidden ${expandedId === item._id ? 'ring-2 ring-violet-500/20 shadow-xl' : 'shadow-sm'}`}>
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                {/* Ngày */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 rounded-2xl border border-slate-200 shadow-inner group-hover:scale-105 transition">
                  <span className="text-xs font-black uppercase text-violet-600">{new Date(item.date).toLocaleString('vi', { month: 'short' })}</span>
                  <span className="text-4xl font-black leading-none mt-1">{new Date(item.date).getDate()}</span>
                </div>

                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">{item.content || "Buổi tập thường kỳ"}</h3>
                  <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"><Clock size={16} className="text-orange-500"/> {item.time}</div>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"><MapPin size={16} className="text-blue-500"/> {item.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:border-l md:pl-8 border-slate-100">
                  <button onClick={() => toggleExpand(item)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${expandedId === item._id ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Users size={18}/> {user?.role === 'admin' ? "Điểm danh" : "Thành viên"}
                    {expandedId === item._id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(item._id)} className="p-2.5 text-slate-400 hover:text-rose-500 transition rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100">
                      <Trash2 size={20}/>
                    </button>
                  )}
                </div>
              </div>

              {expandedId === item._id && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 md:p-8 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(editingAttendance || []).map((m) => (
                      <div key={m._id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-black text-sm">
                            {m.user?.fullName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{m.user?.fullName || "Thành viên"}</p>
                            <p className={`text-[10px] font-black uppercase mt-1 ${m.status === 'present' ? 'text-emerald-500' : m.status === 'late' ? 'text-amber-500' : m.status === 'absent' ? 'text-rose-500' : 'text-slate-400'}`}>
                               {m.status === 'pending' ? 'Chưa báo' : m.status}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                           {user?.role === 'admin' ? (
                             <>
                               <button onClick={() => changeStatus(m._id, 'present')} className={`p-1.5 rounded-lg transition ${m.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-slate-100'}`}><CheckCircle size={20}/></button>
                               <button onClick={() => changeStatus(m._id, 'late')} className={`p-1.5 rounded-lg transition ${m.status === 'late' ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:bg-slate-100'}`}><Clock size={20}/></button>
                               <button onClick={() => changeStatus(m._id, 'absent')} className={`p-1.5 rounded-lg transition ${m.status === 'absent' ? 'bg-rose-100 text-rose-600' : 'text-slate-300 hover:bg-slate-100'}`}><XCircle size={20}/></button>
                             </>
                           ) : m.fine > 0 && (
                             <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100">
                               -{m.fine.toLocaleString()}đ
                             </span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="mt-8 flex justify-end">
                       <button onClick={() => saveAttendance(item._id)} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-black transition transform active:scale-95">
                         <Save size={18}/> LƯU ĐIỂM DANH
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

      {/* MODAL CREATE */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-8 animate-slide-up">
              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">Lên Lịch Tập Mới <span className="text-violet-600">🎸</span></h3>
              <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ngày tập</label>
                        <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-violet-500 font-bold" onChange={e => setNewForm({...newForm, date: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Giờ tập</label>
                        <input type="time" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-violet-500 font-bold" onChange={e => setNewForm({...newForm, time: e.target.value})}/>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Địa điểm</label>
                    <input type="text" placeholder="Nhập tên phòng tập..." className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-violet-500 font-medium" onChange={e => setNewForm({...newForm, location: e.target.value})}/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung (Không bắt buộc)</label>
                    <textarea rows="3" placeholder="Ghi chú bài tập hôm nay..." className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 ring-violet-500 font-medium" onChange={e => setNewForm({...newForm, content: e.target.value})}></textarea>
                 </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                 <button onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition">Đóng</button>
                 <button onClick={handleCreate} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition transform active:scale-95">TẠO LỊCH TẬP</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RehearsalManager;