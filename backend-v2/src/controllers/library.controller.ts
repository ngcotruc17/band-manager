import { Response } from 'express';
import Song from '../models/Song';
import { AuthenticatedRequest } from '../middleware/auth';

const handleLibraryError = (res: Response, error: any, defaultMessage = "Không tìm thấy bài hát (ID không hợp lệ)") => {
  if (error?.name === 'CastError' || error?.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: defaultMessage });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

export const getSongs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const songs = await Song.find({ 
      $or: [
        { event: { $exists: false } }, 
        { event: null }
      ] 
    }).sort({ createdAt: -1 });
    
    res.json(songs);
  } catch (error: any) {
    handleLibraryError(res, error);
  }
};

export const addSong = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, name, note } = req.body;
    const songName = title || name;

    if (!songName) {
      res.status(400).json({ message: "Vui lòng cung cấp tên bài hát!" });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const sheetFile = files && files['sheet'] ? files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatFile = files && files['beat'] ? files['beat'][0].path.replace(/\\/g, "/") : null;

    const newSong = new Song({
      title: songName,
      name: songName,
      note,
      sheetUrl: sheetFile, 
      beatUrl: beatFile,
      uploadedBy: req.user ? req.user._id : undefined
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error: any) {
    res.status(400).json({ message: "Lỗi upload: " + error.message });
  }
};

export const deleteSong = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ message: "Không tìm thấy bài hát" });
      return;
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isUploader = song.uploadedBy && req.user && song.uploadedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isUploader) {
      res.status(403).json({ success: false, message: "Bạn không có quyền xóa bài hát này" });
      return;
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài hát" });
  } catch (error: any) {
    handleLibraryError(res, error);
  }
};
