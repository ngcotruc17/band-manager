import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string; // 'show', 'fine', 'rehearsal', 'equipment', 'other'
  date: Date;
  performedBy: mongoose.Types.ObjectId;
  showId?: mongoose.Types.ObjectId;
  
  // Nâng cấp v2.0
  webhookLogId?: mongoose.Types.ObjectId; // Liên kết tới logs webhook ngân hàng nếu có
  isAutoReconciled: boolean;
  paymentStatus: 'pending' | 'success' | 'failed';
  
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'show' },
  date: { type: Date, default: Date.now },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  showId: { type: Schema.Types.ObjectId, ref: 'Show' },
  
  // Nâng cấp v2.0
  webhookLogId: { type: Schema.Types.ObjectId, ref: 'BankWebhookLog' },
  isAutoReconciled: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
