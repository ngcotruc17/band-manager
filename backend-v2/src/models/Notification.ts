import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: string;
  message: string;
  link: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: String, default: 'Hệ thống' },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', notificationSchema);
