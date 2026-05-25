/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-455': '#707f94',
        'slate-750': '#334155',
        'slate-850': '#1e293b',
        'indigo-650': '#483ecd',
        'indigo-655': '#4338ca',
        'emerald-650': '#059669',
        'rose-650': '#e11d48',
        'blue-605': '#2563eb',
        'blue-650': '#1d4ed8',
      },
    },
  },
  plugins: [],
}