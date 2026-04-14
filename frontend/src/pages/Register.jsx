import { useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus, Mail, Lock, User, X, ArrowDown, CheckSquare, Square,
  AlertTriangle, Clock, DollarSign, Music, Phone, FileText, ArrowRight, Sparkles,
  Shield, LogOut // 👈 Thêm 2 icon này vào
} from "lucide-react";
import toast from "react-hot-toast";

const Register = () => {
  // --- STATE ---
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

  const termsBodyRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error("Mật khẩu nhập lại không khớp");
    if (formData.password.length < 6) return toast.error("Mật khẩu phải từ 6 ký tự trở lên");

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
    const toastId = toast.loading("Đang khởi tạo tài khoản...");
    try {
      await axios.post("https://band-manager-s9tm.onrender.com/api/auth/register", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success("Đăng ký thành công! Vui lòng chờ Admin duyệt nhé. 🎸", { id: toastId });
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đăng ký", { id: toastId });
      setShowTerms(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 font-sans">
      {/* Background Blobs (Đồng bộ với Login) */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-violet-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>

      {/* Box Đăng ký */}
      <div className="relative w-full max-w-lg glass-dark rounded-[32px] p-8 sm:p-10 z-10 animate-fade-in my-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-violet-500 text-white shadow-lg mb-4">
            <UserPlus size={28} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">ĐĂNG KÝ THÀNH VIÊN</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Bắt đầu hành trình âm nhạc chuyên nghiệp</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
              <input name="fullName" placeholder="Họ và tên" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
            </div>
            <div className="relative group">
              <Music className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
              <input name="username" placeholder="Tên đăng nhập" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
            </div>
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
            <input name="email" type="email" placeholder="Địa chỉ Email" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
          </div>

          <div className="relative group">
            <Phone className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
            <input name="phone" placeholder="Số điện thoại" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
              <input name="password" type="password" placeholder="Mật khẩu" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" size={18} />
              <input name="confirmPassword" type="password" placeholder="Nhập lại" className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 ring-blue-500/50 text-white transition text-sm" onChange={handleChange} required />
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 tracking-widest text-xs">
            TIẾP TỤC <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-sm font-medium">
          Đã có tài khoản? <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 transition underline underline-offset-4">Đăng nhập ngay</Link>
        </p>
      </div>

      {/* --- MODAL ĐIỀU KHOẢN (DESIGN MỚI) --- */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                <FileText size={24} className="text-blue-400" /> Quy Định Nội Bộ
              </h3>
              <button onClick={() => setShowTerms(false)} className="text-slate-500 hover:text-white transition bg-white/5 p-2 rounded-full"><X size={20} /></button>
            </div>

            <div ref={termsBodyRef} onScroll={handleScroll} className="p-8 overflow-y-auto space-y-8 text-slate-400 text-sm leading-relaxed scroll-smooth">

              {/* 1. Tài khoản & Bảo mật */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <Shield size={18} className="text-blue-400" /> 1. Bảo mật Hệ thống
                </h4>
                <p>Thành viên có trách nhiệm bảo mật tài khoản cá nhân. Tuyệt đối không cung cấp thông tin đăng nhập hoặc link nội bộ (Sheet nhạc, Beat, Lịch diễn) cho người ngoài ban nhạc. Mọi hành vi làm rò rỉ dữ liệu sẽ bị đình chỉ tư cách thành viên ngay lập tức.</p>
              </div>

              {/* 2. Kỷ luật Giờ giấc */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <Clock size={18} className="text-amber-500" /> 2. Kỷ luật Giờ giấc & Sự hiện diện
                </h4>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">●</span>
                    <span><strong>Tập luyện:</strong> Có mặt trước giờ tập 10 phút để setup nhạc cụ. Trễ quá 15 phút không lý do chính đáng: phạt <strong>50.000đ</strong> vào quỹ nhóm.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">●</span>
                    <span><strong>Biểu diễn (Gigs):</strong> Tuyệt đối không được trễ. Có mặt ít nhất 45-60 phút trước giờ diễn để soundcheck.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">●</span>
                    <span><strong>Vắng mặt:</strong> Phải báo trước ít nhất 3 ngày (lịch tập) và 10 ngày (lịch diễn) để Admin tìm người thay thế (sub).</span>
                  </li>
                </ul>
              </div>

              {/* 3. Chuyên môn & Chất lượng */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <Music size={18} className="text-fuchsia-400" /> 3. Chuẩn bị Chuyên môn
                </h4>
                <p>Phòng tập là nơi để **ráp Band**, không phải nơi để tập cá nhân. Thành viên bắt buộc phải thuộc lòng cấu trúc bài, hợp âm và nhịp phách dựa trên tài liệu trong Kho Nhạc trước khi đến buổi tập chính thức. Nếu không chuẩn bị bài gây ảnh hưởng tiến độ chung, Admin có quyền mời thành viên đó ra khỏi buổi tập.</p>
              </div>

              {/* 4. Tài chính & Quyền lợi */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <DollarSign size={18} className="text-emerald-400" /> 4. Phân chia Cát-xê & Quỹ nhóm
                </h4>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold">●</span>
                    <span><strong>Cát-xê:</strong> Được công khai minh bạch và thanh toán trong vòng 24h sau khi Show kết thúc hoặc nhận được tiền từ đối tác.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold">●</span>
                    <span><strong>Quỹ chung:</strong> Trích 10% từ mỗi Show diễn vào Quỹ Band để chi trả chi phí phòng tập, bảo trì thiết bị chung và vận hành hệ thống.</span>
                  </li>
                </ul>
              </div>

              {/* 5. Tác phong & Hình ảnh */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <User size={18} className="text-violet-400" /> 5. Tác phong & Trang phục
                </h4>
                <p>Tuân thủ đúng Concept trang phục được yêu cầu cho từng Show diễn. Giữ thái độ hòa nhã, lịch sự với khách hàng và nhân viên tại điểm diễn để giữ uy tín cho Sắc Band.</p>
              </div>

              {/* 6. Rời nhóm (Exit Policy) */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-base">
                  <LogOut size={18} className="text-rose-500" /> 6. Quy định Rời nhóm
                </h4>
                <p>Thành viên muốn rời nhóm cần thông báo trước ít nhất **30 ngày** và có trách nhiệm hoàn thành nốt các Show diễn đã được chốt lịch trước đó. Bàn giao lại đầy đủ tài sản và các tài liệu chuyên môn thuộc sở hữu của Band.</p>
              </div>

              <div className="p-5 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl text-blue-300 text-xs italic text-center leading-relaxed">
                "Âm nhạc là cảm xúc, nhưng làm việc là kỷ luật. Bằng việc nhấn xác nhận, bạn cam kết cùng Sắc Band xây dựng một tập thể chuyên nghiệp và văn minh."
              </div>

              {!canCheck && (
                <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-sm p-4 text-center text-blue-400 font-bold text-xs animate-bounce flex items-center justify-center gap-2 border border-blue-500/20 rounded-xl">
                  <ArrowDown size={16} /> Cuộn xuống để đồng ý với nội quy mới
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-white/5 flex flex-col gap-4">
              <button
                onClick={() => canCheck && setAgreed(!agreed)}
                disabled={!canCheck}
                className={`flex items-start gap-3 text-sm transition p-3 rounded-2xl ${canCheck ? 'hover:bg-white/5 cursor-pointer text-slate-200' : 'text-slate-600 cursor-not-allowed'}`}
              >
                <div className="mt-0.5">{agreed ? <CheckSquare className="text-blue-400 shrink-0" /> : <Square className="shrink-0 text-slate-600" />}</div>
                <span className="font-medium">Tôi đã đọc kỹ, hiểu rõ và cam kết tuân thủ toàn bộ nội quy của Sắc Band.</span>
              </button>

              <button
                onClick={handleFinalRegister}
                disabled={!agreed || loading}
                className={`w-full py-4 rounded-2xl font-black tracking-widest text-xs transition-all duration-300 shadow-2xl ${agreed ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-500/20 hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐĂNG KÝ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;