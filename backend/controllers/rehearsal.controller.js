const Rehearsal = require('../models/Rehearsal'); // Đảm bảo bạn đã có Model này
// Nếu chưa có Model, báo mình để mình gửi code Model nhé

// Lấy danh sách lịch tập (Sắp xếp ngày gần nhất lên đầu)
exports.getRehearsals = async (req, res) => {
  try {
    // Lấy tất cả, sort theo ngày (cũ nhất -> mới nhất hoặc ngược lại tùy bạn)
    // Ở đây mình sort -1 để lấy cái mới tạo, hoặc sort theo date để lấy sắp diễn ra
    const rehearsals = await Rehearsal.find().sort({ date: 1 }); 
    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... Các hàm tạo, xóa khác giữ nguyên nếu có ...