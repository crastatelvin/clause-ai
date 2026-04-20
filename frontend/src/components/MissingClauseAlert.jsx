// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { motion } from 'framer-motion';

const IMPORTANCE_COLORS = {
  critical: 'var(--red)',
  high: 'var(--orange)',
  medium: 'var(--amber)'
};

export default function MissingClauseAlert({ missingClauses }) {
  if (!missingClauses || missingClauses.length === 0) return null;

  return (
    <div className="card" style={{ borderColor: 'var(--red-border)' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--red)', letterSpacing: '3px', marginBottom: '1rem', fontFamily: 'DM Mono' }}>
        ⚠ MISSING STANDARD PROTECTIONS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
        {missingClauses.map((clause, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.7rem',
              background: 'var(--red-light)',
              border: '1px solid var(--red-border)',
              borderRadius: '6px',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ color: IMPORTANCE_COLORS[clause.importance] || 'var(--ink-muted)', fontSize: '0.9rem' }}>⊘</span>
            <span style={{ color: 'var(--ink-soft)', fontWeight: '500' }}>{clause.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
