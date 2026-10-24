/** @type {import('tailwindcss').Config} */
const withAlpha = (variable) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: withAlpha('--background'),
        surface: withAlpha('--surface'),
        'surface-2': withAlpha('--surface-2'),
        'surface-3': withAlpha('--surface-3'),
        border: withAlpha('--border'),
        'border-strong': withAlpha('--border-strong'),
        muted: withAlpha('--muted'),
        foreground: withAlpha('--foreground'),
        'foreground-muted': withAlpha('--foreground-muted'),
        'foreground-subtle': withAlpha('--foreground-subtle'),
        accent: withAlpha('--accent'),
        'accent-soft': withAlpha('--accent-soft'),
        'accent-foreground': withAlpha('--accent-foreground'),
        success: withAlpha('--success'),
        warning: withAlpha('--warning'),
        info: withAlpha('--info'),
        danger: withAlpha('--danger'),
        ring: withAlpha('--ring'),
        card: {
          DEFAULT: withAlpha('--surface'),
          foreground: withAlpha('--foreground'),
        },
        popover: {
          DEFAULT: withAlpha('--surface'),
          foreground: withAlpha('--foreground'),
        },
        primary: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--surface-2'),
          foreground: withAlpha('--foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--danger'),
          foreground: '#ffffff',
        },
        // Mapeamentos de segurança para componentes que ainda usam slate/indigo/beige/brown:
        // Todos alinhados com a paleta luxuosa e sem marrom
        slate: {
          50: 'hsl(var(--surface-2))',
          100: 'hsl(var(--surface-3))',
          200: 'hsl(var(--border))',
          300: 'hsl(var(--border-strong))',
          400: 'hsl(var(--foreground-subtle))',
          500: 'hsl(var(--foreground-muted))',
          600: 'hsl(var(--foreground-muted))',
          700: 'hsl(var(--foreground))',
          750: 'hsl(var(--border))',
          800: 'hsl(var(--surface-2))',
          850: 'hsl(var(--surface-3))',
          900: 'hsl(var(--surface))',
          950: 'hsl(var(--background))',
        },
        stone: {
          50: 'hsl(var(--surface-2))',
          100: 'hsl(var(--surface-3))',
          200: 'hsl(var(--border))',
          300: 'hsl(var(--border-strong))',
          400: 'hsl(var(--foreground-subtle))',
          500: 'hsl(var(--foreground-muted))',
          600: 'hsl(var(--foreground-muted))',
          700: 'hsl(var(--foreground))',
          800: 'hsl(var(--foreground))',
          900: 'hsl(var(--foreground))',
        },
        indigo: {
          50: 'hsl(var(--accent-soft))',
          100: 'hsl(var(--accent-soft))',
          200: 'hsl(var(--accent-soft))',
          500: 'hsl(var(--accent))',
          600: 'hsl(var(--accent))',
          700: 'hsl(var(--accent))',
        },
        brown: {
          50: 'hsl(var(--accent-soft))',
          100: 'hsl(var(--accent-soft))',
          200: 'hsl(var(--accent-soft))',
          500: 'hsl(var(--accent))',
          600: 'hsl(var(--accent))',
          700: 'hsl(var(--accent))',
        },
        beige: {
          50: 'hsl(var(--background))',
          100: 'hsl(var(--surface-2))',
          200: 'hsl(var(--border))',
          300: 'hsl(var(--accent))',
          400: 'hsl(var(--accent))',
          500: 'hsl(var(--accent))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.12)',
        elevated: '0 2px 4px rgba(0,0,0,0.04), 0 18px 40px -18px rgba(0,0,0,0.22)',
        glow: '0 0 0 1px hsl(var(--accent) / 0.25), 0 12px 40px -12px hsl(var(--accent) / 0.45)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease forwards',
        'scale-in': 'scale-in 0.2s ease forwards',
        shimmer: 'shimmer 1.6s infinite',
        'slide-up': 'slide-up 0.3s ease forwards',
      },
    },
  },
  plugins: [],
};
