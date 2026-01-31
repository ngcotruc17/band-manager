const Event = require('../models/Event');
const Song = require('../models/Song');
const Booking = require('../models/Booking');
const { notifyAdmin, notifyUser } = require('./notification.controller'); // Import thông báo
const LibrarySong = require('../models/LibrarySong');

// 1. Get Events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('bookingRef', 'customerName contactInfo status')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Get Detail
exports.getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('bookingRef')
      .populate('participants.user', 'username fullName');
      
    if (!event) return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    const songs = await Song.find({ event: req.params.id });
    res.json({ event, songs });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Add Song
exports.addSongToEvent = async (req, res) => {
  try {
    const { name, note } = req.body;
    const sheetUrl = req.files && req.files['sheet'] ? req.files['sheet'][0].path.replace(/\\/g, "/") : null;
    const beatUrl = req.files && req.files['beat'] ? req.files['beat'][0].path.replace(/\\/g, "/") : null;
    const newSong = new Song({ name, note, event: req.params.id, sheetUrl, beatUrl });
    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 4. Update Event
exports.updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 5. Delete Song
exports.deleteSong = async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Đã xóa bài hát' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 6. Join Event (Có báo Admin)
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event không tồn tại' });

    const alreadyJoined = event.participants.some(p => p.user && p.user.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ message: 'Bạn đã đăng ký rồi!' });

    event.participants.push({ user: req.user._id, joinedAt: new Date(), isSelected: false });
    await event.save();

    // Báo Admin
    await notifyAdmin({
      message: `👤 ${req.user.username} vừa đăng ký show: ${event.title}`,
      link: `/events/${event._id}`,
      type: 'info'
    });

    res.json(event);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. Toggle Performer (Có báo User)
exports.togglePerformer = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.id);
    const participant = event.participants.find(p => p.user.toString() === userId);
    
    if (participant) {
      participant.isSelected = !participant.isSelected;
      await event.save();

      // Báo User
      if (participant.isSelected) {
         await notifyUser({
           recipientId: userId,
           message: `🎉 Bạn đã được chọn đi diễn show: ${event.title}!`,
           link: `/events/${event._id}`,
           type: 'success'
         });
      }
    }
    res.json(event);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 8. Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Không tìm thấy Event' });

    if (event.bookingRef) {
      await Booking.findByIdAndDelete(event.bookingRef);
    }
    await Song.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Đã xóa sự kiện và booking gốc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addSongFromLibrary = async (req, res) => {
  try {
    const { librarySongId } = req.body;
    const eventId = req.params.id;

    // 1. Tìm bài gốc trong kho
    const libSong = await LibrarySong.findById(librarySongId);
    if (!libSong) return res.status(404).json({ message: "Bài hát không tồn tại trong kho" });

    // 2. Tạo bản sao (Song) gắn vào Event
    const newSong = new Song({
      name: libSong.name,
      note: libSong.note,
      sheetUrl: libSong.sheetUrl, // Dùng lại file cũ, không cần upload lại
      beatUrl: libSong.beatUrl,
      event: eventId
    });

    await newSong.save();
    res.status(201).json(newSong);
  } catch (error) { res.status(500).json({ message: error.message }); }
};