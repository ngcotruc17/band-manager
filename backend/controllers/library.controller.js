const LibrarySong = require('../models/LibrarySong');

// 1. Lấy tất cả bài trong kho
exports.getLibrarySongs = async (req, res) => {
  try {
    const songs = await LibrarySong.find().sort({ name: 1 }); // Xếp theo tên A-Z
    res.json(songs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Upload bài mới vào kho
exports.addLibrarySong = async (req, res) => {
  try {
    const { name, note, category } = req.body;
    const sheetUrl = req.files && req.files['sheet'] ? req.files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatUrl = req.files && req.files['beat'] ? req.files['beat'][0].path.replace(/\\/g, "/") : null;

    const newSong = new LibrarySong({ name, note, category, sheetUrl, beatUrl });
    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 3. Xóa bài khỏi kho
exports.deleteLibrarySong = async (req, res) => {
  try {
    await LibrarySong.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa khỏi kho nhạc' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};