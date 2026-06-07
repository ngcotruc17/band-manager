"use client";
 
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from '../../services/api';
import { 
  DollarSign, TrendingUp, AlertCircle, Calendar, 
  UploadCloud, FileText, CheckCircle, RefreshCw, 
  Search, ShieldAlert, CreditCard, Clock, CheckCircle2,
  Trash2, Plus, ArrowDown, ArrowUp, Loader, Download
} from "lucide-react";
import toast from "react-hot-toast";
 
interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  isAutoReconciled?: boolean;
  performedBy?: {
    fullName: string;
  };
}
 
interface WebhookLog {
  _id: string;
  transactionId: string;
  amount: number;
  content: string;
  senderName: string;
  processed: boolean;
  rawPayload?: any;
  createdAt: string;
}
 
export default function FinanceV2() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalFund, setTotalFund] = useState<number>(0);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
 
  // Dữ liệu hóa đơn tải lên
  const [invoiceData, setInvoiceData] = useState({
    title: "",
    amount: "",
    category: "equipment",
    notes: ""
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
 
  // Nạp dữ liệu tài chính từ API
  const fetchFinanceData = async () => {
    try {
      const res = await api.get("/finance");
      setTransactions(res.data.transactions || []);
      setTotalFund(res.data.totalFund || 0);
      
      // Nếu là admin, nạp thêm log Webhook ngân hàng
      if (user?.role === "admin") {
        const webhookRes = await api.get("/finance/webhooks");
        setWebhookLogs(webhookRes.data || []);
      }
    } catch (err) {
      toast.error("Lỗi nạp dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    if (user) {
      fetchFinanceData();
    }
  }, [user]);
 
  // Xử lý nộp hóa đơn phát sinh chi phí
  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceData.title || !invoiceData.amount) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và số tiền!");
      return;
    }
 
    setLoading(true);
    try {
      // Gửi giao dịch lên API
      await api.post("/finance", {
        title: invoiceData.title,
        amount: Number(invoiceData.amount),
        type: "expense",
        category: invoiceData.category
      });
      toast.success("Đã ghi nhận chi phí phát sinh và khấu trừ Quỹ Band! 📉");
      setInvoiceData({ title: "", amount: "", category: "equipment", notes: "" });
      setInvoiceFile(null);
      setShowUploadModal(false);
      fetchFinanceData();
    } catch (err) {
      toast.error("Lỗi khi kê khai chi phí");
    } finally {
      setLoading(false);
    }
  };
 
  // Xóa giao dịch (Admin)
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này khỏi sổ quỹ?")) return;
    try {
      await api.delete(`/finance/${id}`);
      toast.success("Đã xóa giao dịch thành công");
      fetchFinanceData();
    } catch (err) {
      toast.error("Không thể xóa giao dịch");
    }
  };
 
  // Xuất file CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Thời gian,Nội dung,Phân loại,Số tiền,Người thực hiện\n";
    
    transactions.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('vi-VN');
      const typeStr = t.type === 'income' ? 'Thu' : 'Chi';
      const amountStr = `${t.type === 'income' ? '' : '-'}${t.amount}`;
      const performer = t.performedBy?.fullName || "Hệ thống";
      const cleanTitle = t.title.replace(/"/g, '""');
      csvContent += `"${dateStr}","${cleanTitle}","${typeStr}",${amountStr},"${performer}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_tai_chinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Xuất CSV thành công! 📂");
  };
 
  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString("vi-VN") + "đ";
  };
 
  const filteredTransactions = transactions.filter(t => 
    (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-indigo-650" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang đồng bộ sổ quỹ tài chính...</span>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-2.5 rounded-2xl shadow-lg shadow-teal-500/10">
                <DollarSign size={26} />
              </span>
              QUẢN LÝ TÀI CHÍNH & ĐỐI SOÁT
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Hệ thống mở Open Banking & Kế toán dòng tiền v2.0</p>
          </div>
 
          <div className="flex gap-2 w-full md:w-auto">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 text-xs uppercase tracking-wider"
              >
                <Plus size={16} /> Tạo giao dịch quỹ
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 text-xs uppercase tracking-wider"
            >
              <Download size={16} /> Xuất Báo Cáo
            </button>
          </div>
        </div>
 
        {/* Các thẻ thông số chính */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-550/10 text-emerald-600 p-4 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-405 font-extrabold uppercase tracking-wider">Quỹ chung ban nhạc</p>
                <p className="text-2xl font-black text-slate-850">{formatCurrency(totalFund)}</p>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded-lg border border-emerald-100 uppercase">Hoạt động</span>
          </div>
 
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-650 p-4 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-405 font-extrabold uppercase tracking-wider">Số dư ví cá nhân</p>
                <p className="text-2xl font-black text-slate-850">{formatCurrency(user?.walletBalance || 0)}</p>
              </div>
            </div>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-1 rounded-lg border border-indigo-100 uppercase">Khả dụng</span>
          </div>
 
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-405 font-extrabold uppercase tracking-wider">Tiền phạt đã đóng</p>
                <p className="text-2xl font-black text-slate-850">{formatCurrency(user?.totalFinePaid || 0)}</p>
              </div>
            </div>
            <span className="text-[9px] bg-rose-50 text-rose-600 font-black px-2 py-1 rounded-lg border border-rose-100 uppercase">Tích lũy</span>
          </div>
        </div>
 
        {/* Khối Nội Dung: Giao Dịch & Nhật Ký Đối Soát */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: DANH SÁCH GIAO DỊCH (7 cột) */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" /> Sổ Nhật Ký Thu Chi
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Lịch sử dòng tiền ban nhạc cập nhật thời gian thực</p>
              </div>
              
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Tìm nội dung giao dịch..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-205 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
 
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 italic py-10">Không tìm thấy giao dịch nào</p>
              ) : (
                filteredTransactions.map(t => (
                  <div key={t._id} className="flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition duration-200">
                    <div className="flex items-center gap-3">
                      {t.type === "income" ? (
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <ArrowDown size={14} />
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <ArrowUp size={14} />
                        </span>
                      )}
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 leading-snug">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-black uppercase">
                          <span>{new Date(t.date).toLocaleDateString("vi-VN")}</span>
                          <span>•</span>
                          <span>{t.performedBy?.fullName || "Hệ thống"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "income" ? "+" : ""}{formatCurrency(t.amount)}
                      </span>
                      {t.isAutoReconciled && (
                        <span className="bg-emerald-50 text-[8px] font-black text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100" title="Đã đối soát tự động qua Webhook">
                          Reconciled
                        </span>
                      )}
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteTransaction(t._id)}
                          className="text-slate-350 hover:text-rose-500 p-1 rounded-lg transition"
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
 
          {/* CỘT PHẢI: WEBHOOK BANK LOGS (5 cột dành cho Admin) hoặc CƠ CHẾ NỘP TIỀN QUỸ (cho Member) */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
            {user?.role === "admin" ? (
              <>
                <div>
                  <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-indigo-600" /> Webhook Ngân Hàng
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Nhật ký truy vấn giao dịch trực tiếp từ TPBank/Cake</p>
                </div>
 
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {webhookLogs.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 italic py-10">Chưa có giao dịch webhook nào</p>
                  ) : (
                    webhookLogs.map(log => (
                      <div key={log._id} className="p-4 rounded-2xl border border-slate-150 bg-slate-50/20 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{log.transactionId}</span>
                          <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            log.processed 
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {log.processed ? "Khớp đối soát 100%" : "Chưa khớp mã"}
                          </span>
                        </div>
 
                        <div className="space-y-1 text-slate-700 font-semibold">
                          <p className="font-extrabold text-slate-850">{log.senderName || "KHONG RO NGUOI GUI"}</p>
                          <p className="text-slate-500 italic">" {log.content} "</p>
                        </div>
 
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-400">
                          <span>{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                          <span className="text-slate-800 text-xs font-black">+{formatCurrency(log.amount)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* GIAO DIỆN HƯỚNG DẪN NỘP PHẠT/NOP QUY CỦA THÀNH VIÊN */
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-indigo-605" /> Nộp Quỹ & Đóng Phạt
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Cơ chế đối soát tự động qua Open Banking</p>
                </div>
 
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-semibold text-slate-650">
                  <p className="leading-relaxed">Anh em có thể nộp tiền quỹ hoặc đóng tiền phạt đi trễ bằng cách quét mã QR chuyển khoản ngân hàng. Hệ thống SePay sẽ tự động khớp mã đối soát thời gian thực.</p>
                  
                  <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-2.5">
                    <h5 className="font-black text-slate-800 text-xs">Cú pháp đóng phạt tự động:</h5>
                    <div className="bg-slate-50 p-3 rounded-lg font-mono text-[11px] text-indigo-650 border border-slate-200">
                      PHAT {user?._id}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">Chuyển khoản chính xác số tiền phạt của bạn với nội dung trên để hệ thống tự động xóa công nợ trễ/vắng.</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-2.5">
                    <h5 className="font-black text-slate-800 text-xs">Thông tin tài khoản nhận:</h5>
                    <p className="text-[11px] text-slate-700">• Ngân hàng: TPBank</p>
                    <p className="text-[11px] text-slate-700">• Số tài khoản: 0987 654 321</p>
                    <p className="text-[11px] text-slate-700">• Chủ tài khoản: NGUYEN CONG TRUC</p>
                  </div>
                </div>
              </div>
            )}
          </div>
 
        </div>
 
      </div>
 
      {/* MODAL TẠO GIAO DỊCH QUỸ (Chi phí / Thu nhập phát sinh) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-black text-lg text-slate-850 flex items-center gap-2">
                <UploadCloud className="text-indigo-650" size={24} /> Kê khai chi tiêu / Thu nhập
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-rose-500 text-sm font-bold">Đóng</button>
            </div>
 
            <form onSubmit={handleUploadInvoice} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiêu đề khoản chi *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiền cọc show diễn, Tiền nước đi tập ráp..."
                  className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-1 ring-indigo-500 transition"
                  value={invoiceData.title}
                  onChange={e => setInvoiceData({ ...invoiceData, title: e.target.value })}
                />
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tiền (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Số tiền"
                    className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-1 ring-indigo-500 transition"
                    value={invoiceData.amount}
                    onChange={e => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                  />
                </div>
 
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh mục *</label>
                  <select
                    className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-1 ring-indigo-500 transition cursor-pointer"
                    value={invoiceData.category}
                    onChange={e => setInvoiceData({ ...invoiceData, category: e.target.value })}
                  >
                    <option value="show">Cát-xê show</option>
                    <option value="rehearsal">Thuê phòng tập</option>
                    <option value="equipment">Thiết bị âm thanh</option>
                    <option value="other">Khoản khác</option>
                  </select>
                </div>
              </div>
 
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                <FileText className="mx-auto text-slate-400 mb-2" size={24} />
                <span className="text-[10px] font-extrabold text-slate-500 block truncate">
                  {invoiceFile ? invoiceFile.name : "Tải lên ảnh Hóa đơn / Chứng từ (Tùy chọn)"}
                </span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={e => e.target.files && setInvoiceFile(e.target.files[0])}
                />
              </div>
 
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {loading ? <Loader className="animate-spin" size={16} /> : "XÁC NHẬN GHI VÀO SỔ"}
              </button>
            </form>
          </div>
        </div>
      )}
 
    </div>
  );
}
