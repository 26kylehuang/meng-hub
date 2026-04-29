/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono:  ['Fira Code', 'monospace'],
      },
      colors: {
        cosmos: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
        },
        archive: {
          bg:        '#FAFAFA',
          paper:     '#FFFFFF',
          ink:       '#334155',
          highlight: '#E0F2FE',
        }
      },
      animation: {
        'float-slow':   'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%':      { transform: 'translateY(-12px) scale(1.02)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%':      { boxShadow: '0 0 50px rgba(59,130,246,0.6)' },
        }
      }
    }
  },
  plugins: []
};
