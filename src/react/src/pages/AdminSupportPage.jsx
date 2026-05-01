import React, { useEffect, useState, useRef } from 'react';
import { apiGet, apiPost } from '../services/chatService';
import '../styles/chat.css';

const POLL_INTERVAL = 2000;

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const lastReplyCountRef = useRef(0);

  // Fetch all tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await apiGet('/support');
        const list = Array.isArray(res.data) ? res.data : [];
        setTickets(list);
        if (list.length > 0 && !selectedTicket) {
          setSelectedTicket(list[0]);
        }
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
          // Update selectedTicket with latest data
          setSelectedTicket(res.data);
        }
      } catch (error) {
        console.error('Error fetching ticket detail:', error);
      }
    };

    fetchTicketDetail();
    const interval = setInterval(fetchTicketDetail, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedTicket?.TicketID]);

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
      {/* Left Panel: Ticket List */}
      <div className="chat-list-panel">
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: '0', fontSize: '16px', color: '#111827' }}>Support Tickets</h3>
        </div>

        <div className="tickets-list">
          {tickets.length === 0 ? (
            <div className="empty-state">No support tickets</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.TicketID}
                className={`ticket-item ${selectedTicket?.TicketID === t.TicketID ? 'active' : ''}`}
                onClick={() => setSelectedTicket(t)}
              >
                <div className="ticket-subject">#{t.TicketID} - {t.Subject}</div>
                <div className="ticket-meta">
                  <span className={`status ${t.Status}`}>{t.Status}</span>
                  <span>Company {t.CompanyID}</span>
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
              <h3>Ticket #{selectedTicket.TicketID} - {selectedTicket.Subject}</h3>
              <span className={`status-badge ${selectedTicket.Status}`}>{selectedTicket.Status}</span>
            </div>

            <div className="messages-list">
              {/* Initial ticket message */}
              <div className="message-group">
                <div className="bubble their">
                  <div className="bubble-text">{selectedTicket.Description || 'No description'}</div>
                  <div className="bubble-time time-left">
                    Company - {new Date(selectedTicket.CreatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {replies.map((reply, idx) => (
                <div key={idx} className="message-group">
                  <div className={reply.By === 'admin' ? 'bubble mine' : 'bubble their'}>
                    <div className="bubble-text">{reply.Message}</div>
                    <div className={`bubble-time ${reply.By === 'admin' ? 'time-right' : 'time-left'}`}>
                      {reply.By === 'admin' ? 'You' : 'Company'} - {new Date(reply.At).toLocaleString()}
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
