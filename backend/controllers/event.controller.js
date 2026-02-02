const Event = require('../models/Event');
const Song = require('../models/Song');
const Booking = require('../models/Booking');
const LibrarySong = require('../models/LibrarySong');
// Import thông báo
const notificationController = require('./notification.controller'); 
const notifyAdmin = notificationController?.notifyAdmin;
const notifyUser = notificationController?.notifyUser;

// ... (Các hàm getEvents, getEventDetail GIỮ NGUYÊN)

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('bookingRef', 'customerName contactInfo status').sort({ date: 1 });
    res.json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('bookingRef').populate('participants.user', 'username fullName email');
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    const songs = await Song.find({ event: req.params.id });
    res.json({ event, songs });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. FIX: Thêm bài hát vào Event (Hỗ trợ cả 'title' và 'name')
exports.addSongToEvent = async (req, res) => {
  try {
    const { title, name, note } = req.body;
    
    // Logic "hybrid": Dù model cũ dùng name hay model mới dùng title, ta đều lưu cả 2
    const songName = title || name; 

    // Fix path cho Windows và check null an toàn
    const sheetUrl = req.files && req.files['sheet'] ? req.files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatUrl = req.files && req.files['beat'] ? req.files['beat'][0].path.replace(/\\/g, "/") : null;
    
    // Lưu cả title và name để tương thích mọi phiên bản Model
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
  } catch (error) { 
      console.error("Lỗi add song:", error);
      res.status(400).json({ message: "Lỗi thêm bài hát: " + error.message }); 
  }
};

// ... (Các hàm updateEvent, deleteSong, joinEvent, togglePerformer, deleteEvent GIỮ NGUYÊN)

exports.updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteSong = async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Đã xóa bài hát' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Show không tồn tại' });
    const alreadyJoined = event.participants.some(p => p.user && p.user.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ message: 'Bạn đã đăng ký rồi!' });
    event.participants.push({ user: req.user._id, joinedAt: new Date(), isSelected: false });
    await event.save();
    if (notifyAdmin) { await notifyAdmin({ message: `👤 ${req.user.username} vừa đăng ký show: ${event.title}`, link: `/events/${event._id}`, type: 'info' }); }
    res.json(event);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

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
         try { await notifyUser({ recipientId: userId, message: `🎉 Bạn đã được chọn đi diễn show: ${event.title}!`, link: `/events/${event._id}`, type: 'success' }); } catch (e) {}
      }
      return res.json(event);
    } else { return res.status(404).json({ message: "Thành viên này chưa đăng ký tham gia show" }); }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy Event' });
    if (event.bookingRef) await Booking.findByIdAndDelete(event.bookingRef);
    await Song.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa sự kiện' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 9. FIX: Thêm bài hát từ Kho Nhạc (Map title/name)
exports.addSongFromLibrary = async (req, res) => {
  try {
    const { librarySongId } = req.body;
    const eventId = req.params.id;

    const libSong = await LibrarySong.findById(librarySongId);
    if (!libSong) return res.status(404).json({ message: "Bài hát không tồn tại trong kho" });

    // Lấy title hoặc name từ kho
    const songName = libSong.title || libSong.name;

    const newSong = new Song({
      title: songName,
      name: songName,
      note: libSong.note,
      sheetUrl: libSong.sheetUrl,
      beatUrl: libSong.beatUrl,
      event: eventId
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { res.status(500).json({ message: error.message }); }
};