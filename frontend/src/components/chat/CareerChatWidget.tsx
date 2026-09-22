import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { GapAnalysisResponse } from '../../types';
import { storageAdapter } from '../../utils/storageAdapter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface CareerChatWidgetProps {
  analysisId?: string | null;
  analysisData?: GapAnalysisResponse | null;
  jobTitle?: string | null;
  onExpandToFullWorkspace?: () => void;
}

export const CareerChatWidget: React.FC<CareerChatWidgetProps> = ({
  analysisId,
  analysisData: _analysisData,
  jobTitle,
  onExpandToFullWorkspace,
}) => {
  const { user } = useAuth();
  const isAuth = Boolean(user);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    return storageAdapter.getChatMessages(isAuth, user?.id);
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const prevChatUserIdRef = useRef<string | null | undefined>(user?.id);

  // Synchronize messages on account switch and auto-save scoped to active user
  useEffect(() => {
    if (prevChatUserIdRef.current !== user?.id) {
      prevChatUserIdRef.current = user?.id;
      setMessages(storageAdapter.getChatMessages(isAuth, user?.id));
      return;
    }
    storageAdapter.setChatMessages(isAuth, messages, user?.id);
  }, [user?.id, isAuth, messages]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isStreaming]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery.trim();
    if (!textToSend || isStreaming) return;

    setInputQuery('');
    const userMsgId = 'msg_' + Date.now();
    const assistantMsgId = 'msg_' + (Date.now() + 1);

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    await chatService.streamMessage(
      {
        message: textToSend,
        analysis_id: analysisId || null,
        stream: true,
      },
      (token: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + token } : m
          )
        );
      },
      (fullText: string) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: fullText, isStreaming: false } : m
          )
        );
      },
      () => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    '⚠️ Connection notice: Unable to reach RAG backend at http://127.0.0.1:8000.',
                  isStreaming: false,
                }
              : m
          )
        );
      }
    );
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <aside aria-label="Career Copilot AI Assistant" className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] transform hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer border border-emerald-300/40"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 animate-ping" />
            <svg className="w-5 h-5 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm font-extrabold tracking-tight">Career Copilot</span>
          </button>
        )}
      </aside>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] glass-frame rounded-[2rem] shadow-2xl flex flex-col justify-between border border-white/20 backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-400/40 shadow-inner">
                AI
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">Career Copilot</h3>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {jobTitle ? `${jobTitle} • ` : ''}Pinecone 3A-K5 Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onExpandToFullWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onExpandToFullWorkspace();
                  }}
                  title="Expand to Full Workspace"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close drawer"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-xl">
                  ✨
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Ask your Career Copilot</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Grounded in 26 official technical guides & interview question banks.
                  </p>
                </div>
                <div className="space-y-1.5 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Give me a senior interview drill on FastAPI async concurrency.')}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition"
                  >
                    🎯 FastAPI Concurrency Drill &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Why is Redis caching critical for a Senior Backend role?')}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition"
                  >
                    ⚡ Why Redis for Senior Role? &rarr;
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        : 'glass-frame text-zinc-200 border border-white/10'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div>
                        {m.content ? (
                          <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => <h4 className="font-bold text-white text-xs mt-2 mb-1">{children}</h4>,
                                h2: ({ children }) => <h4 className="font-bold text-white text-xs mt-2 mb-1">{children}</h4>,
                                h3: ({ children }) => <h4 className="font-bold text-emerald-300 text-xs mt-1.5 mb-1">{children}</h4>,
                                h4: ({ children }) => <h4 className="font-bold text-emerald-300 text-xs mt-1.5 mb-1">{children}</h4>,
                                p: ({ children }) => <p className="my-1 text-zinc-200">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                ul: ({ children }) => <ul className="space-y-1 my-1.5 ml-1 list-none">{children}</ul>,
                                ol: ({ children }) => <ol className="space-y-1 my-1.5 ml-3 list-decimal text-zinc-200">{children}</ol>,
                                li: ({ children }) => (
                                  <li className="flex items-start gap-1.5 my-0.5 text-zinc-200">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    <span className="flex-1">{children}</span>
                                  </li>
                                ),
                                hr: () => <hr className="my-2 border-t border-white/10" />,
                                code: ({ inline, children, ...props }: any) => {
                                  if (inline) {
                                    return (
                                      <code className="px-1 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[10px]" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <pre className="my-1.5 p-2 rounded-lg bg-zinc-950/80 border border-white/10 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                                      <code>{children}</code>
                                    </pre>
                                  );
                                },
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-300 hover:text-white underline underline-offset-2 decoration-cyan-400/50 hover:decoration-white transition-colors inline-flex items-center gap-0.5 font-medium"
                                  >
                                    <span>{children}</span>
                                    <span className="text-[9px] text-cyan-400">↗</span>
                                  </a>
                                ),
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-zinc-400 flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Thinking...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                    <div className="mt-1 text-[9px] text-white/40 text-right">{m.timestamp}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Input */}
          <div className="p-3 border-t border-white/10 bg-white/5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your Career Copilot..."
                className="w-full bg-white/10 text-white placeholder-zinc-500 rounded-full px-4 py-2.5 text-xs pr-10 outline-none border border-white/10 focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isStreaming}
                className="absolute right-1.5 w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold disabled:opacity-40"
              >
                {isStreaming ? (
                  <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
