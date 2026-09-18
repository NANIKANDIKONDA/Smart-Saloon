import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle, Scissors } from 'lucide-react';
import { sendChatMessage } from '../services/api';

const SESSION_HISTORY_KEY = 'smartsalon_chat_session_history';

const SUGGESTIONS = [
  "What branches do you have?",
  "How much does a Haircut cost?",
  "Tell me about your Fruit Facial",
  "What are your opening hours?",
  "How does advance booking work?"
];

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse chat history from session', e);
    }
    return [
      {
        id: 'initial',
        sender: 'bot',
        text: "Greetings. I am your SmartSalon Luxury AI Stylist. How may I assist your grooming ritual or branch booking today?",
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history to session', e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend = null) => {
    const query = (textToSend !== null ? textToSend : input).trim();
    if (!query || isLoading) return;

    setErrorState(null);

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === null) setInput('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage(query);
      const botText = res && res.answer ? res.answer : "I don't know the answer to that from current salon data.";

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setErrorState("Unable to reach the salon knowledge assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-5rem)] bg-[#12111a] border border-[#c59a58]/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Header */}
      <div className="px-5 py-4 bg-[#181724] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#201e2c] border border-[#c59a58]/40 flex items-center justify-center text-[#c59a58]">
            <Scissors className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white">
                AI Concierge Stylist
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-[10px] text-stone-400">Verified Pricing & Branch Assistant</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#0e0d14]">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
            >
              {isBot && (
                <div className="w-6 h-6 rounded-full bg-[#1c1a26] border border-[#c59a58]/30 text-[#c59a58] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl whitespace-pre-line leading-relaxed max-w-[84%] shadow-md ${
                  isBot
                    ? 'bg-[#181724] text-stone-200 border border-white/5 rounded-tl-sm'
                    : 'bg-[#c59a58] text-neutral-950 font-medium rounded-br-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-stone-400 text-xs">
            <div className="w-6 h-6 rounded-full bg-[#1c1a26] border border-[#c59a58]/30 text-[#c59a58] flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="bg-[#181724] px-3.5 py-2 rounded-2xl rounded-tl-sm flex items-center gap-2 border border-white/5">
              <span className="italic text-stone-400 text-[11px]">Consulting salon catalog...</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c59a58] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#c59a58] animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#c59a58] animate-bounce delay-300" />
              </span>
            </div>
          </div>
        )}

        {errorState && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorState}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-3 py-2 bg-[#14131d] border-t border-white/5 overflow-x-auto flex gap-1.5 scrollbar-none">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(s)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1c1a26] hover:bg-[#252332] text-stone-300 text-[10px] font-condensed uppercase tracking-wider border border-white/5 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#181724] border-t border-white/5 flex items-center gap-2"
      >
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask about treatments, branches, prices..."
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3.5 py-2.5 bg-[#12111a] border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c59a58] resize-none overflow-hidden max-h-20"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#c59a58] hover:bg-[#dfb76c] text-neutral-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
