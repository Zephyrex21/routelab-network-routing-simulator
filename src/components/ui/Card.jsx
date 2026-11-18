export function Card({ children, className = '', padding = 'md', as: Element = 'section', ...props }) {
  return <Element className={`card card-${padding} ${className}`.trim()} {...props}>{children}</Element>;
}

export function CardHeading({ eyebrow, title, action, description }) {
  return (
    <div className="card-heading">
      <div className="card-heading-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="card-heading-description">{description}</p>}
      </div>
      {action && <div className="card-heading-action">{action}</div>}
    </div>
  );
}
