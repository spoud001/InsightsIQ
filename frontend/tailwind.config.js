/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // indigo-500
        secondary: '#06b6d4', // cyan-500
        accent: '#fbbf24', // amber-400
        background: '#f1f5f9', // slate-100
        card: '#ffffff',
        border: '#e5e7eb', // gray-200
        text: '#0f172a', // slate-900
        muted: '#64748b', // slate-400
        success: '#22c55e', // green-500
        danger: '#ef4444', // red-500
        info: '#38bdf8', // sky-400
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(99, 102, 241, 0.10)',
        glow: '0 0 0 4px #6366f133',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fade: 'fadeIn 0.5s ease-in-out',
        slide: 'slideUp 0.6s cubic-bezier(.4,0,.2,1)',
        pop: 'pop 0.3s cubic-bezier(.4,0,.2,1)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
