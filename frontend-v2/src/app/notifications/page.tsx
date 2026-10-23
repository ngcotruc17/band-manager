"use client";

import React, { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { 
  Bell, Send, Users, User, Mail, FileText, Loader, 
  CheckCircle, Info, Trash2, Calendar, AlertTriangle, 
  Sparkles, CheckSquare, MessageSquare, ArrowRight, Megaphone
} from "lucide-react";
import toast from "react-hot-toast";

interface NotificationItem {
  _id: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface Member {
  _id: string;
  fullName: string;
  role: string;
  instrument?: string;
  isApproved: boolean;
}

export default function NotificationsHubPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<"inbox" | "broadcast">("inbox");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Broadcast states
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"general" | "urgent" | "show" | "rehearsal" | "finance">("general");
  const [recipientType, setRecipientType] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      toast.error("Lỗi nạp thông báo");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (user?.role !== "admin") return;
    try {
      const res = await api.get("/users");
      setMembers((res.data || []).filter((m: Member) => m.isApproved));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchMembers();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success("Đã đánh dấu đã đọc");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu đã đọc tất cả");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Vui lòng điền tiêu đề và nội dung thông báo!");
    }

    setSubmitting(true);
    try {
      const formattedMessage = `[${category.toUpperCase()}] ${title}: ${content}`;
      await api.post("/notifications/custom", {
        title: title.trim(),
        content: formattedMessage,
        recipientType
      });
      toast.success("Đã phát thông báo thành công đến thành viên!");
      setTitle("");
      setContent("");
      setActiveTab("inbox");
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi gửi thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="ui-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>TRUNG TÂM PHÁT THANH NỘI BỘ</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thông Báo Ban Nhạc
            </h1>
            <span className="icon-chip icon-chip-indigo w-8 h-8">
              <Megaphone className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
            Nhận tin báo lịch diễn, lịch tập, quyết toán tài chính và phát thanh chỉ đạo từ Admin.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="ios-segmented-container p-1 shrink-0">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`ios-segmented-item px-4 py-1.5 text-xs font-bold cursor-pointer ${
              activeTab === "inbox" ? "active" : ""
            }`}
          >
            Hộp Thư ({notifications.filter(n => !n.isRead).length})
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab("broadcast")}
              className={`ios-segmented-item px-4 py-1.5 text-xs font-bold cursor-pointer ${
                activeTab === "broadcast" ? "active" : ""
              }`}
            >
              Gửi Thông Báo
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: INBOX */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
              Lịch sử thông báo ({notifications.length})
            </h3>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-24">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang nạp thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="ui-card p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bell size={28} />
              </div>
              <h3 className="font-bold text-base text-slate-800">Không có thông báo nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tất cả tin tức về show diễn, điểm danh tập và biến động quỹ sẽ hiển thị ở đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((noti) => (
                <div
                  key={noti._id}
                  className={`ui-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                    noti.isRead
                      ? "opacity-85 hover:opacity-100"
                      : "border-indigo-500/30 shadow-sm ring-1 ring-indigo-500/20"
                  }`}
                >
                  <div className="space-y-1">
                    <p className={`text-xs sm:text-sm leading-relaxed ${noti.isRead ? "text-slate-700" : "font-extrabold text-slate-900"}`}>
                      {noti.message}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {new Date(noti.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!noti.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(noti._id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold text-xs cursor-pointer"
                      >
                        Đã đọc
                      </button>
                    )}
                    {noti.link && (
                      <a
                        href={noti.link}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROADCAST FOR ADMIN */}
      {activeTab === "broadcast" && user?.role === "admin" && (
        <div className="ui-card p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Phát Thanh Thông Báo Toàn Ban Nhạc</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông báo sẽ ngay lập tức được gửi đến tài khoản thành viên và chuông báo thời gian thực.
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Người nhận *</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="ui-input w-full text-xs font-semibold cursor-pointer"
                >
                  <option value="all">Tất cả thành viên trong Ban Nhạc (Broadcast)</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.fullName} ({m.instrument || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phân loại tin *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="ui-input w-full text-xs font-semibold cursor-pointer"
                >
                  <option value="general">Thông báo chung</option>
                  <option value="urgent">Khẩn cấp / Thay đổi lịch</option>
                  <option value="show">Lịch diễn / Chốt Setlist</option>
                  <option value="rehearsal">Lịch tập ráp & Điểm danh</option>
                  <option value="finance">Quyết toán / Nộp phạt quỹ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tiêu đề thông báo *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Chốt thời gian soundcheck show tối Thứ 7..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ui-input w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nội dung chi tiết *</label>
              <textarea
                rows={5}
                required
                placeholder="Nhập nội dung thông báo đầy đủ gửi đến các thành viên..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="ui-input w-full text-xs resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="ui-button-primary text-xs py-2.5 px-6 flex items-center gap-2"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Phát Thông Báo Ngay</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
