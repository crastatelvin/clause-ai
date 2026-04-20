// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { motion } from 'framer-motion';

export default function RiskSummaryBar({ riskScore, docInfo }) {
  const counts = [
    { label: 'CRITICAL', count: riskScore.critical, color: 'var(--red)' },
    { label: 'HIGH', count: riskScore.high, color: 'var(--orange)' },
    { label: 'MEDIUM', count: riskScore.medium, color: 'var(--amber)' },
    { label: 'LOW', count: riskScore.low, color: 'var(--blue)' }
  ];

  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', fontFamily: 'DM Mono', marginBottom: '0.2rem' }}>
          DOCUMENT ANALYZED
        </div>
        <div className="serif" style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--ink)' }}>
          {docInfo?.document_type || 'Contract'} — {docInfo?.filename}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontFamily: 'DM Mono', marginTop: '0.2rem' }}>
          {docInfo?.word_count?.toLocaleString()} words • {riskScore.total} risks found
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {counts.map(({ label, count, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color, fontFamily: 'Syne' }}>{count}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--ink-muted)', letterSpacing: '1px', fontFamily: 'DM Mono' }}>{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
