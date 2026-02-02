import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import toast from 'react-hot-toast';

const FinanceManager = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "income", // income hoặc expense
    category: "show"
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "https://band-manager-s9tm.onrender.com/api";
  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  // 1. Tải dữ liệu
  const fetchFinance = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/finance`, getAuthHeader());
      setTransactions(res.data.transactions);
      
      // Tính toán thống kê
      const total = res.data.totalFund;
      const income = res.data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = res.data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setStats({ total, income, expense });
    } catch (error) {
      console.error("Lỗi tải tài chính", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFinance(); }, []);

  // 2. Thêm giao dịch
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return toast.error("Vui lòng nhập đủ thông tin");
    
    const toastId = toast.loading("Đang lưu...");
    try {
      await axios.post(`${BASE_URL}/finance`, formData, getAuthHeader());
      toast.success("Đã lưu giao dịch! 💰", { id: toastId });
      setFormData({ title: "", amount: "", type: "income", category: "show" });
      fetchFinance(); // Load lại
    } catch (error) {
      toast.error("Lỗi khi lưu", { id: toastId });
    }
  };

  // 3. Xóa giao dịch
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa giao dịch này?")) return;
    try {
      await axios.delete(`${BASE_URL}/finance/${id}`, getAuthHeader());
      toast.success("Đã xóa");
      fetchFinance();
    } catch (error) {
      toast.error("Lỗi xóa");
    }
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="p-10 text-center">Đang tải két sắt... 🔐</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-blue-600"/> Quản Lý Tài Chính
        </h1>
        <p className="text-slate-500 mt-1">Theo dõi dòng tiền của Band</p>
      </div>

      {/* 3 Thẻ Thống Kê (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tổng Quỹ */}
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
           <div className="flex items-center gap-3 mb-2 text-blue-800 font-bold">
             <div className="p-2 bg-white rounded-lg shadow-sm"><DollarSign size={20}/></div>
             Tổng Quỹ Hiện Tại
           </div>
           <div className="text-3xl font-black text-blue-700">{formatCurrency(stats.total)}</div>
        </div>

        {/* Tổng Thu */}
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
           <div className="flex items-center gap-3 mb-2 text-emerald-800 font-bold">
             <div className="p-2 bg-white rounded-lg shadow-sm"><TrendingUp size={20}/></div>
             Tổng Thu Nhập
           </div>
           <div className="text-3xl font-black text-emerald-600">+{formatCurrency(stats.income)}</div>
        </div>

        {/* Tổng Chi */}
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border-rose-100">
           <div className="flex items-center gap-3 mb-2 text-rose-800 font-bold">
             <div className="p-2 bg-white rounded-lg shadow-sm"><TrendingDown size={20}/></div>
             Tổng Chi Tiêu
           </div>
           <div className="text-3xl font-black text-rose-600">-{formatCurrency(stats.expense)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM NHẬP LIỆU (Bên trái) */}
        <div className="glass-card p-6 rounded-2xl h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="text-blue-600"/> Thêm Giao Dịch Mới
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Loại giao dịch</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`py-2 text-sm font-bold rounded-lg transition ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Thu Tiền (+)
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`py-2 text-sm font-bold rounded-lg transition ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Chi Tiền (-)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Số tiền (VNĐ)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nội dung</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Cát xê Show Tết, Mua dây đàn..."
              />
            </div>

            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition transform active:scale-95">
              Lưu Giao Dịch
            </button>
          </form>
        </div>

        {/* DANH SÁCH LỊCH SỬ (Bên phải - Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800">Lịch Sử Giao Dịch</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">Chưa có giao dịch nào.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t._id} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-blue-200 transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{t.title}</div>
                      <div className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('vi-VN')} • Bởi {t.performedBy?.fullName}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`font-black text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(t._id)} className="text-slate-300 hover:text-rose-500 transition">
                        <Trash2 size={18}/>
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