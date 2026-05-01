import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../services/chatService';
import '../styles/chat.css';

const POLL_INTERVAL = 2000;

export default function CompanySupportPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const lastReplyCountRef = useRef(0);

  // Fetch all tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await apiGet('/support/company');
        setTickets(res.data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Fetch selected ticket details
  useEffect(() => {
    if (!selectedTicket) return;
    
    const fetchTicketDetail = async () => {
      try {
        const res = await apiGet(`/support/${selectedTicket.TicketID}`);
        if (res.data) {
          setReplies(res.data.Replies || []);
          lastReplyCountRef.current = (res.data.Replies || []).length;
        }
      } catch (error) {
        console.error('Error fetching ticket detail:', error);
      }
    };
    
    fetchTicketDetail();
    const interval = setInterval(fetchTicketDetail, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const createTicket = async () => {
    if (!subject.trim()) return;
    try {
      const res = await apiPost('/support', { subject, description });
      setTickets((t) => [res.data, ...t]);
      setSubject('');
      setDescription('');
      setSelectedTicket(res.data);
      setReplies([]);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const res = await apiPost(`/support/${selectedTicket.TicketID}/reply`, {
        message: replyText
      });
      if (res.data && res.data.Replies) {
        setReplies(res.data.Replies);
        setSelectedTicket(res.data);
      }
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  return (
    <div className="messages-container">
      {/* Left Panel: New Ticket + Ticket List */}
      <div className="chat-list-panel">
        <div className="new-ticket-form">
          <h3>New Support Ticket</h3>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createTicket()}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />
          <button onClick={createTicket} className="btn-primary">Send to Admin</button>
        </div>

        <div className="tickets-list">
          <h3>Your Tickets</h3>
          {tickets.length === 0 ? (
            <div className="empty-state">No tickets yet</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.TicketID}
                className={`ticket-item ${selectedTicket?.TicketID === t.TicketID ? 'active' : ''}`}
                onClick={() => setSelectedTicket(t)}
              >
                <div className="ticket-subject">{t.Subject}</div>
                <div className="ticket-meta">
                  <span className={`status ${t.Status}`}>{t.Status}</span>
                  <span>{new Date(t.CreatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Ticket Chat */}
      <div className="chat-window-panel">
        {selectedTicket ? (
          <div className="support-chat-window">
            <div className="chat-header">
              <h3>{selectedTicket.Subject}</h3>
              <span className={`status-badge ${selectedTicket.Status}`}>{selectedTicket.Status}</span>
            </div>

            <div className="messages-list">
              {/* Initial ticket message */}
              <div className="message-group">
                <div className="bubble mine">
                  <div className="bubble-text">{selectedTicket.Description || 'No description'}</div>
                  <div className="bubble-time time-right">
                    {new Date(selectedTicket.CreatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {replies.map((reply, idx) => (
                <div key={idx} className="message-group">
                  <div className={reply.By === 'company' ? 'bubble mine' : 'bubble their'}>
                    <div className="bubble-text">{reply.Message}</div>
                    <div className={`bubble-time ${reply.By === 'company' ? 'time-right' : 'time-left'}`}>
                      {new Date(reply.At).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="message-input-area">
              <textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <button onClick={sendReply} className="btn-send">Send</button>
            </div>
          </div>
        ) : (
          <div className="empty-state">Select a ticket to view conversation</div>
        )}
      </div>
    </div>
  );
}
