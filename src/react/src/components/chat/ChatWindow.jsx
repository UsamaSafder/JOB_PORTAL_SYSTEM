import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { apiGet, apiPost } from '../../services/chatService';

const SOCKET_URL = 'http://localhost:5001';
const POLL_INTERVAL = 2000; // Poll every 2 seconds for real-time feel

export default function ChatWindow({ conversation, role, candidateName, companyName, companyId, candidateId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const pollRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const fileInputRef = useRef(null);
  const messagesLoadedRef = useRef(false);

  // Fetch messages
  const fetchMessages = async (forceLoad = false) => {
    if (!conversation) return;
    try {
      const res = await apiGet(`/messages/${conversation.ConversationID}`);
      const msgs = Array.isArray(res.data) ? res.data : [];
      
      // Always update messages on force load (initial load or manual fetch)
      if (forceLoad || msgs.length > lastMessageCountRef.current) {
        setMessages(msgs);
        lastMessageCountRef.current = msgs.length;
        
        // Scroll to bottom after setting messages
        setTimeout(() => {
          scrollToEnd();
        }, 50);
      }
    } catch (e) {
      console.error('Fetch messages error', e);
    }
  };

  // Fetch ALL messages when conversation is opened
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      messagesLoadedRef.current = false;
      return;
    }
    
    console.log('Loading messages for conversation:', conversation.ConversationID);
    setLoading(true);
    lastMessageCountRef.current = 0;
    messagesLoadedRef.current = false;
    
    // Force load all messages
    fetchMessages(true).then(() => {
      messagesLoadedRef.current = true;
      setLoading(false);
    });
  }, [conversation?.ConversationID]);

  // Set up polling for real-time updates ONLY after initial load
  useEffect(() => {
    if (!conversation || !messagesLoadedRef.current) return;
    
    // Start polling for new messages
    pollRef.current = setInterval(() => {
      fetchMessages(false);
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversation?.ConversationID, messagesLoadedRef.current]);

  // Socket.io setup for real-time events
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      // Join room based on role and ID
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser?.id || null;

      if (role === 'company' && companyId) {
        socketRef.current.emit('join', { role: 'company', companyId, userId });
      } else if (role === 'candidate' && candidateId) {
        socketRef.current.emit('join', { role: 'candidate', candidateId, userId });
      }
    });

    socketRef.current.on('message:receive', (msg) => {
      if (!conversation) return;
      if (msg.ConversationID === conversation.ConversationID) {
        setMessages((m) => [...m, msg]);
        scrollToEnd();
      }
    });

    socketRef.current.on('message:sent', (msg) => {
      // Message sent confirmation
      console.log('Message sent:', msg);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [role, companyId, candidateId, conversation]);

  const scrollToEnd = () => {
    setTimeout(() => {
      try { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
    }, 50);
  };

  const send = async () => {
    if ((!text.trim() && !selectedFile) || !conversation) return;
    const messageText = text;
    const file = selectedFile;
    setText('');
    setSelectedFile(null);
    
    try {
      const formData = new FormData();
      formData.append('text', messageText);
      if (file) {
        formData.append('file', file);
      }
      
      const res = await fetch(`http://localhost:5001/api/messages/${conversation.ConversationID}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      
      if (res.ok) {
        const resData = await res.json();
        setMessages((m) => [...m, resData]);
        scrollToEnd();
      } else {
        console.error('Failed to send message');
        setText(messageText);
        setSelectedFile(file);
      }
    } catch (e) {
      console.error('send error', e);
      setText(messageText);
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const displayName = role === 'candidate' ? (companyName || `Company ${conversation?.CompanyID}`) : (candidateName || `Candidate ${conversation?.CandidateID}`);

  return (
    <div className="chat-window">
      {!conversation && <div className="empty">Select a conversation</div>}
      {conversation && (
        <>
          <div className="chat-header">Chat with {displayName}</div>
          <div className="chat-messages">
            {loading && (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: 12 }}>
                Loading messages...
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: 12 }}>
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.SenderType === role;
              return (
                <div key={`msg-${m.MessageID}`} className="message-group">
                  <div className={`bubble ${isMine ? 'mine' : 'their'}`}>
                    {m.Text && <div className="bubble-text">{m.Text}</div>}
                    {m.FilePath && (
                      <div className="bubble-file">
                        <a href={`http://localhost:5001${m.FilePath}`} target="_blank" rel="noreferrer" style={{ color: isMine ? '#fff' : '#4f46e5', textDecoration: 'underline' }}>
                          📎 {m.FileName || 'Download File'}
                        </a>
                      </div>
                    )}
                    <div className={`bubble-time ${isMine ? 'time-right' : 'time-left'}`}>
                      {m.CreatedAt ? new Date(m.CreatedAt).toLocaleTimeString() : 'Just now'}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
          <div className="chat-input">
            <div style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
              <input 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..." 
                style={{ flex: 1 }}
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '10px 12px',
                  background: selectedFile ? '#10b981' : '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14
                }}
                title={selectedFile ? `File: ${selectedFile.name}` : 'Attach file'}
              >
                📎
              </button>
            </div>
            <button onClick={send}>Send</button>
          </div>
          {selectedFile && (
            <div style={{ fontSize: 12, padding: '8px 12px', background: '#f0f9ff', color: '#0369a1', borderTop: '1px solid #e0f2fe' }}>
              📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </>
      )}
    </div>
  );
}
