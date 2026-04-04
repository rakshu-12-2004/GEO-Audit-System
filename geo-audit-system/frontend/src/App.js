import React, { useState } from 'react';
import './App.css';
import AuditForm from './components/AuditForm';
import AuditResults from './components/AuditResults';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const runAudit = async (url) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Audit failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Grid background */}
      <div className="grid-bg" aria-hidden />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">GEO<span className="logo-accent">AUDIT</span></span>
          </div>
          <div className="header-badge">
            <span className="pulse-dot" />
            AI Citation Readiness Scanner
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-label">GENERATIVE ENGINE OPTIMIZATION</div>
        <h1 className="hero-title">
          Audit Your Page for<br />
          <span className="gradient-text">AI Visibility</span>
        </h1>
        <p className="hero-subtitle">
          Extract structured SEO signals and generate schema.org JSON-LD
          to ensure your content is cited by AI search engines.
        </p>
      </section>

      {/* Main */}
      <main className="main">
        <AuditForm onSubmit={runAudit} loading={loading} />

        {error && (
          <div className="error-card">
            <span className="error-icon">⚠</span>
            <div>
              <strong>Audit Failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && <AuditResults data={result} />}
      </main>

      <footer className="footer">
        <span>GEO Audit System</span>
        <span className="footer-sep">·</span>
        <span>Powered by FastAPI + React</span>
        <span className="footer-sep">·</span>
        <span>schema.org JSON-LD</span>
      </footer>
    </div>
  );
}
