const { SystemLogDoc, UserDoc, CandidateDoc, CompanyDoc, nextSequence, toPlain } = require('./mongoCollections');

class SystemLog {
  static async create(logData) {
    try {
      const created = await SystemLogDoc.create({
        LogID: await nextSequence('SystemLogs.LogID'),
        UserId: logData.userId ? Number(logData.userId) : null,
        Action: logData.action,
        Entity: logData.entity || null,
        EntityId: logData.entityId ? Number(logData.entityId) : null,
        Details: logData.details || null,
        IpAddress: logData.ipAddress || null,
        UserAgent: logData.userAgent || null
      });

      return toPlain(created);
    } catch (err) {
      console.error('Error creating system log:', err);
      // Don't throw - logging should never break the application
      return null;
    }
  }

  static async findById(logId) {
    const doc = await SystemLogDoc.findOne({ LogID: Number(logId) }).lean();
    return toPlain(doc);
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.userId) query.UserId = Number(filters.userId);
    if (filters.action) query.Action = { $regex: String(filters.action), $options: 'i' };
    if (filters.entity) query.Entity = filters.entity;
    if (filters.startDate || filters.endDate) {
      query.CreatedAt = {};
      if (filters.startDate) query.CreatedAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.CreatedAt.$lte = new Date(filters.endDate);
    }

    const docs = await SystemLogDoc.find(query)
      .sort({ CreatedAt: -1 })
      .skip(Number(filters.offset) || 0)
      .limit(Number(filters.limit) || 500)
      .lean();

    const userIds = [...new Set(docs.map((x) => x.UserId).filter((x) => x !== null && x !== undefined))];
    const [users, candidates, companies] = await Promise.all([
      UserDoc.find({ id: { $in: userIds } }).lean(),
      CandidateDoc.find({ userId: { $in: userIds } }).lean(),
      CompanyDoc.find({ userId: { $in: userIds } }).lean()
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const candidateMap = new Map(candidates.map((c) => [c.userId, c]));
    const companyMap = new Map(companies.map((c) => [c.userId, c]));

    return docs.map((log) => {
      const user = userMap.get(log.UserId);
      const candidate = candidateMap.get(log.UserId);
      const company = companyMap.get(log.UserId);
      return {
        ...toPlain(log),
        Timestamp: log.CreatedAt ? new Date(log.CreatedAt).toISOString().replace('T', ' ').replace('Z', '').slice(0, 23) : null,
        Email: user?.email || null,
        UserType: user?.role || null,
        UserName: candidate?.FullName || company?.CompanyName || null
      };
    });
  }

  static async deleteOldLogs(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(daysOld));
    const result = await SystemLogDoc.deleteMany({ CreatedAt: { $lt: cutoffDate } });
    return result.deletedCount || 0;
  }
}

module.exports = SystemLog;