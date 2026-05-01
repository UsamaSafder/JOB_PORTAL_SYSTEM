import React from 'react';

export default function ChatList({ conversations = [], onSelect }) {
  return (
    <div className="chat-list">
      {conversations.length === 0 && <div className="empty">No conversations yet</div>}
      {conversations.map((c) => {
        // Show either company name (for candidates) or candidate name (for companies)
        const displayName = c.companyName || c.candidateName || `Conversation ${c.ConversationID}`;
        return (
          <div key={c.ConversationID} className="chat-item" onClick={() => onSelect(c)}>
            <div className="chat-item-head">{displayName}</div>
            <div className="chat-item-sub">Last: {new Date(c.LastMessageAt || c.CreatedAt).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
