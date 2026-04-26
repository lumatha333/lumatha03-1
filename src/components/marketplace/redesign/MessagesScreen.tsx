import { Send, Phone, Info, SearchIcon } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'other';
  text: string;
  timestamp: string;
  avatar?: string;
}

interface MessagesScreenProps {
  otherUser: {
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: string;
  };
  listingTitle?: string;
  price?: number;
  initialMessages?: Message[];
  onCall?: () => void;
}

export function MessagesScreen({
  otherUser,
  listingTitle,
  price,
  initialMessages = [],
  onCall,
}: MessagesScreenProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputValue('');
  };

  return (
    <div style={{ backgroundColor: '#0D1117', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#0D1117' }}>
            {otherUser.avatar || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3', marginBottom: '2px' }}>{otherUser.name}</h2>
            <p
              style={{
                fontSize: '12px',
                color: otherUser.status === 'online' ? '#34D399' : '#7D8590',
              }}
            >
              {otherUser.status === 'online' ? '🟢 Online' : `Last seen ${otherUser.lastSeen || 'offline'}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCall}
            className="p-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              cursor: 'pointer',
            }}
          >
            <Phone className="w-5 h-5" style={{ color: '#4F8EF7' }} />
          </button>
          <button
            className="p-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              cursor: 'pointer',
            }}
          >
            <Info className="w-5 h-5" style={{ color: '#7D8590' }} />
          </button>
        </div>
      </div>

      {/* Listing Card in Chat */}
      {listingTitle && (
        <div
          className="mx-4 mt-4 p-3 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: '#0D1117' }}
          >
            📦
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '12px', color: '#7D8590', marginBottom: '2px' }}>Listing</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>{listingTitle}</p>
            <p style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>NPR {price?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: '#7D8590', fontSize: '13px' }}>Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className="flex gap-2 max-w-xs" style={{ alignItems: 'flex-end' }}>
                {msg.sender === 'other' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: '#161B24' }}>
                    {otherUser.avatar || '👤'}
                  </div>
                )}
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: msg.sender === 'user' ? '#4F8EF7' : '#161B24',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#E6EDF3',
                    fontSize: '13px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.07)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginTop: '4px', marginLeft: '8px', marginRight: '8px' }}>
                {msg.timestamp}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div
        className="p-4 flex gap-3"
        style={{
          backgroundColor: '#161B24',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <input
          type="text"
          placeholder="Message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={{
            flex: 1,
            backgroundColor: '#0D1117',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#E6EDF3',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-3 rounded-lg font-semibold flex items-center justify-center"
          style={{
            backgroundColor: '#4F8EF7',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            minWidth: '44px',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function MessagesScreenDemo() {
  return (
    <MessagesScreen
      otherUser={{
        name: 'Tech Seller Nepal',
        avatar: '👨‍💼',
        status: 'online',
        lastSeen: '2 min ago',
      }}
      listingTitle="iPhone 12 Pro - Mint Condition"
      price={45000}
      initialMessages={[
        {
          id: '1',
          sender: 'other',
          text: 'Hi! Is this still available?',
          timestamp: '10:30',
          avatar: '👨‍💼',
        },
        {
          id: '2',
          sender: 'user',
          text: 'Yes, it is! Interested?',
          timestamp: '10:31',
        },
        {
          id: '3',
          sender: 'other',
          text: 'Can you share more photos? Especially of the back.',
          timestamp: '10:32',
          avatar: '👨‍💼',
        },
        {
          id: '4',
          sender: 'user',
          text: 'Sure! Will send them now.',
          timestamp: '10:33',
        },
      ]}
    />
  );
}
