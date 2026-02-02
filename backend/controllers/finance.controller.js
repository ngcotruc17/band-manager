const Transaction = require('../models/Transaction');

// Lấy danh sách & Tổng quỹ
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 }).populate('performedBy', 'fullName');
    // Tính tổng: Thu (dương) + Chi (âm)
    const totalFund = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    res.json({ totalFund, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo giao dịch
exports.createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category } = req.body;
    // Nếu là chi tiêu (expense) thì lưu số âm, thu (income) lưu số dương
    const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    const newTrans = new Transaction({
      title,
      amount: finalAmount,
      type,
      category,
      performedBy: req.user._id
    });

    await newTrans.save();
    res.status(201).json(newTrans);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa giao dịch
exports.deleteTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};