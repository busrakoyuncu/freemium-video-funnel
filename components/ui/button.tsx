import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#d98b57',
    color: '#120d0b',
    borderColor: '#d98b57',
  },
  secondary: {
    background: '#2a211d',
    color: '#f6efe8',
    borderColor: '#4d3d36',
  },
  ghost: {
    background: 'transparent',
    color: '#f6efe8',
    borderColor: 'transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '0.5rem 0.875rem',
    fontSize: '0.875rem',
  },
  md: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
  },
  lg: {
    padding: '0.9rem 1.25rem',
    fontSize: '1.125rem',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  children,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    border: '1px solid',
    borderRadius: '999px',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"Google Sans", "Inter", sans-serif',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    opacity: props.disabled ? 0.6 : 1,
  };

  return (
    <button
      {...props}
      className={className}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
