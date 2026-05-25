import { useState, useEffect, useContext, useRef } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { Bell, Send, Users, User, Mail, FileText, Loader, CheckCircle, Info, HelpCircle, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import toast from "react-hot-toast";

const AdminNotifications = () => {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("all"); // 'all' or userId

  const editorRef = useRef(null);

  const handleCommand = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/users");
      // Chỉ hiện các thành viên đã được duyệt và có email
      const activeMembers = res.data.filter(m => m.isApproved);
      setMembers(activeMembers);
    } catch (err) {
      toast.error("Lỗi tải danh sách thành viên");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!title.trim() || !textContent) {
      return toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
    }

    setSubmitting(true);
    try {
      const res = await api.post("/notifications/send-custom", {
        title: title.trim(),
        content: content.trim(),
        recipientType
      });
      toast.success(res.data.message || "Đã gửi thông báo thành công! 🎉");
      // Reset form
      setTitle("");
      setContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setRecipientType("all");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-md">
          <Info size={40} className="mx-auto text-rose-500 mb-4" />
          <h2 className="text-lg font-black text-slate-800 mb-2">QUYỀN TRUY CẬP BỊ TỪ CHỐI</h2>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed">
            Chỉ Admin của hệ thống mới có quyền truy cập và sử dụng tính năng gửi thông báo tùy chỉnh này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10">
              <Bell size={24} />
            </span>
            GỬI THÔNG BÁO TÙY CHỈNH
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-bold">
            Gửi thông tin quan trọng tới toàn bộ ban nhạc (Broadcast) hoặc một thành viên cụ thể qua hệ thống Navbar & Email.
          </p>
        </div>

        {/* COMPOSER FORM CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
              <FileText className="text-indigo-600" size={18}/> Soạn Thảo Nội Dung
            </h3>

            <form onSubmit={handleSend} className="space-y-5 text-xs">
              {/* Recipient Selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Đối tượng nhận thông báo *
                </label>
                <div className="relative">
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-slate-800 font-extrabold transition appearance-none pr-10 cursor-pointer"
                  >
                    <option value="all">📢 Gửi tất cả thành viên (Broadcast)</option>
                    <optgroup label="Cá nhân cụ thể">
                      {loadingMembers ? (
                        <option disabled>Đang tải danh sách thành viên...</option>
                      ) : (
                        members.map((m) => (
                          <option key={m._id} value={m._id}>
                            👤 {m.fullName} ({m.instrument}) - {m.email || "Không có email"}
                          </option>
                        ))
                      )}
                    </optgroup>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                    ▼
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  placeholder="VD: Cập nhật lịch diễn cuối tuần này hoặc Thay đổi nội quy tập ráp..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none font-bold text-slate-800 transition"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  Nội dung thông báo (Chi tiết) *
                </label>
                
                <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-500 transition-all bg-slate-50">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1.5 p-2 border-b border-slate-200 bg-slate-100/80">
                    <button
                      type="button"
                      onClick={() => handleCommand("bold")}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-200 hover:text-slate-900 transition"
                      title="Chữ đậm"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommand("italic")}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-200 hover:text-slate-900 transition"
                      title="Chữ nghiêng"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommand("underline")}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-200 hover:text-slate-900 transition"
                      title="Gạch chân"
                    >
                      <Underline size={13} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-250 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => handleCommand("insertUnorderedList")}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-200 hover:text-slate-900 transition"
                      title="Danh sách dấu tròn"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommand("insertOrderedList")}
                      className="p-1.5 rounded-lg text-slate-650 hover:bg-slate-200 hover:text-slate-900 transition"
                      title="Danh sách số"
                    >
                      <ListOrdered size={13} />
                    </button>
                  </div>

                  {/* Editable Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    className="w-full min-h-[220px] p-4 bg-white outline-none font-medium text-slate-800 text-xs leading-relaxed overflow-y-auto rich-editor"
                    data-placeholder="Nhập nội dung thông báo chi tiết tại đây. Bạn có thể sử dụng thanh công cụ bên trên để định dạng chữ đậm, chữ nghiêng, danh sách..."
                  />
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
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                  }
                  .rich-editor ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                  }
                  .rich-editor b {
                    font-weight: bold !important;
                  }
                  .rich-editor i {
                    font-style: italic !important;
                  }
                  .rich-editor u {
                    text-decoration: underline !important;
                  }
                `}</style>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Đang gửi thông báo...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi Thông Báo Ngay 🚀
                  </>
                )}
              </button>
            </form>
          </div>

          {/* SIDE INFORMATION CARD */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm bg-gradient-to-br from-indigo-50/10 to-white">
              <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                <HelpCircle className="text-indigo-500" size={18}/> Hướng Dẫn & Lưu Ý
              </h3>
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed mt-4">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1 bg-indigo-50 text-indigo-650 rounded-lg font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <p><strong>Kênh gửi kép:</strong> Khi gửi, thông báo sẽ tự động được lưu vào cơ sở dữ liệu để hiển thị trên <strong>Navbar</strong> (Chuông thông báo) đồng thời gửi một email HTML được thiết kế đẹp mắt về <strong>Địa chỉ Email</strong> của các thành viên được chọn.</p>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <div className="p-1 bg-indigo-50 text-indigo-650 rounded-lg font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <p><strong>Cấu hình email:</strong> Vui lòng đảm bảo tài khoản Gmail App Password ở tệp <code>.env</code> phía máy chủ hoạt động bình thường để tránh lỗi gián đoạn gửi email.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="p-1 bg-indigo-50 text-indigo-650 rounded-lg font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <p><strong>Bảo mật thông tin:</strong> Đối với loại thông báo gửi toàn bộ ban nhạc (Broadcast), danh sách email người nhận sẽ được gửi dưới dạng ẩn danh (BCC) để bảo mật thông tin cá nhân của các thành viên.</p>
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Thành viên nhận thông báo</p>
                <h3 className="text-2xl font-black text-indigo-650 mt-1">{loadingMembers ? "..." : members.length} người</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center shadow-sm">
                <Users size={22}/>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminNotifications;
