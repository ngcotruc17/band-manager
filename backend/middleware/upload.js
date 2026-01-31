const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Lưu vào thư mục uploads
  },
  filename: function (req, file, cb) {
    // Đặt tên file: thoi-gian-ten-goc.mp3
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Chỉ cho phép file PDF và Audio
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF hoặc Âm thanh!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;