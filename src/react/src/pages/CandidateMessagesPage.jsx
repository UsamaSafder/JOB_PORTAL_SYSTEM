import React, { useEffect, useState } from 'react';
import { apiGet } from '../services/chatService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import '../styles/chat.css';

export default function CandidateMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [candidateId, setCandidateId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Get current user's candidate ID
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const cId = user.candidateId;
        setCandidateId(cId);

        // Get conversations
        const res = await apiGet('/messages');
        setConversations(res.data || []);
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };
    fetch();
  }, []);

  return (
    <div className="chat-page">
      <div className="chat-side">
        <h3>Inbox</h3>
        <ChatList conversations={conversations} onSelect={setSelected} />
      </div>
      <div className="chat-main">
        <ChatWindow 
          conversation={selected} 
          role="candidate"
          companyName={selected?.companyName}
          candidateId={candidateId}
        />
      </div>
    </div>
  );
}
