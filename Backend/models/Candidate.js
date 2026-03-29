const bcrypt = require('bcryptjs');
const { UserDoc, CandidateDoc, ApplicationDoc, InterviewDoc, nextSequence, toPlain } = require('./mongoCollections');

class Candidate {
  static async create(candidateData) {
    const hashedPassword = await bcrypt.hash(candidateData.password, 10);
    const userId = await nextSequence('Users.id');
    const candidateId = await nextSequence('Candidates.CandidateID');

    const user = await UserDoc.create({
      id: userId,
      email: candidateData.email,
      password: hashedPassword,
      role: 'candidate',
      isActive: true,
      isVerified: false
    });

    const candidate = await CandidateDoc.create({
      CandidateID: candidateId,
      userId,
      FullName: candidateData.fullName,
      PhoneNumber: candidateData.phone,
      Skills: candidateData.skills || '',
      ExperienceYears: Number(candidateData.experienceYears) || 0,
      ResumeLink: candidateData.resumeLink || null,
      Location: candidateData.location || null,
      Education: candidateData.education || null,
      Bio: candidateData.bio || null,
      LinkedinUrl: candidateData.linkedinUrl || null,
      PortfolioUrl: candidateData.portfolioUrl || null,
      ProfilePicture: candidateData.profilePicture || null
    });

    return {
      userId: user.id,
      CandidateID: candidate.CandidateID,
      Email: user.email,
      FullName: candidate.FullName,
      PhoneNumber: candidate.PhoneNumber,
      Skills: candidate.Skills,
      ExperienceYears: candidate.ExperienceYears,
      ResumeLink: candidate.ResumeLink,
      ProfilePicture: candidate.ProfilePicture,
      IsActive: user.isActive
    };
  }

  static async findById(candidateId) {
    const candidate = await CandidateDoc.findOne({ CandidateID: Number(candidateId) }).lean();
    if (!candidate) return null;
    const user = await UserDoc.findOne({ id: candidate.userId }).lean();
    return {
      ...toPlain(candidate),
      email: user?.email,
      Email: user?.email,
      isActive: user?.isActive,
      IsActive: user?.isActive,
      isVerified: user?.isVerified,
      IsVerified: user?.isVerified,
      PasswordHash: user?.password,
      id: user?.id
    };
  }

  static async findByUserId(userId) {
    const candidate = await CandidateDoc.findOne({ userId: Number(userId) }).lean();
    if (!candidate) return null;
    const user = await UserDoc.findOne({ id: candidate.userId }).lean();
    return {
      ...toPlain(candidate),
      email: user?.email,
      Email: user?.email,
      isActive: user?.isActive,
      IsActive: user?.isActive,
      isVerified: user?.isVerified,
      IsVerified: user?.isVerified,
      PasswordHash: user?.password,
      id: user?.id
    };
  }

  static async findByEmail(email) {
    const user = await UserDoc.findOne({ email, role: 'candidate' }).lean();
    if (!user) return null;
    const candidate = await CandidateDoc.findOne({ userId: user.id }).lean();
    if (!candidate) return null;
    return {
      ...toPlain(candidate),
      id: user.id,
      email: user.email,
      Email: user.email,
      PasswordHash: user.password,
      IsActive: user.isActive,
      isActive: user.isActive
    };
  }

  static async update(candidateId, candidateData) {
    try {
      const updatePayload = {};

      if (candidateData.fullName !== undefined && candidateData.fullName !== null) {
        const fullName = String(candidateData.fullName).trim();
        if (fullName) updatePayload.FullName = fullName;
      }

      if (candidateData.phone !== undefined && candidateData.phone !== null) {
        const phone = String(candidateData.phone).trim();
        if (phone) updatePayload.PhoneNumber = phone;
      }

      if (candidateData.skills !== undefined) {
        updatePayload.Skills = candidateData.skills === null ? '' : String(candidateData.skills).trim();
      }

      if (candidateData.experienceYears !== undefined && candidateData.experienceYears !== null) {
        const expNum = parseInt(String(candidateData.experienceYears), 10);
        if (!isNaN(expNum) && expNum >= 0 && expNum <= 100) {
          updatePayload.ExperienceYears = expNum;
        }
      }

      if (candidateData.resumeLink !== undefined) {
        updatePayload.ResumeLink = candidateData.resumeLink ? String(candidateData.resumeLink).trim() : null;
      }

      if (candidateData.profilePicture !== undefined) {
        updatePayload.ProfilePicture = candidateData.profilePicture ? String(candidateData.profilePicture).trim() : null;
      }

      if (candidateData.location !== undefined) {
        const value = candidateData.location === null ? null : String(candidateData.location).trim();
        updatePayload.Location = value || null;
      }

      if (candidateData.education !== undefined) {
        const value = candidateData.education === null ? null : String(candidateData.education).trim();
        updatePayload.Education = value || null;
      }

      if (candidateData.bio !== undefined) {
        const value = candidateData.bio === null ? null : String(candidateData.bio).trim();
        updatePayload.Bio = value || null;
      }

      if (candidateData.linkedinUrl !== undefined) {
        const value = candidateData.linkedinUrl === null ? null : String(candidateData.linkedinUrl).trim();
        updatePayload.LinkedinUrl = value || null;
      }

      if (candidateData.portfolioUrl !== undefined) {
        const value = candidateData.portfolioUrl === null ? null : String(candidateData.portfolioUrl).trim();
        updatePayload.PortfolioUrl = value || null;
      }

      const updated = await CandidateDoc.findOneAndUpdate(
        { CandidateID: Number(candidateId) },
        { $set: { ...updatePayload, UpdatedAt: new Date() } },
        { new: true }
      ).lean();

      if (!updated) {
        throw new Error(`Candidate with ID ${candidateId} not found`);
      }

      return toPlain(updated);
    } catch (err) {
      console.error('');
      console.error('=== CANDIDATE.UPDATE ERROR ===');
      console.error('Error name:', err?.name);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Error number:', err?.number);
      console.error('Error state:', err?.state);
      console.error('Error class:', err?.class);
      console.error('Error procName:', err?.procName);
      console.error('Error severity:', err?.severity);
      console.error('Full error:', JSON.stringify(err, null, 2));
      console.error('Stack:', err?.stack);
      console.error('==============================');
      console.error('');
      throw err;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.skills) query.Skills = { $regex: String(filters.skills), $options: 'i' };
    if (filters.experienceYears !== undefined) query.ExperienceYears = { $gte: Number(filters.experienceYears) };

    const candidates = await CandidateDoc.find(query).sort({ CreatedAt: -1 }).lean();
    const users = await UserDoc.find({ id: { $in: candidates.map((c) => c.userId) } }).lean();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return candidates
      .filter((c) => {
        if (filters.isActive === undefined) return true;
        return userMap.get(c.userId)?.isActive === !!filters.isActive;
      })
      .map((c) => {
        const user = userMap.get(c.userId);
        return {
          ...toPlain(c),
          email: user?.email,
          isActive: user?.isActive
        };
      });
  }

  static async getCandidateStats(candidateId) {
    const cid = Number(candidateId);
    const [
      totalApplications,
      pendingApplications,
      rejectedApplications,
      applicationsWithInterviews
    ] = await Promise.all([
      ApplicationDoc.countDocuments({ CandidateID: cid }),
      ApplicationDoc.countDocuments({ CandidateID: cid, Status: 'Pending' }),
      ApplicationDoc.countDocuments({ CandidateID: cid, Status: 'Rejected' }),
      ApplicationDoc.find({ CandidateID: cid }, { ApplicationID: 1, _id: 0 }).lean()
    ]);

    const interviewIds = applicationsWithInterviews.map((a) => a.ApplicationID);
    const interviewsScheduled = interviewIds.length
      ? await InterviewDoc.countDocuments({ ApplicationID: { $in: interviewIds }, Status: { $regex: '^scheduled$', $options: 'i' } })
      : 0;

    return {
      TotalApplications: totalApplications,
      PendingApplications: pendingApplications,
      InterviewsScheduled: interviewsScheduled,
      RejectedApplications: rejectedApplications
    };
  }
}

module.exports = Candidate;