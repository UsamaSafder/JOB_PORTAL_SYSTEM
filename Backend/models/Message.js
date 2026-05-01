const { MessageDoc, nextSequence, toPlain } = require('./mongoCollections');

class Message {
  static async create(conversationId, senderType, senderId, text, filePath = null, fileName = null, attachments = []) {
    const id = await nextSequence('Messages.id');
    const created = await MessageDoc.create({
      MessageID: id,
      ConversationID: Number(conversationId),
      SenderType: senderType,
      SenderId: Number(senderId),
      Text: text || '',
      FilePath: filePath,
      FileName: fileName,
      Attachments: attachments || [],
      IsRead: false
    });
    return toPlain(created);
  }

  static async findByConversation(conversationId, limit = 100, skip = 0) {
    const docs = await MessageDoc.find({ ConversationID: Number(conversationId) }).sort({ CreatedAt: 1 }).skip(Number(skip)).limit(Number(limit)).lean();
    return Array.isArray(docs) ? docs.map(toPlain) : [];
  }

  static async markRead(conversationId, forReceiverId) {
    // Mark messages not sent by receiver as read
    await MessageDoc.updateMany({ ConversationID: Number(conversationId), SenderId: { $ne: Number(forReceiverId) } }, { $set: { IsRead: true } });
  }
}

module.exports = Message;
