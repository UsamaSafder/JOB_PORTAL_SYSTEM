const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Company = require('../models/Company');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Job = require('../models/Job');

const messageController = {
  createOrGetConversation: async (req, res) => {
    try {
      const { candidateId } = req.body;
      if (!candidateId) return res.status(400).json({ error: 'candidateId required' });

      // Only companies can create conversations here
      if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can initiate conversations' });

      const companyId = req.user.companyId;

      // Ensure candidate exists
      const candidate = await Candidate.findById(candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      // Check if candidate has applied to this company's jobs
      const app = await Application.findAll({ companyId, candidateId });
      if (!app || app.length === 0) return res.status(403).json({ error: 'Candidate has not applied to your jobs' });

      // Find existing conversation
      let convo = await Conversation.findBetween(companyId, candidateId);
      if (!convo) {
        convo = await Conversation.create(companyId, candidateId);
      }

      res.json(convo);
    } catch (error) {
      console.error('createOrGetConversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  getConversations: async (req, res) => {
    try {
      if (req.user.role === 'company') {
        const companyId = req.user.companyId;
        const list = await Conversation.findForCompany(companyId);
        return res.json(list);
      }

      if (req.user.role === 'candidate') {
        const candidateId = req.user.candidateId;
        const list = await Conversation.findForCandidate(candidateId);
        return res.json(list);
      }

      return res.status(403).json({ error: 'Not allowed' });
    } catch (error) {
      console.error('getConversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  getApplicants: async (req, res) => {
    try {
      if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can view applicants' });

      const companyId = req.user.companyId;

      // Get all applications for this company
      const applications = await Application.findAll({ companyId });

      // Extract unique candidates with their job details
      const candidateMap = new Map();
      const seenIds = new Set();

      for (const app of applications) {
        const cId = app.CandidateID;
        if (!seenIds.has(cId)) {
          seenIds.add(cId);
          candidateMap.set(cId, {
            candidateId: cId,
            candidateName: app.candidateName || `Candidate ${cId}`,
            jobTitle: app.jobTitle,
            appliedAt: app.AppliedAt,
            applicationId: app.ApplicationID,
            jobId: app.JobID
          });
        }
      }

      const applicants = Array.from(candidateMap.values());
      res.json(applicants);
    } catch (error) {
      console.error('getApplicants error:', error);
      res.status(500).json({ error: 'Failed to fetch applicants' });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const convo = await Conversation.findById(conversationId);
      if (!convo) return res.status(404).json({ error: 'Conversation not found' });

      // Access control: only participant can view
      if (req.user.role === 'company' && convo.CompanyID !== req.user.companyId) return res.status(403).json({ error: 'Access denied' });
      if (req.user.role === 'candidate' && convo.CandidateID !== req.user.candidateId) return res.status(403).json({ error: 'Access denied' });

      const messages = await Message.findByConversation(convo.ConversationID);
      res.json(messages);
    } catch (error) {
      console.error('getMessages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { text } = req.body;
      const convo = await Conversation.findById(conversationId);
      if (!convo) return res.status(404).json({ error: 'Conversation not found' });

      // Only company or candidate participant can send
      let senderType = null;
      let senderId = null;

      if (req.user.role === 'company') {
        if (convo.CompanyID !== req.user.companyId) return res.status(403).json({ error: 'Access denied' });
        senderType = 'company';
        senderId = req.user.companyId;
      } else if (req.user.role === 'candidate') {
        if (convo.CandidateID !== req.user.candidateId) return res.status(403).json({ error: 'Access denied' });
        senderType = 'candidate';
        senderId = req.user.candidateId;
      } else {
        return res.status(403).json({ error: 'Only company or candidate can send messages' });
      }

      // Handle file upload
      let filePath = null;
      let fileName = null;
      if (req.file) {
        filePath = `/uploads/messages/${req.file.filename}`;
        fileName = req.file.originalname;
      }

      const msg = await Message.create(convo.ConversationID, senderType, senderId, text || '', filePath, fileName);
      await Conversation.touch(convo.ConversationID);
      // Emit socket event if io is available
      try {
        if (global.io) {
          if (senderType === 'company') {
            global.io.to(`candidate-${convo.CandidateID}`).emit('message:receive', msg);
          } else if (senderType === 'candidate') {
            global.io.to(`company-${convo.CompanyID}`).emit('message:receive', msg);
          }
        }
      } catch (e) { console.warn('Socket emit failed', e); }
      res.status(201).json(msg);
    } catch (error) {
      console.error('sendMessage error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
};

module.exports = messageController;
