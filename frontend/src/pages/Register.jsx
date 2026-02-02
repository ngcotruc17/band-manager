import { useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  X,
  ArrowDown,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  DollarSign,
  Music
} from "lucide-react";

const Register = () => {
  // --- STATE ---
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [canCheck, setCanCheck] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const termsBodyRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) return setError("Mật khẩu nhập lại không khớp");
    if (formData.password.length < 6) return setError("Mật khẩu phải hơn 6 ký tự");

    setShowTerms(true);
    setCanCheck(false);
    setAgreed(false);
  };

  const handleScroll = () => {
    const element = termsBodyRef.current;
    if (!element) return;
    // Sai số 20px cho chắc ăn
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 20) {
      setCanCheck(true);
    }
  };

  const handleFinalRegister = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await axios.post("https://band-manager-s9tm.onrender.com/api/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login", { state: { message: "🎉 Đăng ký thành công! Vui lòng chờ Admin duyệt.", type: "success" } });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng ký");
      setShowTerms(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 relative">
      {/* FORM ĐĂNG KÝ */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Tạo tài khoản</h2>
          <p className="text-gray-500">Tham gia hệ thống quản lý Sắc Band</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium text-center">{error}</div>}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={20} /><input name="fullName" type="text" placeholder="Họ và tên hiển thị" className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" onChange={handleChange} required /></div>
          <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={20} /><input name="email" type="text" placeholder="Email hoặc Tên đăng nhập" className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" onChange={handleChange} required /></div>
          <div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={20} /><input name="password" type="password" placeholder="Mật khẩu" className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" onChange={handleChange} required /></div>
          <div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={20} /><input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" onChange={handleChange} required /></div>
          <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">Tiếp tục</button>
        </form>
        <p className="text-center mt-6 text-gray-600">Đã có tài khoản? <Link to="/login" className="text-green-600 font-bold hover:underline">Đăng nhập</Link></p>
      </div>

      {/* --- MODAL ĐIỀU KHOẢN (ĐÃ CẬP NHẬT DÀI THOÒNG) --- */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><FileText size={20}/> Quy Định Thành Viên</h3>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            
            {/* Nội dung dài */}
            <div ref={termsBodyRef} onScroll={handleScroll} className="p-6 overflow-y-auto space-y-6 text-sm text-gray-600 relative scroll-smooth bg-gray-50/50">
              
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> 1. Tài khoản & Bảo mật</h4>
                <p>Thành viên có trách nhiệm tự bảo quản tài khoản. Không chia sẻ tài khoản cho người ngoài ban nhạc.</p>
                {/* Đoạn Reset Pass Quan Trọng */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-800 text-xs">
                  <strong>⚠️ LƯU Ý QUAN TRỌNG:</strong><br/>
                  Hệ thống <strong>KHÔNG</strong> hỗ trợ tự lấy lại mật khẩu qua Email.<br/>
                  Nếu quên mật khẩu, vui lòng liên hệ trực tiếp <strong>Admin (Trưởng nhóm)</strong> để yêu cầu Reset.<br/>
                  Mật khẩu mặc định sau khi reset là <code>123456</code>. Bạn bắt buộc phải reload trang sau khi đăng nhập bằng mật khẩu mặc định và đổi mật khẩu mới ngay lập tức.
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> 2. Giờ giấc & Kỷ luật</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Đi trễ tập:</strong> Trễ quá 15 phút không lý do chính đáng sẽ bị phạt <strong>50.000đ</strong> vào quỹ nhóm.</li>
                  <li><strong>Đi trễ Show:</strong> Tuyệt đối cấm kỵ. Trễ show gây ảnh hưởng uy tín sẽ bị xem xét tư cách thành viên.</li>
                  <li><strong>Vắng mặt:</strong> Phải thông báo trước ít nhất 24h (với lịch tập) và 7 ngày (với lịch diễn).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><Music size={16} className="text-purple-500"/> 3. Chuyên môn & Tập luyện</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Phải thuộc bài (cấu trúc, hợp âm, lời) <strong>TRƯỚC</strong> khi đến phòng tập.</li>
                  <li>Phòng tập là nơi để ráp band, không phải nơi để tập cá nhân.</li>
                  <li>Tôn trọng ý kiến đóng góp của Leader và các thành viên khác.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign size={16} className="text-green-500"/> 4. Tài chính & Cát-xê</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Cát-xê được chia công khai, minh bạch sau mỗi show diễn hoặc tổng kết cuối tháng.</li>
                  <li>Trích <strong>5-10%</strong> cát-xê vào quỹ chung (dùng để duy trì web, mua dây đàn, nước uống...).</li>
                  <li>Thành viên làm hỏng thiết bị chung do sơ suất phải chịu trách nhiệm đền bù 100%.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900">5. Hình ảnh & Truyền thông</h4>
                <p>Thành viên đồng ý cho phép Ban nhạc sử dụng hình ảnh khi biểu diễn để phục vụ mục đích quảng bá trên Fanpage/Website.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900">6. Rời nhóm</h4>
                <p>Thành viên muốn rời nhóm phải thông báo trước <strong>30 ngày</strong> và hoàn thành các show đã nhận lịch. Bàn giao đầy đủ tài sản, bài vở trước khi nghỉ.</p>
              </div>

              <p className="italic text-gray-400 text-xs pt-4 text-center">
                Bằng việc nhấn "Đồng ý", bạn cam kết thực hiện nghiêm túc các quy định trên vì sự phát triển chung của Sắc Band.
              </p>

              {/* Chỉ dẫn cuộn xuống */}
              {!canCheck && (
                  <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t p-2 text-center text-blue-600 font-bold text-xs animate-bounce rounded-b-lg shadow-lg">
                      <ArrowDown size={16} className="inline mr-1"/> Vui lòng đọc hết quy định để tiếp tục
                  </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
              <button onClick={() => canCheck && setAgreed(!agreed)} disabled={!canCheck} className={`flex items-start gap-3 text-sm transition p-2 rounded-lg ${canCheck ? 'hover:bg-gray-100 cursor-pointer text-gray-800' : 'text-gray-400 cursor-not-allowed'}`}>
                <div className="mt-0.5">{agreed ? <CheckSquare className="text-blue-600 shrink-0" /> : <Square className="shrink-0"/>}</div>
                <span className="leading-tight">Tôi xác nhận đã đọc kỹ, hiểu rõ và cam kết tuân thủ toàn bộ nội quy của Ban nhạc.</span>
              </button>

              <button onClick={handleFinalRegister} disabled={!agreed || loading} className={`w-full py-3 rounded-xl font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${agreed ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>
                {loading ? "Đang xử lý..." : "Xác Nhận Đăng Ký"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import { FileText } from "lucide-react"; // Đừng quên import icon này nếu chưa có
export default Register;