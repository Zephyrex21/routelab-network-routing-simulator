export default function IconButton({ icon: Icon, label, size = 'md', className = '', type = 'button', ...props }) {
  if (!Icon) throw new Error('IconButton requires an icon component');
  return (
    <button
      className={`icon-button icon-button-${size} ${className}`.trim()}
      type={type}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={size === 'sm' ? 15 : 17} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
