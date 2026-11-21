"use client";
 
import React, { useState, useEffect, useContext, useRef } from "react";
import api from '../../services/api';
import { AuthContext } from "../../context/AuthContext";
import { 
  Users, Search, Key, Trash2, Shield, User, Mail, AlertTriangle, Loader, Phone,
  Bell, Send, FileText, HelpCircle, Bold, Italic, Underline, List, ListOrdered,
  Check, Clock, UserPlus, Copy, CheckCheck, X, Sparkles, CheckCircle2,
  GraduationCap, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

type MemberRole = 'admin' | 'manager' | 'staff' | 'lecturer' | 'student' | 'member' | 'system' | 'viewer';

interface Member {
  _id: string;
  fullName: string;
  username?: string;
  email?: string;
  phone?: string;
  instrument?: string;
  role: MemberRole;
  isApproved: boolean;
  mustChangePassword: boolean;
}

interface CredentialModalData {
  fullName: string;
  username: string;
  email?: string;
  role: string;
  instrument?: string;
  tempPassword: string;
  isReset?: boolean;
}

export default function MemberAndNotificationManager() {
  const { user } = useContext(AuthContext);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "lecturer" | "admin">("all");
  const [loading, setLoading] = useState(true);

  // Tab con của Admin: "list" (Danh sách thành viên) | "notify" (Gửi thông báo)
  const [adminTab, setAdminTab] = useState<"list" | "notify">("list");

  // Modal tạo tài khoản thành viên mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    role: "student" as "student" | "lecturer" | "admin",
    instrument: ""
  });

  // Modal hiển thị thông tin tài khoản & mật khẩu ngẫu nhiên vừa cấp
  const [credentialModalData, setCredentialModalData] = useState<CredentialModalData | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Đang cập nhật vai trò cho thành viên
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

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
    } catch { 
      toast.error("Lỗi tải danh sách nhân sự"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    let isCancelled = false;
    const initData = async () => {
      await Promise.resolve();
      if (isCancelled) return;
      fetchMembers();
    };
    initData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.put(`/auth/users/${id}/approve`);
      toast.success(`Đã duyệt ${name} thành công!`);
      fetchMembers();
    } catch { 
      toast.error("Lỗi duyệt thành viên"); 
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (!window.confirm(`Reset mật khẩu của "${name}"? Hệ thống sẽ cấp mật khẩu ngẫu nhiên mới và yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên.`)) return;
    try {
      const res = await api.put(`/auth/users/${id}/reset-password`);
      toast.success(res.data.message || `Đã reset mật khẩu cho ${name}`);
      const targetUser = members.find(m => m._id === id);
      if (res.data.tempPassword) {
        setCredentialModalData({
          fullName: res.data.fullName || name,
          username: res.data.username || targetUser?.username || "",
          email: targetUser?.email || "",
          role: targetUser?.role || "student",
          instrument: targetUser?.instrument || "",
          tempPassword: res.data.tempPassword,
          isReset: true
        });
      }
      fetchMembers();
    } catch { 
      toast.error("Lỗi reset mật khẩu"); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thành viên "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success(`Đã xóa ${name}`);
      fetchMembers();
    } catch { 
      toast.error("Lỗi xóa user"); 
    }
  };

  const handleRoleChange = async (memberId: string, memberName: string, newRole: MemberRole) => {
    if (user?._id === memberId && newRole !== "admin") {
      const confirmSelfDemote = window.confirm(
        "CẢNH BÁO: Bạn đang thay đổi vai trò của chính tài khoản của bạn khỏi 'Quản trị viên'. Sau khi thay đổi, bạn sẽ mất quyền quản trị. Bạn có chắc chắn muốn tiếp tục?"
      );
      if (!confirmSelfDemote) return;
    }

    setUpdatingRoleId(memberId);
    try {
      await api.put(`/users/${memberId}`, { role: newRole });
      setMembers(prev =>
        prev.map(m => (m._id === memberId ? { ...m, role: newRole } : m))
      );
      const roleLabels: Record<string, string> = {
        admin: "Quản trị viên",
        lecturer: "Giảng viên",
        student: "Sinh viên",
        manager: "Cán bộ CTSV",
        staff: "Cán bộ Bộ môn",
        member: "Thành viên"
      };
      toast.success(`Đã cập nhật vai trò của ${memberName} thành "${roleLabels[newRole] || newRole}"`);
      if (user?._id === memberId) {
        window.location.reload();
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Lỗi cập nhật vai trò");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.fullName.trim()) {
      toast.error("Vui lòng nhập Họ và tên thành viên!");
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await api.post("/users", {
        fullName: createFormData.fullName.trim(),
        email: createFormData.email.trim() || undefined,
        username: createFormData.username.trim() || undefined,
        phone: createFormData.phone.trim() || undefined,
        role: createFormData.role,
        instrument: createFormData.instrument.trim() || "Chưa phân công"
      });

      toast.success(res.data.message || "Tạo tài khoản thành viên thành công!");
      
      // Đóng modal form & hiển thị modal thông tin đăng nhập + mật khẩu ngẫu nhiên
      setShowCreateModal(false);
      setCredentialModalData({
        fullName: res.data.fullName,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        instrument: res.data.instrument,
        tempPassword: res.data.tempPassword,
        isReset: false
      });

      // Reset form
      setCreateFormData({
        fullName: "",
        email: "",
        username: "",
        phone: "",
        role: "student",
        instrument: ""
      });

      fetchMembers();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj.response?.data?.message || "Lỗi tạo tài khoản thành viên");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    toast.success("Đã sao chép mật khẩu!");
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyAllInfo = (data: CredentialModalData) => {
    const roleLabels: Record<string, string> = {
      admin: "Quản trị viên",
      lecturer: "Giảng viên",
      student: "Sinh viên",
      manager: "Cán bộ CTSV",
      staff: "Cán bộ Bộ môn",
      member: "Thành viên"
    };
    const text = `[FPTU BAND MANAGER] THÔNG TIN ĐĂNG NHẬP THÀNH VIÊN
• Họ và tên: ${data.fullName}
• Tên đăng nhập: ${data.username}${data.email ? `\n• Email: ${data.email}` : ""}
• Vai trò: ${roleLabels[data.role] || data.role}
• Nhạc cụ / Vị trí: ${data.instrument || "Chưa phân công"}
• Mật khẩu tạm thời: ${data.tempPassword}

LƯU Ý BẢO MẬT: Khi đăng nhập lần đầu tiên vào hệ thống FPTU Band, bạn sẽ được yêu cầu đổi mật khẩu mới để bắt đầu sử dụng.`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("Đã sao chép toàn bộ thông tin tài khoản!");
    setTimeout(() => setCopiedAll(false), 2000);
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const errMsg = errorObj.response?.data?.message || "Lỗi gửi thông báo";
      toast.error(errMsg);
    } finally {
      setSubmittingNotification(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (roleFilter === "all") return true;
    return m.role === roleFilter;
  });

  const approvedMembers = members.filter(m => m.isApproved);

  // Thống kê vai trò
  const studentCount = members.filter(m => m.role === "student").length;
  const lecturerCount = members.filter(m => m.role === "lecturer").length;
  const adminCount = members.filter(m => m.role === "admin").length;

  return (
    <div className="min-h-screen p-3.5 sm:p-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 w-full min-w-0">
        
        {/* HEADER HỆ THỐNG */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F27024] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#F27024]/25 border border-white/20">
                <Users size={20} />
              </span>
              TRUNG TÂM NHÂN SỰ & THÀNH VIÊN FPTU BAND
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý nhân sự FPTU Band · Bộ môn & Phòng CTSV ĐH FPT TP.HCM, tạo tài khoản thành viên, phân quyền vai trò & điều phối kênh thông báo nội bộ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Nút Tạo Tài Khoản Dành Cho Quản Trị Viên */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#F27024] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#F27024]/25 hover:shadow-lg transition active:scale-[0.98] cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Tạo Tài Khoản Thành Viên</span>
              </button>
            )}

            {/* 🍏 iOS Segmented Control cho Admin & Cán bộ */}
            {canManage && (
              <div className="ios-segmented-container w-full sm:w-auto self-stretch sm:self-auto shrink-0 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setAdminTab("list")}
                  className={`ios-segmented-item flex-1 sm:flex-none justify-center ${
                    adminTab === "list" ? "active" : ""
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Danh Sách ({members.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("notify")}
                  className={`ios-segmented-item flex-1 sm:flex-none justify-center ${
                    adminTab === "notify" ? "active" : ""
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Gửi Thông Báo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {(adminTab === "list" || !canManage) && (
          <div className="space-y-6 animate-fade-in w-full min-w-0">
            {/* Bộ lọc vai trò & Thanh tìm kiếm */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Role Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 self-start">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    roleFilter === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tất cả ({members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("student")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    roleFilter === "student"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  <User size={13} />
                  <span>Sinh viên ({studentCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("lecturer")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    roleFilter === "lecturer"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-amber-700"
                  }`}
                >
                  <GraduationCap size={13} />
                  <span>Giảng viên ({lecturerCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("admin")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    roleFilter === "admin"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-rose-700"
                  }`}
                >
                  <Shield size={13} />
                  <span>Quản trị viên ({adminCount})</span>
                </button>
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative w-full md:w-80 lg:w-96 flex items-center min-w-0">
                <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </div>
                <input
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 ring-[#F27024] font-semibold outline-none text-slate-800 transition text-xs sm:text-sm"
                  placeholder="Tìm theo tên, username, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20"><Loader className="animate-spin mx-auto text-[#F27024]" size={32}/></div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <Users className="mx-auto text-slate-300" size={44} />
                <h3 className="text-base font-bold text-slate-700">Không tìm thấy thành viên phù hợp</h3>
                <p className="text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc bấm nút &quot;Tạo Tài Khoản Thành Viên&quot; để thêm người mới.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredMembers.map((m) => (
                  <div key={m._id} className="ui-card p-5 sm:p-6 ui-card-hover flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-3xl bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center font-black text-xl sm:text-2xl text-slate-500 border border-slate-200 shadow-inner">
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>

                        {/* Cấu hình vai trò dành cho Quản trị viên */}
                        {isAdmin ? (
                          <div className="relative shrink-0">
                            <select
                              value={m.role}
                              disabled={updatingRoleId === m._id}
                              onChange={(e) => handleRoleChange(m._id, m.fullName, e.target.value as MemberRole)}
                              className={`text-[11px] font-black uppercase tracking-wider py-1.5 pl-3 pr-7 rounded-xl border appearance-none cursor-pointer transition shadow-2xs outline-none focus:ring-2 focus:ring-[#F27024] ${
                                m.role === 'admin' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                                  : m.role === 'lecturer'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : m.role === 'student'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              } ${updatingRoleId === m._id ? 'opacity-50 cursor-wait' : ''}`}
                              title="Cấu hình vai trò thành viên"
                            >
                              <option value="student">Sinh viên</option>
                              <option value="lecturer">Giảng viên</option>
                              <option value="admin">Quản trị viên</option>
                              {(m.role === 'manager' || m.role === 'staff' || m.role === 'member') && (
                                <option value={m.role}>Cán bộ ({m.role})</option>
                              )}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                          </div>
                        ) : (
                          m.role === "admin" ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shadow-sm shrink-0">
                              <Shield size={12} /> Admin
                            </span>
                          ) : m.role === "lecturer" ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm shrink-0">
                              <GraduationCap size={12} /> Giảng viên
                            </span>
                          ) : m.role === "student" ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 shadow-sm shrink-0">
                              <User size={12} /> Sinh viên
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm shrink-0">
                              <Shield size={12} /> {m.role}
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight mb-0.5 truncate">{m.fullName}</h3>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mb-3">{m.instrument || "Chưa phân vai"}</p>
                      
                      <div className="space-y-2 mb-4 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 truncate">
                          <User size={13} className="text-slate-400 shrink-0"/>
                          <span className="text-slate-400 font-medium">Username:</span>
                          <span className="font-mono text-slate-700 font-bold">{m.username || "---"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 truncate">
                          <Mail size={13} className="text-slate-400 shrink-0"/>
                          <span className="truncate">{m.email || "---"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 truncate">
                          <Phone size={13} className="text-slate-400 shrink-0"/>
                          <span>{m.phone || "---"}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {!m.isApproved && m.role !== "admin" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest animate-pulse">
                            <AlertTriangle size={12} /> Đang chờ duyệt
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest">
                            <Check size={12} /> Hoạt động
                          </div>
                        )}

                        {m.mustChangePassword && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black uppercase tracking-widest" title="Tài khoản cần đổi mật khẩu trong lần đăng nhập đầu">
                            <Clock size={12} /> Đổi pass lần đầu
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Admin & Manager) */}
                    {canManage && user?._id !== m._id && (
                      <div className="pt-4 border-t border-slate-200 flex gap-2 items-center">
                        {!m.isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApprove(m._id, m.fullName)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(m._id, m.fullName)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 transition text-xs font-bold cursor-pointer"
                          title="Cấp lại mật khẩu ngẫu nhiên cho thành viên"
                        >
                          <Key size={14} />
                          <span>Reset Pass</span>
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(m._id, m.fullName)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 transition cursor-pointer ml-auto"
                            title="Xóa thành viên"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === "notify" && canManage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Editor Soạn Thảo */}
            <div className="lg:col-span-2 ui-card p-6 md:p-8 space-y-6">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                <FileText className="text-[#F27024]" size={18}/> Soạn Thảo Nội Dung Thông Báo
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
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-[#F27024] outline-none text-slate-800 font-extrabold transition appearance-none pr-10 cursor-pointer"
                    >
                      <option value="all">Gửi tất cả thành viên FPTU Band (Broadcast)</option>
                      <optgroup label="Cá nhân cụ thể">
                        {approvedMembers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.fullName} ({m.instrument || "Không có nhạc cụ"})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold" />
                  </div>
                </div>

                {/* Tiêu Đề */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Tiêu đề thông báo *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cập nhật lịch diễn cuối tuần này hoặc Nội quy CLB FPTU Band..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-[#F27024] outline-none font-bold text-slate-800 transition focus:bg-white"
                    required
                  />
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Nội dung thông báo (Chi tiết) *
                  </label>
                  
                  <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#F27024]/25 bg-slate-50">
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
                  className="w-full py-4 bg-[#F27024] hover:bg-[#EA580C] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md shadow-[#F27024]/25 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs cursor-pointer"
                >
                  {submittingNotification ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Đang gửi thông báo...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Gửi Thông Báo FPTU Band
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Side Card Thông tin */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                  <HelpCircle className="text-[#F27024]" size={18}/> Hướng Dẫn & Lưu Ý
                </h3>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mt-4">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 bg-orange-50 text-[#F27024] rounded-lg font-black shrink-0 mt-0.5">1</div>
                    <p><strong>Kênh gửi kép:</strong> Thông báo sẽ được lưu vào Navbar và đồng thời gửi email HTML cho các thành viên.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 bg-orange-50 text-[#F27024] rounded-lg font-black shrink-0 mt-0.5">2</div>
                    <p><strong>Độ rộng Broadcast:</strong> Nếu chọn gửi tất cả, danh sách người nhận sẽ được gửi dưới dạng ẩn danh (BCC) để bảo mật thông tin.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nhân sự nhận thông báo</p>
                  <h3 className="text-xl font-black text-[#F27024] mt-1">{approvedMembers.length} người</h3>
                </div>
                <div className="w-12 h-12 bg-orange-50 text-[#F27024] rounded-2xl flex items-center justify-center shadow-sm">
                  <Users size={22}/>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN THÀNH VIÊN DÀNH CHO QUẢN TRỊ VIÊN */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 animate-scale-up">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F27024] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#F27024]/25 shrink-0">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Tạo Tài Khoản Thành Viên</h3>
                <p className="text-xs text-slate-500 font-medium">Cấp tài khoản & mật khẩu ngẫu nhiên cho thành viên FPTU Band</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Họ và tên thành viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#F27024] outline-none font-bold text-slate-800 transition text-xs sm:text-sm"
                />
              </div>

              {/* Email & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Email FPT / Cá nhân
                  </label>
                  <input
                    type="email"
                    placeholder="annv@fpt.edu.vn"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#F27024] outline-none font-medium text-slate-800 transition text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Username (Tên đăng nhập)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống tự sinh từ email"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#F27024] outline-none font-medium text-slate-800 transition text-xs"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#F27024] outline-none font-medium text-slate-800 transition text-xs"
                />
              </div>

              {/* Cấu hình vai trò */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Vai trò thành viên trong hệ thống <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "student" })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      createFormData.role === "student"
                        ? "border-blue-500 bg-blue-50/80 text-blue-700 font-black shadow-sm ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <User size={18} className={createFormData.role === "student" ? "text-blue-600" : "text-slate-400"} />
                    <span className="text-[11px] font-bold">Sinh viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "lecturer" })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      createFormData.role === "lecturer"
                        ? "border-amber-500 bg-amber-50/80 text-amber-700 font-black shadow-sm ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap size={18} className={createFormData.role === "lecturer" ? "text-amber-600" : "text-slate-400"} />
                    <span className="text-[11px] font-bold">Giảng viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "admin" })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      createFormData.role === "admin"
                        ? "border-rose-500 bg-rose-50/80 text-rose-700 font-black shadow-sm ring-2 ring-rose-500/20"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Shield size={18} className={createFormData.role === "admin" ? "text-rose-600" : "text-slate-400"} />
                    <span className="text-[11px] font-bold">Quản trị viên</span>
                  </button>
                </div>
              </div>

              {/* Vị trí / Nhạc cụ */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nhạc cụ / Vị trí phụ trách
                </label>
                <input
                  type="text"
                  placeholder="VD: Vocal, Lead Guitar, Bass, Drums, Keyboard, Cố vấn..."
                  value={createFormData.instrument}
                  onChange={(e) => setCreateFormData({ ...createFormData, instrument: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#F27024] outline-none font-medium text-slate-800 transition text-xs"
                />
                {/* Gợi ý nhanh */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Vocal", "Lead Guitar", "Bass", "Drums", "Keyboard / Piano", "Cố vấn"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCreateFormData({ ...createFormData, instrument: item })}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[10px] font-semibold transition cursor-pointer"
                    >
                      +{item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex gap-2.5 items-start text-slate-700">
                <Sparkles className="text-[#F27024] shrink-0 mt-0.5" size={16} />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-black text-[#F27024]">Cơ chế cấp mật khẩu ngẫu nhiên:</span> Hệ thống sẽ tự động sinh mật khẩu ngẫu nhiên an toàn cho thành viên. Khi đăng nhập lần đầu tiên, thành viên bắt buộc phải đổi mật khẩu mới.
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#F27024] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold transition flex items-center gap-2 shadow-md shadow-[#F27024]/25 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCreate ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      <span>Tạo Tài Khoản & Cấp Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HIỂN THỊ THÔNG TIN TÀI KHOẢN VÀ MẬT KHẨU NGẪU NHIÊN VỪA CẤP */}
      {credentialModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 animate-scale-up">
            <button
              type="button"
              onClick={() => setCredentialModalData(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {credentialModalData.isReset ? "Cấp Lại Mật Khẩu Thành Công!" : "Khởi Tạo Tài Khoản Thành Công!"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Vui lòng sao chép thông tin tài khoản và mật khẩu ngẫu nhiên dưới đây để bàn giao cho thành viên.
              </p>
            </div>

            {/* Credential Details */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-bold">Họ và tên:</span>
                  <span className="font-black text-slate-800">{credentialModalData.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-bold">Tên đăng nhập (Username):</span>
                  <span className="font-mono font-black text-slate-900">{credentialModalData.username}</span>
                </div>
                {credentialModalData.email && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-400 font-bold">Email:</span>
                    <span className="font-bold text-slate-700">{credentialModalData.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-bold">Vai trò:</span>
                  <span className="font-black text-[#F27024] uppercase text-[11px]">
                    {credentialModalData.role === "admin"
                      ? "Quản trị viên"
                      : credentialModalData.role === "lecturer"
                      ? "Giảng viên"
                      : "Sinh viên"}
                  </span>
                </div>
              </div>

              {/* Mật khẩu ngẫu nhiên */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Mật khẩu ngẫu nhiên cấp lần đầu
                </label>
                <div className="p-3.5 bg-orange-50 border-2 border-dashed border-[#F27024]/40 rounded-2xl flex items-center justify-between gap-3">
                  <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                    {credentialModalData.tempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(credentialModalData.tempPassword)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-[#F27024] border border-orange-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    {copiedPassword ? (
                      <>
                        <CheckCheck size={14} className="text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Bắt buộc đổi mật khẩu:</strong> Khi thành viên đăng nhập lần đầu tiên bằng mật khẩu trên, hệ thống sẽ tự động yêu cầu họ tạo mật khẩu mới trước khi được truy cập các tính năng.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyAllInfo(credentialModalData)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F27024] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md shadow-[#F27024]/25 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <CheckCheck size={16} /> Đã Sao Chép Thông Tin!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Sao Chép Toàn Bộ Thông Tin Đăng Nhập
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCredentialModalData(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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