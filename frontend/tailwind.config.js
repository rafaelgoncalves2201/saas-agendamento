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
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--danger'),
          foreground: '#ffffff',
        },
        // Mapeamento elegante de 'slate' para Marfim Limpo e Grafite Neutro (sem marrom)
        slate: {
          50: '#FAF8F5',   // Fundo marfim/creme suave
          100: '#F5EFE6',  // Marfim/creme suave para botões e cards secundários
          200: '#EAE1D1',  // Bordas suaves creme
          300: '#D8CCA6',  // Divisórias e bordas mais definidas
          400: '#94A3B8',  // Texto secundário neutro
          500: '#64748B',  // Texto de apoio neutro
          600: '#475569',  // Texto de leitura nítido
          700: '#334155',  // Texto forte
          750: '#1E293B',  // Divisórias no modo escuro
          800: '#1E293B',  // Cards e superfícies no modo escuro
          850: '#162032',  // Superfície intermediária de cards
          900: '#0F172A',  // Containers escuros
          950: '#090D16',  // Fundo principal no modo escuro
        },
        stone: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#EAE1D1',
          300: '#D8CCA6',
          400: '#94A3B8',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        // Mapeamento de 'indigo' para a cor da imagem Bege Inovae Agenda (#E6D4B0)
        indigo: {
          50: '#FAF7F0',
          100: '#F5EFE0',
          200: '#EFE4CE',
          300: '#E6D4B0',   // Cor exata da imagem do usuário
          400: '#D8C296',
          500: '#C7AC7B',
          600: '#B59358',   // Bege/Dourado nobre para botões
          700: '#9E7E45',   // Hover
          800: '#826532',
          900: '#5F4820',
          950: '#3D2D10',
        },
        // Mapeamento de 'brown' também para a paleta Bege da imagem (#E6D4B0) para eliminar marrom
        brown: {
          50: '#FAF7F0',
          100: '#F5EFE0',
          200: '#EFE4CE',
          300: '#E6D4B0',
          400: '#D8C296',
          500: '#C7AC7B',
          600: '#B59358',
          700: '#9E7E45',
          800: '#826532',
          900: '#5F4820',
          950: '#3D2D10',
        },
        beige: {
          50: '#FAF8F4',
          100: '#F5EFE0',
          200: '#EFE4CD',
          300: '#E6D4B0',   // Cor exata da imagem
          400: '#D8C296',
          500: '#C7AC7B',
          600: '#B59358',
          700: '#9E7E45',
          800: '#826532',
          900: '#5F4820',
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
