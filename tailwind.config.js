/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary": "#ffffff",
        "on-error": "#ffffff",
        "primary-container": "#7b1fa2",
        "outline-variant": "#d2c1d3",
        "on-surface": "#1b1b1c",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f4",
        "primary-fixed-dim": "#ebb2ff",
        "inverse-on-surface": "#f3f0f1",
        "surface-container-high": "#eae7e8",
        "on-primary-fixed-variant": "#721199",
        "surface": "#fcf8f9",
        "on-tertiary-container": "#f3b800",
        "surface-dim": "#dcd9da",
        "surface-bright": "#fcf8f9",
        "on-primary-fixed": "#320047",
        "secondary": "#b80049",
        "outline": "#807382",
        "error-container": "#ffdad6",
        "on-tertiary-fixed-variant": "#5b4300",
        "on-primary": "#ffffff",
        "on-secondary-fixed": "#400014",
        "primary-fixed": "#f8d8ff",
        "on-secondary-fixed-variant": "#900038",
        "tertiary-container": "#654b00",
        "secondary-container": "#e2165f",
        "on-secondary-container": "#fffbff",
        "tertiary-fixed-dim": "#fabd00",
        "on-tertiary": "#ffffff",
        "on-background": "#1b1b1c",
        "secondary-fixed": "#ffd9de",
        "on-surface-variant": "#4e4351",
        "on-primary-container": "#e8aaff",
        "on-error-container": "#93000a",
        "inverse-surface": "#303031",
        "surface-variant": "#e5e2e3",
        "tertiary-fixed": "#ffdf9e",
        "surface-container": "#f0edee",
        "primary": "#5e0081",
        "tertiary": "#493500",
        "surface-tint": "#8c33b3",
        "surface-container-highest": "#e5e2e3",
        "error": "#ba1a1a",
        "secondary-fixed-dim": "#ffb2be",
        "on-tertiary-fixed": "#261a00",
        "background": "#fcf8f9",
        "inverse-primary": "#ebb2ff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-mobile": "16px",
        "stack-md": "24px",
        "margin-desktop": "48px",
        "stack-sm": "8px",
        "container-max": "1280px",
        "stack-lg": "64px",
        "gutter": "24px"
      },
      fontFamily: {
        "body-lg": ["Inter"],
        "headline-lg": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "display-lg": ["Plus Jakarta Sans"],
        "label-md": ["Inter"],
        "body-md": ["Inter"]
      },
      fontSize: {
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "headline-lg": ["40px", {"lineHeight": "1.2", "fontWeight": "700"}],
        "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
        "display-lg": ["56px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],
        "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]
      },
      animation: {
        "scroll-reveal": "scroll-reveal 0.8s ease-out forwards",
      },
      keyframes: {
        "scroll-reveal": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        }
      }
    },
  },
  plugins: [],
}
