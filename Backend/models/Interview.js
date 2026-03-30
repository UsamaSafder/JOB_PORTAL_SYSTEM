const { InterviewDoc, ApplicationDoc, JobDoc, CandidateDoc, CompanyDoc, UserDoc, nextSequence, toPlain } = require('./mongoCollections');

class Interview {
  static async create(interviewData) {
    try {
      const created = await InterviewDoc.create({
        InterviewID: await nextSequence('Interviews.InterviewID'),
        ApplicationID: Number(interviewData.applicationId),
        ScheduledDate: new Date(interviewData.interviewDate || interviewData.scheduledDate),
        Location: interviewData.location || null,
        Mode: interviewData.interviewType || interviewData.mode || 'Online',
        InterviewerName: interviewData.interviewerName || null,
        Notes: interviewData.notes || null,
        Status: 'scheduled'
      });

      return toPlain(created);
    } catch (err) {
      console.error('Interview.create error:', err);
      throw err;
    }
  }

  static async findByApplicationId(applicationId) {
    const doc = await InterviewDoc.findOne({ ApplicationID: Number(applicationId) })
      .sort({ ScheduledDate: -1, InterviewID: -1 })
      .lean();
    return toPlain(doc);
  }

  static async findById(interviewId) {
    const interview = await InterviewDoc.findOne({ InterviewID: Number(interviewId) }).lean();
    if (!interview) return null;
    const application = await ApplicationDoc.findOne({ ApplicationID: interview.ApplicationID }).lean();
    const [job, candidate] = await Promise.all([
      application ? JobDoc.findOne({ JobID: application.JobID }).lean() : null,
      application ? CandidateDoc.findOne({ CandidateID: application.CandidateID }).lean() : null
    ]);
    const [company, user] = await Promise.all([
      job ? CompanyDoc.findOne({ CompanyID: job.CompanyID }).lean() : null,
      candidate ? UserDoc.findOne({ id: candidate.userId }).lean() : null
    ]);

    return {
      ...toPlain(interview),
      JobID: application?.JobID,
      CandidateID: application?.CandidateID,
      JobTitle: job?.Title,
      CandidateName: candidate?.FullName,
      CandidatePhone: candidate?.PhoneNumber,
      CompanyName: company?.CompanyName,
      CompanyLogo: company?.Logo,
      logo: company?.Logo,
      CandidateEmail: user?.email
    };
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.status) query.Status = filters.status;

    let interviews = await InterviewDoc.find(query).sort({ ScheduledDate: 1 }).lean();
    const appIds = interviews.map((i) => i.ApplicationID);
    const applications = await ApplicationDoc.find({ ApplicationID: { $in: appIds } }).lean();
    const appMap = new Map(applications.map((a) => [a.ApplicationID, a]));

    if (filters.candidateId) {
      interviews = interviews.filter((i) => appMap.get(i.ApplicationID)?.CandidateID === Number(filters.candidateId));
    }

    const jobIds = [...new Set(applications.map((a) => a.JobID))];
    const jobs = await JobDoc.find({ JobID: { $in: jobIds } }).lean();
    const jobMap = new Map(jobs.map((j) => [j.JobID, j]));

    if (filters.companyId) {
      interviews = interviews.filter((i) => {
        const app = appMap.get(i.ApplicationID);
        const job = app ? jobMap.get(app.JobID) : null;
        return job?.CompanyID === Number(filters.companyId);
      });
    }

    const candidateIds = [...new Set(applications.map((a) => a.CandidateID))];
    const candidates = await CandidateDoc.find({ CandidateID: { $in: candidateIds } }).lean();
    const candidateMap = new Map(candidates.map((c) => [c.CandidateID, c]));

    const companies = await CompanyDoc.find({ CompanyID: { $in: jobs.map((j) => j.CompanyID) } }).lean();
    const companyMap = new Map(companies.map((c) => [c.CompanyID, c]));

    const users = await UserDoc.find({ id: { $in: candidates.map((c) => c.userId) } }).lean();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return interviews.map((interview) => {
      const app = appMap.get(interview.ApplicationID);
      const job = app ? jobMap.get(app.JobID) : null;
      const candidate = app ? candidateMap.get(app.CandidateID) : null;
      const company = job ? companyMap.get(job.CompanyID) : null;
      const user = candidate ? userMap.get(candidate.userId) : null;

      return {
        ...toPlain(interview),
        JobID: app?.JobID,
        CandidateID: app?.CandidateID,
        JobTitle: job?.Title,
        CandidateName: candidate?.FullName,
        CandidatePhone: candidate?.PhoneNumber,
        CompanyName: company?.CompanyName,
        CompanyLogo: company?.Logo,
        logo: company?.Logo,
        CompanyID: company?.CompanyID,
        CandidateEmail: user?.email
      };
    });
  }

  static async update(interviewId, interviewData) {
    const updatePayload = {};
    if (interviewData.scheduledDate || interviewData.interviewDate) {
      updatePayload.ScheduledDate = new Date(interviewData.scheduledDate || interviewData.interviewDate);
    }
    if (interviewData.location !== undefined) updatePayload.Location = interviewData.location;
    if (interviewData.mode || interviewData.interviewType) updatePayload.Mode = interviewData.mode || interviewData.interviewType;
    if (interviewData.interviewerName !== undefined) updatePayload.InterviewerName = interviewData.interviewerName;
    if (interviewData.notes !== undefined) updatePayload.Notes = interviewData.notes;
    if (interviewData.status) updatePayload.Status = interviewData.status;
    if (interviewData.rescheduleReason !== undefined) updatePayload.RescheduleReason = interviewData.rescheduleReason;
    updatePayload.UpdatedAt = new Date();

    const updated = await InterviewDoc.findOneAndUpdate(
      { InterviewID: Number(interviewId) },
      { $set: updatePayload },
      { new: true }
    ).lean();
    return toPlain(updated);
  }

  static async delete(interviewId) {
    await InterviewDoc.deleteOne({ InterviewID: Number(interviewId) });
    return true;
  }
}

module.exports = Interview;