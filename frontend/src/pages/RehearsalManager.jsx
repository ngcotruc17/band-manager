import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { Calendar, Clock, MapPin, Music, Plus, CheckCircle, XCircle, DollarSign, Users, ChevronDown, ChevronUp, Trash2, Save, Loader, AlertCircle, Camera, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const RehearsalManager = () => {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({ date: "", time: "", location: "", content: "" });
  const [expandedId, setExpandedId] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState([]);

  // States cho QR điểm danh (Admin)
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRehearsal, setQrRehearsal] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const fetchQRToken = async (rehearsalId) => {
    setQrLoading(true);
    try {
      const res = await api.get(`/rehearsals/${rehearsalId}/qr-token`);
      setQrToken(res.data.token);
    } catch (err) {
      toast.error("Không thể tạo mã QR điểm danh");
    } finally {
      setQrLoading(false);
    }
  };

  const handleShowQR = (item) => {
    setQrRehearsal(item);
    setShowQRModal(true);
    setQrToken("");
    fetchQRToken(item._id);
  };

  // Tự động làm mới token mỗi 60s
  useEffect(() => {
    let interval;
    if (showQRModal && qrRehearsal) {
      interval = setInterval(() => {
        fetchQRToken(qrRehearsal._id);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [showQRModal, qrRehearsal]);

  const fetchData = async () => {
    try {
      const res = await api.get("/rehearsals");
      setRehearsals(res.data || []);
    } catch (err) { 
      toast.error("Lỗi tải lịch tập"); 
    } finally { 
      setLoading(false); 
    }
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
    } catch (err) { 
      toast.error("Lỗi tạo lịch"); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch tập này?")) return;
    try {
      await api.delete(`/rehearsals/${id}`);
      toast.success("Đã xóa");
      fetchData();
    } catch (err) { 
      toast.error("Lỗi xóa"); 
    }
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
    } catch (err) { 
      toast.error("Lỗi lưu điểm danh"); 
    }
  };

  const totalFine = rehearsals.reduce((acc, curr) => {
    const list = curr.attendance || []; 
    return acc + list.reduce((sum, m) => sum + (m.fine || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-indigo-650 to-purple-600 text-white p-2.5 rounded-xl shadow-lg"><Calendar size={24} /></span>
              LỊCH TẬP & ĐIỂM DANH
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/checkin" className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold shadow-md transition transform active:scale-[0.98] text-xs uppercase tracking-wider">
              <Camera size={18}/> Quét QR Điểm Danh
            </Link>
            {user?.role === 'admin' && (
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-indigo-500/10 transition transform active:scale-[0.98] text-xs uppercase tracking-wider">
                <Plus size={18}/> Lên Lịch Tập
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/50 p-6 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-indigo-655 text-xs font-bold uppercase tracking-wider">Số buổi tập ráp band</p>
              <h3 className="text-3xl font-black text-slate-850 mt-1">{rehearsals.length}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center shadow-sm"><Music size={24}/></div>
          </div>
          
          <div className="bg-white border border-slate-200/50 p-6 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-rose-500 text-xs font-bold uppercase tracking-wider">Quỹ phạt chờ thu</p>
              <h3 className="text-3xl font-black text-rose-600 mt-1">{totalFine.toLocaleString()}đ</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div>
          </div>
        </div>

        {/* LIST REHEARSALS */}
        <div className="space-y-5">
          {loading ? (
            <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-650" size={32}/></div>
          ) : rehearsals.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <Music size={40} className="mx-auto text-slate-300 mb-3"/>
                <p className="text-slate-500 text-xs font-semibold">Chưa có lịch tập nào được ghi nhận.</p>
             </div>
          ) : (
             rehearsals.map((item) => (
              <div key={item._id} className={`bg-white rounded-3xl border border-slate-200/50 transition-all duration-300 overflow-hidden ${expandedId === item._id ? 'ring-2 ring-indigo-500/20 shadow-md' : 'shadow-sm'}`}>
                <div className="p-6 md:p-6 flex flex-col md:flex-row gap-6">
                  {/* Calendar Date Icon */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 shadow-sm group-hover:scale-105 transition">
                    <span className="text-[9px] font-black uppercase text-indigo-650">{new Date(item.date).toLocaleString('vi', { month: 'short' })}</span>
                    <span className="text-3xl font-black leading-none mt-0.5">{new Date(item.date).getDate()}</span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-black text-slate-850 leading-tight">{item.content || "Buổi tập thường kỳ"}</h3>
                    <div className="flex flex-wrap gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-750 font-bold"><Clock size={14} className="text-orange-500"/> {item.time}</div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-755 font-bold"><MapPin size={14} className="text-blue-500"/> {item.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:border-l md:pl-6 border-slate-150">
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleShowQR(item)}
                        className="flex items-center gap-1 bg-violet-50 text-violet-650 border border-violet-100 hover:bg-violet-100 px-3.5 py-2.5 rounded-xl font-bold text-xs transition"
                        title="Tạo mã QR điểm danh"
                      >
                        <Camera size={14}/> Mã QR
                      </button>
                    )}
                    <button onClick={() => toggleExpand(item)} className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 ${expandedId === item._id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'}`}>
                      <Users size={15}/> {user?.role === 'admin' ? "Điểm danh" : "Thành viên"}
                      {expandedId === item._id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(item._id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-colors duration-150">
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === item._id && (
                  <div className="bg-slate-50/50 border-t border-slate-150 p-6 md:p-7 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(editingAttendance || []).map((m) => (
                        <div key={m._id} className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 text-indigo-650 flex items-center justify-center font-black text-base border border-indigo-100/30">
                              {m.user?.fullName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs md:text-sm leading-tight">{m.user?.fullName || "Thành viên"}</p>
                              <p className={`text-[10px] font-black uppercase mt-1 ${m.status === 'present' ? 'text-emerald-500' : m.status === 'late' ? 'text-amber-500' : m.status === 'absent' ? 'text-rose-500' : 'text-slate-450'}`}>
                                 {m.status === 'pending' ? 'Chưa báo danh' : m.status === 'present' ? 'Có mặt' : m.status === 'late' ? 'Đi muộn' : 'Vắng mặt'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {user?.role === 'admin' ? (
                               <>
                                 <button 
                                   onClick={() => changeStatus(m._id, 'present')} 
                                   title="Có mặt"
                                   className={`p-2.5 rounded-xl transition-all duration-150 border ${m.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                 >
                                   <CheckCircle size={20}/>
                                 </button>
                                 <button 
                                   onClick={() => changeStatus(m._id, 'late')} 
                                   title="Trễ (phạt 50k)"
                                   className={`p-2.5 rounded-xl transition-all duration-150 border ${m.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                 >
                                   <Clock size={20}/>
                                 </button>
                                 <button 
                                   onClick={() => changeStatus(m._id, 'absent')} 
                                   title="Vắng (phạt 100k)"
                                   className={`p-2.5 rounded-xl transition-all duration-150 border ${m.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                 >
                                   <XCircle size={20}/>
                                 </button>
                               </>
                             ) : m.fine > 0 && (
                               <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 shadow-sm">
                                 -{m.fine.toLocaleString()}đ
                               </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {user?.role === 'admin' && (
                      <div className="mt-6 flex justify-end">
                         <button onClick={() => saveAttendance(item._id)} className="flex items-center gap-1.5 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md hover:bg-black transition transform active:scale-95 tracking-wide">
                           <Save size={15}/> LƯU BẢNG ĐIỂM DANH
                         </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
             )))
          }
        </div>
      </div>

      {/* MODAL CREATE REHEARSAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-slide-up border border-slate-200">
              <h3 className="text-xl font-black text-slate-850 mb-6 flex items-center gap-2">Lên Lịch Tập Mới <span className="text-indigo-650">🎸</span></h3>
              <div className="space-y-4 text-xs">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ngày tập</label>
                        <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-800" onChange={e => setNewForm({...newForm, date: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Giờ tập</label>
                        <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-800" onChange={e => setNewForm({...newForm, time: e.target.value})}/>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Địa điểm tập</label>
                    <input type="text" placeholder="Tên phòng tập (VD: Sonar Studio)..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-medium text-slate-850" onChange={e => setNewForm({...newForm, location: e.target.value})}/>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nội dung tập ráp (Tùy chọn)</label>
                    <textarea rows="3" placeholder="Ghi chú setlist bài ráp hôm nay..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-medium text-slate-850" onChange={e => setNewForm({...newForm, content: e.target.value})}></textarea>
                 </div>
              </div>
              <div className="mt-8 flex gap-2.5 justify-end text-xs font-bold">
                 <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">Hủy</button>
                 <button onClick={handleCreate} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition shadow-md">TẠO LỊCH TẬP</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal QR Điểm Danh (Admin) */}
      {showQRModal && qrRehearsal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-slide-up border border-slate-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mã QR Điểm Danh Buổi Tập</h3>
                <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-1.5 rounded-full transition"><X size={16}/></button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-200 flex flex-col items-center justify-center min-h-[260px]">
                {qrLoading && !qrToken ? (
                  <Loader className="animate-spin text-indigo-650" size={32}/>
                ) : qrToken ? (
                  <>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/checkin/${qrRehearsal._id}?token=${qrToken}`)}`}
                      alt="Checkin QR"
                      className="w-48 h-48 object-contain rounded-xl shadow-md border border-white bg-white p-2"
                    />
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2.5 py-1 rounded-md">
                      <RefreshCw size={10} className="animate-spin"/> Mã QR tự động làm mới sau 60s
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-bold text-rose-500">Lỗi tạo mã QR. Vui lòng thử lại.</p>
                )}
              </div>

              <div className="text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-1">
                <p className="font-extrabold text-slate-700">Thông tin buổi tập:</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Ngày: {new Date(qrRehearsal.date).toLocaleDateString('vi-VN')}</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Giờ tập: {qrRehearsal.time}</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Địa điểm: {qrRehearsal.location}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const checkinUrl = `${window.location.origin}/checkin/${qrRehearsal._id}?token=${qrToken}`;
                    navigator.clipboard.writeText(checkinUrl);
                    toast.success("Đã sao chép link check-in!");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200 transition"
                >
                  Sao chép Link
                </button>
                <button 
                  onClick={() => fetchQRToken(qrRehearsal._id)}
                  className="px-4 py-2.5 bg-indigo-50 border border-indigo-150 text-indigo-650 font-bold rounded-lg text-xs hover:bg-indigo-100 transition"
                >
                  <RefreshCw size={14}/>
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RehearsalManager;