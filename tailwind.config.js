/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B76E79',
          dark: '#9C5A64',
          light: '#D2949C',
        },
        secondary: '#1E1E1E',
        accent: '#F6E9E8',
        canvas: '#FAFAFA',
        surface: '#FFFFFF',
        ink: '#202020',
        muted: '#666666',
        line: '#ECECEC',
        success: '#2E7D32',
        warning: '#F9A825',
        danger: '#C62828',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(32, 32, 32, 0.06)',
        medium: '0 8px 24px rgba(32, 32, 32, 0.10)',
        high: '0 16px 40px rgba(32, 32, 32, 0.16)',
        glass: '0 8px 32px rgba(183, 110, 121, 0.15)',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
