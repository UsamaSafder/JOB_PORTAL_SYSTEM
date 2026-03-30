const { JobDoc, CompanyDoc, CandidateDoc, ApplicationDoc, nextSequence, toPlain } = require('./mongoCollections');

class Job {
  static async create(jobData) {
    const created = await JobDoc.create({
      JobID: await nextSequence('Jobs.JobID'),
      CompanyID: Number(jobData.companyId),
      Title: jobData.title,
      Description: jobData.description || null,
      Requirements: jobData.requirements || null,
      Location: jobData.location || null,
      SalaryRange: jobData.salary || jobData.salaryRange || null,
      EmploymentType: jobData.jobType || jobData.employmentType || null,
      Deadline: jobData.deadline ? new Date(jobData.deadline) : null,
      IsActive: true,
      PostedAt: new Date()
    });

    return toPlain(created);
  }

  static async findById(jobId) {
    const job = await JobDoc.findOne({ JobID: Number(jobId) }).lean();
    if (!job) return null;
    const [company, applicationsCount] = await Promise.all([
      CompanyDoc.findOne({ CompanyID: job.CompanyID }).lean(),
      ApplicationDoc.countDocuments({ JobID: job.JobID })
    ]);
    return {
      ...toPlain(job),
      CompanyName: company?.CompanyName,
      CompanyLocation: company?.Location,
      Website: company?.Website,
      Logo: company?.Logo,
      ApplicationsCount: applicationsCount || 0
    };
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.companyId) query.CompanyID = Number(filters.companyId);
    if (filters.status === 'active' || filters.isActive !== false) query.IsActive = true;
    if (filters.jobType || filters.employmentType) query.EmploymentType = filters.jobType || filters.employmentType;
    if (filters.location) query.Location = { $regex: String(filters.location), $options: 'i' };
    if (filters.search) {
      query.$or = [
        { Title: { $regex: String(filters.search), $options: 'i' } },
        { Description: { $regex: String(filters.search), $options: 'i' } }
      ];
    }
    if (filters.excludeExpired) {
      const now = new Date();
      query.$and = [{ $or: [{ Deadline: null }, { Deadline: { $gte: now } }] }];
    }

    const docs = await JobDoc.find(query)
      .sort({ CreatedAt: -1 })
      .skip(Number(filters.offset) || 0)
      .limit(Number(filters.limit) || 20)
      .lean();

    const companies = await CompanyDoc.find({ CompanyID: { $in: docs.map((j) => j.CompanyID) } }).lean();
    const companyMap = new Map(companies.map((c) => [c.CompanyID, c]));
    const jobIds = docs.map((j) => j.JobID);
    const applicationsByJob = await ApplicationDoc.aggregate([
      { $match: { JobID: { $in: jobIds } } },
      { $group: { _id: '$JobID', count: { $sum: 1 } } }
    ]);
    const applicationCountMap = new Map(applicationsByJob.map((item) => [Number(item._id), Number(item.count) || 0]));

    return docs.map((job) => {
      const company = companyMap.get(job.CompanyID);
      return {
        ...toPlain(job),
        PostedAt: job.CreatedAt || job.PostedAt,
        CompanyName: company?.CompanyName,
        CompanyLocation: company?.Location,
        Logo: company?.Logo,
        ApplicationsCount: applicationCountMap.get(job.JobID) || 0
      };
    });
  }

  static async update(jobId, jobData) {
    const updatePayload = {};
    if (jobData.title) updatePayload.Title = jobData.title;
    if (jobData.description !== undefined) updatePayload.Description = jobData.description || null;
    if (jobData.requirements !== undefined) updatePayload.Requirements = jobData.requirements || null;
    if (jobData.location !== undefined) updatePayload.Location = jobData.location || null;
    if (jobData.salary || jobData.salaryRange) updatePayload.SalaryRange = jobData.salary || jobData.salaryRange;
    if (jobData.jobType || jobData.employmentType) updatePayload.EmploymentType = jobData.jobType || jobData.employmentType;
    if (jobData.deadline !== undefined) updatePayload.Deadline = jobData.deadline ? new Date(jobData.deadline) : null;
    if (jobData.status !== undefined) updatePayload.IsActive = jobData.status === 'active';

    if (jobData.isActive !== undefined) {
      if (typeof jobData.isActive === 'string') {
        const normalizedValue = jobData.isActive.trim().toLowerCase();
        updatePayload.IsActive = normalizedValue === 'active' || normalizedValue === 'true' || normalizedValue === '1';
      } else {
        updatePayload.IsActive = !!jobData.isActive;
      }
    }

    updatePayload.UpdatedAt = new Date();

    const updated = await JobDoc.findOneAndUpdate(
      { JobID: Number(jobId) },
      { $set: updatePayload },
      { new: true }
    ).lean();
    return toPlain(updated);
  }

  static async delete(jobId) {
    await JobDoc.deleteOne({ JobID: Number(jobId) });
    return true;
  }

  static async getRecommendedJobs(candidateId, limit = 10) {
    const candidate = await CandidateDoc.findOne({ CandidateID: Number(candidateId) }).lean();
    const skills = String(candidate?.Skills || '').trim();

    const query = { IsActive: true };
    if (skills) {
      query.$or = [
        { Requirements: { $regex: skills, $options: 'i' } },
        { Description: { $regex: skills, $options: 'i' } }
      ];
    }

    const jobs = await JobDoc.find(query).sort({ CreatedAt: -1 }).limit(Number(limit) || 10).lean();
    const companies = await CompanyDoc.find({ CompanyID: { $in: jobs.map((j) => j.CompanyID) } }).lean();
    const companyMap = new Map(companies.map((c) => [c.CompanyID, c]));

    return jobs.map((job) => {
      const company = companyMap.get(job.CompanyID);
      return {
        ...toPlain(job),
        PostedAt: job.CreatedAt || job.PostedAt,
        CompanyName: company?.CompanyName,
        Logo: company?.Logo
      };
    });
  }
}

module.exports = Job;