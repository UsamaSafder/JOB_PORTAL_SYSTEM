const { ApplicationDoc, JobDoc, CandidateDoc, CompanyDoc, UserDoc, InterviewDoc, nextSequence, toPlain } = require('./mongoCollections');

class Application {
  static async create(applicationData) {
    const created = await ApplicationDoc.create({
      ApplicationID: await nextSequence('Applications.ApplicationID'),
      JobID: Number(applicationData.jobId),
      CandidateID: Number(applicationData.candidateId),
      CoverLetter: applicationData.coverLetter || null,
      ResumePath: applicationData.resumePath || null,
      AppliedAt: new Date(),
      Status: 'Pending'
    });

    return toPlain(created);
  }

  static async findById(applicationId) {
    const app = await ApplicationDoc.findOne({ ApplicationID: Number(applicationId) }).lean();
    if (!app) return null;

    const [job, candidate] = await Promise.all([
      JobDoc.findOne({ JobID: app.JobID }).lean(),
      CandidateDoc.findOne({ CandidateID: app.CandidateID }).lean()
    ]);
    const [company, user] = await Promise.all([
      job ? CompanyDoc.findOne({ CompanyID: job.CompanyID }).lean() : null,
      candidate ? UserDoc.findOne({ id: candidate.userId }).lean() : null
    ]);

    return {
      ...toPlain(app),
      jobTitle: job?.Title,
      jobLocation: job?.Location,
      salaryRange: job?.SalaryRange,
      CompanyID: job?.CompanyID,
      candidateName: candidate?.FullName,
      candidatePhone: candidate?.PhoneNumber,
      candidateSkills: candidate?.Skills,
      experienceYears: candidate?.ExperienceYears,
      resumePath: app?.ResumePath || null,
      submittedResumePath: app?.ResumePath || null,
      candidateResumeLink: candidate?.ResumeLink || null,
      resumeLink: app?.ResumePath || candidate?.ResumeLink || null,
      candidateProfilePicture: candidate?.ProfilePicture,
      profilePicture: candidate?.ProfilePicture,
      CompanyName: company?.CompanyName,
      CompanyLogo: company?.Logo,
      companyId: company?.CompanyID,
      candidateEmail: user?.email
    };
  }

  static async findAll(filters = {}) {
    try {
      console.log('Application.findAll executing query with filters:', filters);

      const query = {};
      if (filters.candidateId) query.CandidateID = Number(filters.candidateId);
      if (filters.jobId) query.JobID = Number(filters.jobId);
      if (filters.status) query.Status = filters.status;

      let apps = await ApplicationDoc.find(query).sort({ AppliedAt: -1 }).lean();

      const jobs = await JobDoc.find({ JobID: { $in: apps.map((a) => a.JobID) } }).lean();
      const jobMap = new Map(jobs.map((j) => [j.JobID, j]));

      if (filters.companyId) {
        const companyId = Number(filters.companyId);
        apps = apps.filter((a) => jobMap.get(a.JobID)?.CompanyID === companyId);
      }

      const candidateIds = [...new Set(apps.map((a) => a.CandidateID))];
      const candidates = await CandidateDoc.find({ CandidateID: { $in: candidateIds } }).lean();
      const candidateMap = new Map(candidates.map((c) => [c.CandidateID, c]));

      const companyIds = [...new Set(jobs.map((j) => j.CompanyID))];
      const companies = await CompanyDoc.find({ CompanyID: { $in: companyIds } }).lean();
      const companyMap = new Map(companies.map((c) => [c.CompanyID, c]));

      const users = await UserDoc.find({ id: { $in: candidates.map((c) => c.userId) } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const appIds = apps.map((a) => a.ApplicationID);
      const interviews = await InterviewDoc.find({ ApplicationID: { $in: appIds } }).sort({ ScheduledDate: -1, InterviewID: -1 }).lean();
      const latestInterviewMap = new Map();
      for (const interview of interviews) {
        if (!latestInterviewMap.has(interview.ApplicationID)) {
          latestInterviewMap.set(interview.ApplicationID, interview);
        }
      }

      const output = apps.map((app) => {
        const job = jobMap.get(app.JobID);
        const candidate = candidateMap.get(app.CandidateID);
        const company = companyMap.get(job?.CompanyID);
        const user = userMap.get(candidate?.userId);
        const latestInterview = latestInterviewMap.get(app.ApplicationID);

        return {
          ...toPlain(app),
          jobTitle: job?.Title,
          jobLocation: job?.Location,
          salaryRange: job?.SalaryRange,
          companyId: job?.CompanyID,
          CompanyID: job?.CompanyID,
          candidateName: candidate?.FullName,
          candidatePhone: candidate?.PhoneNumber,
          candidateSkills: candidate?.Skills,
          experienceYears: candidate?.ExperienceYears,
          resumePath: app?.ResumePath || null,
          submittedResumePath: app?.ResumePath || null,
          candidateResumeLink: candidate?.ResumeLink || null,
          resumeLink: app?.ResumePath || candidate?.ResumeLink || null,
          candidateProfilePicture: candidate?.ProfilePicture,
          profilePicture: candidate?.ProfilePicture,
          CompanyName: company?.CompanyName,
          CompanyLogo: company?.Logo,
          candidateEmail: user?.email,
          interviewScheduledDate: latestInterview?.ScheduledDate || null,
          interviewLocation: latestInterview?.Location || null,
          interviewMode: latestInterview?.Mode || null,
          interviewStatus: latestInterview?.Status || null
        };
      });

      console.log('Application.findAll result count:', output.length);
      return output;
    } catch (err) {
      console.error('Application.findAll error:', err.message);
      console.error('Application.findAll stack:', err.stack);
      throw err;
    }
  }

  static async update(applicationId, applicationData) {
    const updatePayload = { UpdatedAt: new Date() };
    if (applicationData.status) updatePayload.Status = applicationData.status;
    if (applicationData.coverLetter !== undefined) updatePayload.CoverLetter = applicationData.coverLetter;
    if (applicationData.notes !== undefined) updatePayload.Notes = applicationData.notes;

    const updated = await ApplicationDoc.findOneAndUpdate(
      { ApplicationID: Number(applicationId) },
      { $set: updatePayload },
      { new: true }
    ).lean();

    return toPlain(updated);
  }

  static async delete(applicationId) {
    await ApplicationDoc.deleteOne({ ApplicationID: Number(applicationId) });
    return true;
  }

  static async checkDuplicate(jobId, candidateId) {
    const app = await ApplicationDoc.findOne({ JobID: Number(jobId), CandidateID: Number(candidateId) }, { ApplicationID: 1 }).lean();
    return app ? { id: app.ApplicationID } : null;
  }
}

module.exports = Application;