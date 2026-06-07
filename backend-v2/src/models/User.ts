import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBadge {
  badgeId: string;
  name: string;
  icon: string;
  earnedAt: Date;
}

export interface IUser extends Document {
  fullName: string;
  email?: string;
  phone: string;
  username: string;
  password?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'banned';
  mustChangePassword: boolean;
  instrument: string;
  isApproved: boolean;
  createdAt: Date;
  
  // Nâng cấp v2.0
  walletBalance: number;
  totalFinePaid: number;
  attendanceRate: number;
  
  gpsHome?: {
    latitude: number;
    longitude: number;
  };
  
  faceDescriptor?: number[]; // Lưu 128 số thực của FaceID descriptor
  
  calendarSync: {
    googleEnabled: boolean;
    googleRefreshToken?: string;
    appleEnabled: boolean;
  };
  
  points: number;
  badges: IBadge[];
  
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, default: "" },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  status: { type: String, enum: ['pending', 'active', 'banned'], default: 'pending' },
  mustChangePassword: { type: Boolean, default: false },
  instrument: { type: String, default: 'Chưa phân công' },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  
  // Nâng cấp v2.0
  walletBalance: { type: Number, default: 0 },
  totalFinePaid: { type: Number, default: 0 },
  attendanceRate: { type: Number, default: 100 },
  
  gpsHome: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  faceDescriptor: { type: [Number] },
  
  calendarSync: {
    googleEnabled: { type: Boolean, default: false },
    googleRefreshToken: { type: String },
    appleEnabled: { type: Boolean, default: false }
  },
  
  points: { type: Number, default: 0 },
  badges: [{
    badgeId: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  }]
});

userSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password || '', salt);
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

export default mongoose.model<IUser>('User', userSchema);
