"use client";
 
import React, { useState, useEffect, useContext, useRef } from "react";
import api from '../../services/api';
import { AuthContext } from "../../context/AuthContext";
import { 
  Users, Search, Key, Trash2, Shield, User, Mail, AlertTriangle, Loader, Phone,
  Bell, Send, FileText, Info, HelpCircle, Bold, Italic, Underline, List, ListOrdered,
  Check, Clock
} from "lucide-react";
import toast from "react-hot-toast";

interface Member {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  instrument?: string;
  role: 'admin' | 'member' | 'viewer';
  isApproved: boolean;
  mustChangePassword: boolean;
}

export default function MemberAndNotificationManager() {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Tab con của Admin: "list" (Danh sách thành viên) | "notify" (Gửi thông báo)
  const [adminTab, setAdminTab] = useState<"list" | "notify">("list");

  // State cho gửi thông báo
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [submittingNotification, setSubmittingNotification] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/users');
      setMembers(res.data || []);
    } catch (err) { 
      toast.error("Lỗi tải danh sách nhân sự"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMembers(); 
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.put(`/auth/users/${id}/approve`);
      toast.success(`Đã duyệt ${name} thành công!`);
      fetchMembers();
    } catch (err) { 
      toast.error("Lỗi duyệt"); 
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (!window.confirm(`Reset mật khẩu của "${name}" về mặc định (123456)?`)) return;
    try {
      await api.put(`/auth/users/${id}/reset-password`);
      toast.success(`Đã reset pass cho ${name}`);
      fetchMembers();
    } catch (err) { 
      toast.error("Lỗi reset pass"); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thành viên "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success(`Đã xóa ${name}`);
      fetchMembers();
    } catch (err) { 
      toast.error("Lỗi xóa user"); 
    }
  };

  const handleCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!title.trim() || !textContent) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    setSubmittingNotification(true);
    try {
      const res = await api.post("/notifications/custom", {
        title: title.trim(),
        content: content.trim(),
        recipientType
      });
      toast.success(res.data.message || "Đã gửi thông báo thành công!");
      setTitle("");
      setContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setRecipientType("all");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi gửi thông báo";
      toast.error(errMsg);
    } finally {
      setSubmittingNotification(false);
    }
  };

  const filteredMembers = members.filter(m =>
    (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedMembers = members.filter(m => m.isApproved);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER HỆ THỐNG */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 border border-white/20">
                <Users size={20} />
              </span>
              TRUNG TÂM NHÂN SỰ & THÀNH VIÊN
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý nghệ sĩ ban nhạc, phân quyền vai trò & điều phối kênh thông báo nội bộ
            </p>
          </div>

          {/* 🍏 iOS Segmented Control cho Admin */}
          {user?.role === "admin" && (
            <div className="ios-segmented-container w-full md:w-auto self-start md:self-auto shrink-0">
              <button
                onClick={() => setAdminTab("list")}
                className={`ios-segmented-item flex-1 md:flex-none justify-center ${
                  adminTab === "list" ? "active" : ""
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Danh Sách ({members.length})</span>
              </button>
              <button
                onClick={() => setAdminTab("notify")}
                className={`ios-segmented-item flex-1 md:flex-none justify-center ${
                  adminTab === "notify" ? "active" : ""
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Gửi Thông Báo</span>
              </button>
            </div>
          )}
        </div>

        {(adminTab === "list" || user?.role !== "admin") && (
          <div className="space-y-6 animate-fade-in">
            {/* Thanh tìm kiếm */}
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Danh sách nhân sự chính thức của ban nhạc</span>
              <div className="relative w-full md:w-96 flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 ring-indigo-500 font-semibold outline-none text-slate-800 transition text-sm"
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
                  <div key={m._id} className="ui-card p-6 ui-card-hover flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 border border-slate-200 shadow-inner">
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
                      <p className="text-xs font-bold text-slate-400 mb-4">{m.instrument || "Chưa phân vai"}</p>
                      
                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Mail size={14} className="text-slate-355"/> {m.email || "---"}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Phone size={14} className="text-slate-355"/> {m.phone || "---"}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-6">
                        {!m.isApproved && m.role !== "admin" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <AlertTriangle size={12} /> Đang chờ duyệt
                          </div>
                        ) : m.mustChangePassword ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest">
                            <Clock size={12} /> Chưa đổi Pass
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest">
                            <Check size={12} /> Hoạt động
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Admin Only) */}
                    {user?.role === 'admin' && user._id !== m._id && (
                      <div className="pt-6 border-t border-slate-200 flex gap-2">
                        {!m.isApproved && (
                          <button onClick={() => handleApprove(m._id, m.fullName)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/10 transition">
                            Duyệt Thành Viên
                          </button>
                        )}
                        <button onClick={() => handleResetPassword(m._id, m.fullName)} className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 transition" title="Reset Mật khẩu">
                          <Key size={18} />
                        </button>
                        <button onClick={() => handleDelete(m._id, m.fullName)} className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 transition" title="Xóa thành viên">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === "notify" && user?.role === "admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Editor Soạn Thảo */}
            <div className="lg:col-span-2 ui-card p-6 md:p-8 space-y-6">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                <FileText className="text-indigo-600" size={18}/> Soạn Thảo Nội Dung Thông Báo
              </h3>

              <form onSubmit={handleSendNotification} className="space-y-5 text-xs">
                {/* Chọn Đối Tượng */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Đối tượng nhận thông báo *
                  </label>
                  <div className="relative">
                    <select
                      value={recipientType}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-slate-800 font-extrabold transition appearance-none pr-10 cursor-pointer"
                    >
                      <option value="all">Gửi tất cả thành viên (Broadcast)</option>
                      <optgroup label="Cá nhân cụ thể">
                        {approvedMembers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.fullName} ({m.instrument || "Không có nhạc cụ"})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Tiêu Đề */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Tiêu đề thông báo *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cập nhật lịch diễn cuối tuần này hoặc Nội quy tập ráp..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none font-bold text-slate-800 transition focus:bg-white"
                    required
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Nội dung thông báo (Chi tiết) *
                  </label>
                  
                  <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 bg-slate-50">
                    <div className="flex items-center gap-1.5 p-2 border-b border-slate-200 bg-slate-100">
                      <button type="button" onClick={() => handleCommand("bold")} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition" title="Chữ đậm"><Bold size={13} /></button>
                      <button type="button" onClick={() => handleCommand("italic")} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition" title="Chữ nghiêng"><Italic size={13} /></button>
                      <button type="button" onClick={() => handleCommand("underline")} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition" title="Gạch chân"><Underline size={13} /></button>
                      <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                      <button type="button" onClick={() => handleCommand("insertUnorderedList")} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition" title="Dấu tròn"><List size={13} /></button>
                      <button type="button" onClick={() => handleCommand("insertOrderedList")} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition" title="Dấu số"><ListOrdered size={13} /></button>
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) => setContent(e.currentTarget.innerHTML)}
                      className="w-full min-h-[220px] p-4 bg-white outline-none font-medium text-slate-800 text-xs leading-relaxed overflow-y-auto rich-editor"
                      data-placeholder="Nhập chi tiết nội dung thông báo..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingNotification}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
                >
                  {submittingNotification ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Đang gửi thông báo...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Gửi Thông Báo Ngay
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Side Card Thông tin */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                  <HelpCircle className="text-indigo-500" size={18}/> Hướng Dẫn & Lưu Ý
                </h3>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mt-4">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg font-black shrink-0 mt-0.5">1</div>
                    <p><strong>Kênh gửi kép:</strong> Thông báo sẽ được lưu vào Navbar và đồng thời gửi email HTML cho các thành viên.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg font-black shrink-0 mt-0.5">2</div>
                    <p><strong>Độ rộng Broadcast:</strong> Nếu chọn gửi tất cả, danh sách người nhận sẽ được gửi dưới dạng ẩn danh (BCC) để bảo mật thông tin.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nhân sự nhận thông báo</p>
                  <h3 className="text-xl font-black text-indigo-600 mt-1">{approvedMembers.length} người</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Users size={22}/>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <style>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-weight: 550;
        }
        .rich-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
        }
        .rich-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
        }
      `}</style>
    </div>
  );
}
