import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import { UserRole } from '../types';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const seedAdmin = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL not set in .env');
    }

    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'chantal@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`⚠️  Admin user with email ${adminEmail} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    });

    await adminUser.save();
    console.log(`✅ Admin user created successfully`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${UserRole.ADMIN}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Run seeder
seedAdmin();
