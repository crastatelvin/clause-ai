// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useState } from 'react';

export default function ComparisonMode({ risks }) {
  const [selected, setSelected] = useState(null);

  if (!risks || risks.length === 0) return null;

  const risk = selected !== null ? risks[selected] : null;

  return (
    <div className="card">
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', marginBottom: '1rem', fontFamily: 'DM Mono' }}>
        CLAUSE COMPARISON — BEFORE / AFTER
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {risks.map((r, i) => (
          <button
            key={i}
            onClick={() => setSelected(i === selected ? null : i)}
            style={{
              padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
              fontSize: '0.65rem', fontFamily: 'DM Mono', letterSpacing: '0.5px',
              border: `1px solid ${selected === i ? 'var(--red)' : 'var(--border-strong)'}`,
              background: selected === i ? 'var(--red-light)' : 'transparent',
              color: selected === i ? 'var(--red)' : 'var(--ink-muted)'
            }}
          >
            {r.name}
          </button>
        ))}
      </div>

      {risk && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--red)', letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '6px' }}>
              ✗ CURRENT (RISKY)
            </div>
            <div style={{
              background: 'var(--red-light)', border: '1px solid var(--red-border)',
              borderRadius: '6px', padding: '12px',
              fontFamily: 'IBM Plex Serif, serif', fontSize: '0.78rem',
              color: 'var(--ink-soft)', lineHeight: 1.7, fontStyle: 'italic'
            }}>
              {risk.excerpt ? `"...${risk.excerpt}..."` : `[${risk.name} clause — risk identified]`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--green)', letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '6px' }}>
              ✓ RECOMMENDED FIX
            </div>
            <div style={{
              background: 'var(--green-light)', border: '1px solid var(--green-border)',
              borderRadius: '6px', padding: '12px',
              fontFamily: 'IBM Plex Serif, serif', fontSize: '0.78rem',
              color: 'var(--ink-soft)', lineHeight: 1.7
            }}>
              {risk.recommendation}
            </div>
          </div>
        </div>
      )}

      {!risk && (
        <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', fontFamily: 'DM Mono', padding: '8px' }}>
          Select a risk above to see before/after comparison.
        </div>
      )}
    </div>
  );
}
