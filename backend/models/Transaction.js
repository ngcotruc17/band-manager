const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'show' },
  date: { type: Date, default: Date.now },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);