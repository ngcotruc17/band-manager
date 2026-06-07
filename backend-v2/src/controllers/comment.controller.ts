import { Response } from 'express';
import Comment from '../models/Comment';
import Event from '../models/Event';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCommentsByEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ event: req.params.eventId })
      .populate('user', 'fullName username role')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, eventId } = req.body;
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    
    const newComment = new Comment({
      event: eventId,
      user: req.user._id,
      content
    });
    
    await newComment.save();
    await newComment.populate('user', 'fullName username role');

    const eventObj = await Event.findById(eventId);
    if (eventObj) {
      // Có thể dùng socket service hoặc notification service ở đây nếu cần đẩy thông báo thời gian thực
    }

    res.status(201).json(newComment);
  } catch (error: any) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: 'Không tìm thấy bình luận' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }

    // Kiểm tra quyền: Admin hoặc người viết mới được xóa
    if (req.user.role !== 'admin' && comment.user.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Không có quyền xóa' });
      return;
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bình luận' });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};
