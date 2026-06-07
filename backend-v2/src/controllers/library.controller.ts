import { Response } from 'express';
import Song from '../models/Song';
import { AuthenticatedRequest } from '../middleware/auth';

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
    res.status(500).json({ message: error.message });
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
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài hát" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
