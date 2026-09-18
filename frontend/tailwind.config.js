export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#16998eff",
        canvas: "#F8FAFC",
        border: "#E2E8F0",
        critical: "#DC2626",
        high: "#EA580C",
        medium: "#D97706",
        normal: "#16A34A",
        ink: "#0F172A",
        subtext: "#64748B",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: { xl: "0.875rem" },
    },
  },
  plugins: [],
};
