/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Deep Blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0d1f4e',
        },
        // Deep navy
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fd',
          400: '#8093fa',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1e2a5e',
          900: '#0f1729',
          950: '#080d1a',
        },
        // Accent cyan/glow
        glow: {
          100: '#e0f7fa',
          300: '#4dd0e1',
          500: '#00b4d8',
          700: '#0077b6',
        },
        // Subject colors
        science: { from: '#dc2626', to: '#b91c1c' },
        arabic: { from: '#059669', to: '#047857' },
        french: { from: '#7c3aed', to: '#6d28d9' },
        math: { from: '#ea580c', to: '#c2410c' },
        religion: { from: '#0369a1', to: '#075985' },
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, #0d1f4e 0%, #1e3a8a 50%, #1d4ed8 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'glow-gradient': 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.3) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        'glow': '0 0 30px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 60px rgba(59, 130, 246, 0.3)',
        'card': '0 20px 60px rgba(0,0,0,0.3)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(59,130,246,0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
