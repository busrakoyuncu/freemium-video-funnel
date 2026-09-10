export const designTokens = {
  colors: {
    background: '#120d0b',
    backgroundElevated: '#1b1412',
    backgroundSoft: '#241b18',
    panel: '#2a211d',
    panelStrong: '#332922',
    border: '#4d3d36',
    text: '#f6efe8',
    textMuted: '#d7c7bd',
    textSubtle: '#a89990',
    accent: '#d98b57',
    accentStrong: '#c96f3a',
    accentSoft: '#f1c59a',
    success: '#8cc9a6',
    warning: '#e9b65d',
    danger: '#e77763',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    pill: '999px',
  },
  shadows: {
    sm: '0 8px 20px rgba(0, 0, 0, 0.18)',
    md: '0 16px 30px rgba(0, 0, 0, 0.22)',
  },
  typography: {
    fontSans: '"Google Sans", "Inter", "Segoe UI", sans-serif',
    fontMono: '"SFMono-Regular", "SFMono"',
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.5rem',
      xxl: '2.25rem',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
} as const;

export type DesignTokenValue = typeof designTokens;
