/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Apple-Inspired Minimalist Palette
      colors: {
        primary: {
          50: '#f5f5f7', // Apple Background Grey
          100: '#e8e8ed',
          200: '#d2d2d7',
          300: '#adadad',
          400: '#86868b', // Apple Subtext
          500: '#6e6e73',
          600: '#424245',
          700: '#1d1d1f', // Apple Heading
          800: '#121212',
          900: '#000000',
        },
        accent: {
          50: '#f0f8ff',
          100: '#e0f0ff',
          200: '#b9ddff',
          300: '#7bbaff',
          400: '#3694ff',
          500: '#0071e3', // Apple Blue
          600: '#005bb5',
          700: '#004488',
          800: '#003060',
          900: '#001e3c',
        },
        // Semantic Colors
        success: '#34c759', // Apple Green
        warning: '#ff9f0a', // Apple Orange
        error: '#ff3b30',   // Apple Red
      },
      // Typography
      fontFamily: {
        sans: ['SF Pro Display', 'SF Pro Text', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['SF Pro Display', 'Inter', '-apple-system', 'sans-serif'],
      },
      // Shadows
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'medium': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'large': '0 30px 60px rgba(0, 0, 0, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      // Animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 15s linear infinite',
      },
      // Border Radius
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'md': '12px',
        'lg': '20px',
        'xl': '40px',
      },
    },
  },
  plugins: [],
};
