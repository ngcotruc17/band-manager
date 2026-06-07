# TÀI LIỆU TỔNG HỢP NỘI DUNG VÀ TÍNH NĂNG HỆ THỐNG
## SẮC BAND MANAGER - PHIÊN BẢN HIỆN TẠI

Hệ thống quản lý ban nhạc Sắc Band Manager được phát triển nhằm mục đích số hóa toàn bộ quy trình vận hành nội bộ, tối ưu hóa công tác tổ chức biểu diễn, tự động hóa kế toán dòng tiền và nâng cao tính kỷ luật chuyên cần của các thành viên. Tài liệu này tổng hợp toàn bộ các phân hệ chức năng và nội dung công nghệ đang hoạt động trên hệ thống.

---

### 1. Phân hệ Quản lý Show diễn (Booking Manager)
* **Quy trình duyệt lịch diễn**: Hệ thống hỗ trợ ghi nhận thông tin chi tiết các show diễn bao gồm thời gian, địa điểm, khách hàng liên hệ và đơn giá hợp đồng. Trạng thái show được cập nhật theo tiến trình từ Chờ duyệt, Xác nhận, Đã hoàn thành hoặc Đã hủy.
* **Đăng ký tham gia trực tuyến**: Thành viên ban nhạc chủ động đăng ký tham gia show diễn trực tiếp trên hệ thống. Quyền phê duyệt đội hình chính thức thuộc về Ban quản trị.
* **Đóng mở đăng ký linh hoạt**: Trình trạng thái cho phép Ban quản trị đóng hoặc mở cổng đăng ký tham gia show diễn nhằm cố định đội hình biểu diễn trước giờ diễn.

---

### 2. Phân hệ Tự động hóa Tài chính và Cát-xê
* **Tự động trích Quỹ hoạt động**: Khi show diễn được chuyển sang trạng thái Đã hoàn thành, hệ thống tự động trích 5% tổng doanh thu đưa vào Quỹ chung của ban nhạc nhằm phục vụ các hoạt động mua sắm thiết bị và chi phí tập luyện.
* **Phân chia cát-xê tự động**: Sau khi trích quỹ chung, 95% doanh thu còn lại sẽ được hệ thống chia đều và ghi nhận trực tiếp vào số dư cát-xê của các thành viên tham gia chính thức đã được phê duyệt.
* **Đồng bộ hóa giao dịch tài chính**: Hệ thống tự động tạo giao dịch doanh thu (Giao dịch Thu) và các giao dịch chi trả cát-xê cho thành viên (Giao dịch Chi) trong lịch sử tài chính của ban nhạc, đảm bảo sự minh bạch tuyệt đối. Nếu trạng thái show diễn thay đổi ngược lại, các giao dịch tài chính liên quan sẽ tự động được thu hồi để tránh sai sót kế toán.
* **Thanh toán VietQR động**: Tích hợp mã VietQR động tự động điền sẵn thông tin số tài khoản thủ quỹ, số tiền thanh toán (tiền đặt cọc show, thanh toán hoàn tất show hoặc đóng quỹ phạt) và nội dung chuyển khoản đúng cú pháp để thành viên hoặc đối tác quét mã nhanh chóng.

---

### 3. Phân hệ Điểm danh bảo mật bằng mã QR
* **Mã QR động xoay vòng**: Khi bắt đầu buổi tập ráp nhạc, Ban quản trị tạo mã QR động trên màn hình hệ thống. Mã QR này chứa mã token được tự động xoay vòng làm mới sau mỗi 60 giây và tự động hết hạn sau 5 phút nhằm ngăn chặn tình trạng gửi ảnh chụp mã QR cho người vắng mặt điểm danh hộ.
* **Ghi nhận trạng thái và tính toán đi trễ**: Thành viên sử dụng camera trên điện thoại di động quét mã QR trực tiếp từ trình duyệt để điểm danh. Hệ thống tự động đối chiếu thời gian quét với lịch tập hẹn:
  * Đi tập đúng giờ (Thời gian trễ dưới 15 phút): Ghi nhận Trực tiếp, không phạt.
  * Đi tập trễ (Thời gian trễ từ 15 phút trở lên): Hệ thống tự động chuyển trạng thái thành Đi trễ và tự động áp dụng mức phạt 50.000 đồng vào quỹ phạt của thành viên.
  * Vắng mặt không lý do: Ghi nhận Vắng mặt và áp dụng mức phạt theo quy chế nội bộ.

---

### 4. Phân hệ Quản lý Repertoire và Thiết lập Setlist Tập trung
* **Phân quyền truy cập bảo mật**: Trang danh mục biểu diễn và bộ công cụ lên setlist được phân quyền bảo mật cấp cao, chỉ hiển thị trên thanh điều hướng đối với tài khoản Admin. Thành viên thường khi truy cập trực tiếp bằng đường dẫn URL sẽ bị hệ thống tự động chuyển hướng về trang tổng quan.
* **Báo cáo thống kê kho nhạc**: Hệ thống tự động tính toán tổng số bài hát biểu diễn, số lượng bài có nốt nhạc sheet PDF, số lượng bài có file beat đệm và phân tích các ghi chú để đưa ra tone giọng chủ đạo thường xuyên sử dụng của ban nhạc.
* **Trình thiết lập Setlist hai cột trực quan**: Cho phép Ban quản trị chọn show diễn hoạt động, tìm kiếm nhanh bài hát trong kho nhạc chung và nhấn nút thêm sang Setlist của show.
* **Quản lý thứ tự và ghi chú chi tiết**: Ban quản trị có thể thay đổi thứ tự biểu diễn của các bài hát (nút lên/xuống), viết ghi chú riêng cho từng bài hát trong show đó (ví dụ chỉ định tone ca sĩ, dặn dò nhạc công dập trống) và ghi chú chung cho đêm diễn.
* **Xuất bản nhanh Zalo**: Tự động chuyển đổi Setlist của show thành đoạn văn bản có cấu trúc gọn gàng, liệt kê đầy đủ thời gian, địa điểm và danh sách bài hát đánh số để copy-paste trực tiếp gửi vào nhóm chat Zalo nội bộ.
* **In ấn Stage Sheet chuyên dụng**: Thiết kế bản in tối giản riêng cho sân khấu. Khi bấm lệnh in trên trình duyệt, hệ thống tự động ẩn tất cả các nút công cụ, menu điều hướng để xuất bản bản in chữ lớn, rõ ràng giúp nhạc công dễ dàng theo dõi trên sân khấu.

---

### 5. Phân hệ Kho Beat và Sheet Nhạc
* **Lưu trữ tài liệu tập luyện**: Cho phép tải lên và lưu trữ tập tin nốt nhạc sheet dạng PDF và tập tin âm thanh beat đệm dạng MP3 trực tiếp lên hệ thống.
* **Trình phát nhạc nền toàn hệ thống (Global Audio Player)**: Tích hợp trình phát nhạc beat chạy ẩn bên dưới website, cho phép thành viên nghe nhạc đệm tập luyện ở bất cứ trang nào mà không bị gián đoạn khi chuyển tab hoặc chuyển trang.

---

### 6. Phân hệ Truyền thông và Hệ thống Thông báo (Email & Website)
* **Bộ soạn thảo Rich Text (WYSIWYG) của Admin**: Ban quản trị sử dụng bộ soạn thảo tích hợp để định dạng văn bản thông báo (Chữ đậm, chữ nghiêng, gạch chân, danh sách số, danh sách bullet) một cách chuyên nghiệp.
* **Thông báo tức thời trên Navbar**: Giao diện Navbar hiển thị chuông thông báo trực quan, tự động lọc bỏ thẻ HTML để hiển thị tin tóm tắt dạng chữ thuần thẩm mỹ.
* **Email thông báo tự động**: Hệ thống tự động gửi thư điện tử định dạng HTML cao cấp (container rộng 800px rõ ràng) tới email cá nhân của thành viên trong các trường hợp:
  * Khi Ban quản trị phát hành lịch tập ráp band mới.
  * Khi Ban quản trị phê duyệt thành viên vào đội hình biểu diễn chính thức của show.
  * Khi show diễn hoàn thành và hệ thống chia cát-xê thành công (email liệt kê chi tiết doanh thu, tiền trích quỹ nhóm và số cát-xê thực tế thành viên nhận được).
  * Khi Ban quản trị gửi thông báo tùy chỉnh khẩn cấp.

---

### 7. Phân hệ Quản lý Nhân sự và Tài chính Tổng hợp
* **Quản lý danh sách thành viên**: Quản lý hồ sơ, số điện thoại liên hệ, vai trò nhạc công/ca sĩ chính trong ban nhạc và phê duyệt tài khoản mới đăng ký.
* **Theo dõi lịch sử giao dịch**: Hiển thị bảng kê toàn bộ các giao dịch tài chính của ban nhạc kèm bộ lọc phân loại theo nguồn thu và mục đích chi.
* **Bảng công nợ quỹ phạt**: Liệt kê số tiền phạt tích lũy chưa nộp của từng thành viên, hỗ trợ Ban quản trị ghi nhận đóng phạt trực tiếp để đồng bộ vào dòng tiền chung.

---

### 8. Phân hệ Báo cáo Tổng quan (Dashboard)
* **Theo dõi thời gian thực**: Đồng hồ số thời gian thực cập nhật liên tục giây, phút và ngày tháng hiển thị nổi bật ở biểu ngữ chào mừng cá nhân hóa.
* **Thống kê tiến độ hoạt động**: Hiển thị nhanh số lượng thành viên, số lượng show diễn trong tháng, số tiền quỹ nhóm hiện tại và khoản nợ phạt tích lũy toàn ban nhạc.
* **Bảng xếp hạng thi đua nội bộ (Leaderboards)**:
  * Bảng xếp hạng chuyên cần: Thống kê tỷ lệ đi tập đầy đủ và đúng giờ của các thành viên.
  * Bảng xếp hạng quỹ phạt ("Vua Phạt"): Liệt kê số tiền phạt tích lũy để tăng tính nhắc nhở và kỷ luật của các thành viên.

---

### 9. Giao diện Xác thực và Bảo mật
* **Thiết kế Premium**: Các màn hình Đăng nhập (Login), Đăng ký (Register), và Đổi mật khẩu lần đầu (Change Password) được thiết kế hiện đại trên nền hiệu ứng lưới chuyển màu công nghệ sang trọng.
* **Quy chế hoạt động chuyên nghiệp**: Modal điều khoản hoạt động khi đăng ký được soạn thảo bằng văn phong trang trọng, chuẩn mực, làm nổi bật các mốc thời gian và nghĩa vụ đóng góp mà không sử dụng các biểu tượng cảm xúc.
