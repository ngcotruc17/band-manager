"use client";

import React, { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { 
  UserPlus, Mail, Lock, User, X, CheckSquare, Square,
  Phone, Music, ArrowRight, Loader, ShieldCheck
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
      return toast.error("Mật khẩu xác nhận không khớp!");
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
    const toastId = toast.loading("Đang khởi tạo tài khoản thành viên...");
    try {
      await api.post("/auth/register", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success("Đăng ký thành công! Admin sẽ duyệt kích hoạt tài khoản của bạn.", { id: toastId });
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
    <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden py-4 sm:py-6">
      
      {/* Ambient concert stage lighting background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-500/12 to-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/8 to-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 🍏 iOS / OneUI Fluid Frosted Glass Register Sheet */}
      <div className="w-full max-w-lg ui-card p-6 sm:p-8 space-y-4 relative z-10 shadow-[0_25px_60px_-15px_rgba(242,112,36,0.15)] rounded-[2rem] my-auto">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#F27024] via-[#FA8C16] to-[#EA580C] flex items-center justify-center text-white mx-auto shadow-md shadow-orange-500/25 border border-white/30">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Đăng Ký Thành Viên FPTU Band</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Gia nhập CLB Âm nhạc Đại học FPT & quản lý nội bộ</p>
          </div>
        </div>

        {/* Form Đăng ký ban đầu */}
        <form onSubmit={handleInitialSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Họ và tên *</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tên đăng nhập *</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Music size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                  placeholder="username..."
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Địa chỉ Email *</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                required
                className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                placeholder="email@example.com"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Số điện thoại liên lạc *</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="text"
                name="phone"
                required
                className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                placeholder="0912345678..."
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Mật khẩu *</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                  placeholder="Tối thiểu 6 ký tự"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Xác nhận lại mật khẩu *</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="ui-input w-full pl-11 pr-4 py-3 text-sm font-medium"
                  placeholder="Nhập lại mật khẩu..."
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="ui-button-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            <span>ĐỌC ĐIỀU KHOẢN HOẠT ĐỘNG</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center text-xs font-medium text-slate-500 pt-3 border-t border-slate-200">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-[#F27024] hover:text-orange-700 font-bold underline">
            Đăng nhập ngay
          </Link>
        </div>

        {/* Modal điều khoản */}
        {showTerms && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] rounded-[2rem] border border-white/80 animate-slide-up">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#F27024]" />
                  <h3 className="font-extrabold text-sm text-slate-900">Quy Chế Hoạt Động CLB FPTU Band</h3>
                </div>
                <button 
                  onClick={() => setShowTerms(false)} 
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div 
                ref={termsBodyRef} 
                onScroll={handleScroll} 
                className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed"
              >
                <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-xs">Điều 1. Bảo mật tài nguyên & Lịch trình</h4>
                  <p className="text-slate-600">Thành viên có trách nhiệm bảo mật thông tin tài khoản. Tuyệt đối không chia sẻ tài nguyên âm nhạc (beat, sheet) hoặc thông tin lịch trình nội bộ CLB FPTU Band ra bên ngoài.</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-xs">Điều 2. Kỷ luật chuyên cần & Đúng giờ</h4>
                  <p className="text-slate-600">Có mặt trước giờ tập 10 phút. Chậm trễ không lý do chính đáng sẽ áp dụng trừ quỹ tự động theo quy chế biểu diễn CLB.</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-xs">Điều 3. Ý thức chuẩn bị bài trước khi ráp</h4>
                  <p className="text-slate-600">Chủ động tự tập thuộc bài và hợp âm thông qua Kho Nhạc FPTU trước buổi ráp để đảm bảo tiến độ chung của toàn ban.</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-xs">Điều 4. Cơ chế trích lập Quỹ Ban Nhạc</h4>
                  <p className="text-slate-600">Doanh thu mỗi chương trình được phân bổ minh bạch: trích lập Quỹ chung vận hành CLB và chi trả thù lao nhạc công theo phân bổ vai trò.</p>
                </div>

                {!canCheck && (
                  <div className="sticky bottom-0 bg-amber-50 border border-amber-200 p-2.5 text-center text-amber-800 font-bold text-[10px] rounded-xl shadow-xs">
                    ⬇️ CUỘN XUỐNG DƯỚI CÙNG ĐỂ KÍCH HOẠT NÚT ĐỒNG Ý
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                <button
                  onClick={() => canCheck && setAgreed(!agreed)}
                  disabled={!canCheck}
                  className={`flex items-start gap-2.5 text-xs transition p-2.5 rounded-xl text-left ${
                    canCheck ? "hover:bg-slate-100 cursor-pointer text-slate-800" : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <div className="mt-0.5">{agreed ? <CheckSquare className="text-[#F27024] shrink-0" /> : <Square className="shrink-0 text-slate-400" />}</div>
                  <span className="font-bold">Tôi đã đọc kỹ và cam kết tuân thủ nghiêm túc toàn bộ điều lệ của FPTU Band.</span>
                </button>

                <button
                  onClick={handleFinalRegister}
                  disabled={!agreed || loading}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    agreed 
                      ? "ui-button-primary" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN GIA NHẬP FPTU BAND"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
