import { useEffect, useRef, useState } from 'react';
import { useChatWithAIMutation, useGetChatHistoryQuery } from '../api/analytics-endpoints';
import { useAppSelector } from '../store';
import { Bot, Send, Sparkles, X, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  "Who's the top performer this week?",
  'Which tasks are overdue?',
  'How are my projects tracking?',
  "What's our team's profitability?",
  'Summarize the week',
  'Who needs support?',
];

export default function AIChatWidget() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const isAllBusinesses = !businessId || businessId === 'all';

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  const { data: chatData } = useGetChatHistoryQuery(businessId, {
    skip: isAllBusinesses,
  });
  const [chat, chatResult] = useChatWithAIMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = chatData?.messages || [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAllBusinesses) return;
    const msg = input;
    setInput('');
    await chat({ businessId, message: msg }).unwrap().catch(() => null);
  };

  const sendSuggestion = (text: string) => {
    if (isAllBusinesses) return;
    setInput(text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatResult.isLoading]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-surface-800 text-white scale-95'
            : 'bg-gradient-to-br from-brand-500 to-purple-600 text-white hover:scale-110 hover:shadow-glow'
        }`}
        title="AI Assistant"
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl overflow-hidden shadow-2xl border border-surface-200 bg-white animate-scale-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">FlowDesk AI</p>
              <p className="text-xs text-white/70 mt-0.5">
                {isAllBusinesses ? 'Select a business to start' : 'Powered by Groq · Llama 3.3'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* No business selected */}
          {isAllBusinesses ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-50">
              <div className="w-12 h-12 rounded-2xl bg-warning-50 border border-warning-200 flex items-center justify-center mb-3">
                <AlertCircle size={22} className="text-warning-500" />
              </div>
              <p className="text-sm font-semibold text-surface-700 mb-1">Select a business first</p>
              <p className="text-xs text-surface-400">Use the business switcher at the top to pick a specific business — then I can access your real data.</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-surface-50/80">
                {messages.length === 0 ? (
                  <div className="py-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={20} className="text-brand-500" />
                    </div>
                    <p className="text-center text-xs font-semibold text-surface-500 mb-3">
                      I have access to your live data — try asking:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendSuggestion(s)}
                          className="text-left px-2.5 py-2 text-xs text-surface-600 bg-white border border-surface-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all leading-snug"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={12} className="text-brand-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-brand-500 text-white rounded-tr-sm'
                            : 'bg-white text-surface-800 border border-surface-200 rounded-tl-sm shadow-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {chatResult.isLoading && (
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-brand-600" />
                    </div>
                    <div className="bg-white border border-surface-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={submit} className="border-t border-surface-200 p-3 bg-white">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about tasks, team, projects…"
                    className="flex-1 px-3.5 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-surface-400 text-surface-900"
                    disabled={chatResult.isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || chatResult.isLoading}
                    className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                  >
                    <Send size={15} />
                  </button>
                </div>
                {chatResult.isError && (
                  <p className="text-[10px] text-danger-500 mt-1.5 px-1">
                    Something went wrong. Try again.
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
