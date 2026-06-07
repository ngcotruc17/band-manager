import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance {
  user: mongoose.Types.ObjectId;
  status: 'present' | 'late' | 'absent' | 'pending';
  fine: number;
  checkInTime?: Date;
  method?: 'qr' | 'face' | 'manual';
}

export interface IRehearsal extends Document {
  date: Date;
  time: string;
  location: string;
  content?: string;
  attendance: IAttendance[];
  
  // Nâng cấp v2.0
  gpsLocation?: {
    latitude: number;
    longitude: number;
    radius: number; // Mét
  };
  
  qrToken?: {
    token: string;
    expiresAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const rehearsalSchema = new Schema<IRehearsal>({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  content: { type: String },
  
  attendance: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['present', 'late', 'absent', 'pending'], 
      default: 'pending' 
    },
    fine: { type: Number, default: 0 },
    checkInTime: { type: Date },
    method: { type: String, enum: ['qr', 'face', 'manual'], default: 'manual' }
  }],
  
  // Nâng cấp v2.0
  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    radius: { type: Number, default: 30 } // Bán kính 30m
  },
  
  qrToken: {
    token: { type: String },
    expiresAt: { type: Date }
  }
}, { timestamps: true });

export default mongoose.model<IRehearsal>('Rehearsal', rehearsalSchema);
