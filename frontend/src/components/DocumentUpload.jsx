// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { analyzeDocument } from '../services/api';
import ThemeToggle from './ThemeToggle';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

function makeRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function DocumentUpload({ onAnalysisComplete }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setProgress('Connecting...');

    const requestId = makeRequestId();

    let ws = null;
    try {
      ws = new WebSocket(`${WS_URL}?request_id=${requestId}`);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.step === 'connected') return;
          if (data.message) setProgress(data.message);
        } catch {
          /* ignore malformed progress frames */
        }
      };
    } catch {
      /* WebSocket failures shouldn't block analysis itself */
    }

    try {
      const result = await analyzeDocument(file, { requestId });
      onAnalysisComplete(result);
    } catch (err) {
      setError(err?.message || 'Analysis failed. Please try again.');
      setLoading(false);
    } finally {
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      position: 'relative', zIndex: 1
    }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 2 }}>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <div style={{ fontSize: '0.65rem', color: 'var(--ink-muted)', letterSpacing: '5px', fontFamily: 'DM Mono', marginBottom: '0.8rem' }}>
          AI CONTRACT INTELLIGENCE
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '700', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '0.8rem' }}>
          CLAUSE
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '1rem', maxWidth: '440px', lineHeight: 1.7 }}>
          Upload any contract or legal document. AI reads every clause, flags every risk, and tells you exactly what to watch out for.
        </p>
        <div style={{ width: '60px', height: '2px', background: 'var(--red)', margin: '1.2rem auto 0' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          width: '100%', maxWidth: '500px',
          border: `1px dashed ${dragging ? 'var(--red)' : 'var(--border-strong)'}`,
          borderRadius: '8px', padding: '3rem 2rem', textAlign: 'center',
          background: dragging ? 'var(--red-light)' : 'var(--bg-card)',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: dragging ? '0 0 30px var(--red-strong)' : 'var(--shadow)'
        }}
      >
        {loading ? (
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '2rem', marginBottom: '1rem', display: 'inline-block', color: 'var(--red)' }}
            >
              ◌
            </motion.div>
            <div className="serif" style={{ color: 'var(--ink)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Analyzing document...
            </div>
            <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', fontFamily: 'DM Mono' }}>{progress}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--ink-faint)' }}>⚖</div>
            <div className="serif" style={{ color: 'var(--ink)', fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: '600' }}>
              Drop your contract here
            </div>
            <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', marginBottom: '1.5rem', fontFamily: 'DM Mono' }}>
              PDF • TXT • DOCX
            </div>
            <label style={{
              background: 'var(--ink)', color: 'var(--bg)',
              padding: '0.6rem 1.5rem', borderRadius: '4px',
              cursor: 'pointer', fontSize: '0.78rem',
              fontFamily: 'DM Mono', letterSpacing: '1px', fontWeight: '500'
            }}>
              SELECT FILE
              <input type="file" accept=".pdf,.txt,.docx,.md" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            </label>
          </>
        )}
        {error && <div style={{ color: 'var(--red)', marginTop: '1rem', fontSize: '0.75rem', fontFamily: 'DM Mono' }}>{error}</div>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: '1.5rem', color: 'var(--ink-muted)', fontSize: '0.7rem', fontFamily: 'DM Mono', textAlign: 'center' }}
      >
        Try sample_docs/sample_employment.txt to test
      </motion.div>

      <div style={{ position: 'fixed', bottom: '1rem', color: 'var(--ink-faint)', fontSize: '0.65rem', fontFamily: 'DM Mono' }}>
        Built by Telvin Crasta • CC BY-NC 4.0
      </div>
    </div>
  );
}
