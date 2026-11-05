"use client";
// src/components/chat/ChatPanel.tsx
import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import type { ChatMessage } from "@/lib/ai/chatSchema";

// ── Prompt chips shown when chat is empty ─────────────────────────────────────
const PROMPT_CHIPS = [
  "What objections should I expect?",
  "What should I say to open the call?",
  "What questions should I ask?",
  "Summarise this lead for me.",
  "Is a site visit recommended?",
  "What is the customer's budget clarity?",
];

// ── Single message bubble with copy action ────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className="flex flex-col gap-1 max-w-[82%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
            }`}
        >
          {msg.content}
        </div>
        {/* Copy button — visible on hover */}
        <button
          onClick={handleCopy}
          className={`self-${isUser ? "end" : "start"} text-[10px] text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {copied ? "✅ Copied" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── Main ChatPanel ────────────────────────────────────────────────────────────
export default function ChatPanel() {
  const { selectedLead, messages, setMessages, clearMessages, addMessage, setChatOpen } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load persisted history when lead changes
  useEffect(() => {
    if (!selectedLead) return;
    setHistoryLoaded(false);
    clearMessages();

    fetch(`/api/leads/${selectedLead.id}/chat`)
      .then((r) => r.json())
      .then((data: { messages?: ChatMessage[] }) => {
        setMessages(data.messages ?? []);
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLead?.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || !selectedLead) return;
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const res = await fetch(`/api/leads/${selectedLead.id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string })?.error ?? `Server error ${res.status}`);
        }

        const data = await res.json() as { userMessage: ChatMessage; assistantMessage: ChatMessage };
        addMessage(data.userMessage);
        addMessage(data.assistantMessage);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [loading, selectedLead, addMessage]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input.trim());
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!selectedLead) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-gray-200 p-6">
        <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm text-gray-400 text-center">Select a lead to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200">
      {/* Header with Close Toggle */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">💬 ChatBot  | client :  {selectedLead.name}</p>
          <p className="text-xs text-gray-400">{selectedLead.location}</p>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="hidden md:flex h-6 w-6 rounded-md hover:bg-gray-100 items-center justify-center text-gray-400 hover:text-gray-700 transition"
          title="Close Chat Panel"
        >
          ✕
        </button>
      </div>

      {/* Messages area with custom pattern background between header and input */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 bg-repeat"
        style={{
          backgroundImage: "url('/chat-bg.jpg?v=2')",
          backgroundSize: "300px auto",
          backgroundColor: "#f4f3fa",
        }}
      >

        {/* Prompt chips — show only when no messages yet */}
        {messages.length === 0 && historyLoaded && (
          <div className="mb-4">
            <p className="text-center text-xs text-gray-400 mb-3">Ask anything about this lead…</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading history skeleton */}
        {!historyLoaded && (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-8 w-3/4 rounded-xl bg-gray-200" />
            <div className="h-8 w-1/2 rounded-xl bg-gray-100 self-end" />
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <MessageBubble key={`${msg.id}-${idx}`} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
            ⚠ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-200 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask about this lead…"
          className="flex-1 rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
