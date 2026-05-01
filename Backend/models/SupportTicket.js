const { SupportTicketDoc, nextSequence, toPlain } = require('./mongoCollections');

class SupportTicket {
  static async create(companyId, subject, description) {
    const id = await nextSequence('SupportTickets.id');
    const created = await SupportTicketDoc.create({
      TicketID: id,
      CompanyID: Number(companyId),
      Subject: subject,
      Description: description,
      Status: 'open',
      Replies: []
    });
    return toPlain(created);
  }

  static async findById(id) {
    const doc = await SupportTicketDoc.findOne({ TicketID: Number(id) }).lean();
    return toPlain(doc);
  }

  static async findForCompany(companyId) {
    const docs = await SupportTicketDoc.find({ CompanyID: Number(companyId) }).sort({ CreatedAt: -1 }).lean();
    return Array.isArray(docs) ? docs.map(toPlain) : [];
  }

  static async findAll() {
    const docs = await SupportTicketDoc.find({}).sort({ CreatedAt: -1 }).lean();
    return Array.isArray(docs) ? docs.map(toPlain) : [];
  }

  static async addReply(ticketId, replyObj) {
    const doc = await SupportTicketDoc.findOneAndUpdate(
      { TicketID: Number(ticketId) },
      { $push: { Replies: replyObj }, $set: { UpdatedAt: new Date() } },
      { new: true }
    ).lean();
    return toPlain(doc);
  }
}

module.exports = SupportTicket;
