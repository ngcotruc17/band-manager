"use client";

import React, { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { 
  UserPlus, Mail, Lock, User, X, CheckSquare, Square,
  Phone, Music, ArrowRight, Sparkles, Loader
} from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [canCheck, setCanCheck] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const termsBodyRef = useRef<HTMLDivElement | null>(null);

  // Điều hướng nếu đã đăng nhập
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Mật khẩu nhập lại không khớp!");
    }
    if (formData.password.length < 6) {
      return toast.error("Mật khẩu phải từ 6 ký tự trở lên!");
    }

    setShowTerms(true);
    setCanCheck(false);
    setAgreed(false);
  };

  const handleScroll = () => {
    const element = termsBodyRef.current;
    if (!element) return;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 20) {
      setCanCheck(true);
    }
  };

  const handleFinalRegister = async () => {
    if (!agreed) return;
    setLoading(true);
    const toastId = toast.loading("Đang khởi tạo tài khoản đăng ký...");
    try {
      await api.post("/auth/register", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success("Đăng ký thành công! Vui lòng chờ Admin duyệt kích hoạt nhé. 🎸", { id: toastId });
      router.push("/login");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi tạo tài khoản";
      toast.error(errMsg, { id: toastId });
      setShowTerms(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Nền lưới công nghệ */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
      
      {/* Glow blobs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-200/30 rounded-full filter blur-[100px] opacity-75"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-200/20 rounded-full filter blur-[100px] opacity-65"></div>

      <div className="w-full max-w-lg bg-white/85 backdrop-blur-md rounded-[36px] border border-slate-200/60 p-8 md:p-10 shadow-2xl shadow-slate-200/20 space-y-6 relative z-10 my-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="bg-gradient-to-tr from-indigo-650 to-fuchsia-650 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 transform rotate-6 hover:rotate-12 transition">
            <UserPlus size={26} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight uppercase text-slate-800">Đăng Ký Thành Viên</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gia nhập cộng đồng Sắc Band chuyên nghiệp</p>
          </div>
        </div>

        {/* Form Đăng ký ban đầu */}
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Họ và tên *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                  placeholder="Họ tên..."
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username *</label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                  placeholder="Tên tài khoản..."
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                name="email"
                required
                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                placeholder="email@example.com"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                name="phone"
                required
                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                placeholder="Nhập số điện thoại liên lạc..."
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                  placeholder="Tối thiểu 6 ký tự"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Xác nhận lại *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-xs transition focus:ring-2 ring-indigo-500/25 focus:border-indigo-500 shadow-inner"
                  placeholder="Nhập lại mật khẩu..."
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/15 transition active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-4 group"
          >
            ĐỌC ĐIỀU KHOẢN HOẠT ĐỘNG
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Đăng nhập ngay
          </Link>
        </p>

        {/* Modal điều khoản */}
        {showTerms && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200/80 rounded-[32px] max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
              
              <div className="p-6 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-lg text-slate-800">Quy Chế Hoạt Động & Quy Định Nội Bộ</h3>
                <button 
                  onClick={() => setShowTerms(false)} 
                  className="text-slate-400 hover:text-rose-500 p-2 rounded-full border border-slate-200 bg-white shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>

              <div 
                ref={termsBodyRef} 
                onScroll={handleScroll} 
                className="p-8 overflow-y-auto space-y-6 text-xs text-slate-650 leading-relaxed scroll-smooth"
              >
                {/* Nội dung điều khoản */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-850 text-sm">Điều 1. Bảo mật thông tin tài khoản</h4>
                  <p>Thành viên có trách nhiệm bảo mật thông tin tài khoản của mình. Tuyệt đối không chia sẻ tài nguyên âm nhạc (beat, sheet) hoặc thông tin lịch trình nội bộ cho bên ngoài. Vi phạm sẽ chịu hình thức xử lý <span className="font-black text-rose-600">đình chỉ sinh hoạt ngay lập tức</span>.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-850 text-sm">Điều 2. Kỷ luật chuyên cần và giờ giấc</h4>
                  <p><strong>Lịch tập ráp:</strong> Phải có mặt trước giờ bắt đầu <span className="font-black text-indigo-600">10 phút</span>. Việc chậm trễ quá <span className="font-black text-rose-600">15 phút</span> mà không được ban quản trị phê duyệt sẽ tự động áp dụng phạt <span className="font-black text-rose-600">50.000 đồng</span> khấu trừ trực tiếp vào cát-xê ví.</p>
                  <p><strong>Lịch biểu diễn:</strong> Bắt buộc có mặt soundcheck đúng giờ trước <span className="font-black text-indigo-600">45-60 phút</span>.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-850 text-sm">Điều 3. Ý thức chuẩn bị bài diễn</h4>
                  <p>Thành viên phải chủ động tự tập thuộc bài và hợp âm thông qua Kho Nhạc trước khi tập ráp. Ban quản trị có quyền từ chối sự tham gia của thành viên nếu phát hiện không thuộc bài gây ảnh hưởng tiến độ chung.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-850 text-sm">Điều 4. Cơ chế trích lập quỹ hoạt động</h4>
                  <p>Hệ thống tự động trích lập <span className="font-black text-emerald-650">5% tổng doanh thu</span> từ mỗi chương trình biểu diễn làm Quỹ chung ban nhạc để chi trả phòng tập và vận hành. 95% cát-xê còn lại sẽ được chia đều cho các thành viên tham gia chính thức.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-850 text-sm">Điều 5. Tác phong hoạt động và rời nhóm</h4>
                  <p>Tuân thủ đúng concept trang phục diễn. Thành viên muốn chấm dứt hoạt động phải báo trước <span className="font-black text-rose-600">30 ngày</span> và cam kết hoàn tất đầy đủ các show đã chốt trước thời điểm xin nghỉ.</p>
                </div>

                {!canCheck && (
                  <div className="sticky bottom-0 bg-indigo-50 border border-indigo-250 p-3 text-center text-indigo-650 font-black text-[10px] rounded-xl shadow-md animate-bounce">
                    CUỘN XUỐNG DƯỚI CÙNG ĐỂ ĐỒNG Ý VỚI CÁC ĐIỀU KHOẢN NỘI BỘ
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-150 bg-slate-50/50 flex flex-col gap-4">
                <button
                  onClick={() => canCheck && setAgreed(!agreed)}
                  disabled={!canCheck}
                  className={`flex items-start gap-3 text-xs transition p-3 rounded-2xl text-left ${
                    canCheck ? 'hover:bg-slate-100 cursor-pointer text-slate-700' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="mt-0.5">{agreed ? <CheckSquare className="text-indigo-600 shrink-0" /> : <Square className="shrink-0 text-slate-300" />}</div>
                  <span className="font-bold">Tôi đã đọc kỹ và cam kết tuân thủ nghiêm túc toàn bộ điều lệ của ban nhạc.</span>
                </button>

                <button
                  onClick={handleFinalRegister}
                  disabled={!agreed || loading}
                  className={`w-full py-4 rounded-2xl font-black text-xs tracking-wider transition ${
                    agreed 
                      ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:scale-[1.02] shadow-lg shadow-indigo-600/10' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐĂNG KÝ THÀNH VIÊN"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
