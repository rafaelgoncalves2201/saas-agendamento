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
        // Mapeamento elegante de 'slate' para a paleta Bege & Café Espresso
        slate: {
          50: '#F8F5EE',   // Fundo bege principal (suave, luxuoso e quente)
          100: '#EFE9DF',  // Bege claro para botões e cards secundários
          200: '#E2D9CC',  // Bordas bege suaves
          300: '#D0C3B2',  // Divisórias e bordas mais escuras
          400: '#9C8B7D',  // Texto secundário / muted suave
          500: '#796758',  // Texto de apoio quente
          600: '#5A4A3E',  // Texto de leitura confortável
          700: '#42342A',  // Texto forte tom café
          750: '#342921',  // Divisórias e bordas intermediárias no modo escuro
          800: '#261E18',  // Cards e superfícies no modo escuro (chocolate escuro)
          850: '#1F1813',  // Superfície intermediária de cards
          900: '#1C1510',  // Containers escuros (café espresso)
          950: '#120D0A',  // Fundo principal no modo escuro (café torrado profundo)
        },
        // Mapeamento de 'indigo' para Marrom Nobre (#6B3E26)
        indigo: {
          50: '#F9F5F0',
          100: '#F0E6DC',
          200: '#E2CEBC',
          300: '#CDB196',
          400: '#A98263',
          500: '#875135',
          600: '#6B3E26',   // Marrom Nobre Principal
          700: '#56311D',   // Marrom Escuro Hover
          800: '#422415',
          900: '#2E190E',
          950: '#1D0E07',
        },
        // Paletas diretas
        brown: {
          50: '#F9F5F0',
          100: '#F0E6DC',
          200: '#E2CEBC',
          300: '#CDB196',
          400: '#A98263',
          500: '#875135',
          600: '#6B3E26',
          700: '#56311D',
          800: '#422415',
          900: '#2E190E',
          950: '#1D0E07',
        },
        beige: {
          50: '#FAF8F4',
          100: '#F8F5EE',
          200: '#EFE9DF',
          300: '#E2D9CC',
          400: '#D0C3B2',
          500: '#B8A592',
          600: '#96816D',
          700: '#756352',
          800: '#54463A',
          900: '#332A23',
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
