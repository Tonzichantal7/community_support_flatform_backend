    // src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.warn('⚠️  MONGO_URL not set. Using in-memory database.');
      return;
    }
    await mongoose.connect(mongoUrl);
    console.log('💾 MongoDB connected successfully');
    console.log(`🎯 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.warn('⚠️  Continuing without database connection...');
  }
};