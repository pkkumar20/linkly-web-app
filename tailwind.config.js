const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flyonui/dist/js/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"], // Replaces default sans
        telegram: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"], // Custom class
      },
      fontWeight: {
        normal: 400, // Makes font-normal = 400 everywhere
      },
      screen: { xs: "360px" },
      animation: {
        "checkbox-scale": "checkboxScale 0.2s ease-in-out",
      },
      keyframes: {
        checkboxScale: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },

  plugins: [require("tailwind-scrollbar")],
});
