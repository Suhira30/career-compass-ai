import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserNavPill } from '../components/auth/UserNavPill';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { GapAnalysisResponse } from '../types';
import { storageAdapter } from '../utils/storageAdapter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggested_followups?: string[];
  isStreaming?: boolean;
}

interface CareerCopilotWorkspaceProps {
  onBackToRoadmap?: () => void;
  onBackToGapAnalysis?: () => void;
  analysisId?: string | null;
  analysisData?: GapAnalysisResponse | null;
  jobTitle?: string | null;
}

export const CareerCopilotWorkspace: React.FC<CareerCopilotWorkspaceProps> = ({
  onBackToRoadmap: _onBackToRoadmap,
  onBackToGapAnalysis,
  analysisId,
  analysisData,
  jobTitle,
}) => {
  const { user } = useAuth();
  const isAuth = Boolean(user);

  // Resolve active candidate context
  const candidateName = user?.name || (analysisData?.readiness_category ? 'Candidate' : 'Tech Leader');
  const targetRole = jobTitle || (analysisData as any)?.job_title || 'Senior Backend Engineer';
  const missingSkills = analysisData?.skill_matrix?.missing_skills || ['FastAPI', 'Redis', 'Docker'];

  // Session state
  const [sessionId] = useState<string>(() => {
    return 'sess_' + Math.random().toString(36).substring(2, 9);
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    return storageAdapter.getChatMessages(isAuth, user?.id);
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Scroll to bottom when streaming or new message arrives
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Send message handler with real-time SSE streaming
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
        session_id: sessionId,
        analysis_id: analysisId || null,
        stream: true,
      },
      // On each streamed token
      (token: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + token } : m
          )
        );
      },
      // On stream complete
      (fullText: string) => {
        setIsStreaming(false);
        const followups = generateContextFollowups(textToSend, fullText);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: fullText, isStreaming: false, suggested_followups: followups }
              : m
          )
        );
      },
      // On error
      (_err: Error) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    '⚠️ Connection notice: Unable to stream from RAG backend. Please ensure backend is running at http://127.0.0.1:8000.',
                  isStreaming: false,
                }
              : m
          )
        );
      }
    );
  };

  // Helper generating intelligent follow-up suggestions
  const generateContextFollowups = (query: string, _text: string): string[] => {
    const qLower = query.toLowerCase();
    if (qLower.includes('fastapi')) {
      return [
        'How do I test async endpoints with pytest-asyncio and httpx?',
        'Give me a mock interview drill on dependency injection with yield.',
        'How does FastAPI compare to Django REST Framework in throughput?',
      ];
    } else if (qLower.includes('redis') || qLower.includes('kafka')) {
      return [
        'What is the Cache-Aside pattern vs Write-Through in Redis?',
        'How does Kafka guarantee message ordering across consumer partitions?',
        'What are the failure modes of Redis pub/sub?',
      ];
    }
    return [
      'Give me a senior-level mock interview question on this topic.',
      'How does this impact my target role ATS match score?',
      'Suggest a 2-day hands-on project to master this concept.',
    ];
  };

  const handleClearHistory = () => {
    if (confirm('Clear current Career Copilot conversation history?')) {
      setMessages([]);
      try {
        localStorage.removeItem('career_compass_copilot_messages');
      } catch {}
      storageAdapter.setChatMessages(isAuth, [], user?.id);
    }
  };

  // Rich markdown parser for assistant messages powered by ReactMarkdown & remarkGfm
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    return (
      <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl sm:text-2xl font-black text-white mt-4 mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm sm:text-base font-bold text-emerald-300 mt-3 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="my-2 leading-relaxed text-zinc-200">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2 my-2.5 ml-1 list-none">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-2 my-2.5 ml-4 list-decimal text-zinc-200">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-2.5 text-zinc-200 leading-relaxed my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-sm" />
                <div className="flex-1">{children}</div>
              </li>
            ),
            hr: () => (
              <hr className="my-4 border-t border-white/15" />
            ),
            code: ({ inline, children, ...props }: any) => {
              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-300 font-mono text-xs border border-white/10"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <pre className="my-3 p-3.5 rounded-xl bg-zinc-950/90 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
                  <code>{children}</code>
                </pre>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-emerald-400 pl-3.5 my-2.5 italic text-zinc-300 bg-white/5 py-1.5 rounded-r-lg">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-zinc-200 border-collapse bg-zinc-950/40">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 bg-white/10 font-bold text-white border-b border-white/10">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border-b border-white/5">{children}</td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-white underline underline-offset-2 decoration-cyan-400/50 hover:decoration-white transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>{children}</span>
                <span className="text-[10px] text-cyan-400 font-normal">↗</span>
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Reusable Prompt Input Card Component
  const renderPromptCard = (isDockedBottom: boolean = false) => (
    <div
      className={`w-full glass-frame rounded-[2rem] border border-white/20 focus-within:border-emerald-400/60 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all duration-300 shadow-2xl ${
        isDockedBottom ? 'p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xl' : 'p-4 sm:p-6'
      }`}
    >
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={isDockedBottom ? 1 : 2}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask anything about your roadmap, interview questions, or skill gaps..."
          className={`w-full bg-transparent resize-none border-none outline-none text-white placeholder-zinc-500 leading-relaxed tracking-wide ${
            isDockedBottom ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          }`}
        />
      </div>

      {/* Action Bar */}
      <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Smart Context Attachment Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Focus Topic Button */}
          <button
            type="button"
            title="Add focus topic"
            onClick={() => setInputQuery((prev) => prev + ' [Focus: System Design]')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition border border-white/10"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Target Role Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium bg-white/10 text-zinc-200 border border-white/10 backdrop-blur-md">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Target: {targetRole}
          </span>

          {/* Priority Missing Skills Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Missing: {missingSkills.slice(0, 2).join(', ')}
          </span>
        </div>

        {/* Right: Circular Send Button (NO voice button) */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isStreaming}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
              inputQuery.trim() && !isStreaming
                ? 'bg-white text-zinc-950 hover:bg-emerald-400 hover:text-zinc-950 font-bold cursor-pointer ring-2 ring-white/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
            }`}
            title="Send Message (Enter)"
          >
            {isStreaming ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Reusable 3 Quick-Launch Action Cards
  const renderQuickLaunchCards = () => (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      {/* Card 1: Interview Insights */}
      <div
        onClick={() => handleSendMessage('Test me with a hard Senior Backend interview scenario on FastAPI async vs sync!')}
        className="glass-frame rounded-[1.75rem] p-5 border border-white/15 hover:border-emerald-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-xl"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#bef264]/20 border border-[#bef264]/40 flex items-center justify-center text-[#bef264] mb-3.5 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="font-bold text-base text-white mb-1 group-hover:text-emerald-300 transition-colors">
          Interview Insights
        </h3>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          Practice scenario-based questions on concurrency, GIL, and failure modes with senior rubrics.
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors font-medium">
          <span>FastAPI & Docker Drills</span>
          <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Card 2: Skill Gap Navigator */}
      <div
        onClick={() => handleSendMessage('Explain why Redis and Kafka are marked as my Priority 1 missing skills for the Senior role.')}
        className="glass-frame rounded-[1.75rem] p-5 border border-white/15 hover:border-emerald-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-xl"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#bef264]/20 border border-[#bef264]/40 flex items-center justify-center text-[#bef264] mb-3.5 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h3 className="font-bold text-base text-white mb-1 group-hover:text-emerald-300 transition-colors">
          Skill Gap Navigator
        </h3>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          Discover why hiring managers mandate distributed caching and streaming architecture.
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors font-medium">
          <span>Priority 1 Gaps (Redis/Kafka)</span>
          <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Card 3: Roadmap Strategy */}
      <div
        onClick={() => handleSendMessage('Give me a concrete hands-on project idea for Week 1 to master FastAPI and Docker.')}
        className="glass-frame rounded-[1.75rem] p-5 border border-white/15 hover:border-emerald-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-xl"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#bef264]/20 border border-[#bef264]/40 flex items-center justify-center text-[#bef264] mb-3.5 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <h3 className="font-bold text-base text-white mb-1 group-hover:text-emerald-300 transition-colors">
          Roadmap Strategy
        </h3>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          Hands-on production projects and verified official documentation for your study plan.
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors font-medium">
          <span>Hands-on Week 1 Project</span>
          <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-hero-quantum text-[#F1F5F9] min-h-screen antialiased flex flex-col justify-between p-3 sm:p-5 lg:p-6 relative overflow-x-hidden">
      
      {/* ================= TOP FLOATING NAVIGATION BAR ================= */}
      <header className="max-w-6xl w-full mx-auto pb-3 shrink-0">
        <div className="glass-frame rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl">
          {/* Brand Logo & Copilot Mode Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-400/40 shadow-inner">
              <svg className="w-4 h-4 text-emerald-400 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7l2.5 5-2.5-1.5L9.5 12 12 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 17l-2.5-5 2.5 1.5 2.5-1.5L12 17z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white leading-none">Career Compass AI</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Career Copilot
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <UserNavPill />

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="glass-pill px-3 py-1.5 rounded-full text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear chat history"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}

            {onBackToGapAnalysis && (
              <button
                type="button"
                onClick={onBackToGapAnalysis}
                className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>←</span>
                <span className="hidden md:inline">Gap Analysis</span>
                <span className="md:hidden">Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= BODY: INITIAL CENTERED vs ACTIVE CHAT ================= */}
      {messages.length === 0 ? (
        /* ================= INITIAL EMPTY STATE (CENTERED PROMPT) ================= */
        <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center items-center space-y-6 sm:space-y-8 py-6">
          {/* Hero Greeting */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 backdrop-blur-md mb-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Parent-Child RAG Online &bull; 484 Pinecone Vectors
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md">
              Hello, <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">{candidateName}</span>
            </h1>
            
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-300">
              Let's accelerate your career transition.
            </p>
            
            <p className="text-sm sm:text-base text-zinc-400/90 max-w-xl mx-auto leading-relaxed">
              Your personal AI Career Copilot for interview preparation, skill gap closure, and roadmap execution.
            </p>
          </div>

          {/* Centered Prompt Card */}
          <div className="w-full">
            {renderPromptCard(false)}
          </div>

          {/* 3 Quick Launch Cards */}
          <div className="w-full">
            {renderQuickLaunchCards()}
          </div>
        </main>
      ) : (
        /* ================= ACTIVE CHAT STATE (MESSAGES ABOVE, PROMPT AT BOTTOM) ================= */
        <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col h-[calc(100vh-130px)] min-h-[500px]">
          
          {/* Scrollable Conversation Thread Container (Takes all space above input) */}
          <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 space-y-5 scrollbar-thin scrollbar-thumb-white/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-sm">
                    AI
                  </div>
                )}

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-[1.5rem] p-4 sm:p-5 leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-md'
                      : 'glass-frame text-zinc-100 border border-white/15 rounded-tl-md'
                  }`}
                >
                  {/* Assistant response rendering with Markdown styling */}
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      renderFormattedContent(msg.content)
                    ) : (
                      <div className="flex items-center gap-2.5 text-zinc-400 py-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Searching Pinecone 3A-K5 & crafting response...</span>
                      </div>
                    )
                  ) : (
                    <div className="whitespace-pre-wrap font-medium text-sm sm:text-base">{msg.content}</div>
                  )}

                  {/* Suggested Follow-up Chips */}
                  {msg.suggested_followups && msg.suggested_followups.length > 0 && !msg.isStreaming && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                        Suggested Follow-ups
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggested_followups.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(chip)}
                            className="px-2.5 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 transition-all text-left flex items-center gap-1.5 group cursor-pointer"
                          >
                            <span>{chip}</span>
                            <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-white/40 text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    You
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* DOCKED BOTTOM INPUT CARD (Fixed below conversation thread) */}
          <div className="pt-2 pb-1 shrink-0">
            {renderPromptCard(true)}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-3 font-mono">
              <span className="hidden sm:inline">Pinecone 3A-K5 &bull; 484 Chunks &bull; Groq Llama 3</span>
              <span className="text-right ml-auto">Grounded in 26 Official Technical Knowledge Base Guides</span>
            </div>
          </div>

        </main>
      )}

      {/* Footer minimal info (only on initial screen to avoid cluttering chat) */}
      {messages.length === 0 && (
        <footer className="max-w-4xl w-full mx-auto text-center pt-4 pb-1 shrink-0">
          <p className="text-[11px] text-zinc-400 font-mono">
            Career Compass AI &bull; Grounded RAG with Parent-Child 3A-K5 &bull; Pinecone Serverless Cloud
          </p>
        </footer>
      )}

    </div>
  );
};
