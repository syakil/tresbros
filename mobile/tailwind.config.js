/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-olive': '#4B5A3A',
        'brand-sage': '#7D8F6A',
        'brand-cream': '#F3EDE1',
        'brand-warm': '#A16B3D',
        'brand-dark': '#3A2B1F',
      },
    },
  },
  plugins: [],
}
