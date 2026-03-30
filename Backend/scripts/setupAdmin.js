const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { UserDoc, AdminDoc } = require('../models/mongoCollections');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobportal');
    
    // First, delete all existing admins to ensure only 1
    const existingAdmins = await AdminDoc.find().lean();
    console.log('Cleaning up... Found', existingAdmins.length, 'existing admin(s)');
    
    if (existingAdmins.length > 0) {
      const adminUserIds = existingAdmins.map(a => a.userId);
      await UserDoc.deleteMany({ id: { $in: adminUserIds } });
      await AdminDoc.deleteMany({});
      console.log('Deleted existing admins');
    }
    
    // Create the single admin account
    console.log('\nCreating single admin account...');
    const admin = await Admin.create({
      email: 'admin@jobportal.com',
      password: 'Admin@12345',
      username: 'admin'
    });
    
    console.log('\n=== ADMIN ACCOUNT CREATED ===');
    console.log('Email: admin@jobportal.com');
    console.log('Password: Admin@12345');
    console.log('Username: admin');
    console.log('Admin ID:', admin.AdminID);
    console.log('\n============================\n');
    
    // Verify
    const verify = await AdminDoc.findOne({ AdminID: admin.AdminID }).lean();
    const user = await UserDoc.findOne({ id: verify.userId }).lean();
    console.log('✓ Admin verified in database');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
