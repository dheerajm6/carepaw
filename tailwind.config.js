/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#1E3A2F',
        'primary-light': '#2D5443',
        accent:    '#E8A838',
        bg:        '#F9F6F0',
        surface:   '#FFFFFF',
        border:    '#E8E3DC',
        text:      '#1A1A1A',
        muted:     '#6B7280',
        danger:    '#DC2626',
        warning:   '#F59E0B',
        success:   '#10B981',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
      },
    },
  },
  plugins: [],
}
