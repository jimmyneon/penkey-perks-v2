import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Outfit', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        accent: ['var(--font-accent)', 'Caveat', 'cursive'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Penkey Premium Design System
        // Core Colors
        'cream-bg': '#FAF7F4',           // Main background - warm cream
        'cream-card': '#FFFDFC',         // Card background - off-white
        'blush': '#F4D8CC',              // Soft blush - accents
        'burgundy': '#8D123F',           // Primary - burgundy
        'burgundy-dark': '#6B0E2F',     // Primary dark
        'brown': '#4B3028',              // Text - warm brown
        'brown-light': '#6B4F47',        // Text light
        'gold': '#C9952E',               // Gold - highlights
        'gold-light': '#E8C76E',         // Gold light
        
        // Orange Accent (for CTAs)
        'orange': '#FF8C42',
        'orange-light': '#FFB380',
        'orange-dark': '#E67A35',
        
        // Functional Colors
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F59E0B',
        
        // Gradients
        'gradient-cream': 'linear-gradient(135deg, #FAF7F4 0%, #F4D8CC 100%)',
        'gradient-blush': 'linear-gradient(135deg, #F4D8CC 0%, #E8C4B8 100%)',
        'gradient-burgundy': 'linear-gradient(135deg, #8D123F 0%, #6B0E2F 100%)',
        
        // Legacy colors (keep for gradual migration)
        'duck-yellow': '#FFD93B',
        'pond-blue': '#3CA9E2',
        'success-green': '#4CAF50',
        'danger-red': '#FF5252',
        'bg-ivory': '#FFFEF7',
        'text-dark': '#2C3E50',
        'grey-light': '#ECEFF1',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'bounce-duck': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bob': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'splash': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-duck': 'bounce-duck 1s ease-in-out infinite',
        'bob': 'bob 2s ease-in-out infinite',
        'splash': 'splash 0.6s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
