import { forwardRef } from 'react';

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      className={`button button-${variant} button-${size} ${className}`.trim()}
      type={type}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={1.8} aria-hidden="true" />}
      <span>{children}</span>
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
});

export default Button;
