import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/band-booking');
    console.log(`🔌 Đã kết nối MongoDB Atlas: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ Lỗi kết nối cơ sở dữ liệu: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
