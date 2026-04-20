// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================

export default function ExportReport({ result }) {
  const handleExport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const { document: docInfo, risk_score, risks, missing_clauses, ai_analysis } = result;

      // Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CLAUSE — Contract Risk Report', 20, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Document: ${docInfo?.filename}`, 20, 32);
      doc.text(`Type: ${docInfo?.document_type || 'Contract'}`, 20, 40);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 48);

      // Risk Score
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Overall Risk Score: ${risk_score?.overall}/100 (${risk_score?.level})`, 20, 62);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Critical: ${risk_score?.critical}  High: ${risk_score?.high}  Medium: ${risk_score?.medium}  Low: ${risk_score?.low}`, 20, 72);

      // Executive Summary
      if (ai_analysis?.executive_summary) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Executive Summary', 20, 86);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(ai_analysis.executive_summary, 170);
        doc.text(summaryLines, 20, 96);
      }

      // Detected Risks
      let y = 130;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detected Risks', 20, y);
      y += 10;

      for (const risk of (risks || []).slice(0, 8)) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`[${risk.severity.toUpperCase()}] ${risk.name}`, 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(risk.explanation, 170);
        doc.text(lines, 20, y);
        y += lines.length * 4 + 4;
        const recLines = doc.splitTextToSize(`Action: ${risk.recommendation}`, 170);
        doc.text(recLines, 20, y);
        y += recLines.length * 4 + 8;
      }

      // Overall Verdict
      if (ai_analysis?.overall_verdict) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Verdict', 20, y + 10);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        const verdictLines = doc.splitTextToSize(`"${ai_analysis.overall_verdict}"`, 170);
        doc.text(verdictLines, 20, y + 20);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Built by Telvin Crasta · CLAUSE AI · CC BY-NC 4.0', 20, 290);
      }

      doc.save(`CLAUSE_Report_${docInfo?.filename || 'contract'}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      style={{
        background: 'var(--ink)',
        color: 'var(--bg)',
        border: 'none',
        padding: '0.5rem 1.2rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontFamily: 'DM Mono',
        letterSpacing: '1px',
        fontWeight: '500'
      }}
    >
      ↓ EXPORT PDF
    </button>
  );
}
