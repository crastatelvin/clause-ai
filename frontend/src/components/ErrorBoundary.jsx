// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta | CC BY-NC 4.0
// ============================================
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[CLAUSE] Uncaught UI error', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    if (typeof this.props.onReset === 'function') this.props.onReset();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', fontFamily: 'Syne, sans-serif', background: 'var(--bg)'
      }}>
        <div className="card" style={{ maxWidth: '520px' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--red)', letterSpacing: '4px', fontFamily: 'DM Mono', marginBottom: '0.6rem' }}>
            SOMETHING BROKE
          </div>
          <h1 className="serif" style={{ fontSize: '1.4rem', color: 'var(--ink)', marginBottom: '0.8rem' }}>
            The interface hit an error.
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: 'var(--ink)', color: 'var(--bg)', border: 'none',
              padding: '0.55rem 1.2rem', borderRadius: '4px', cursor: 'pointer',
              fontSize: '0.72rem', fontFamily: 'DM Mono', letterSpacing: '1px'
            }}
          >
            ↺ TRY AGAIN
          </button>
        </div>
      </div>
    );
  }
}
