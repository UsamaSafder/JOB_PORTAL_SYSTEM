const bcrypt = require('bcryptjs');
const { UserDoc, CompanyDoc, JobDoc, ApplicationDoc, nextSequence, toPlain } = require('./mongoCollections');

class Company {
  static async create(companyData) {
    const hashedPassword = await bcrypt.hash(companyData.password, 10);
    const userId = await nextSequence('Users.id');
    const companyId = await nextSequence('Companies.CompanyID');

    const user = await UserDoc.create({
      id: userId,
      email: companyData.email,
      password: hashedPassword,
      role: 'company',
      isActive: true,
      isVerified: false
    });

    const company = await CompanyDoc.create({
      CompanyID: companyId,
      userId,
      CompanyName: companyData.companyName,
      PhoneNumber: companyData.phone,
      Industry: companyData.industry,
      Location: companyData.location || null,
      Website: companyData.website || null,
      Description: companyData.description || null,
      Logo: companyData.logo || null,
      IsVerified: !!companyData.isVerified
    });

    return {
      userId: user.id,
      CompanyID: company.CompanyID,
      Email: user.email,
      CompanyName: company.CompanyName,
      PhoneNumber: company.PhoneNumber,
      Industry: company.Industry,
      Location: company.Location,
      Website: company.Website,
      IsVerified: company.IsVerified,
      IsActive: user.isActive,
      Logo: company.Logo
    };
  }

  static async findById(companyId) {
    const company = await CompanyDoc.findOne({ CompanyID: Number(companyId) }).lean();
    if (!company) return null;
    const user = await UserDoc.findOne({ id: company.userId }).lean();
    return {
      ...toPlain(company),
      email: user?.email,
      Email: user?.email,
      isActive: user?.isActive,
      IsActive: user?.isActive,
      UserIsVerified: user?.isVerified,
      IsVerified: company.IsVerified
    };
  }

  static async findByUserId(userId) {
    const company = await CompanyDoc.findOne({ userId: Number(userId) }).lean();
    if (!company) return null;
    const user = await UserDoc.findOne({ id: company.userId }).lean();
    return {
      ...toPlain(company),
      email: user?.email,
      Email: user?.email,
      isActive: user?.isActive,
      IsActive: user?.isActive,
      UserIsVerified: user?.isVerified,
      IsVerified: company.IsVerified
    };
  }

  static async findByEmail(email) {
    const user = await UserDoc.findOne({ email, role: 'company' }).lean();
    if (!user) return null;
    const company = await CompanyDoc.findOne({ userId: user.id }).lean();
    if (!company) return null;
    return {
      ...toPlain(company),
      id: user.id,
      email: user.email,
      Email: user.email,
      PasswordHash: user.password,
      IsActive: user.isActive,
      UserIsVerified: user.isVerified
    };
  }

  static async update(companyId, companyData) {
    const updatePayload = {};
    if (companyData.companyName) updatePayload.CompanyName = companyData.companyName;
    if (companyData.phone) updatePayload.PhoneNumber = companyData.phone;
    if (companyData.industry) updatePayload.Industry = companyData.industry;
    if (companyData.location !== undefined) updatePayload.Location = companyData.location || null;
    if (companyData.website !== undefined) updatePayload.Website = companyData.website || null;
    if (companyData.description !== undefined) updatePayload.Description = companyData.description || null;
    if (companyData.logo !== undefined) updatePayload.Logo = companyData.logo || null;
    if (companyData.isVerified !== undefined) updatePayload.IsVerified = !!companyData.isVerified;
    updatePayload.UpdatedAt = new Date();

    const updated = await CompanyDoc.findOneAndUpdate(
      { CompanyID: Number(companyId) },
      { $set: updatePayload },
      { new: true }
    ).lean();

    return toPlain(updated);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.industry) query.Industry = filters.industry;
    if (filters.isVerified !== undefined) query.IsVerified = !!filters.isVerified;

    const companies = await CompanyDoc.find(query).sort({ CreatedAt: -1 }).lean();
    const userIds = companies.map((c) => c.userId);
    const users = await UserDoc.find({ id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const output = [];
    for (const company of companies) {
      const user = userMap.get(company.userId);
      if (filters.isActive !== undefined && user?.isActive !== !!filters.isActive) {
        continue;
      }

      const jobsPosted = await JobDoc.countDocuments({ CompanyID: company.CompanyID, IsActive: true });
      output.push({
        ...toPlain(company),
        email: user?.email,
        isActive: user?.isActive,
        jobsPosted
      });
    }

    return output;
  }

  static async ensureForUser(userId, fallback = {}) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const user = await UserDoc.findOne({ id: Number(userId), role: 'company' }).lean();
    if (!user) return null;

    const company = await CompanyDoc.create({
      CompanyID: await nextSequence('Companies.CompanyID'),
      userId: user.id,
      CompanyName: fallback.companyName || 'Company',
      PhoneNumber: fallback.phone || '00000000000',
      Industry: fallback.industry || 'Other',
      Location: fallback.location || null,
      Website: fallback.website || null,
      Description: fallback.description || null,
      IsVerified: false
    });

    return {
      ...toPlain(company),
      email: user.email,
      isActive: user.isActive,
      UserIsVerified: user.isVerified
    };
  }

  static async getCompanyStats(companyId) {
    const cid = Number(companyId);
    const jobs = await JobDoc.find({ CompanyID: cid }, { JobID: 1, IsActive: 1 }).lean();
    const jobIds = jobs.map((j) => j.JobID);
    const [totalApplications, pendingApplications] = await Promise.all([
      jobIds.length ? ApplicationDoc.countDocuments({ JobID: { $in: jobIds } }) : 0,
      jobIds.length ? ApplicationDoc.countDocuments({ JobID: { $in: jobIds }, Status: 'Pending' }) : 0
    ]);

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => !!j.IsActive).length,
      totalApplications,
      pendingApplications
    };
  }
}

module.exports = Company;