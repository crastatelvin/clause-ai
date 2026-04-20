// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { motion } from 'framer-motion';

const LEVEL_COLORS = {
  CRITICAL: 'var(--red)',
  HIGH: 'var(--orange)',
  MEDIUM: 'var(--amber)',
  LOW: 'var(--green)'
};

const LEVEL_BG = {
  CRITICAL: 'var(--red-light)',
  HIGH: 'var(--orange-light)',
  MEDIUM: 'var(--amber-light)',
  LOW: 'var(--green-light)'
};

const LEVEL_BORDER = {
  CRITICAL: 'var(--red-border)',
  HIGH: 'var(--orange-border)',
  MEDIUM: 'var(--amber-border)',
  LOW: 'var(--green-border)'
};

export default function RiskScoreGauge({ score, level }) {
  const color = LEVEL_COLORS[level] || 'var(--ink-muted)';
  const bg = LEVEL_BG[level] || 'var(--bg-subtle)';
  const border = LEVEL_BORDER[level] || 'var(--border-strong)';
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            strokeWidth="8"
            style={{ stroke: 'var(--border)' }}
          />
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ stroke: color }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color, fontFamily: 'Syne' }}>{score}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '2px', fontFamily: 'DM Mono' }}>/ 100</div>
        </div>
      </div>
      <div style={{
        padding: '0.3rem 0.8rem',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: '700',
        color,
        fontFamily: 'DM Mono',
        letterSpacing: '2px'
      }}>
        {level} RISK
      </div>
    </div>
  );
}
