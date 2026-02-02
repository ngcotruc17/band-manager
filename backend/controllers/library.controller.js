const Song = require('../models/Song');

// 1. Lấy danh sách bài hát
exports.getSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Upload bài hát mới
exports.addSong = async (req, res) => {
  try {
    const { title, note } = req.body;
    
    // Lấy đường dẫn file nếu có upload
    // Lưu ý: Frontend phải đặt name="sheet" và name="beat"
    const sheetFile = req.files['sheet'] ? req.files['sheet'][0].path : null;
    const beatFile = req.files['beat'] ? req.files['beat'][0].path : null;

    const newSong = new Song({
      title,
      note,
      sheetUrl: sheetFile, // Lưu đường dẫn file
      beatUrl: beatFile,
      uploadedBy: req.user.id
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) {
    res.status(400).json({ message: "Lỗi upload: " + error.message });
  }
};

// 3. Xóa bài hát
exports.deleteSong = async (req, res) => {
    try {
        await Song.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa bài hát" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}