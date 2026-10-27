"use client";

import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { 
  Calendar, Clock, MapPin, Music, Plus, CheckCircle, XCircle, 
  DollarSign, Users, ChevronDown, ChevronUp, Trash2, Save, 
  Loader, AlertCircle, Camera, X, RefreshCw, QrCode, Copy, Check,
  ExternalLink, Layers
} from "lucide-react";
import toast from "react-hot-toast";

interface AttendanceItem {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email?: string;
    instrument?: string;
  };
  status: "pending" | "present" | "late" | "absent";
  fine: number;
}

interface RehearsalItem {
  _id: string;
  date: string;
  time: string;
  location: string;
  content?: string;
  attendance: AttendanceItem[];
}

export default function RehearsalManagerPage() {
  const { user } = useContext(AuthContext);
  const [rehearsals, setRehearsals] = useState<RehearsalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({ date: "", time: "", location: "", content: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceItem[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // QR Modal States for Admin
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRehearsal, setQrRehearsal] = useState<RehearsalItem | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchRehearsals = async () => {
    try {
      const res = await api.get("/rehearsals");
      setRehearsals(res.data || []);
    } catch (err) {
      toast.error("Lỗi tải danh sách lịch tập ráp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRehearsals();
  }, []);

  const fetchQRToken = async (rehearsalId: string) => {
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

  const handleOpenQRModal = (item: RehearsalItem) => {
    setQrRehearsal(item);
    setShowQRModal(true);
    setQrToken("");
    fetchQRToken(item._id);
  };

  // Auto refresh token every 60s
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQRModal && qrRehearsal) {
      interval = setInterval(() => {
        fetchQRToken(qrRehearsal._id);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [showQRModal, qrRehearsal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.date || !newForm.time || !newForm.location) {
      return toast.error("Vui lòng nhập ngày, giờ và địa điểm phòng tập!");
    }
    try {
      await api.post("/rehearsals", newForm);
      toast.success("Đã lên lịch tập ráp mới thành công!");
      setShowCreateModal(false);
      setNewForm({ date: "", time: "", location: "", content: "" });
      fetchRehearsals();
    } catch (err) {
      toast.error("Lỗi tạo lịch tập");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch tập này?")) return;
    try {
      await api.delete(`/rehearsals/${id}`);
      toast.success("Đã xóa buổi tập");
      fetchRehearsals();
    } catch (err) {
      toast.error("Lỗi xóa buổi tập");
    }
  };

  const toggleExpand = (item: RehearsalItem) => {
    if (expandedId === item._id) {
      setExpandedId(null);
    } else {
      setExpandedId(item._id);
      setEditingAttendance(JSON.parse(JSON.stringify(item.attendance || [])));
    }
  };

  const changeStatus = (memberId: string, newStatus: "pending" | "present" | "late" | "absent") => {
    setEditingAttendance(prev => prev.map(m => {
      if (m.user?._id === memberId || m._id === memberId) {
        let fine = 0;
        if (newStatus === "late") fine = 20000;
        if (newStatus === "absent") fine = 50000;
        return { ...m, status: newStatus, fine };
      }
      return m;
    }));
  };

  const handleSaveAttendance = async (rehearsalId: string) => {
    setSavingAttendance(true);
    try {
      const payload = {
        attendance: editingAttendance.map(m => ({
          user: m.user?._id || m.user,
          status: m.status,
          fine: m.fine
        }))
      };
      await api.put(`/rehearsals/${rehearsalId}/attendance`, payload);
      toast.success("Đã lưu bảng điểm danh thành công!");
      fetchRehearsals();
      setExpandedId(null);
    } catch (err) {
      toast.error("Lỗi lưu điểm danh");
    } finally {
      setSavingAttendance(false);
    }
  };

  const copyToClipboard = (text: string, type: "token" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success("Đã sao chép token điểm danh!");
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Đã sao chép link điểm danh gửi Zalo nhóm!");
    }
  };

  const getCheckInUrl = () => {
    if (typeof window === "undefined" || !qrRehearsal || !qrToken) return "";
    return `${window.location.origin}/checkin?rehearsalId=${qrRehearsal._id}&token=${qrToken}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="ui-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F27024]" />
              <span>LỊCH TRÌNH TẬP LUYỆN FPTU</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản Lý Lịch Tập Ráp FPTU
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
            Lên lịch tập, tạo mã QR động điểm danh thời gian thực và tự động tính quỹ phạt trễ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/checkin"
            className="ui-button-secondary text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-[#F27024]" />
            <span>Quét QR Điểm Danh</span>
          </Link>

          {user?.role === "admin" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="ui-button-primary text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Lên Lịch Tập Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="text-center py-24">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang nạp lịch tập...</p>
        </div>
      ) : rehearsals.length === 0 ? (
        <div className="ui-card p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Music size={28} />
          </div>
          <h3 className="font-bold text-base text-slate-800">Chưa có lịch tập ráp nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Admin có thể bấm &quot;Lên Lịch Tập Mới&quot; để thiết lập thời gian, phòng tập và danh sách bài ráp cho anh em.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rehearsals.map((item) => {
            const isExpanded = expandedId === item._id;
            const presentCount = (item.attendance || []).filter(a => a.status === "present").length;
            const lateCount = (item.attendance || []).filter(a => a.status === "late").length;
            const totalFines = (item.attendance || []).reduce((acc, curr) => acc + (curr.fine || 0), 0);

            return (
              <div key={item._id} className="ui-card overflow-hidden transition-all border border-slate-200">
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Session Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {new Date(item.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {item.time}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {item.location}
                      </span>
                    </div>

                    {item.content && (
                      <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl">
                        <strong>Nội dung ráp:</strong> {item.content}
                      </p>
                    )}
                  </div>

                  {/* Right: Attendance Stats & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Attendance Pill */}
                    <div className="text-right pr-2 hidden sm:block">
                      <div className="text-xs font-bold text-slate-900">
                        <span className="text-emerald-600">{presentCount} có mặt</span> · <span className="text-amber-600">{lateCount} trễ</span>
                      </div>
                      {totalFines > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          Phạt: {new Intl.NumberFormat("vi-VN").format(totalFines)}đ
                        </span>
                      )}
                    </div>

                    {/* QR Code Action for Admin */}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleOpenQRModal(item)}
                        className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Tạo mã QR & Token điểm danh"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Mã QR</span>
                      </button>
                    )}

                    {/* Check In Button for Members */}
                    <Link
                      href={`/checkin?rehearsalId=${item._id}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>Điểm danh</span>
                    </Link>

                    {/* Toggle Attendance Details (Admin) */}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => toggleExpand(item)}
                        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isExpanded 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Sổ điểm danh</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Delete Rehearsal */}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Xóa lịch tập"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>

                {/* Expanded Attendance Matrix (Admin) */}
                {isExpanded && user?.role === "admin" && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                          Bảng Điểm Danh Buổi Tập
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => handleSaveAttendance(item._id)}
                        disabled={savingAttendance}
                        className="ui-button-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                      >
                        {savingAttendance ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Lưu Điểm Danh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {editingAttendance.map((m) => {
                        const memberId = m.user?._id || m._id;
                        const fullName = m.user?.fullName || "Thành viên";
                        const instrument = m.user?.instrument || "";

                        return (
                          <div key={memberId} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 truncate">{fullName}</span>
                              {instrument && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {instrument}
                                </span>
                              )}
                            </div>

                            <div className="ios-segmented-container p-0.5 grid grid-cols-4 gap-0.5 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => changeStatus(memberId, "present")}
                                className={`ios-segmented-item py-1 text-center font-bold cursor-pointer transition-all ${
                                  m.status === "present"
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Đúng giờ
                              </button>
                              <button
                                type="button"
                                onClick={() => changeStatus(memberId, "late")}
                                className={`ios-segmented-item py-1 text-center font-bold cursor-pointer transition-all ${
                                  m.status === "late"
                                    ? "bg-amber-500 text-white shadow-xs font-black"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Đi muộn
                              </button>
                              <button
                                type="button"
                                onClick={() => changeStatus(memberId, "absent")}
                                className={`ios-segmented-item py-1 text-center font-bold cursor-pointer transition-all ${
                                  m.status === "absent"
                                    ? "bg-rose-600 text-white shadow-xs font-black"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Vắng
                              </button>
                              <button
                                type="button"
                                onClick={() => changeStatus(memberId, "pending")}
                                className={`ios-segmented-item py-1 text-center font-bold cursor-pointer transition-all ${
                                  m.status === "pending"
                                    ? "bg-slate-700 text-white shadow-xs font-black"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Chờ
                              </button>
                            </div>

                            {m.fine > 0 && (
                              <div className="flex justify-between items-center text-[10px] text-rose-600 font-bold pt-1 border-t border-slate-100">
                                <span>Tiền phạt:</span>
                                <span>{new Intl.NumberFormat("vi-VN").format(m.fine)}đ</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE REHEARSAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ui-card w-full max-w-md p-6 sm:p-7 space-y-5 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Lên Lịch Tập Mới</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ngày tập *</label>
                  <input
                    type="date"
                    required
                    value={newForm.date}
                    onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                    className="ui-input w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Giờ tập *</label>
                  <input
                    type="time"
                    required
                    value={newForm.time}
                    onChange={(e) => setNewForm({ ...newForm, time: e.target.value })}
                    className="ui-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Địa điểm / Phòng tập *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phòng tập FPTU - Tòa Alpha, ĐH FPT..."
                  value={newForm.location}
                  onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                  className="ui-input w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nội dung / Bài tập ráp</label>
                <textarea
                  rows={3}
                  placeholder="Danh sách bài cần ráp, chia tone, bài hát mới..."
                  value={newForm.content}
                  onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                  className="ui-input w-full text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ui-button-secondary flex-1 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="ui-button-primary flex-1 text-xs"
                >
                  Tạo Lịch Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL FOR ADMIN */}
      {showQRModal && qrRehearsal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ui-card w-full max-w-sm p-6 text-center space-y-4 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Mã QR Điểm Danh Live</h3>
              </div>
              <button 
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Buổi tập ngày {new Date(qrRehearsal.date).toLocaleDateString("vi-VN")} lúc {qrRehearsal.time}
            </p>

            {/* QR Box with Dynamic SVG Placeholder / Canvas */}
            <div className="relative mx-auto w-52 h-52 bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-4 text-white shadow-inner">
              {qrLoading ? (
                <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
              ) : (
                <div className="space-y-2 text-center">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getCheckInUrl())}`}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Mã làm mới mỗi 60s
                  </span>
                </div>
              )}
            </div>

            {/* Token String Display & Copy */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 truncate mr-2">
                {qrToken || "Đang tạo token..."}
              </span>
              <button
                onClick={() => copyToClipboard(qrToken, "token")}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
                title="Sao chép Token"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Send Link Button */}
            <button
              onClick={() => copyToClipboard(getCheckInUrl(), "link")}
              className="w-full ui-button-primary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check size={14} /> : <ExternalLink size={14} />}
              <span>{copiedLink ? "Đã sao chép link!" : "Sao Chép Link Gửi Zalo"}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
