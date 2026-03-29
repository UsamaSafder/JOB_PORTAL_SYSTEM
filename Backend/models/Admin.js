const bcrypt = require('bcryptjs');
const { UserDoc, AdminDoc, nextSequence, toPlain } = require('./mongoCollections');

class Admin {
  static async create(adminData) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const userId = await nextSequence('Users.id');
    const adminId = await nextSequence('Admins.AdminID');

    const user = await UserDoc.create({
      id: userId,
      email: adminData.email || `${adminData.username}@admin.com`,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true
    });

    const admin = await AdminDoc.create({
      AdminID: adminId,
      userId,
      Username: adminData.username,
      PhoneNumber: adminData.phone || null,
      Department: adminData.department || null
    });

    return {
      AdminID: admin.AdminID,
      Username: admin.Username,
      Email: user.email
    };
  }

  static async findById(adminId) {
    const admin = await AdminDoc.findOne({ AdminID: Number(adminId) }).lean();
    if (!admin) return null;
    const user = await UserDoc.findOne({ id: admin.userId }).lean();
    return {
      ...toPlain(admin),
      email: user?.email,
      isActive: user?.isActive,
      PasswordHash: user?.password
    };
  }

  static async findByUsername(username) {
    const admin = await AdminDoc.findOne({ Username: username }).lean();
    if (!admin) return null;
    const user = await UserDoc.findOne({ id: admin.userId }).lean();
    return {
      ...toPlain(admin),
      email: user?.email,
      Email: user?.email,
      PasswordHash: user?.password,
      isActive: user?.isActive,
      IsActive: user?.isActive
    };
  }

  static async findByEmail(email) {
    const user = await UserDoc.findOne({ email, role: 'admin' }).lean();
    if (!user) return null;
    const admin = await AdminDoc.findOne({ userId: user.id }).lean();
    if (!admin) return null;
    return {
      ...toPlain(admin),
      userId: user.id,
      email: user.email,
      Email: user.email,
      PasswordHash: user.password,
      isActive: user.isActive,
      IsActive: user.isActive
    };
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Admin;