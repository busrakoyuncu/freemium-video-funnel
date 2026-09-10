import * as React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'soft' | 'strong';
};

const tones: Record<NonNullable<CardProps['tone']>, React.CSSProperties> = {
  default: {
    background: '#1b1412',
    border: '1px solid #4d3d36',
  },
  soft: {
    background: '#241b18',
    border: '1px solid #4d3d36',
  },
  strong: {
    background: '#2a211d',
    border: '1px solid #d98b57',
  },
};

export function Card({ tone = 'default', style, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      style={{
        ...style,
        ...tones[tone],
        borderRadius: '1rem',
        boxShadow: '0 14px 28px rgba(0, 0, 0, 0.16)',
      }}
    >
      {children}
    </div>
  );
}
