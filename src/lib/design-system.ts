// Penkey Perks V2 - Design System
// Premium café aesthetic with subtle duck branding

export const colors = {
  // Primary palette - Forest greens
  forest: {
    50: '#f2f6f4',
    100: '#e3ebe6',
    200: '#c5d9cc',
    300: '#9ac4a8',
    400: '#6ba882',
    500: '#4a8c66',
    600: '#3d7356',
    700: '#335e48',
    800: '#2b4b3c',
    900: '#243f34',
  },
  
  // Secondary palette - Dark creams
  cream: {
    50: '#faf9f6',
    100: '#f5f3ed',
    200: '#ebe7dd',
    300: '#ddd5c5',
    400: '#c9bfaa',
    500: '#b8a991',
    600: '#a8957d',
    700: '#8f7f6a',
    800: '#7a6a5a',
    900: '#655a4d',
  },
  
  // Accent - Warm orange (subtle duck branding)
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Neutral - Warm grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  
  // Semantic colors
  success: '#4a8c66',
  warning: '#f97316',
  error: '#dc2626',
  info: '#3b82f6',
}

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Playfair Display', 'serif'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
}

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}

export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
  },
}

// Component-specific styles
export const card = {
  background: colors.cream[50],
  border: colors.cream[200],
  shadow: shadows.md,
  radius: borderRadius.lg,
}

export const button = {
  primary: {
    background: colors.forest[600],
    hover: colors.forest[700],
    text: '#ffffff',
  },
  secondary: {
    background: colors.cream[200],
    hover: colors.cream[300],
    text: colors.neutral[800],
  },
  accent: {
    background: colors.accent[500],
    hover: colors.accent[600],
    text: '#ffffff',
  },
}

export const progress = {
  background: colors.cream[200],
  fill: colors.forest[500],
  radius: borderRadius.full,
}
