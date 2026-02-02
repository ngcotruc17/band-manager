const Event = require('../models/Event');
const Song = require('../models/Song'); // 👈 Chỉ khai báo 1 lần duy nhất ở đây
const Booking = require('../models/Booking');

// Import bộ thông báo (Dùng optional chaining để tránh lỗi nếu chưa có file)
let notifyAdmin, notifyUser;
try {
    const notificationController = require('./notification.controller');
    notifyAdmin = notificationController.notifyAdmin;
    notifyUser = notificationController.notifyUser;
} catch (e) {
    console.log("⚠️ Chưa cấu hình Notification (Bỏ qua)");
}

// 1. Lấy danh sách Events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('bookingRef', 'customerName contactInfo status')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Lấy chi tiết Event + List nhạc của Event đó
exports.getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('bookingRef')
      .populate('participants.user', 'username fullName email');
      
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    
    // Tìm các bài hát thuộc về Event này
    const songs = await Song.find({ event: req.params.id });
    
    res.json({ event, songs });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Thêm bài hát vào Event (Upload file hoặc tạo mới)
exports.addSongToEvent = async (req, res) => {
  try {
    const { title, name, note } = req.body;
    
    // Hỗ trợ cả 2 tên biến title/name để tránh lỗi frontend cũ
    const songName = title || name; 

    // Xử lý path file (Replace dấu \ thành / cho Window đỡ lỗi)
    const sheetUrl = req.files && req.files['sheet'] ? req.files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatUrl = req.files && req.files['beat'] ? req.files['beat'][0].path.replace(/\\/g, "/") : null;
    
    const newSong = new Song({ 
        title: songName, 
        name: songName, 
        note, 
        event: req.params.id, // Liên kết với Show
        sheetUrl, 
        beatUrl 
    });
    
    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { 
      console.error("Lỗi add song:", error);
      res.status(400).json({ message: "Lỗi thêm bài hát: " + error.message }); 
  }
};

// 4. Thêm bài hát TỪ KHO (Copy từ bài có sẵn)
exports.addSongFromLibrary = async (req, res) => {
  try {
    const { librarySongId } = req.body;
    const eventId = req.params.id;

    // Tìm bài gốc trong kho (Cũng dùng Model Song)
    const sourceSong = await Song.findById(librarySongId);
    
    if (!sourceSong) {
        return res.status(404).json({ message: "Không tìm thấy bài hát này trong kho!" });
    }

    // Tạo bản sao (Clone) gắn vào Event mới
    const newSong = new Song({
      title: sourceSong.title || sourceSong.name,
      name: sourceSong.name || sourceSong.title,
      note: sourceSong.note,
      sheetUrl: sourceSong.sheetUrl,
      beatUrl: sourceSong.beatUrl,
      event: eventId // 👈 Quan trọng: Gán vào Show hiện tại
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { 
      console.error("Lỗi clone nhạc:", error);
      res.status(500).json({ message: error.message }); 
  }
};

// 5. Cập nhật thông tin Event
exports.updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 6. Xóa bài hát khỏi Event
exports.deleteSong = async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Đã xóa bài hát' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. Đăng ký tham gia (Join)
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Show không tồn tại' });

    const alreadyJoined = event.participants.some(p => p.user && p.user.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ message: 'Bạn đã đăng ký rồi!' });

    event.participants.push({ 
      user: req.user._id, 
      joinedAt: new Date(), 
      isSelected: false 
    });
    
    await event.save();

    if (notifyAdmin) {
        await notifyAdmin({
          message: `👤 ${req.user.username} vừa đăng ký show: ${event.title}`,
          link: `/events/${event._id}`,
          type: 'info'
        });
    }

    res.json(event);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 8. Chọn thành viên đi diễn (Toggle Performer)
exports.togglePerformer = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Show không tồn tại' });

    const participant = event.participants.find(p => {
        if (!p.user) return false;
        const pUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return pUserId === userId;
    });
    
    if (participant) {
      participant.isSelected = !participant.isSelected;
      await event.save();

      if (participant.isSelected && notifyUser) {
          try {
              await notifyUser({
                recipientId: userId,
                message: `🎉 Bạn đã được chọn đi diễn show: ${event.title}!`,
                link: `/events/${event._id}`,
                type: 'success'
              });
          } catch (e) { console.log("Lỗi gửi thông báo:", e.message); }
      }
      return res.json(event);
    } else {
        return res.status(404).json({ message: "Thành viên này chưa đăng ký tham gia show" });
    }
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// 9. Xóa Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy Event' });

    if (event.bookingRef) await Booking.findByIdAndDelete(event.bookingRef);
    // Xóa luôn các bài hát gắn với event này cho sạch DB
    await Song.deleteMany({ event: req.params.id });
    
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Đã xóa sự kiện' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};