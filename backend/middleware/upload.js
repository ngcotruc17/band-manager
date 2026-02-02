const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Lưu vào thư mục uploads
  },
  filename: function (req, file, cb) {
    // Đặt tên file: thoigian-tenfilegoc
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});

// Kiểm tra định dạng file (Chỉ cho PDF và Audio)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file Nhạc hoặc PDF!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
module.exports = upload;