/** @type {import('tailwindcss').Config} */
module.exports = {
  // mode: 'jit',
  // purge: ['./public/**/*.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ... existing theme extensions ...
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false,
    container: true
  },
  future: {
    hoverOnlyWhenSupported: true
  },
  experimental: {
    containerQueries: true
  }
}
