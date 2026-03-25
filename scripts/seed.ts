import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://medical:8FQRQ9WSAytxrsHo@cluster0.lt8krlq.mongodb.net/database';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    await mongoose.connection.dropDatabase();
    console.log('🗑️  Cleared existing data\n');

    const adminPassword = await bcrypt.hash('12345678', 12);
    const admin = {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
      employeeId: 'ADMIN001',
      department: 'Administration',
      phone: '(555) 000-0000',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mongoose.connection.collection('users').insertOne(admin);
    console.log('✅ Created admin user: admin@gmail.com / 12345678');

    console.log('\n🎉 Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
