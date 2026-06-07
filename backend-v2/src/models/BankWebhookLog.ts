import mongoose, { Schema, Document } from 'mongoose';

export interface IBankWebhookLog extends Document {
  transactionId: string;
  gateway: string;
  amount: number;
  content: string;
  senderAccount?: string;
  senderName?: string;
  processed: boolean;
  error?: string;
  referenceType?: 'show' | 'fine' | 'unknown';
  referenceId?: mongoose.Types.ObjectId;
  rawPayload: any;
  createdAt: Date;
}

const bankWebhookLogSchema = new Schema<IBankWebhookLog>({
  transactionId: { type: String, required: true, unique: true },
  gateway: { type: String, required: true },
  amount: { type: Number, required: true },
  content: { type: String, required: true },
  senderAccount: { type: String },
  senderName: { type: String },
  processed: { type: Boolean, default: false },
  error: { type: String },
  referenceType: { type: String, enum: ['show', 'fine', 'unknown'], default: 'unknown' },
  referenceId: { type: Schema.Types.ObjectId },
  rawPayload: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBankWebhookLog>('BankWebhookLog', bankWebhookLogSchema);
