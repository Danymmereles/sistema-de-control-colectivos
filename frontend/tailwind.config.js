/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ok: '#22c55e',
        delayed: '#f59e0b',
        critical: '#ef4444'
      }
    }
  },
  plugins: []
}
