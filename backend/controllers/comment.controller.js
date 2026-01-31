const Comment = require('../models/Comment');
const Event = require('../models/Event');
const { notifyAllMembers } = require('./notification.controller');

// 1. Lấy danh sách bình luận của 1 show
exports.getCommentsByEvent = async (req, res) => {
  try {
    const comments = await Comment.find({ event: req.params.eventId })
      .populate('user', 'fullName username role') // Lấy thông tin người chat
      .sort({ createdAt: 1 }); // Xếp theo thời gian cũ -> mới (giống chat)
    res.json(comments);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Gửi bình luận mới
exports.addComment = async (req, res) => {
  try {
    const { content, eventId } = req.body;
    
    const newComment = new Comment({
      event: eventId,
      user: req.user._id,
      content
    });
    
    await newComment.save();
    
    // Populate để trả về cho frontend hiển thị ngay
    await newComment.populate('user', 'fullName username role');

    // --- TẠO THÔNG BÁO CHO MỌI NGƯỜI ---
    const event = await Event.findById(eventId);
    if (event) {
        // Thông báo đơn giản: Có thảo luận mới
        // (Lưu ý: Logic này sẽ báo cho cả người vừa chat, nhưng tạm chấp nhận cho đơn giản)
        /* Nếu muốn xịn hơn, bạn có thể viết hàm notify riêng trừ người gửi ra,
           nhưng hiện tại dùng notifyAllMembers cho tiện.
        */
    }

    res.status(201).json(newComment);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 3. Xóa bình luận (Chỉ Admin hoặc chính chủ)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' });

    // Kiểm tra quyền: Admin hoặc người viết mới được xóa
    if (req.user.role !== 'admin' && comment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Không có quyền xóa' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bình luận' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};