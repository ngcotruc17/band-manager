import { useState, useEffect, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, ArrowUpRight, ArrowDownLeft, Loader, Calendar, Download, User } from "lucide-react";
import toast from 'react-hot-toast';

const FinanceManager = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", amount: "", type: "income", category: "show" });

  // Filters state
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchFinance = async () => {
    try {
      const res = await api.get('/finance');
      setTransactions(res.data.transactions || []);
      const total = res.data.totalFund;
      const income = (res.data.transactions || []).filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = (res.data.transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setStats({ total, income, expense });
    } catch (error) { 
      toast.error("Lỗi tải thông tin tài chính"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchFinance(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return toast.error("Vui lòng nhập đủ thông tin");
    try {
      await api.post("/finance", formData);
      toast.success("Đã ghi nhận giao dịch! 💰");
      setFormData({ title: "", amount: "", type: "income", category: "show" });
      fetchFinance();
    } catch (error) { 
      toast.error("Lỗi khi lưu"); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch sử giao dịch này?")) return;
    try {
      await api.delete(`/finance/${id}`);
      toast.success("Đã xóa");
      fetchFinance();
    } catch (error) { 
      toast.error("Lỗi xóa"); 
    }
  };

  const fmt = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Compute unique years from transactions list
  const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear()))).sort((a, b) => b - a);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    const monthMatch = filterMonth ? (tDate.getMonth() + 1).toString() === filterMonth : true;
    const yearMatch = filterYear ? tDate.getFullYear().toString() === filterYear : true;
    const typeMatch = filterType ? t.type === filterType : true;
    return monthMatch && yearMatch && typeMatch;
  });

  // Client-side Excel/CSV Export with UTF-8 BOM
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Thời gian,Nội dung,Phân loại,Số tiền,Người thực hiện\n";
    
    filteredTransactions.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('vi-VN');
      const typeStr = t.type === 'income' ? 'Thu' : 'Chi';
      const amountStr = `${t.type === 'income' ? '' : '-'}${t.amount}`;
      const performer = t.performedBy?.fullName || "Thành viên";
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

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-8 animate-fade-in transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="bg-gradient-to-tr from-blue-600 to-indigo-650 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/10">
              <Wallet size={28} />
            </span>
            TÀI CHÍNH & THỐNG KÊ
          </h1>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-8 rounded-[40px] border-blue-100 flex flex-col justify-center card-hover">
             <div className="flex items-center gap-3 mb-3 text-blue-600 font-black uppercase text-xs tracking-widest">
               <div className="p-2 bg-blue-100 rounded-xl"><DollarSign size={20}/></div>
               Tổng Quỹ Hiện Tại
             </div>
             <div className="text-4xl font-black text-slate-800">{fmt(stats.total)}</div>
          </div>

          <div className="glass p-8 rounded-[40px] border-emerald-100 flex flex-col justify-center card-hover">
             <div className="flex items-center gap-3 mb-3 text-emerald-600 font-black uppercase text-xs tracking-widest">
               <div className="p-2 bg-emerald-100 rounded-xl"><TrendingUp size={20}/></div>
               Tổng Thu
             </div>
             <div className="text-4xl font-black text-emerald-600">+{fmt(stats.income)}</div>
          </div>

          <div className="glass p-8 rounded-[40px] border-rose-100 flex flex-col justify-center card-hover">
             <div className="flex items-center gap-3 mb-3 text-rose-600 font-black uppercase text-xs tracking-widest">
               <div className="p-2 bg-rose-100 rounded-xl"><TrendingDown size={20}/></div>
               Tổng Chi
             </div>
             <div className="text-4xl font-black text-rose-600">-{fmt(stats.expense)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM (Admin Only) */}
          {user?.role === 'admin' && (
            <div className="glass p-8 rounded-[40px] h-fit lg:sticky lg:top-24">
              <h3 className="font-black text-xl text-slate-850 mb-6 flex items-center gap-2">
                <Plus className="text-blue-605" size={24}/> Tạo Giao Dịch
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Thu (+)</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Chi (-)</button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền (VNĐ)</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-800 outline-none focus:ring-2 ring-blue-500 transition" placeholder="0"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nội dung giao dịch</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500 transition" placeholder="VD: Cát xê show, Mua dây đàn..."/>
                </div>

                <button className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-blue-500/10 transition transform active:scale-95 uppercase tracking-widest text-xs">Ghi Vào Sổ</button>
              </form>
            </div>
          )}

          {/* HISTORY */}
          <div className={`space-y-6 ${user?.role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-black text-2xl text-slate-850">Lịch Sử Giao Dịch</h3>
              <button onClick={exportToCSV} className="flex items-center gap-2 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-650 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md transition transform active:scale-95">
                <Download size={15}/> Xuất báo cáo CSV
              </button>
            </div>

            {/* FILTERS PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-3xl border border-slate-200/60 shadow-sm">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bộ lọc phân loại</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700">
                  <option value="">Tất cả phân loại</option>
                  <option value="income">Khoản Thu (+)</option>
                  <option value="expense">Khoản Chi (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bộ lọc tháng</label>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700">
                  <option value="">Tất cả các tháng</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bộ lọc năm</label>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700">
                  <option value="">Tất cả các năm</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
               <div className="text-center py-20"><Loader className="animate-spin mx-auto text-blue-600" size={32}/></div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-20 glass rounded-[40px] border-dashed border-slate-200 text-slate-400 italic font-bold text-sm">Không tìm thấy giao dịch nào khớp với bộ lọc.</div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((t) => (
                  <div key={t._id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all duration-300 animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-inner ${t.type === 'income' ? 'bg-emerald-50 text-emerald-650' : 'bg-rose-50 text-rose-650'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={22}/> : <ArrowDownLeft size={22}/>}
                      </div>
                      <div>
                        <div className="font-black text-slate-850 text-lg leading-tight">{t.title}</div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                           <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(t.date).toLocaleDateString('vi-VN')}</span>
                           <span className="flex items-center gap-1"><User size={12}/> {t.performedBy?.fullName || "Thành viên"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`font-black text-xl ${t.type === 'income' ? 'text-emerald-650' : 'text-rose-650'}`}>
                        {t.type === 'income' ? '+' : ''}{fmt(t.amount)}
                      </div>
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(t._id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-xl transition">
                          <Trash2 size={20}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceManager;