import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ style, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={className}
      style={{
        ...style,
        background: '#1b1412',
        border: '1px solid #4d3d36',
        borderRadius: '0.75rem',
        color: '#f6efe8',
        padding: '0.75rem 0.875rem',
        fontSize: '1rem',
        outline: 'none',
      }}
    />
  );
}
