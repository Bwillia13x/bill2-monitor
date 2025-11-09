import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning-amber))",
        },
        success: {
          DEFAULT: "hsl(var(--success-green))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // WCAG 2.2 AA compliant colors
        accessible: {
          primary: {
            DEFAULT: "hsl(160, 84%, 39%)", // Teal with 4.5:1 contrast
            hover: "hsl(160, 84%, 45%)",
          },
          text: {
            primary: "hsl(210, 40%, 98%)", // High contrast text
            secondary: "hsl(215, 20%, 65%)", // Secondary text
            muted: "hsl(215, 15%, 55%)", // Muted text
          },
          background: {
            main: "hsl(217, 33%, 2%)", // Main background
            card: "hsl(217, 33%, 8%)", // Card background
            border: "hsl(217, 15%, 20%)", // Border color
          },
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "breathe": {
          "0%": { transform: "scale(0.96)", opacity: "0.25" },
          "50%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(0.96)", opacity: "0.25" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4", filter: "blur(40px)" },
          "50%": { opacity: "0.8", filter: "blur(50px)" },
        },
        "needle-enter": {
          "0%": { transform: "rotate(0deg) translateY(-40%)", opacity: "0" },
          "100%": { transform: "rotate(var(--needle-deg)) translateY(-40%)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        // Reduced motion alternatives
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { 
            transform: "translateY(10px)",
            opacity: "0"
          },
          to: { 
            transform: "translateY(0)",
            opacity: "1"
          },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin-slow 10s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "breathe-fast": "breathe 2.4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "needle-enter": "needle-enter 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "shimmer": "shimmer 3s linear infinite",
        // Reduced motion alternatives
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
