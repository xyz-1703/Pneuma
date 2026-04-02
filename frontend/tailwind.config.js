export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
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
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 500ms ease forwards",
      },
    },
  },
  plugins: [],
};
