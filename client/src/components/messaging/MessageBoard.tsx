import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import * as db from '../../lib/localDB';
import { useAuthStore } from '../../store/authStore';
import { timeAgo, getInitials, generateAvatarColor } from '../../lib/utils';
import type { Message } from '../../types';

export default function MessageBoard() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK_EMOJIS = ['😊', '🎉', '❤️', '🔥', '👏', '🌴', '✨', '😂', '🎊', '💪', '🍕', '🎵'];

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = () => {
    const { messages: msgs } = db.getMessages();
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!content.trim() || !user) return;
    setIsSending(true);
    try {
      const msg = db.sendMessage(content.trim(), user.id, true);
      setMessages((prev) => [...prev, msg]);
      setContent('');
      setShowEmoji(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col"
      style={{ height: '500px' }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <MessageCircle size={20} className="text-primary" />
        <h3 className="font-display text-lg font-bold text-dark">Team Chat</h3>
        <span className="text-xs text-gray-400 ml-auto">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No messages yet — start the conversation! 💬</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${generateAvatarColor(msg.sender?.name || 'U')}`}
                >
                  {getInitials(msg.sender?.name || 'U')}
                </div>
                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-600">
                      {isOwn ? 'You' : msg.sender?.name}
                    </span>
                    {msg.sender?.role === 'ADMIN' && (
                      <span className="badge-primary text-[10px] py-0 px-1.5">Admin</span>
                    )}
                  </div>
                  <div
                    className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-primary text-white rounded-tr-md'
                        : 'bg-gray-100 text-gray-700 rounded-tl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(msg.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-xl">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setContent((c) => c + emoji);
                setShowEmoji(false);
              }}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <Smile size={22} />
        </button>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={!content.trim() || isSending}
          className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-50 transition-all"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}
