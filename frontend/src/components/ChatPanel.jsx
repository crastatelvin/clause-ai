// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SUGGESTED_PROMPTS = [
  'What are the most dangerous clauses for me to sign?',
  'Which clauses do I have the most leverage to negotiate?',
  'Explain the termination terms in plain English.',
  'What standard protections is this contract missing?',
];

export default function ChatPanel({ requestId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming || !requestId) return;

    const userMsg = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '', pending: true }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          message: trimmed,
          history: messages.filter((m) => !m.pending).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Chat failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: acc || '(no response)' };
        return copy;
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: `⚠ ${err.message || 'Chat failed.'}`,
          error: true,
        };
        return copy;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', fontFamily: 'DM Mono' }}>
          ASK CLAUSE · FOLLOW-UP QUESTIONS
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              background: 'transparent', border: '1px solid var(--border-strong)',
              color: 'var(--ink-muted)', padding: '2px 10px', borderRadius: '4px',
              cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'DM Mono'
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        style={{
          maxHeight: '280px', overflowY: 'auto', marginBottom: '0.6rem',
          padding: messages.length === 0 ? 0 : '0.2rem',
        }}
      >
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.8rem' }}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                disabled={!requestId}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--ink-soft)',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  cursor: requestId ? 'pointer' : 'not-allowed',
                  fontSize: '0.72rem',
                  fontFamily: 'IBM Plex Serif, serif',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '0.4rem',
              }}
            >
              <div style={{
                maxWidth: '82%',
                padding: '0.55rem 0.8rem',
                borderRadius: '10px',
                background: isUser
                  ? 'var(--user-msg-bg)'
                  : (m.error ? 'var(--red-light)' : 'var(--bg-card)'),
                color: isUser
                  ? 'var(--user-msg-fg)'
                  : (m.error ? 'var(--red)' : 'var(--ink-soft)'),
                fontSize: '0.82rem',
                lineHeight: 1.55,
                fontFamily: isUser ? 'DM Mono, monospace' : 'IBM Plex Serif, serif',
                whiteSpace: 'pre-wrap',
                border: isUser
                  ? 'none'
                  : `1px solid ${m.error ? 'var(--red-border)' : 'var(--border)'}`,
              }}>
                {m.content}
                {m.pending && !m.content && (
                  <span style={{ opacity: 0.5 }}>thinking…</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={requestId ? 'Ask about this contract…' : 'Analyze a document first to enable chat.'}
          disabled={!requestId || streaming}
          style={{
            flex: 1,
            resize: 'vertical',
            minHeight: '44px',
            maxHeight: '140px',
            padding: '0.55rem 0.7rem',
            border: '1px solid var(--border-strong)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontFamily: 'IBM Plex Serif, serif',
            background: 'var(--bg-input)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || streaming || !requestId}
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 'none',
            padding: '0.55rem 1rem',
            borderRadius: '6px',
            cursor: streaming ? 'wait' : 'pointer',
            fontSize: '0.72rem',
            fontFamily: 'DM Mono',
            letterSpacing: '1px',
            opacity: !input.trim() || streaming || !requestId ? 0.5 : 1,
          }}
        >
          {streaming ? '⋯' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
