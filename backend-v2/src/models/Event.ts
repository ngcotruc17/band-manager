import mongoose, { Schema, Document } from 'mongoose';

export interface IEventParticipant {
  user: mongoose.Types.ObjectId;
  joinedAt: Date;
  isSelected: boolean;
}

export interface IEvent extends Document {
  title: string;
  date: Date;
  time: string;
  location: string;
  description?: string;
  logistics?: string;
  cast: number;
  bookingRef?: mongoose.Types.ObjectId;
  participants: IEventParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: "19:00" },
  location: { type: String, required: true },
  description: { type: String },
  logistics: { type: String }, 
  cast: { type: Number, default: 0 },
  bookingRef: { type: Schema.Types.ObjectId, ref: 'Booking' },
  participants: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    isSelected: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', eventSchema);
