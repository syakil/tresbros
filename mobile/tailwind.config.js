/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-olive': '#18181B',
        'brand-sage': '#A1A1AA',
        'brand-cream': '#FFFFFF',
        'brand-warm': '#2563EB',
        'brand-dark': '#09090B',
      },
    },
  },
  plugins: [],
}
