import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE, API_ORIGIN } from '../config/api';

// Connect to the backend exactly once per file load
const socket = io(API_ORIGIN);

export default function LiveChat({ currentUserId, connectionId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  
  // A reference to auto-scroll to the bottom of the chat
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 1. Fetch chat history from the database
    axios.get(`${API_BASE}/messages/${connectionId}`)
      .then(res => {
        setMessages(res.data);
        setLoading(false);
        scrollToBottom();
      })
      .catch(err => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });

    // 2. Tell the backend we are joining this specific chat room
    socket.emit('join_chat', connectionId);

    // 3. Listen for incoming messages in real-time
    const handleReceiveMessage = (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    };

    socket.on('receive_message', handleReceiveMessage);

    // Cleanup: When the user leaves this screen, stop listening
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [connectionId]);

  // Auto-scroll logic whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      connectionId,
      senderId: currentUserId,
      content: inputText
    };

    // Fire the message instantly through the WebSocket pipe
    socket.emit('send_message', payload);
    setInputText(""); // Clear the input box
  };

  if (loading) {
    return <div className="text-center py-20 text-forest-400 font-mono animate-pulse">Establishing secure connection...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-charcoal-900 border border-charcoal-700 rounded-lg shadow-2xl overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-charcoal-800 p-4 border-b border-charcoal-700 flex justify-between items-center">
        <div className="text-forest-400 font-bold tracking-widest">ENCRYPTED TERMINAL</div>
        <button onClick={onBack} className="text-gray-400 hover:text-red-400 transition-colors text-sm">
          [ Disconnect ]
        </button>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-charcoal-900">
        {messages.map((msg, idx) => {
          // Check if this message was sent by the current user
          const isMe = typeof msg.senderId === 'object' 
            ? msg.senderId._id === currentUserId 
            : msg.senderId === currentUserId;

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-1 px-1">
                {typeof msg.senderId === 'object' ? msg.senderId.username : "User"}
              </span>
              <div 
                className={`max-w-[75%] p-3 rounded-lg text-sm ${
                  isMe 
                    ? 'bg-forest-900 text-green-50 border border-forest-800 rounded-br-none' 
                    : 'bg-charcoal-800 text-gray-300 border border-charcoal-600 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {/* Invisible div to scroll down to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-charcoal-800 border-t border-charcoal-700 flex gap-3">
        <span className="text-forest-400 font-bold self-center">{">"}</span>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-charcoal-900 text-gray-200 border border-charcoal-600 rounded p-2 focus:outline-none focus:border-forest-400"
          placeholder="Execute message..."
          autoFocus
        />
        <button 
          type="submit" 
          className="bg-forest-800 hover:bg-forest-900 text-white font-bold px-6 py-2 rounded transition-colors"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
