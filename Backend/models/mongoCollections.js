const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 }
  },
  { versionKey: false }
);

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'company', 'candidate'], required: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false
  }
);

const candidateSchema = new mongoose.Schema(
  {
    CandidateID: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, unique: true, index: true },
    FullName: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Skills: { type: String, default: '' },
    ExperienceYears: { type: Number, default: 0 },
    ResumeLink: { type: String, default: null },
    ProfilePicture: { type: String, default: null },
    Location: { type: String, default: null },
    Education: { type: String, default: null },
    Bio: { type: String, default: null },
    LinkedinUrl: { type: String, default: null },
    PortfolioUrl: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const companySchema = new mongoose.Schema(
  {
    CompanyID: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, unique: true, index: true },
    CompanyName: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Industry: { type: String, required: true },
    Location: { type: String, default: null },
    Website: { type: String, default: null },
    Description: { type: String, default: null },
    Logo: { type: String, default: null },
    IsVerified: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const adminSchema = new mongoose.Schema(
  {
    AdminID: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, unique: true, index: true },
    Username: { type: String, required: true, unique: true, index: true },
    PhoneNumber: { type: String, default: null },
    Department: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const jobSchema = new mongoose.Schema(
  {
    JobID: { type: Number, required: true, unique: true, index: true },
    CompanyID: { type: Number, required: true, index: true },
    Title: { type: String, required: true },
    Description: { type: String, default: null },
    Requirements: { type: String, default: null },
    Location: { type: String, default: null },
    SalaryRange: { type: String, default: null },
    EmploymentType: { type: String, default: null },
    Deadline: { type: Date, default: null },
    IsActive: { type: Boolean, default: true },
    PostedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const applicationSchema = new mongoose.Schema(
  {
    ApplicationID: { type: Number, required: true, unique: true, index: true },
    JobID: { type: Number, required: true, index: true },
    CandidateID: { type: Number, required: true, index: true },
    CoverLetter: { type: String, default: null },
    ResumePath: { type: String, default: null },
    AppliedAt: { type: Date, default: Date.now },
    Status: { type: String, default: 'Pending' },
    Notes: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const interviewSchema = new mongoose.Schema(
  {
    InterviewID: { type: Number, required: true, unique: true, index: true },
    ApplicationID: { type: Number, required: true, index: true },
    ScheduledDate: { type: Date, required: true },
    Location: { type: String, default: null },
    Mode: { type: String, default: 'Online' },
    InterviewerName: { type: String, default: null },
    Notes: { type: String, default: null },
    Status: { type: String, default: 'scheduled' },
    RescheduleReason: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const notificationSchema = new mongoose.Schema(
  {
    NotificationID: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    Title: { type: String, default: 'Notification' },
    Message: { type: String, required: true },
    Type: { type: String, default: 'info' },
    Link: { type: String, default: null },
    IsRead: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const systemLogSchema = new mongoose.Schema(
  {
    LogID: { type: Number, required: true, unique: true, index: true },
    UserId: { type: Number, default: null, index: true },
    Action: { type: String, required: true },
    Entity: { type: String, default: null },
    EntityId: { type: Number, default: null },
    Details: { type: String, default: null },
    IpAddress: { type: String, default: null },
    UserAgent: { type: String, default: null }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: false },
    versionKey: false
  }
);

const conversationSchema = new mongoose.Schema(
  {
    ConversationID: { type: Number, required: true, unique: true, index: true },
    CompanyID: { type: Number, required: true, index: true },
    CandidateID: { type: Number, required: true, index: true },
    LastMessageAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const messageSchema = new mongoose.Schema(
  {
    MessageID: { type: Number, required: true, unique: true, index: true },
    ConversationID: { type: Number, required: true, index: true },
    SenderType: { type: String, enum: ['company', 'candidate', 'admin'], required: true },
    SenderId: { type: Number, required: true },
    Text: { type: String, default: '' },
    FilePath: { type: String, default: null },
    FileName: { type: String, default: null },
    Attachments: { type: Array, default: [] },
    IsRead: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    TicketID: { type: Number, required: true, unique: true, index: true },
    CompanyID: { type: Number, required: true, index: true },
    AdminID: { type: Number, default: null },
    Subject: { type: String, required: true },
    Description: { type: String, default: null },
    Status: { type: String, default: 'open' },
    Replies: { type: Array, default: [] }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    versionKey: false
  }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
const UserDoc = mongoose.models.UserDoc || mongoose.model('UserDoc', userSchema, 'Users');
const CandidateDoc = mongoose.models.CandidateDoc || mongoose.model('CandidateDoc', candidateSchema, 'Candidates');
const CompanyDoc = mongoose.models.CompanyDoc || mongoose.model('CompanyDoc', companySchema, 'Companies');
const AdminDoc = mongoose.models.AdminDoc || mongoose.model('AdminDoc', adminSchema, 'Admins');
const JobDoc = mongoose.models.JobDoc || mongoose.model('JobDoc', jobSchema, 'Jobs');
const ApplicationDoc = mongoose.models.ApplicationDoc || mongoose.model('ApplicationDoc', applicationSchema, 'Applications');
const InterviewDoc = mongoose.models.InterviewDoc || mongoose.model('InterviewDoc', interviewSchema, 'Interviews');
const NotificationDoc = mongoose.models.NotificationDoc || mongoose.model('NotificationDoc', notificationSchema, 'Notifications');
const SystemLogDoc = mongoose.models.SystemLogDoc || mongoose.model('SystemLogDoc', systemLogSchema, 'SystemLogs');
const ConversationDoc = mongoose.models.ConversationDoc || mongoose.model('ConversationDoc', conversationSchema, 'Conversations');
const MessageDoc = mongoose.models.MessageDoc || mongoose.model('MessageDoc', messageSchema, 'Messages');
const SupportTicketDoc = mongoose.models.SupportTicketDoc || mongoose.model('SupportTicketDoc', supportTicketSchema, 'SupportTickets');

const nextSequence = async (key) => {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return doc.value;
};

const toPlain = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete plain._id;
  delete plain.__v;
  return plain;
};

module.exports = {
  UserDoc,
  CandidateDoc,
  CompanyDoc,
  AdminDoc,
  JobDoc,
  ApplicationDoc,
  InterviewDoc,
  NotificationDoc,
  SystemLogDoc,
  ConversationDoc,
  MessageDoc,
  SupportTicketDoc,
  nextSequence,
  toPlain
};