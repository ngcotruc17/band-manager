import { useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus, Mail, Lock, User, X, ArrowDown, CheckSquare, Square,
  AlertTriangle, Clock, DollarSign, Music, Phone, FileText, ArrowRight, Sparkles,
  Shield, LogOut, Loader
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
    const getAPIUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:5000/api/auth';
        }
      }
      return 'https://band-manager-s9tm.onrender.com/api/auth';
    };

    try {
      await axios.post(`${getAPIUrl()}/register`, {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8fafc] font-sans">
      {/* Premium Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>

      {/* Background Blobs (Premium Light Glow) */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-violet-200/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      {/* Box Đăng ký */}
      <div className="relative w-full max-w-lg bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-8 sm:p-10 z-10 shadow-[0_30px_60px_rgba(15,23,42,0.08)] animate-fade-in my-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 mb-5">
            <UserPlus size={30} />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent tracking-tight">
            ĐĂNG KÝ THÀNH VIÊN
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1.5">Bắt đầu hành trình âm nhạc chuyên nghiệp</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Họ và tên</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
                <input name="fullName" placeholder="Nhập họ tên..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Tên đăng nhập</label>
              <div className="relative group">
                <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
                <input name="username" placeholder="Tên tài khoản..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Địa chỉ Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
              <input name="email" type="email" placeholder="Nhập địa chỉ email cá nhân..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Số điện thoại</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
              <input name="phone" placeholder="Nhập số điện thoại liên lạc..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
                <input name="password" type="password" placeholder="Từ 6 ký tự trở lên..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Xác nhận lại</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={16} />
                <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu..." className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-800 transition-all text-xs font-semibold placeholder-slate-400 shadow-sm focus:shadow-md" onChange={handleChange} required />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 tracking-widest text-xs uppercase group"
          >
            Tiếp Tục Đăng Ký
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 text-xs font-bold uppercase tracking-wider">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 font-extrabold hover:text-blue-700 transition underline underline-offset-4">
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      {/* --- MODAL ĐIỀU KHOẢN --- */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-850">
                Quy Chế Hoạt Động Và Quy Định Nội Bộ
              </h3>
              <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-rose-500 transition bg-white p-2 rounded-full border border-slate-150"><X size={20} /></button>
            </div>

            <div ref={termsBodyRef} onScroll={handleScroll} className="p-8 overflow-y-auto space-y-8 text-slate-600 text-sm leading-relaxed scroll-smooth">

              {/* 1. Bảo mật */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 1. Bảo mật thông tin
                </h4>
                <p>Thành viên có trách nhiệm tự bảo mật tài khoản cá nhân trên hệ thống. Tuyệt đối không cung cấp thông tin đăng nhập, các đường dẫn dữ liệu nội bộ (tài liệu nhạc, beat nhạc, danh sách biểu diễn) hoặc thông tin hoạt động chưa công bố của ban nhạc cho bất kỳ bên thứ ba nào. Mọi vi phạm làm rò rỉ thông tin sẽ chịu hình thức xử lý <span className="font-extrabold text-rose-600">đình chỉ tư cách thành viên ngay lập tức</span>.</p>
              </div>

              {/* 2. Kỷ luật Giờ giấc */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 2. Quy định thời gian và sự hiện diện
                </h4>
                <div className="space-y-2.5">
                  <p><strong>Hoạt động tập luyện:</strong> Thành viên phải có mặt tại địa điểm tập trước giờ bắt đầu <span className="font-extrabold text-indigo-600">10 phút</span> để thực hiện công tác chuẩn bị cá nhân và cân chỉnh nhạc cụ. Trường hợp chậm trễ quá <span className="font-extrabold text-rose-600">15 phút</span> mà không có lý do bất khả kháng được Ban quản trị chấp thuận sẽ áp dụng mức phạt <span className="font-extrabold text-rose-600">50.000 đồng</span> đóng góp vào quỹ chung của ban nhạc.</p>
                  <p><strong>Hoạt động biểu diễn chính thức:</strong> Thành viên bắt buộc phải có mặt tại điểm biểu diễn tối thiểu trước <span className="font-extrabold text-indigo-600">45 đến 60 phút</span> để thực hiện soundcheck. Tuyệt đối không được phép chậm trễ lịch soundcheck và lịch diễn chính thức.</p>
                  <p><strong>Thông báo vắng mặt:</strong> Thành viên có nghĩa vụ thông báo và xin phép vắng mặt tối thiểu trước <span className="font-extrabold text-amber-600">03 ngày</span> đối với lịch tập ráp thông thường và trước <span className="font-extrabold text-amber-600">10 ngày</span> đối với các buổi diễn chính thức đã được chốt lịch.</p>
                </div>
              </div>

              {/* 3. Chuyên môn */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 3. Ý thức chuẩn bị chuyên môn
                </h4>
                <p>Thời gian tập ráp tập thể phục vụ cho việc phối hợp nhạc cụ và chỉnh sửa bản phối, không phải thời gian tập luyện cá nhân. Thành viên bắt buộc phải hoàn thành việc tự luyện tập, <span className="font-extrabold text-indigo-600">thuộc cấu trúc tác phẩm, hợp âm và nhịp phách</span> dựa trên tài liệu cung cấp trong Kho Nhạc trước khi tham dự tập chung. Ban quản trị có quyền <span className="font-extrabold text-rose-600">từ chối sự tham dự</span> của thành viên trong buổi tập ráp nếu phát hiện thành viên không đảm bảo yêu cầu chuyên môn cơ bản gây ảnh hưởng đến tiến độ của tập thể.</p>
              </div>

              {/* 4. Tài chính */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 4. Cơ chế phân chia cát-xê và đóng góp quỹ
                </h4>
                <div className="space-y-2.5">
                  <p><strong>Phân bổ cát-xê:</strong> Các khoản doanh thu từ hoạt động biểu diễn sẽ được kê khai công khai, minh bạch và chuyển khoản chi trả cho thành viên tham gia chính thức trong vòng <span className="font-extrabold text-emerald-600">24 giờ</span> kể từ khi ban nhạc nhận đủ thanh toán từ đối tác hoặc khách hàng.</p>
                  <p><strong>Trích lập quỹ ban nhạc:</strong> Hệ thống tự động thực hiện trích <span className="font-extrabold text-emerald-600">5% tổng doanh thu</span> từ mỗi chương trình biểu diễn để chuyển vào quỹ hoạt động chung của ban nhạc. Khoản quỹ này được dùng để chi trả cho các chi phí thuê phòng tập ráp, bảo dưỡng trang thiết bị kỹ thuật dùng chung và vận hành hệ thống.</p>
                </div>
              </div>

              {/* 5. Tác phong */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 5. Tác phong hoạt động và hình ảnh
                </h4>
                <p>Thành viên có nghĩa vụ tuân thủ <span className="font-extrabold text-indigo-600">chính xác quy định về trang phục và concept</span> đã được thống nhất cho từng chương trình biểu diễn. Đảm bảo thái độ ứng xử chuẩn mực, văn minh đối với đối tác, khách hàng và các đơn vị phối hợp tại địa điểm diễn để duy trì và nâng cao uy tín cho ban nhạc.</p>
              </div>

              {/* 6. Rời nhóm */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-850 text-base">
                  Điều 6. Quy trình chấm dứt tham gia ban nhạc
                </h4>
                <p>Thành viên có nguyện vọng xin dừng hoạt động trong ban nhạc cần gửi thông báo trước tối thiểu <span className="font-extrabold text-rose-600">30 ngày</span> và có trách nhiệm <span className="font-extrabold text-indigo-600">hoàn tất toàn bộ các show diễn đã được chốt lịch</span> trước thời điểm xin nghỉ. Khi dừng hoạt động, thành viên phải thực hiện bàn giao đầy đủ tài sản chung và toàn bộ tài liệu chuyên môn thuộc sở hữu của ban nhạc.</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-500 text-xs italic text-center leading-relaxed">
                Bằng việc xác nhận đăng ký tài khoản, thành viên cam kết tự nguyện tuân thủ nghiêm túc các điều khoản quy chế hoạt động nêu trên nhằm xây dựng tập thể hoạt động kỷ luật và chuyên nghiệp.
              </div>

              {!canCheck && (
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 text-center text-blue-600 font-bold text-xs animate-bounce flex items-center justify-center gap-2 border border-blue-500/10 rounded-xl shadow-sm">
                  Vui lòng cuộn xuống dưới cùng để đồng ý với các điều khoản hoạt động
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <button
                onClick={() => canCheck && setAgreed(!agreed)}
                disabled={!canCheck}
                className={`flex items-start gap-3 text-sm transition p-3 rounded-2xl ${canCheck ? 'hover:bg-slate-100 cursor-pointer text-slate-700' : 'text-slate-400 cursor-not-allowed'}`}
              >
                <div className="mt-0.5">{agreed ? <CheckSquare className="text-blue-600 shrink-0" /> : <Square className="shrink-0 text-slate-400" />}</div>
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