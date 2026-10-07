/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
          300: '#E6D4B0',   // #E6D4B0
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
