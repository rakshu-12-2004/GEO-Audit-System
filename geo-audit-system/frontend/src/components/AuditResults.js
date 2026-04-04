import React, { useState } from 'react';
import './AuditResults.css';

const SCHEMA_COLORS = {
  Article:      '#00e5ff',
  Organization: '#7b5ea7',
  Product:      '#ffd166',
  WebPage:      '#00ff9d',
};

const SCHEMA_ICONS = {
  Article:      '📰',
  Organization: '🏢',
  Product:      '🛒',
  WebPage:      '🌐',
};

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--card-accent': accent }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Section({ title, badge, children }) {
  return (
    <div className="result-section">
      <div className="section-header">
        <span className="section-title">{title}</span>
        {badge && <span className="section-badge">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AuditResults({ data }) {
  const [copied, setCopied]     = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const schemaColor = SCHEMA_COLORS[data.schema_type] || '#00e5ff';
  const schemaIcon  = SCHEMA_ICONS[data.schema_type]  || '🌐';
  const schemaJson  = JSON.stringify(data.recommended_schema, null, 2);

  const totalHeadings =
    data.headings.h1.length +
    data.headings.h2.length +
    data.headings.h3.length;

  const copySchema = () => {
    navigator.clipboard.writeText(schemaJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="results-wrap">
      {/* Score bar */}
      <div className="score-bar">
        <div className="score-bar-inner">
          <div className="score-label">
            <span className="score-icon">◈</span>
            Audit Complete
          </div>
          <div className="score-url">{data.url}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard label="Headings Found"  value={totalHeadings}        accent="var(--accent)" />
        <StatCard label="Images Found"    value={data.images.length}   accent="var(--accent2)" />
        <StatCard label="H1 Tags"         value={data.headings.h1.length} accent="var(--green)" />
        <StatCard label="Schema Type"     value={schemaIcon + ' ' + data.schema_type} accent={schemaColor} />
      </div>

      {/* Title & Meta */}
      <Section title="Page Title" badge="SEO">
        <div className="text-value">{data.page_title}</div>
      </Section>

      <Section title="Meta Description" badge="SEO">
        <div className="text-value muted">
          {data.meta_description !== 'No meta description found'
            ? data.meta_description
            : <span className="missing">⚠ No meta description found — add one for better AI citation coverage.</span>}
        </div>
      </Section>

      {/* Headings */}
      <Section title="Heading Structure" badge={`${totalHeadings} headings`}>
        <div className="headings-grid">
          {[['H1', data.headings.h1, 'var(--accent)'],
            ['H2', data.headings.h2, 'var(--accent2)'],
            ['H3', data.headings.h3, 'var(--green)']].map(([tag, items, color]) => (
            <div className="heading-group" key={tag}>
              <div className="heading-tag" style={{ color }}>{tag}</div>
              {items.length === 0
                ? <div className="heading-empty">None found</div>
                : items.map((h, i) => (
                    <div className="heading-item" key={i}>
                      <span className="heading-bullet" style={{ background: color }} />
                      {h}
                    </div>
                  ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Images */}
      <Section title="Images" badge={`${data.images.length} found`}>
        {data.images.length === 0
          ? <div className="missing">No images found on this page.</div>
          : (
            <div className="images-grid">
              {data.images.slice(0, 6).map((src, i) => (
                <div className="img-card" key={i}>
                  {imgErrors[i] ? (
                    <div className="img-error">
                      <span>🖼</span>
                      <span>Preview unavailable</span>
                    </div>
                  ) : (
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      loading="lazy"
                      onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                    />
                  )}
                  <div className="img-url">{src}</div>
                </div>
              ))}
            </div>
          )}
      </Section>

      {/* Schema */}
      <Section title="Recommended JSON-LD Schema" badge={data.schema_type}>
        <div className="schema-type-banner" style={{ '--sc': schemaColor }}>
          <span className="schema-icon">{schemaIcon}</span>
          <div>
            <div className="schema-type-name" style={{ color: schemaColor }}>
              {data.schema_type} Schema
            </div>
            <div className="schema-type-desc">
              {data.schema_type === 'Article' && 'Detected blog/news content — using Article schema for AI readability.'}
              {data.schema_type === 'Organization' && 'Detected company/about page — using Organization schema.'}
              {data.schema_type === 'Product' && 'Detected product/shop page — using Product schema.'}
              {data.schema_type === 'WebPage' && 'Generic page detected — using WebPage schema as fallback.'}
            </div>
          </div>
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copySchema}>
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
        </div>

        <div className="schema-code-wrap">
          <div className="schema-topbar">
            <div className="schema-dots">
              <span /><span /><span />
            </div>
            <span className="schema-filename">schema.json</span>
          </div>
          <pre className="schema-code">
            <code>{schemaJson}</code>
          </pre>
        </div>

        <div className="schema-hint">
          <span className="hint-icon">💡</span>
          Add this script tag inside your page's{' '}
          <code className="inline-code">&lt;head&gt;</code>:
          <code className="hint-code">
            {'<script type="application/ld+json">…</script>'}
          </code>
        </div>
      </Section>
    </div>
  );
}
