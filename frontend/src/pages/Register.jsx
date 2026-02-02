import { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  FileText,
  CheckCircle,
  X,
  ArrowDown,
} from "lucide-react";

const Register = () => {
  // --- STATE CƠ BẢN ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- STATE ĐIỀU KHOẢN (MỚI) ---
  const [showTerms, setShowTerms] = useState(false); // Hiện popup
  const [canCheck, setCanCheck] = useState(false); // Đã cuộn hết chưa?
  const [agreed, setAgreed] = useState(false); // Đã tick chưa?
  const termsBodyRef = useRef(null); // Ref để đo độ cao

  const navigate = useNavigate();
  // const { login } = useContext(AuthContext); // Nếu cần login luôn sau khi reg

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 1. NÚT ĐĂNG KÝ BAN ĐẦU -> CHỈ MỞ POPUP
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validate sơ bộ trước khi hiện điều khoản
    if (formData.password !== formData.confirmPassword)
      return setError("Mật khẩu nhập lại không khớp");
    if (formData.password.length < 6)
      return setError("Mật khẩu phải hơn 6 ký tự");

    // Mở popup điều khoản
    setShowTerms(true);
  };

  // 2. XỬ LÝ CUỘN (SCROLL)
  const handleScroll = () => {
    const element = termsBodyRef.current;
    if (!element) return;

    // Công thức: Vị trí hiện tại + Chiều cao khung nhìn >= Chiều cao thực tế (trừ đi 1 xíu sai số 10px)
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 10) {
      setCanCheck(true);
    }
  };

  // 3. ĐĂNG KÝ CHÍNH THỨC (GỌI API)
  const handleFinalRegister = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await axios.post(
        "https://band-manager-s9tm.onrender.com/api/auth/register",
        {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        },
      );

      // 👇 SỬA ĐOẠN NÀY:
      // Không dùng alert() nữa. Chuyển hướng và gửi kèm thông báo.
      navigate("/login", {
        state: {
          message: "🎉 Đăng ký thành công! Vui lòng chờ Admin duyệt.",
          type: "success",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng ký");
      setShowTerms(false); // Tắt popup nếu lỗi để sửa form
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 relative">
      {/* --- FORM ĐĂNG KÝ CHÍNH --- */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Tạo tài khoản</h2>
          <p className="text-gray-500">Tham gia cùng ban nhạc của bạn</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              name="fullName"
              type="text"
              placeholder="Họ và tên hiển thị"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none"
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              name="email"
              type="text"
              placeholder="Email hoặc Tên đăng nhập"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none"
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none"
              onChange={handleChange}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-10 p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            Tiếp tục
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-green-600 font-bold hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>

      {/* --- MODAL ĐIỀU KHOẢN (POPUP) --- */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <FileText className="text-blue-600" /> Điều khoản sử dụng
              </h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Scrollable (Nơi bắt buộc phải đọc) */}
            <div
              ref={termsBodyRef}
              onScroll={handleScroll}
              className="p-6 overflow-y-auto bg-white text-gray-600 text-sm leading-relaxed space-y-4 flex-1 border-b border-gray-100"
              style={{ minHeight: "300px" }} // Chiều cao tối thiểu để hiện scroll
            >
              <div className="space-y-4 text-justify pr-2">
                <div className="text-center border-b pb-4 mb-4">
                  <h4 className="font-bold text-lg text-gray-800 uppercase tracking-wide">
                    THỎA THUẬN NGƯỜI DÙNG CUỐI (EULA)
                  </h4>
                  <p className="text-xs text-gray-400">
                    Phiên bản 1.2 - Cập nhật lần cuối: 03/02/2026
                  </p>
                </div>
                <p>
                  Chào mừng bạn đến với hệ thống quản lý{" "}
                  <strong>Sắc Band Manager</strong> ("Dịch vụ"). Việc bạn đăng
                  ký tài khoản đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý
                  tuân thủ toàn bộ các điều khoản dưới đây. Nếu không đồng ý với
                  bất kỳ điều khoản nào, vui lòng hủy bỏ quy trình đăng ký.
                </p>
                <h5 className="font-bold text-gray-800 text-base mt-4 border-l-4 border-blue-500 pl-2">
                  I. QUYỀN VÀ TRÁCH NHIỆM TÀI KHOẢN
                </h5>
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    <strong>Định danh:</strong> Tài khoản này là duy nhất và
                    không được chuyển nhượng. Bạn cam kết cung cấp thông tin
                    chính xác (Họ tên thật) để phục vụ công tác quản lý nhân sự
                    và chi trả lương/thưởng.
                  </li>
                  <li>
                    <strong>Bảo mật:</strong> Bạn chịu hoàn toàn trách nhiệm về
                    việc bảo mật mật khẩu truy cập. Ban Quản Trị (BQT) không
                    chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh do việc
                    bạn để lộ thông tin đăng nhập cho bên thứ ba.
                  </li>
                  <li>
                    <strong>Phân quyền:</strong> Tài khoản mới sẽ ở trạng thái{" "}
                    <em>Pending (Chờ duyệt)</em>. BQT có quyền từ chối kích hoạt
                    nếu xác minh thông tin không hợp lệ hoặc bạn không còn thuộc
                    biên chế hoạt động của Ban nhạc.
                  </li>
                </ul>
                <h5 className="font-bold text-gray-800 text-base mt-4 border-l-4 border-blue-500 pl-2">
                  II. QUY ĐỊNH VỀ KHO DỮ LIỆU & TÀI NGUYÊN
                </h5>
                <p>
                  Hệ thống cung cấp không gian lưu trữ cho Sheet nhạc, Beat, và
                  Tài liệu nội bộ. Bạn cam kết:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    <strong>Bản quyền:</strong> Chỉ tải lên các tài liệu phục vụ
                    trực tiếp cho hoạt động tập luyện và biểu diễn. Tuyệt đối
                    không tải lên các nội dung vi phạm bản quyền số, nội dung
                    đồi trụy, hoặc phần mềm độc hại (virus, trojan).
                  </li>
                  <li>
                    <strong>Bảo mật dữ liệu:</strong> Các bản phối khí (Beat),
                    Sheet nhạc do Ban nhạc biên soạn là tài sản trí tuệ nội bộ.
                    Nghiêm cấm sao chép, phát tán hoặc chia sẻ ra bên ngoài dưới
                    mọi hình thức khi chưa có sự đồng ý bằng văn bản của Trưởng
                    nhóm.
                  </li>
                  <li>
                    <strong>Tiết kiệm tài nguyên:</strong> Vui lòng tối ưu dung
                    lượng file trước khi upload để tiết kiệm băng thông và không
                    gian lưu trữ của hệ thống chung.
                  </li>
                </ul>
                <h5 className="font-bold text-gray-800 text-base mt-4 border-l-4 border-blue-500 pl-2">
                  III. VĂN HÓA ỨNG XỬ & GIAO TIẾP
                </h5>
                <p>
                  Sắc Band Manager không chỉ là công cụ quản lý mà còn là không
                  gian làm việc số. Chúng tôi đề cao:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    <strong>Tôn trọng:</strong> Không sử dụng ngôn từ thô tục,
                    xúc phạm, quấy rối hoặc công kích cá nhân trong các khu vực
                    tương tác (Bình luận Show, Ghi chú chung).
                  </li>
                  <li>
                    <strong>Minh bạch:</strong> Mọi ý kiến đóng góp về Show
                    diễn, Lịch tập cần được trình bày rõ ràng, mang tính xây
                    dựng.
                  </li>
                  <li>
                    <strong>Kỷ luật:</strong> Tuân thủ nghiêm ngặt các mốc thời
                    gian (Deadline) được giao trên hệ thống (Xác nhận tham gia
                    Show, Nộp bài tập,...).
                  </li>
                </ul>
                <h5 className="font-bold text-gray-800 text-base mt-4 border-l-4 border-blue-500 pl-2">
                  IV. TÀI CHÍNH & THANH TOÁN
                </h5>
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    <strong>Số liệu tham khảo:</strong> Các thông tin về Cát-xê
                    dự kiến hiển thị trên hệ thống chỉ mang tính chất ước tính.
                    Số liệu thực nhận sẽ căn cứ vào Báo cáo quyết toán cuối cùng
                    sau Show diễn.
                  </li>
                  <li>
                    <strong>Khiếu nại:</strong> Mọi thắc mắc về thu nhập/thưởng
                    phạt cần được gửi trực tiếp (Inbox riêng) cho Bộ phận Kế
                    toán hoặc Trưởng nhóm trong vòng 48h kể từ khi Show kết
                    thúc. Không tranh luận về tài chính tại các khu vực bình
                    luận công khai.
                  </li>
                </ul>
                <h5 className="font-bold text-gray-800 text-base mt-4 border-l-4 border-blue-500 pl-2">
                  V. ĐIỀU KHOẢN MIỄN TRỪ & CHẤM DỨT
                </h5>
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    <strong>Tính sẵn sàng:</strong> BQT và đội ngũ kỹ thuật
                    ("Admin NCT đẹp trai nhất thế giới") cam kết nỗ lực hết sức để duy trì hệ thống hoạt
                    động ổn định 24/7. Tuy nhiên, chúng tôi không chịu trách
                    nhiệm cho các gián đoạn dịch vụ do lỗi đường truyền mạng,
                    bảo trì định kỳ hoặc các sự cố bất khả kháng.
                  </li>
                  <li>
                    <strong>Khóa tài khoản:</strong> BQT có quyền đơn phương
                    đình chỉ hoặc xóa vĩnh viễn tài khoản của bạn mà không cần
                    báo trước nếu phát hiện vi phạm nghiêm trọng các điều khoản
                    trên hoặc khi bạn chấm dứt hợp đồng làm việc với Ban nhạc.
                  </li>
                </ul>
                <hr className="my-8 border-gray-200" />
                <p className="text-gray-500 italic text-center text-xs">
                  Bằng việc nhấn nút xác nhận bên dưới, tôi xin thề danh dự sẽ
                  là một thành viên gương mẫu, "cháy" hết mình trên sân khấu và
                  không bao giờ "bùng" show! 🤘🎸🎹
                </p>
                <div className="h-12"></div>{" "}
                {/* Khoảng trắng để chắc chắn người dùng phải cuộn hết */}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-5 bg-gray-50">
              {/* Checkbox */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${canCheck ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"}`}
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    disabled={!canCheck}
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                  />
                </div>
                <div className="text-sm">
                  <span
                    className={`font-bold ${canCheck ? "text-gray-800" : "text-gray-400"}`}
                  >
                    Tôi đồng ý với các điều khoản trên
                  </span>
                  {!canCheck && (
                    <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <ArrowDown size={12} /> Vui lòng cuộn xuống hết để mở khóa
                    </div>
                  )}
                </div>
              </label>

              {/* Button Confirm */}
              <button
                onClick={handleFinalRegister}
                disabled={!agreed || loading}
                className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${agreed ? "bg-green-600 text-white hover:bg-green-700 shadow-lg" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                {loading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    {" "}
                    <CheckCircle size={20} /> Xác nhận & Đăng ký{" "}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
