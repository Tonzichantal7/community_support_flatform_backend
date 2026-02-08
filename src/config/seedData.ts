// Seed data for database initialization
import User from '../models/User';
import { UserRole } from '../types';

export const seedAll = async (): Promise<void> => {
  try {
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'chantal@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
      await adminUser.save();
      console.log(`✅ Admin user seeded: ${adminEmail}`);
    } else {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};
