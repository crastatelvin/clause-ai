// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useState } from 'react';
import RiskScoreGauge from '../components/RiskScoreGauge';
import RiskSummaryBar from '../components/RiskSummaryBar';
import ClauseAnnotation from '../components/ClauseAnnotation';
import DimensionRadar from '../components/DimensionRadar';
import MissingClauseAlert from '../components/MissingClauseAlert';
import RecommendationPanel from '../components/RecommendationPanel';
import RiskHeatmap from '../components/RiskHeatmap';
import DocumentViewer from '../components/DocumentViewer';
import ExportReport from '../components/ExportReport';
import ComparisonMode from '../components/ComparisonMode';
import ChatPanel from '../components/ChatPanel';
import ThemeToggle from '../components/ThemeToggle';

export default function AnalysisPage({ result, onReset }) {
  const {
    document: doc,
    risk_score,
    risks,
    missing_clauses,
    dimension_scores,
    ai_analysis,
    clauses,
    sections,
    request_id: requestId,
  } = result;

  const [highlight, setHighlight] = useState(null);

  const handleHighlight = ({ riskId, position }) => {
    setHighlight({ riskId, position, stamp: Date.now() });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', position: 'relative', zIndex: 1 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '4px', fontFamily: 'DM Mono', marginBottom: '0.2rem' }}>
            CLAUSE AI ANALYSIS
          </div>
          <h1 className="serif" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ink)' }}>
            {doc?.document_type || 'Contract'} Risk Report
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <ExportReport result={result} />
          <button onClick={onReset} style={{
            background: 'transparent', border: '1px solid var(--border-strong)',
            color: 'var(--ink-muted)', padding: '0.5rem 1rem', borderRadius: '4px',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'DM Mono'
          }}>
            ← NEW DOCUMENT
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <RiskSummaryBar riskScore={risk_score} docInfo={doc} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiskScoreGauge score={risk_score?.overall} level={risk_score?.level} />
        </div>
        <DimensionRadar dimensionScores={dimension_scores} />
        <MissingClauseAlert missingClauses={missing_clauses} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', letterSpacing: '3px', marginBottom: '1rem', fontFamily: 'DM Mono' }}>
            DETECTED RISKS ({risks?.length || 0}) · CLICK LOCATE TO JUMP
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {risks?.length > 0 ? (
              risks.map((risk, i) => (
                <ClauseAnnotation key={i} risk={risk} index={i} onHighlight={handleHighlight} />
              ))
            ) : (
              <div style={{ color: 'var(--green)', fontSize: '0.85rem', padding: '1rem', background: 'var(--green-light)', borderRadius: '6px', border: '1px solid var(--green-border)' }}>
                ✓ No major risk patterns detected in this document.
              </div>
            )}
          </div>
        </div>

        <RecommendationPanel aiAnalysis={ai_analysis} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <RiskHeatmap risks={risks} onHighlight={handleHighlight} />
        <ComparisonMode risks={risks} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <DocumentViewer
          clauses={clauses}
          sections={sections}
          highlight={highlight}
          onHandled={() => { /* keep state for repeat clicks via stamp */ }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <ChatPanel requestId={requestId} />
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--ink-faint)', fontSize: '0.65rem', fontFamily: 'DM Mono' }}>
        Built by Telvin Crasta • CC BY-NC 4.0 • github.com/crastatelvin
      </div>
    </div>
  );
}
