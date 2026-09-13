/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        xs: '4px',
      },
      boxShadow: {
        e2: '0 4px 16px rgb(0 0 0 / 0.12)',
      },
      colors: {
        background: '#F9FAFB',
        border: '#E5E7EB',
        error: '#EF4444',
        primary: '#3B82F6',
        'primary-hover': '#60A5FA',
        success: '#10B981',
        surface: '#FFFFFF',
        text: '#111827',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      screens: {
        xl: '90rem',
      },
    },
  },
};