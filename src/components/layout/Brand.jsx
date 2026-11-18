export default function Brand({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-compact' : ''}`}>
      <svg className="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
        <path d="M10 10 26 10 26 26 10 26Z" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".42" />
        <path d="M10 10 18 18 26 10M18 18 10 26M18 18 26 26" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="10" cy="10" r="3" fill="var(--accent)" />
        <circle cx="26" cy="10" r="3" fill="currentColor" />
        <circle cx="18" cy="18" r="3" fill="var(--accent)" />
        <circle cx="10" cy="26" r="3" fill="currentColor" />
        <circle cx="26" cy="26" r="3" fill="currentColor" />
      </svg>
      {!compact && <span className="brand-word">Route<span>Lab</span></span>}
    </span>
  );
}
