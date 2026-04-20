// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================

const SEVERITY_COLOR = {
  critical: 'var(--red)',
  high: 'var(--orange)',
  medium: 'var(--amber)',
  low: 'var(--blue)',
};

const SEVERITY_OPACITY = {
  critical: 1,
  high: 0.75,
  medium: 0.55,
  low: 0.35,
};

export default function RiskHeatmap({ risks, onHighlight }) {
  if (!risks || risks.length === 0) return null;

  const ordered = [...risks].sort(
    (a, b) => (a.position?.start ?? 0) - (b.position?.start ?? 0),
  );

  return (
    <div className="card">
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', marginBottom: '1rem', fontFamily: 'DM Mono' }}>
        RISK HEATMAP · BY DOCUMENT POSITION · CLICK TO LOCATE
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {ordered.map((risk, i) => {
          const color = SEVERITY_COLOR[risk.severity] || 'var(--ink-muted)';
          const baseOpacity = SEVERITY_OPACITY[risk.severity] ?? 0.35;
          const tooltip = [
            risk.name,
            risk.section ? `Section: ${risk.section}` : null,
            risk.explanation,
          ]
            .filter(Boolean)
            .join('\n');
          const locate = () => {
            if (typeof onHighlight === 'function' && risk.position?.start != null) {
              onHighlight({ riskId: risk.id, position: risk.position.start });
            }
          };
          return (
            <button
              key={`${risk.id}-${i}`}
              title={tooltip}
              onClick={locate}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: color,
                opacity: baseOpacity,
                cursor: risk.position?.start != null ? 'pointer' : 'default',
                transition: 'opacity 0.2s',
                border: 'none',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = baseOpacity;
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--ink-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase' }}>
              {sev}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
