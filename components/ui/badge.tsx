import * as React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'accent' | 'success';
};

const tones: Record<NonNullable<BadgeProps['tone']>, React.CSSProperties> = {
  default: {
    background: '#2a211d',
    color: '#f6efe8',
    border: '1px solid #4d3d36',
  },
  accent: {
    background: '#d98b57',
    color: '#120d0b',
    border: '1px solid #d98b57',
  },
  success: {
    background: '#8cc9a6',
    color: '#120d0b',
    border: '1px solid #8cc9a6',
  },
};

export function Badge({ tone = 'default', style, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      style={{
        ...style,
        ...tones[tone],
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '0.375rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
