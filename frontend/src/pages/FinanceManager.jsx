import { useState, useEffect, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, ArrowUpRight, ArrowDownLeft, Loader, Calendar } from "lucide-react";
import toast from 'react-hot-toast';

const FinanceManager = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", amount: "", type: "income", category: "show" });

  const fetchFinance = async () => {
    try {
      const res = await api.get('/finance');
      setTransactions(res.data.transactions);
      const total = res.data.totalFund;
      const income = res.data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = res.data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setStats({ total, income, expense });
    } catch (error) { toast.error("Lỗi tải thông tin tài chính"); }
    finally { setLoading(false); }
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
    } catch (error) { toast.error("Lỗi khi lưu"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa lịch sử giao dịch này?")) return;
    try {
      await api.delete(`/finance/${id}`);
      toast.success("Đã xóa");
      fetchFinance();
    } catch (error) { toast.error("Lỗi xóa"); }
  };

  const fmt = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200">
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
          <div className="glass p-8 rounded-[40px] h-fit sticky top-24">
            <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="text-blue-600" size={24}/> Tạo Giao Dịch
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
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
          <div className="flex items-center justify-between">
            <h3 className="font-black text-2xl text-slate-800">Lịch Sử Giao Dịch</h3>
          </div>
          {loading ? (
             <div className="text-center py-20"><Loader className="animate-spin mx-auto text-blue-600" size={32}/></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 glass rounded-[40px] border-dashed text-slate-400 italic font-medium">Chưa có giao dịch nào được ghi nhận.</div>
          ) : (
            <div className="space-y-4">
              {transactions.map((t) => (
                <div key={t._id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl shadow-inner ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={22}/> : <ArrowDownLeft size={22}/>}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-lg leading-tight">{t.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(t.date).toLocaleDateString('vi-VN')}</span>
                         <span className="flex items-center gap-1"><User size={12}/> {t.performedBy?.fullName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`font-black text-xl ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
  );
};

export default FinanceManager;