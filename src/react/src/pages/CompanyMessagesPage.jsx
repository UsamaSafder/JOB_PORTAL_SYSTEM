import React, { useEffect, useState, useRef } from 'react';
import { apiGet, apiPost } from '../services/chatService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import '../styles/chat.css';

const POLL_INTERVAL = 2000;

export default function CompanyMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const pollIntervalRef = useRef(null);

  // Fetch conversations and candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get conversations
        const convRes = await apiGet('/messages');
        let convList = Array.isArray(convRes.data) ? convRes.data : [];
        setConversations(convList);

        // Get applicants (filtered candidates who applied to this company's jobs)
        const appRes = await apiGet('/messages/applicants/list');
        const applicants = Array.isArray(appRes.data) ? appRes.data : [];
        setCandidates(applicants);
        
        setLoading(false);
      } catch (e) {
        console.error('Error fetching data:', e);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Polling for updates
    pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  const startConversation = async (candidateId) => {
    try {
      const res = await apiPost('/messages/conversation', { candidateId });
      const newConvo = res.data;
      
      // Add candidate name from our candidates list
      const candidateInfo = candidates.find((c) => c.candidateId === candidateId);
      const convoWithName = { 
        ...newConvo, 
        candidateName: candidateInfo?.candidateName || `Candidate ${candidateId}` 
      };
      
      // Update conversations list
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.ConversationID !== newConvo.ConversationID);
        return [convoWithName, ...filtered];
      });
      
      setSelected(convoWithName);
      setSelectedCandidateId(null);
    } catch (e) {
      console.error('Failed to start conversation:', e);
      alert('Failed to start conversation. Make sure the candidate has applied to your jobs.');
    }
  };

  const selectedConvo = selected || conversations[0];

  return (
    <div className="chat-page">
      <div className="chat-side">
        <h3>Messages</h3>
        {!selectedCandidateId ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Start conversation with:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loading ? <div style={{ fontSize: 12, color: '#999' }}>Loading candidates...</div> : null}
                {candidates.length === 0 && !loading ? (
                  <div style={{ fontSize: 12, color: '#999' }}>No candidates yet</div>
                ) : null}
                {candidates.map((cand) => (
                  <button
                    key={cand.candidateId}
                    onClick={() => setSelectedCandidateId(cand.candidateId)}
                    style={{
                      padding: '8px 10px',
                      background: '#eef3ff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 12
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{cand.candidateName}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{cand.jobTitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {selectedCandidateId ? (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setSelectedCandidateId(null)}
              style={{
                padding: '6px 10px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                marginBottom: 8
              }}
            >
              ← Back to candidates
            </button>
            <button
              onClick={() => startConversation(selectedCandidateId)}
              style={{
                padding: '8px 12px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                width: '100%',
                fontWeight: 600,
                fontSize: 12
              }}
            >
              Start Chat
            </button>
          </div>
        ) : null}
        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #eee' }} />
        <h4 style={{ marginTop: 12, marginBottom: 8, fontSize: 12 }}>Conversations</h4>
        <ChatList conversations={conversations} onSelect={setSelected} />
      </div>
      <div className="chat-main">
        <ChatWindow 
          conversation={selectedConvo} 
          role="company" 
          candidateName={selectedConvo?.candidateName}
          companyId={companyId}
        />
      </div>
    </div>
  );
}
