/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic surface tokens — backed by CSS vars, auto-switch with theme
        app: {
          bg:      'var(--app-bg)',
          canvas:  'var(--app-canvas)',
          card:    'var(--app-card)',
          raised:  'var(--app-raised)',
          line:    'var(--app-line)',
          line2:   'var(--app-line2)',
          text:    'var(--app-text)',
          text2:   'var(--app-text2)',
          text3:   'var(--app-text3)',
          muted:   'var(--app-muted)',
          faint:   'var(--app-faint)',
        },
      },
    },
  },
  plugins: [],
}
