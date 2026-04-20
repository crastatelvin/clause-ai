// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { useState } from 'react';
import './styles/globals.css';
import DocumentUpload from './components/DocumentUpload';
import AnalysisPage from './pages/AnalysisPage';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [result, setResult] = useState(null);
  return (
    <ErrorBoundary onReset={() => setResult(null)}>
      {result ? (
        <AnalysisPage result={result} onReset={() => setResult(null)} />
      ) : (
        <DocumentUpload onAnalysisComplete={setResult} />
      )}
    </ErrorBoundary>
  );
}
