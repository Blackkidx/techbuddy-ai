// mobile/tailwind.config.js
// ✅ NativeWind v4 — Minimal Teal/White 2026

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Background — Light Mint
        bg: {
          DEFAULT: '#F0FAF8',
          light: '#F7FDFC',
          surface: '#FFFFFF',
          elevated: '#E8F6F3',
          hover: '#D5F0EB',
        },
        card: '#FFFFFF',
        'surface-light': '#E8F6F3',
        // Primary — Teal
        primary: {
          DEFAULT: '#1ABC9C',
          light: '#48D1B5',
          dark: '#16A085',
        },
        // Accent — Yellow (for CTAs like reference)
        accent: {
          DEFAULT: '#F5C842',
          light: '#F7D56D',
          dark: '#E0B730',
        },
        // Semantic
        success: { DEFAULT: '#2ECC71', dark: '#27AE60' },
        error: { DEFAULT: '#E74C3C', dark: '#C0392B' },
        warning: { DEFAULT: '#F39C12', dark: '#E67E22' },
        info: { DEFAULT: '#3498DB', dark: '#2980B9' },
        // Text
        foreground: '#2C3E50',
        muted: '#95A5A6',
        'text-primary': '#2C3E50',
        'text-secondary': '#7F8C8D',
        'text-tertiary': '#95A5A6',
        'text-disabled': '#BDC3C7',
        // Border
        border: {
          DEFAULT: '#E0ECE9',
          light: '#D5F0EB',
        },
        // Glass
        glass: 'rgba(26, 188, 156, 0.06)',
        'glass-border': 'rgba(26, 188, 156, 0.15)',
        // Online / Offline indicators
        online: '#2ECC71',
        offline: '#BDC3C7',
      },
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        'noto-thai': ['NotoSansThai_400Regular'],
        'noto-thai-medium': ['NotoSansThai_500Medium'],
        'noto-thai-bold': ['NotoSansThai_700Bold'],
        'noto-jp': ['NotoSansJP_400Regular'],
        'noto-jp-medium': ['NotoSansJP_500Medium'],
        'noto-jp-bold': ['NotoSansJP_700Bold'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
