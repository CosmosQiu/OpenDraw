/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 深色主题背景色阶
        bg: {
          DEFAULT: '#0a0a0a',
          2: '#111111',
          3: '#1a1a1a',
          4: '#222222',
        },
        // 边框色阶
        border: {
          DEFAULT: '#2a2a2a',
          2: '#333333',
        },
        // 强调色/主色调
        accent: {
          DEFAULT: '#7c3aed',    // 紫色主色
          2: '#9f67ff',          // 亮色变体
          glow: 'rgba(124,58,237,0.35)',
        },
        // 品牌色
        brand: {
          pink: '#ec4899',       // 粉红
          teal: '#14b8a6',       // 青绿
          green: '#10b981',      // 绿色
          yellow: '#f59e0b',     // 黄色
          red: '#ef4444',        // 红色
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.4)',
        lg: '0 8px 32px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease',
        'slide-up': 'slideUp 0.2s ease',
        'slide-in-right': 'slideInRight 0.25s ease',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
