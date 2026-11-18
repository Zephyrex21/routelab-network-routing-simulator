export default function PageHeader({ eyebrow, title, description, actions, compact = false }) {
  return (
    <div className={`page-header ${compact ? 'page-header-compact' : ''}`}>
      <div className="page-header-copy">
        {eyebrow && <div className="eyebrow muted">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
