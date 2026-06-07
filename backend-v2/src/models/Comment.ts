import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  event: mongoose.Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IComment>('Comment', commentSchema);
