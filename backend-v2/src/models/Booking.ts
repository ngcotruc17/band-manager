import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  customerName: string;
  contactInfo: string;
  date: Date;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  customerName: { type: String, required: true },
  contactInfo: { type: String, required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  note: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', bookingSchema);
