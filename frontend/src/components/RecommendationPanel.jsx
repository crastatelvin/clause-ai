// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { motion } from 'framer-motion';

export default function RecommendationPanel({ aiAnalysis }) {
  if (!aiAnalysis) return null;

  return (
    <div className="card">
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', marginBottom: '1.2rem', fontFamily: 'DM Mono' }}>
        🧠 AI LEGAL ANALYSIS
      </div>

      {aiAnalysis.executive_summary && (
        <Section title="EXECUTIVE SUMMARY" color="var(--blue)" accent="var(--blue-border)">
          {aiAnalysis.executive_summary}
        </Section>
      )}

      {aiAnalysis.top_concerns?.length > 0 && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--red)', letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '0.8rem' }}>
            TOP CONCERNS
          </div>
          {aiAnalysis.top_concerns.map((concern, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '0.8rem', background: 'var(--red-light)',
                border: '1px solid var(--red-border)',
                borderLeft: '3px solid var(--red)',
                borderRadius: '4px', marginBottom: '0.6rem'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--red)', marginBottom: '0.3rem' }}>
                {concern.name}
              </div>
              {concern.why && (
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: '0.3rem' }}>
                  {concern.why}
                </p>
              )}
              {concern.action && (
                <div style={{ fontSize: '0.75rem', color: 'var(--green)', background: 'var(--green-light)', padding: '0.4rem 0.6rem', borderRadius: '3px' }}>
                  → {concern.action}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {aiAnalysis.negotiation_leverage && (
        <Section title="NEGOTIATION LEVERAGE" color="var(--green)" accent="var(--green-border)">
          {aiAnalysis.negotiation_leverage}
        </Section>
      )}

      {aiAnalysis.red_flags && (
        <Section title="RED FLAGS" color="var(--red)" accent="var(--red-border)">
          {aiAnalysis.red_flags}
        </Section>
      )}

      {aiAnalysis.overall_verdict && (
        <div style={{
          padding: '0.8rem 1rem',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          marginTop: '0.8rem'
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '0.3rem' }}>
            OVERALL VERDICT
          </div>
          <p className="serif" style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.6 }}>
            "{aiAnalysis.overall_verdict}"
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, accent, children }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <div style={{ fontSize: '0.6rem', color, letterSpacing: '2px', fontFamily: 'DM Mono', marginBottom: '0.4rem' }}>
        {title}
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.7, paddingLeft: '0.8rem', borderLeft: `2px solid ${accent}` }}>
        {children}
      </p>
    </div>
  );
}
