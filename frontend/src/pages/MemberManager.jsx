import { useState, useEffect, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { Users, Search, Key, Trash2, CheckCircle, Shield, User, Mail, AlertTriangle, Loader, Phone, Music } from "lucide-react";
import toast from "react-hot-toast";

const MemberManager = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/users');
      setMembers(res.data);
    } catch (err) { toast.error("Lỗi tải danh sách nhân sự"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleApprove = async (id, name) => {
    try {
      await api.put(`/auth/users/${id}/approve`);
      toast.success(`Đã duyệt ${name} 🎉`);
      fetchMembers();
    } catch (err) { toast.error("Lỗi duyệt"); }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Reset mật khẩu của "${name}" về mặc định (123456)?`)) return;
    try {
      await api.put(`/auth/users/${id}/reset-password`);
      toast.success(`Đã reset pass cho ${name}`);
      fetchMembers();
    } catch (err) { toast.error("Lỗi reset pass"); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ Bạn có chắc muốn XÓA VĨNH VIỄN thành viên "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success(`Đã xóa ${name}`);
      fetchMembers();
    } catch (err) { toast.error("Lỗi xóa user"); }
  };

  const filteredMembers = members.filter(m =>
      (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-indigo-600 to-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                <Users size={28} />
              </span>
              Quản Lý Nhân Sự
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Theo dõi thông tin và cấp quyền thành viên.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white bg-white/50 backdrop-blur-md shadow-sm focus:ring-2 ring-indigo-500 font-medium outline-none transition"
              placeholder="Tìm tên, email thành viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-600" size={32}/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((m) => (
              <div key={m._id} className="glass rounded-[32px] p-6 card-hover border border-white/60 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner">
                      {m.fullName?.charAt(0).toUpperCase()}
                    </div>
                    {m.role === "admin" ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                        <Shield size={12} /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                        <User size={12} /> Member
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">{m.fullName}</h3>
                  <p className="text-sm font-bold text-slate-400 mb-4">{m.instrument || "Chưa phân vai"}</p>
                  
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Mail size={14} className="text-slate-300"/> {m.email || "---"}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Phone size={14} className="text-slate-300"/> {m.phone || "---"}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    {!m.isApproved && m.role !== "admin" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <AlertTriangle size={12} /> Đang chờ duyệt
                      </div>
                    ) : m.mustChangePassword ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-widest">
                        ⚠️ Chưa đổi Pass
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-widest">
                        ✅ Hoạt động
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions (Admin Only) */}
                {user?.role === 'admin' && user._id !== m._id && (
                  <div className="pt-6 border-t border-slate-100 flex gap-2">
                    {!m.isApproved && (
                      <button onClick={() => handleApprove(m._id, m.fullName)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-200 transition">
                        Duyệt Thành Viên
                      </button>
                    )}
                    <button onClick={() => handleResetPassword(m._id, m.fullName)} className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition" title="Reset Mật khẩu">
                      <Key size={18} />
                    </button>
                    <button onClick={() => handleDelete(m._id, m.fullName)} className="p-2.5 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-100 transition" title="Xóa thành viên">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManager;