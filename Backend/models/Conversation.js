const { ConversationDoc, nextSequence, toPlain } = require('./mongoCollections');
const Candidate = require('./Candidate');

class Conversation {
  static async create(companyId, candidateId) {
    const id = await nextSequence('Conversations.id');
    const created = await ConversationDoc.create({
      ConversationID: id,
      CompanyID: Number(companyId),
      CandidateID: Number(candidateId),
      LastMessageAt: new Date()
    });
    return toPlain(created);
  }

  static async findById(id) {
    const doc = await ConversationDoc.findOne({ ConversationID: Number(id) }).lean();
    return toPlain(doc);
  }

  static async findBetween(companyId, candidateId) {
    const doc = await ConversationDoc.findOne({ CompanyID: Number(companyId), CandidateID: Number(candidateId) }).lean();
    return toPlain(doc);
  }

  static async findForCompany(companyId) {
    const docs = await ConversationDoc.find({ CompanyID: Number(companyId) }).sort({ LastMessageAt: -1 }).lean();
    if (!Array.isArray(docs)) return [];
    
    // Fetch candidate names for each conversation
    const result = await Promise.all(
      docs.map(async (doc) => {
        const candidate = await Candidate.findById(doc.CandidateID);
        return {
          ...toPlain(doc),
          candidateName: candidate?.FullName || `Candidate ${doc.CandidateID}`
        };
      })
    );
    return result;
  }

  static async findForCandidate(candidateId) {
    const docs = await ConversationDoc.find({ CandidateID: Number(candidateId) }).sort({ LastMessageAt: -1 }).lean();
    if (!Array.isArray(docs)) return [];
    
    // Fetch company names for each conversation
    const Company = require('./Company');
    const result = await Promise.all(
      docs.map(async (doc) => {
        const company = await Company.findById(doc.CompanyID);
        return {
          ...toPlain(doc),
          companyName: company?.CompanyName || `Company ${doc.CompanyID}`
        };
      })
    );
    return result;
  }

  static async touch(conversationId) {
    await ConversationDoc.findOneAndUpdate({ ConversationID: Number(conversationId) }, { $set: { LastMessageAt: new Date() } });
  }
}

module.exports = Conversation;
