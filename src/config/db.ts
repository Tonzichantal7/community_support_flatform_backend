    // src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL is not set. Add MONGO_URL to your .env file');
    }

    console.log('🔗 Raw MONGO_URL:', mongoUrl);

    // Prefer IPv4 loopback to avoid ::1 (IPv6) connection attempts on some Windows setups
    const normalizedUrl = mongoUrl.replace('localhost', '127.0.0.1');
    if (normalizedUrl !== mongoUrl) {
      console.log('🔁 Normalized MONGO_URL to IPv4:', normalizedUrl);
    }

    // attempt to connect and fail fast on error so the server doesn't continue
    await mongoose.connect(normalizedUrl, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('💾 MongoDB connected successfully');
    console.log(`🎯 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // rethrow so the caller (server start) can decide to stop startup
    throw error;
  }
};