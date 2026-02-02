const Song = require('../models/Song');

// 1. Lấy danh sách bài hát (FIX LỖI TRÙNG LẶP/STACK)
exports.getSongs = async (req, res) => {
  try {
    // 👇 QUAN TRỌNG: Chỉ tìm những bài KHÔNG thuộc về Event nào
    // (tức là trường 'event' không tồn tại hoặc bằng null)
    const songs = await Song.find({ 
        $or: [
            { event: { $exists: false } }, 
            { event: null }
        ] 
    }).sort({ createdAt: -1 });
    
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Upload bài hát mới vào Kho (Giữ nguyên)
exports.addSong = async (req, res) => {
  try {
    const { title, name, note } = req.body;
    
    // Hỗ trợ cả title và name
    const songName = title || name;

    const sheetFile = req.files['sheet'] ? req.files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatFile = req.files['beat'] ? req.files['beat'][0].path.replace(/\\/g, "/") : null;

    const newSong = new Song({
      title: songName,
      name: songName,
      note,
      sheetUrl: sheetFile, 
      beatUrl: beatFile,
      uploadedBy: req.user.id
      // Không set trường event -> Mặc định là null (Bài Master)
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) {
    res.status(400).json({ message: "Lỗi upload: " + error.message });
  }
};

// 3. Xóa bài hát (Giữ nguyên)
exports.deleteSong = async (req, res) => {
    try {
        await Song.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa bài hát" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}