const SupportTicket = require('../models/SupportTicket');

const supportController = {
  createTicket: async (req, res) => {
    try {
      if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can create support tickets' });
      const companyId = req.user.companyId;
      const { subject, description } = req.body;
      if (!subject) return res.status(400).json({ error: 'subject required' });

      const ticket = await SupportTicket.create(companyId, subject, description || '');
      // Notify admin via socket if available
      try {
        if (global.io) global.io.to('admin').emit('ticket:created', ticket);
      } catch (e) { console.warn('Socket emit failed', e); }
      res.status(201).json(ticket);
    } catch (error) {
      console.error('createTicket error:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  },

  getTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      
      // Verify access: company can only view their own tickets, admin can view all
      if (req.user.role === 'company' && ticket.CompanyID !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('getTicket error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  },

  getCompanyTickets: async (req, res) => {
    try {
      if (req.user.role !== 'company') return res.status(403).json({ error: 'Only companies can view their tickets' });
      const companyId = req.user.companyId;
      const tickets = await SupportTicket.findForCompany(companyId);
      res.json(tickets);
    } catch (error) {
      console.error('getCompanyTickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  },

  getAllTicketsForAdmin: async (req, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin can access all tickets' });
      const tickets = await SupportTicket.findAll();
      res.json(tickets);
    } catch (error) {
      console.error('getAllTicketsForAdmin error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  },

  replyToTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'message required' });

      const replyObj = {
        By: req.user.role,
        ById: req.user.id,
        Message: message,
        At: new Date()
      };

      const updated = await SupportTicket.addReply(ticketId, replyObj);
      res.json(updated);
    } catch (error) {
      console.error('replyToTicket error:', error);
      res.status(500).json({ error: 'Failed to reply to ticket' });
    }
  }
};

module.exports = supportController;
