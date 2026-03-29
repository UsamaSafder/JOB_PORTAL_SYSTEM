const bcrypt = require('bcryptjs');
const { UserDoc, CompanyDoc, CandidateDoc, nextSequence, toPlain } = require('./mongoCollections');

class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const id = await nextSequence('Users.id');

    const created = await UserDoc.create({
      id,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      isActive: userData.isActive !== undefined ? !!userData.isActive : true,
      isVerified: userData.isVerified !== undefined ? !!userData.isVerified : false
    });

    return toPlain(created);
  }

  static async findById(id) {
    const doc = await UserDoc.findOne({ id: Number(id) }).lean();
    return toPlain(doc);
  }

  static async findByEmail(email) {
    const doc = await UserDoc.findOne({ email }).lean();
    return toPlain(doc);
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = !!filters.isActive;

    const docs = await UserDoc.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(toPlain);
  }

  static async update(id, userData) {
    const updatePayload = {};
    if (userData.email) updatePayload.email = userData.email;
    if (userData.password) updatePayload.password = await bcrypt.hash(userData.password, 10);
    if (userData.isActive !== undefined) updatePayload.isActive = !!userData.isActive;
    if (userData.isVerified !== undefined) updatePayload.isVerified = !!userData.isVerified;
    updatePayload.updatedAt = new Date();

    const doc = await UserDoc.findOneAndUpdate(
      { id: Number(id) },
      { $set: updatePayload },
      { new: true }
    ).lean();

    return toPlain(doc);
  }

  static async delete(id) {
    await UserDoc.deleteOne({ id: Number(id) });
    return true;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getUserWithProfile(id) {
    const numericId = Number(id);
    const user = await UserDoc.findOne({ id: numericId }).lean();
    if (!user) return null;

    const [company, candidate] = await Promise.all([
      CompanyDoc.findOne({ userId: numericId }).lean(),
      CandidateDoc.findOne({ userId: numericId }).lean()
    ]);

    return {
      ...toPlain(user),
      ...(company ? { companyName: company.CompanyName, logo: company.Logo, companyPhone: company.PhoneNumber } : {}),
      ...(candidate ? { candidatePhone: candidate.PhoneNumber, resumePath: candidate.ResumeLink } : {})
    };
  }
}

module.exports = User;