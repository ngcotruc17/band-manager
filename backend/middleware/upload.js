const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Lưu vào thư mục uploads
  },
  filename: function (req, file, cb) {
    // 👇 SỬA LẠI ĐOẠN NÀY:
    // Thay vì dùng tên gốc, ta tạo tên mới hoàn toàn bằng thời gian + số ngẫu nhiên
    // Ví dụ: 170988229-123456789.pdf (Đảm bảo không bao giờ bị lỗi ký tự)
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Lấy đuôi file (.pdf, .mp3)
    
    cb(null, 'file-' + uniqueSuffix + fileExtension);
  }
});

// Kiểm tra định dạng file (Chỉ cho PDF và Audio)
const fileFilter = (req, file, cb) => {
  // Chấp nhận mọi file audio (mp3, wav, m4a...) và pdf
  if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file Nhạc hoặc PDF!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
module.exports = upload;