export default function Separator({ orientation = 'horizontal', className = '' }) {
  return <div className={`separator separator-${orientation} ${className}`.trim()} role="separator" aria-orientation={orientation} />;
}
