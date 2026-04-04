import React, { useState } from 'react';
import './AuditForm.css';

const EXAMPLES = [
  'https://openai.com/blog',
  'https://stripe.com/about',
  'https://tailwindcss.com',
];

export default function AuditForm({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <div className="form-card">
      <div className="form-card-top">
        <span className="form-card-label">ENTER URL TO AUDIT</span>
      </div>

      <form className="audit-form" onSubmit={handleSubmit}>
        <div className={`input-wrap ${loading ? 'loading' : ''}`}>
          <span className="input-prefix">https://</span>
          <input
            type="text"
            className="url-input"
            placeholder="example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            autoComplete="off"
            spellCheck="false"
          />
          {loading && (
            <div className="input-spinner">
              <span className="spinner-ring" />
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`audit-btn ${loading ? 'btn-loading' : ''}`}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Scanning…
            </>
          ) : (
            <>
              <span className="btn-icon">◈</span>
              Run GEO Audit
            </>
          )}
        </button>
      </form>

      <div className="examples-row">
        <span className="examples-label">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="example-chip"
            onClick={() => setUrl(ex)}
            disabled={loading}
          >
            {ex.replace('https://', '')}
          </button>
        ))}
      </div>
    </div>
  );
}
