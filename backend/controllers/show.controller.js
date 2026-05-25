const Show = require('../models/Show');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');
const { sendNewShowEmail, sendApproveEmail } = require('../utils/sendEmail'); 
const { notifyAllMembers, notifyAdmins, notifyUser } = require('./notification.controller'); // 👈 Thêm dòng này

exports.getShows = async (req, res) => {
  try { res.json(await Show.find().sort({ date: 1 })); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createShow = async (req, res) => {
  try {
    const newShow = new Show({ ...req.body, createdBy: req.user.id });
    await newShow.save();
    res.status(201).json(newShow);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteShow = async (req, res) => {
  try { await Show.findByIdAndDelete(req.params.id); res.json({ message: "Đã xóa show" }); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateShowStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const oldShow = await Show.findById(req.params.id).populate('participants.user');
    if (!oldShow) {
      return res.status(404).json({ message: "Không tìm thấy Show" });
    }

    // Luôn xóa các giao dịch tài chính cũ liên quan đến show này để tránh bị lặp
    await Transaction.deleteMany({ showId: req.params.id });

    let salarySplit = {
      totalPrice: 0,
      bandFundPercent: 10,
      bandFundAmount: 0,
      memberAmount: 0,
      members: []
    };

    if (status === 'completed') {
      const approvedParticipants = oldShow.participants.filter(p => p.status === 'approved');
      const N = approvedParticipants.length;
      const totalPrice = oldShow.price || 0;
      const bandFundPercent = 10;
      const bandFundAmount = Math.round(totalPrice * (bandFundPercent / 100));
      const remainingAmount = totalPrice - bandFundAmount;
      const memberAmount = N > 0 ? Math.round(remainingAmount / N) : 0;

      salarySplit = {
        totalPrice,
        bandFundPercent,
        bandFundAmount,
        memberAmount,
        members: approvedParticipants.map(p => ({
          user: p.user._id,
          amount: memberAmount
        }))
      };

      // Tạo các bản ghi giao dịch
      if (totalPrice > 0) {
        // 1. Giao dịch thu nhập (Tổng tiền show)
        const incomeTrans = new Transaction({
          title: `Doanh thu Show: ${oldShow.title}`,
          amount: totalPrice,
          type: 'income',
          category: 'show',
          showId: oldShow._id,
          performedBy: req.user.id
        });
        await incomeTrans.save();

        // 2. Chi cát-xê cho từng thành viên tham gia
        for (const p of approvedParticipants) {
          if (memberAmount > 0 && p.user) {
            const expenseTrans = new Transaction({
              title: `Cát-xê ${p.user.fullName || 'Thành viên'} - Show: ${oldShow.title}`,
              amount: -memberAmount, // Chi ra là âm
              type: 'expense',
              category: 'show',
              showId: oldShow._id,
              performedBy: p.user._id
            });
            await expenseTrans.save();
          }
        }
      }
    }

    // Cập nhật show với status mới và thông tin salarySplit
    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id, 
      { status, salarySplit }, 
      { new: true }
    ).populate('participants.user', 'fullName email');

    // 👇 GỬI THÔNG BÁO CHO CẢ BAND KHI ADMIN DUYỆT SHOW
    if (oldShow.status === 'pending' && status === 'confirmed') {
        sendNewShowEmail(updatedShow).catch(err => console.error(err));
        await notifyAllMembers({ 
          message: `🎸 SHOW MỚI: "${updatedShow.title}" đã mở đăng ký. Tham gia ngay!`, 
          link: `/bookings/${updatedShow._id}` 
        });
    }

    // 👇 GỬI THÔNG BÁO KHI SHOW HOÀN THÀNH VÀ CHIA CÁT-XÊ
    if (status === 'completed' && updatedShow.price > 0) {
        await notifyAllMembers({
          message: `🎉 SHOW HOÀN THÀNH: "${updatedShow.title}" đã được thanh toán & chia cát-xê!`,
          link: `/bookings/${updatedShow._id}`
        });
    }

    res.json(updatedShow);
  } catch (error) { 
    console.error("Lỗi trong updateShowStatus:", error);
    res.status(500).json({ message: error.message }); 
  }
};

exports.getShowById = async (req, res) => {
  try { res.json(await Show.findById(req.params.id).populate('participants.user', 'fullName email')); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.joinShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    const isJoined = show.participants.find(p => p.user.toString() === req.user.id);
    if (isJoined) {
      show.participants = show.participants.filter(p => p.user.toString() !== req.user.id);
      await show.save();
      return res.json({ message: "Đã hủy đăng ký" });
    } else {
      show.participants.push({ user: req.user.id, status: 'pending' });
      await show.save();
      // 👇 GỬI THÔNG BÁO CHO ADMIN
      await notifyAdmins({ 
        message: `🙋 ${req.user.fullName} vừa đăng ký tham gia show: ${show.title}`, 
        link: `/bookings/${show._id}` 
      });
      return res.json({ message: "Đã đăng ký tham gia, vui lòng chờ Admin duyệt!" });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.approveParticipant = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    const participant = show.participants.find(p => p.user.toString() === req.body.userId);
    if (participant) {
      participant.status = 'approved'; 
      await show.save();
      const user = await User.findById(req.body.userId);
      if (user && user.email) sendApproveEmail(user.email, show.title, user.fullName).catch(err => console.error(err));
      
      // 👇 GỬI THÔNG BÁO CHO THÀNH VIÊN ĐƯỢC DUYỆT
      await notifyUser(user._id, { 
        message: `✅ Bạn đã được duyệt vào đội hình chính thức cho show: ${show.title}!`, 
        link: `/bookings/${show._id}`,
        type: 'success'
      });

      res.json({ message: "Đã duyệt thành viên" });
    } else { res.status(404).json({ message: "Không tìm thấy" }); }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.removeParticipant = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.participants = show.participants.filter(p => p.user.toString() !== req.body.userId);
    await show.save();
    res.json({ message: "Đã xóa khỏi show" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleRegistration = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.isRegistrationClosed = !show.isRegistrationClosed;
    await show.save();
    res.json({ message: "Đã thay đổi trạng thái đăng ký" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateShow = async (req, res) => {
  try { res.json(await Show.findByIdAndUpdate(req.params.id, req.body, { new: true })); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

exports.addSongToSetlist = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.setlist.push({ ...req.body, addedBy: req.user.id });
    await show.save();
    res.json(show.setlist);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.removeSongFromSetlist = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.setlist = show.setlist.filter(item => item._id.toString() !== req.params.songId);
    await show.save();
    res.json(show.setlist);
  } catch (error) { res.status(500).json({ message: error.message }); }
};