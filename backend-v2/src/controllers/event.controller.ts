import { Response } from 'express';
import Event from '../models/Event';
import Song from '../models/Song';
import Booking from '../models/Booking';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find()
      .populate('bookingRef', 'customerName contactInfo status')
      .sort({ date: 1 });
    res.json(events);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const getEventDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('bookingRef')
      .populate('participants.user', 'username fullName email');
      
    if (!event) {
      res.status(404).json({ message: 'Không tìm thấy sự kiện' });
      return;
    }
    
    const songs = await Song.find({ event: req.params.id });
    res.json({ event, songs });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const addSongToEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, name, note } = req.body;
    const songName = title || name; 

    if (!songName) {
      res.status(400).json({ message: "Thiếu tên bài hát" });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const sheetUrl = files && files['sheet'] ? files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatUrl = files && files['beat'] ? files['beat'][0].path.replace(/\\/g, "/") : null;
    
    const newSong = new Song({ 
      title: songName, 
      name: songName, 
      note, 
      event: req.params.id,
      sheetUrl, 
      beatUrl 
    });
    
    await newSong.save();
    res.status(201).json(newSong);
  } catch (error: any) { 
    console.error("Lỗi add song:", error);
    res.status(400).json({ message: "Lỗi thêm bài hát: " + error.message }); 
  }
};

export const addSongFromLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { librarySongId } = req.body;
    const eventId = req.params.id;

    const sourceSong = await Song.findById(librarySongId);
    if (!sourceSong) {
      res.status(404).json({ message: "Không tìm thấy bài hát này trong kho!" });
      return;
    }

    const newSong = new Song({
      title: sourceSong.title || sourceSong.name,
      name: sourceSong.name || sourceSong.title,
      note: sourceSong.note,
      sheetUrl: sourceSong.sheetUrl,
      beatUrl: sourceSong.beatUrl,
      event: eventId
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error: any) { 
    console.error("Lỗi clone nhạc:", error);
    res.status(500).json({ message: error.message }); 
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error: any) { 
    res.status(400).json({ message: error.message }); 
  }
};

export const deleteSong = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Đã xóa bài hát' });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const joinEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Show không tồn tại' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }

    const alreadyJoined = event.participants.some(p => p.user && p.user.toString() === req.user?._id.toString());
    if (alreadyJoined) {
      res.status(400).json({ message: 'Bạn đã đăng ký rồi!' });
      return;
    }

    event.participants.push({ 
      user: req.user._id, 
      joinedAt: new Date(), 
      isSelected: false 
    } as any);
    
    await event.save();

    await NotificationService.notifyAdmins({
      message: `👤 ${req.user.username} vừa đăng ký show: ${event.title}`,
      link: `/events/${event._id}`,
      type: 'info'
    });

    res.json(event);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const togglePerformer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Show không tồn tại' });
      return;
    }

    const participant = event.participants.find(p => {
      if (!p.user) return false;
      const pUserId = (p.user as any)._id ? (p.user as any)._id.toString() : p.user.toString();
      return pUserId === userId;
    });
    
    if (participant) {
      participant.isSelected = !participant.isSelected;
      await event.save();

      if (participant.isSelected) {
        try {
          await NotificationService.notifyUser(userId, {
            message: `🎉 Bạn đã được chọn đi diễn show: ${event.title}!`,
            link: `/events/${event._id}`,
            type: 'success'
          });
        } catch (e: any) { 
          console.log("Lỗi gửi thông báo:", e.message); 
        }
      }
      res.json(event);
    } else {
      res.status(404).json({ message: "Thành viên này chưa đăng ký tham gia show" });
    }
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Không tìm thấy Event' });
      return;
    }

    if (event.bookingRef) {
      await Booking.findByIdAndDelete(event.bookingRef);
    }
    
    await Song.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Đã xóa sự kiện' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
