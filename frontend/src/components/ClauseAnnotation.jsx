// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEV = {
  critical: { color: 'var(--red)', bg: 'var(--red-light)', border: 'var(--red-border)', label: 'CRITICAL' },
  high: { color: 'var(--orange)', bg: 'var(--orange-light)', border: 'var(--orange-border)', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-light)', border: 'var(--amber-border)', label: 'MEDIUM' },
  low: { color: 'var(--blue)', bg: 'var(--blue-light)', border: 'var(--blue-border)', label: 'LOW' },
};

export default function ClauseAnnotation({ risk, index, onHighlight }) {
  const [expanded, setExpanded] = useState(false);
  const s = SEV[risk.severity] || SEV.low;

  const handleLocate = (e) => {
    e.stopPropagation();
    if (typeof onHighlight === 'function' && risk.position?.start != null) {
      onHighlight({ riskId: risk.id, position: risk.position.start });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '0.6rem',
        background: 'var(--bg-card)',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.8rem 1rem', background: s.bg, cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: '700', color: s.color,
            fontFamily: 'DM Mono', letterSpacing: '1px',
            padding: '0.15rem 0.4rem', border: `1px solid ${s.border}`, borderRadius: '3px',
            flexShrink: 0,
          }}>
            {s.label}
          </span>
          <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {risk.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {risk.position?.start != null && (
            <button
              onClick={handleLocate}
              title="Jump to this clause in the document"
              style={{
                background: 'transparent',
                border: `1px solid ${s.border}`,
                color: s.color,
                padding: '2px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                fontFamily: 'DM Mono',
                letterSpacing: '1px',
              }}
            >
              ↪ LOCATE
            </button>
          )}
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ background: 'var(--bg-card)', padding: '1rem', borderTop: `1px solid ${s.border}` }}
          >
            {risk.section && (
              <div style={{
                fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '2px',
                fontFamily: 'DM Mono', marginBottom: '0.4rem'
              }}>
                FOUND IN: {risk.section}
              </div>
            )}

            {risk.excerpt && (
              <div style={{
                fontFamily: 'IBM Plex Serif, serif', fontSize: '0.8rem', color: 'var(--ink-soft)',
                background: 'var(--bg-subtle)', padding: '0.7rem', borderRadius: '4px',
                marginBottom: '0.8rem', lineHeight: 1.7, fontStyle: 'italic',
                borderLeft: '2px solid var(--border-strong)',
              }}>
                "...{risk.excerpt}..."
              </div>
            )}

            <div style={{ marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '2px', fontFamily: 'DM Mono' }}>WHY THIS MATTERS</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.2rem', lineHeight: 1.6 }}>{risk.explanation}</p>
            </div>

            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-border)', borderRadius: '4px', padding: '0.6rem 0.8rem' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--green)', letterSpacing: '2px', fontFamily: 'DM Mono' }}>RECOMMENDED ACTION</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.2rem', lineHeight: 1.6 }}>{risk.recommendation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
