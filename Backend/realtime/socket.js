const { Server } = require('socket.io');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const SupportTicket = require('../models/SupportTicket');
const Company = require('../models/Company');
const Candidate = require('../models/Candidate');

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', async (payload) => {
      try {
        const { role, userId, companyId, candidateId } = payload || {};
        socket.data.role = role;
        socket.data.userId = userId;

        // If the client provided a numeric companyId/candidateId, prefer that.
        // Otherwise, try to resolve from userId so clients can just send userId.
        if (role === 'company') {
          let targetCompanyId = companyId;
          if (!targetCompanyId && userId) {
            const comp = await Company.findByUserId(userId);
            targetCompanyId = comp?.CompanyID || null;
          }
          if (targetCompanyId) {
            socket.join(`company-${targetCompanyId}`);
            console.log(`Company ${targetCompanyId} joined room`);
          }
        }

        if (role === 'candidate') {
          let targetCandidateId = candidateId;
          if (!targetCandidateId && userId) {
            const cand = await Candidate.findByUserId(userId);
            targetCandidateId = cand?.CandidateID || null;
          }
          if (targetCandidateId) {
            socket.join(`candidate-${targetCandidateId}`);
            console.log(`Candidate ${targetCandidateId} joined room`);
          }
        }

        if (role === 'admin') {
          socket.join('admin');
          console.log('Admin joined room');
        }
      } catch (e) { console.error('join error', e); }
    });

    socket.on('send_message', async (payload) => {
      try {
        const { conversationId, text, senderType, senderId } = payload || {};
        if (!conversationId || !senderType || !senderId) return;

        // Persist message
        const msg = await Message.create(conversationId, senderType, senderId, text || '');
        await Conversation.touch(conversationId);

        // Emit to recipient rooms
        // Determine recipient room based on senderType
        if (senderType === 'company') {
          // get conversation to find candidate
          const convo = await Conversation.findById(conversationId);
          if (convo && convo.CandidateID) {
            io.to(`candidate-${convo.CandidateID}`).emit('message:receive', msg);
          }
        } else if (senderType === 'candidate') {
          const convo = await Conversation.findById(conversationId);
          if (convo && convo.CompanyID) {
            io.to(`company-${convo.CompanyID}`).emit('message:receive', msg);
          }
        }

        // Also emit to sender for confirmation
        socket.emit('message:sent', msg);
      } catch (e) { console.error('send_message error', e); }
    });

    socket.on('create_ticket', async (payload) => {
      try {
        const { companyId, subject, description } = payload || {};
        if (!companyId || !subject) return;
        const ticket = await SupportTicket.create(companyId, subject, description || '');
        io.to('admin').emit('ticket:created', ticket);
        socket.emit('ticket:created', ticket);
      } catch (e) { console.error('create_ticket error', e); }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  console.log('Socket.io initialized');
  global.io = io;
  return io;
};
