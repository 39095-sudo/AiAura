"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, User, Bot, Loader2, Plus, MessageSquare, PanelLeftClose, PanelLeft, Trash2 } from "lucide-react";
import { sendMessage, getChatHistory, getChatSessions, deleteChatSession } from "@/lib/api";
import { getItem, setItem } from "@/lib/storage";
import { ChatMessage, ChatSession } from "@/lib/types";

function generateSessionId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getStoredSessionId() {
  if (typeof window === "undefined") return generateSessionId();
  const stored = getItem("chat_session_id");
  if (stored) return stored;
  const newId = generateSessionId();
  setItem("chat_session_id", newId);
  return newId;
}

function renderMessage(text: string) {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSessions = useCallback(() => {
    getChatSessions().then(setSessions).catch(() => {});
  }, []);
  const loadHistory = useCallback((sid: string) => {
    getChatHistory(sid)
      .then((h: ChatMessage[]) => setMessages(h.length > 0 ? h : []))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => { loadHistory(sessionId); loadSessions(); }, [sessionId, loadHistory, loadSessions]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleNewChat = () => {
    const newId = generateSessionId();
    setItem("chat_session_id", newId);
    setSessionId(newId);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };
  const handleSelectSession = (sid: string) => {
    localStorage.setItem("chat_session_id", sid);
    setSessionId(sid);
    setSidebarOpen(false);
  };
  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sid);
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
      if (sid === sessionId) handleNewChat();
    } catch { /* ignore */ }
  };
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (trimmed.length > 2000) {
      setMessages((prev) => [...prev, { role: "assistant", message: "Your message is too long. Please keep it under 2000 characters." }]);
      return;
    }
    setMessages((prev) => [...prev, { role: "guest", message: trimmed }]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await sendMessage(trimmed, sessionId);
      setMessages((prev) => [...prev, { role: "assistant", message: res.reply }]);
      loadSessions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [...prev, { role: "assistant", message: `I'm sorry, there was an issue: ${msg}. Please try again.` }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const welcomeMsg: ChatMessage = {
    role: "assistant",
    message:
      "Welcome to **The Grand Hotel**! I'm your personal AI concierge.\n\n" +
      "I can assist you with:\n" +
      "- Room service orders\n" +
      "- Housekeeping requests\n" +
      "- Restaurant reservations\n" +
      "- Local recommendations\n" +
      "- Any concerns or feedback\n\n" +
      "Please share your room number and how I may help you today.",
  };
  const allMessages = messages.length === 0 ? [welcomeMsg] : messages;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-200 overflow-hidden bg-white border-r border-border flex-shrink-0`}>
        <div className="w-72 h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between bg-surface-hover">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Conversations</span>
            <button onClick={handleNewChat} className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-primary-dark bg-accent/20 hover:bg-accent/30 rounded transition-colors">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No conversations yet</p>
            ) : sessions.map((s) => (
              <button key={s.session_id} onClick={() => handleSelectSession(s.session_id)}
                className={`group w-full text-left px-3 py-2.5 border-b border-border/40 hover:bg-surface-hover transition-colors ${s.session_id === sessionId ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}>
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground truncate leading-tight">{s.preview}</p>
                    <p className="text-[10px] text-muted mt-0.5">{s.message_count} msgs{s.started_at && ` · ${new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</p>
                  </div>
                  <button onClick={(e) => handleDeleteSession(s.session_id, e)} className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f3ef]">
        {/* Header */}
        <div className="bg-white border-b border-border px-4 py-2 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-muted">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success pulse-dot" />
            <span className="text-[13px] font-medium text-foreground">AI Concierge</span>
            <span className="text-[11px] text-muted">— Online</span>
          </div>
          <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-primary border border-primary/20 hover:bg-primary/5 rounded-md transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {allMessages.map((msg, i) => (
            <div key={i} className={`chat-bubble flex gap-2.5 ${msg.role === "guest" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[70%] px-4 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "guest"
                  ? "bg-primary text-white rounded-2xl rounded-br-sm shadow-sm"
                  : "bg-white text-foreground rounded-2xl rounded-bl-sm shadow-sm border border-border/60"
              }`}>
                {renderMessage(msg.message)}
              </div>
              {msg.role === "guest" && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-white border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="typing-dot w-1.5 h-1.5 bg-muted rounded-full" />
                  <div className="typing-dot w-1.5 h-1.5 bg-muted rounded-full" />
                  <div className="typing-dot w-1.5 h-1.5 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-border px-4 py-3">
          <div className="flex items-center gap-2.5 max-w-3xl mx-auto">
            <input ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your request... (e.g., 'I'm in room 405, send extra towels')"
              className="flex-1 px-4 py-2.5 bg-[#f5f3ef] border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted/60"
              disabled={isLoading} />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-primary hover:bg-primary-light disabled:bg-border disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-all">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
