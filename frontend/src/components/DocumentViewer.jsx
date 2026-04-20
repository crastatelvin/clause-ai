// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useEffect, useRef, useState } from 'react';

function clauseIndexForPosition(clauses, position) {
  if (!clauses || position == null) return -1;
  for (let i = 0; i < clauses.length; i++) {
    const c = clauses[i];
    if (c.start == null || c.end == null) continue;
    if (position >= c.start && position <= c.end) return i;
  }
  // Fallback: nearest earlier clause.
  let best = -1;
  let bestStart = -Infinity;
  for (let i = 0; i < clauses.length; i++) {
    const start = clauses[i].start ?? 0;
    if (start <= position && start > bestStart) {
      best = i;
      bestStart = start;
    }
  }
  return best;
}

export default function DocumentViewer({ clauses, sections, highlight, onHandled }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const clauseRefs = useRef({});
  const [flashIndex, setFlashIndex] = useState(-1);

  useEffect(() => {
    if (!highlight) return;
    setOpen(true);
    const idx = clauseIndexForPosition(clauses, highlight.position);
    if (idx < 0) return;
    setFlashIndex(idx);
    // Defer scroll until after re-render so the clause is actually in the DOM.
    const handle = requestAnimationFrame(() => {
      const node = clauseRefs.current[idx];
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    const clear = setTimeout(() => setFlashIndex(-1), 1800);
    if (typeof onHandled === 'function') onHandled();
    return () => {
      cancelAnimationFrame(handle);
      clearTimeout(clear);
    };
  }, [highlight, clauses, onHandled]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', fontFamily: 'DM Mono' }}>
          DOCUMENT STRUCTURE ({clauses?.length || 0} sections)
        </div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: 'transparent', border: '1px solid var(--border-strong)',
            color: 'var(--ink-muted)', padding: '4px 12px', borderRadius: '4px',
            cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'DM Mono'
          }}
        >
          {open ? 'HIDE' : 'VIEW'}
        </button>
      </div>

      {open && (
        <div ref={containerRef} style={{ marginTop: '1rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
          {sections && sections.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '0.5rem' }}>
                SECTIONS DETECTED
              </div>
              {sections.map((s, i) => (
                <div key={i} style={{
                  fontSize: '0.78rem', color: 'var(--ink)', padding: '4px 8px',
                  borderLeft: '2px solid var(--border-strong)', marginBottom: '2px',
                  fontFamily: 'DM Mono'
                }}>
                  {typeof s === 'string' ? s : s.title}
                </div>
              ))}
            </div>
          )}
          {clauses && clauses.map((clause, i) => {
            const isFlashing = i === flashIndex;
            return (
              <div
                key={i}
                ref={(el) => { clauseRefs.current[i] = el; }}
                style={{
                  padding: '0.7rem',
                  background: isFlashing ? 'var(--red-light)' : 'var(--bg-subtle)',
                  border: isFlashing ? '1px solid var(--red-border)' : '1px solid transparent',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.6,
                  fontFamily: 'IBM Plex Serif, serif',
                  transition: 'background 400ms ease, border-color 400ms ease',
                }}
              >
                <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', fontFamily: 'DM Mono', marginBottom: '4px' }}>
                  CLAUSE {i + 1} · {clause.type?.toUpperCase()}
                </div>
                {clause.text?.slice(0, 300)}...
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
