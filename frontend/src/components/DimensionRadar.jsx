// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';

const DIMENSION_LABELS = {
  liability: 'Liability',
  termination: 'Termination',
  ip: 'IP Rights',
  non_compete: 'Non-Compete',
  dispute: 'Disputes',
  payment: 'Payment',
  confidentiality: 'Confidentiality'
};

export default function DimensionRadar({ dimensionScores }) {
  const { isDark } = useTheme();

  const gridStroke = isDark ? 'rgba(245,237,224,0.12)' : 'rgba(26,20,16,0.1)';
  const tickFill = isDark ? '#a89a87' : '#6b5d4f';
  const radarStroke = isDark ? '#f15f4c' : '#c0392b';
  const radarFill = isDark ? '#f15f4c' : '#c0392b';

  const data = Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
    dimension: label,
    score: dimensionScores?.[key] || 0
  }));

  return (
    <div className="card">
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', marginBottom: '0.5rem', fontFamily: 'DM Mono' }}>
        RISK DIMENSIONS
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke={gridStroke} />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: tickFill, fontSize: 10, fontFamily: 'DM Mono' }} />
          <Radar dataKey="score" stroke={radarStroke} fill={radarFill} fillOpacity={isDark ? 0.18 : 0.12} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
