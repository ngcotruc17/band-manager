import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
  title: string;
  name?: string;
  note?: string;
  sheetUrl?: string;
  beatUrl?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const songSchema = new Schema<ISong>({
  title: { type: String, required: true },
  name: { type: String },
  note: { type: String },
  sheetUrl: { type: String },
  beatUrl: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  event: { type: Schema.Types.ObjectId, ref: 'Event' }
}, { timestamps: true });

export default mongoose.model<ISong>('Song', songSchema);
