import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, 'uploads/'); // Lưu vào thư mục uploads
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Lấy đuôi file (.pdf, .mp3)
    cb(null, 'file-' + uniqueSuffix + fileExtension);
  }
});

// Kiểm tra định dạng file (Chỉ cho PDF và Audio)
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Chấp nhận mọi file audio (mp3, wav, m4a...) và pdf
  if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file Nhạc hoặc PDF!'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
export default upload;
