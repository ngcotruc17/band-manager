import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  user: mongoose.Types.ObjectId;
  role: string;
  status: 'pending' | 'approved';
  joinedAt: Date;
}

export interface ISongItem {
  title: string;
  link?: string;
  note?: string;
  addedBy?: mongoose.Types.ObjectId;
}

export interface IShow extends Document {
  title: string;
  customerName: string;
  phone?: string;
  date: Date;
  time: string;
  location: string;
  price: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isRegistrationClosed: boolean;
  createdBy: mongoose.Types.ObjectId;
  participants: IParticipant[];
  setlist: ISongItem[];
  
  // Thông tin sự kiện bổ sung
  eventType?: string;
  memberCount?: number;
  dresscode?: string;
  extraFee?: number;
  
  // Nâng cấp v2.0
  lockRegistrationHours: number; // Mặc định 24
  
  payoutMatrix: {
    bandFundPercent: number; // Mặc định 5%
    roleMultipliers: Array<{
      instrument: string; // "Vocal", "Guitar"...
      multiplier: number; // Hệ số
    }>;
    allowances: Array<{
      user: mongoose.Types.ObjectId;
      amount: number;
      reason: string;
    }>;
  };
  
  bankReconciliation: {
    isPaid: boolean;
    actualReceived: number;
    transactions: string[];
  };
  
  aiLineupSuggestions: Array<{
    user: mongoose.Types.ObjectId;
    score: number; // 0 - 100
    reasons: string[];
  }>;
  
  salarySplit: {
    totalPrice: number;
    bandFundPercent: number;
    bandFundAmount: number;
    memberAmount: number;
    members: Array<{
      user: mongoose.Types.ObjectId;
      amount: number;
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const showSchema = new Schema<IShow>({
  title: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  isRegistrationClosed: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Thông tin sự kiện bổ sung
  eventType: { type: String },
  memberCount: { type: Number },
  dresscode: { type: String },
  extraFee: { type: Number, default: 0 },
  
  participants: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'Thành viên' },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  setlist: [{
    title: { type: String, required: true },
    link: { type: String },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Nâng cấp v2.0
  lockRegistrationHours: { type: Number, default: 24 },
  
  payoutMatrix: {
    bandFundPercent: { type: Number, default: 5 },
    roleMultipliers: [{
      instrument: { type: String, required: true },
      multiplier: { type: Number, default: 1.0 }
    }],
    allowances: [{
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      amount: { type: Number, default: 0 },
      reason: { type: String, required: true }
    }]
  },
  
  bankReconciliation: {
    isPaid: { type: Boolean, default: false },
    actualReceived: { type: Number, default: 0 },
    transactions: { type: [String], default: [] }
  },
  
  aiLineupSuggestions: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    reasons: { type: [String], default: [] }
  }],
  
  salarySplit: {
    totalPrice: { type: Number, default: 0 },
    bandFundPercent: { type: Number, default: 5 },
    bandFundAmount: { type: Number, default: 0 },
    memberAmount: { type: Number, default: 0 },
    members: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, default: 0 }
    }]
  }
}, { timestamps: true });

export default mongoose.model<IShow>('Show', showSchema);
