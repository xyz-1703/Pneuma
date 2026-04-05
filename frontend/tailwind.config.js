export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-theme="ocean"]', '[data-theme="sunset"]'], // We will handle dark mode via custom theme classes
  theme: {
    extend: {
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        lagoon: "rgb(var(--lagoon) / <alpha-value>)",
        sunrise: "rgb(var(--sunrise) / <alpha-value>)",
        roseleaf: "rgb(var(--roseleaf) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        }
      },
      animation: {
        rise: "rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 4s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite",
        slideIn: "slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        scaleUp: "scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glass-dark-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
