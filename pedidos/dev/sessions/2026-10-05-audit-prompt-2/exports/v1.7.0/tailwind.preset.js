/** @type {Partial<import('tailwindcss').Config>} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          "dark-brown": "var(--colors-brand-dark-brown, #3C2415)",
          pink: "var(--colors-brand-pink, #E84B8A)",
          "cookie-orange": "var(--colors-brand-cookie-orange, #F5A623)",
          "soft-pink": "var(--colors-brand-soft-pink, #F2A6C0)",
          "chocolate-brown": "var(--colors-brand-chocolate-brown, #7B5B3A)",
          white: "var(--colors-brand-white, #FFFFFF)",
        },
        core_palette: {
          "golden-caramel": "var(--colors-core_palette-golden-caramel, #F4C27A)",
        },
        semantic: {
          background: "var(--colors-semantic-background, #FFFFFF)",
          "text-primary": "var(--colors-semantic-text-primary, #3C2415)",
          "text-accent": "var(--colors-semantic-text-accent, #E84B8A)",
        },
      },
      fontFamily: {
        primary: ["var(--typography-fontFamily-primary, cursive)"],
        body: ["var(--typography-fontFamily-body, sans-serif)"],
      },
      fontSize: {
        xs: "var(--typography-fontSize-xs, 12px)",
        sm: "var(--typography-fontSize-sm, 14px)",
        md: "var(--typography-fontSize-md, 16px)",
        lg: "var(--typography-fontSize-lg, 20px)",
        xl: "var(--typography-fontSize-xl, 24px)",
        "2xl": "var(--typography-fontSize-2xl, 32px)",
        "3xl": "var(--typography-fontSize-3xl, 40px)",
      },
      fontWeight: {
        regular: "var(--typography-fontWeight-regular, 400)",
        medium: "var(--typography-fontWeight-medium, 500)",
        bold: "var(--typography-fontWeight-bold, 700)",
      },
      lineHeight: {
        tight: "var(--typography-lineHeight-tight, 1.2)",
        normal: "var(--typography-lineHeight-normal, 1.5)",
        relaxed: "var(--typography-lineHeight-relaxed, 1.75)",
      },
      letterSpacing: {
        normal: "var(--typography-letterSpacing-normal, 0px)",
        wide: "var(--typography-letterSpacing-wide, 0.5px)",
      },
      spacing: {
        xs: "var(--spacing-xs, 4px)",
        sm: "var(--spacing-sm, 8px)",
        md: "var(--spacing-md, 16px)",
        lg: "var(--spacing-lg, 24px)",
        xl: "var(--spacing-xl, 32px)",
        "2xl": "var(--spacing-2xl, 48px)",
        "3xl": "var(--spacing-3xl, 64px)",
      },
      borderRadius: {
        sm: "var(--shape-borderRadius-sm, 4px)",
        md: "var(--shape-borderRadius-md, 8px)",
        lg: "var(--shape-borderRadius-lg, 16px)",
        full: "var(--shape-borderRadius-full, 9999px)",
      },
      borderWidth: {
        thin: "var(--shape-borderWidth-thin, 1px)",
        medium: "var(--shape-borderWidth-medium, 2px)",
      },
      boxShadow: {
        sm: "var(--shape-boxShadow-sm, 0px 2px 4px 0px #3C241526)",
        md: "var(--shape-boxShadow-md, 0px 4px 8px 0px #3C241533)",
      },
    },
  },
};
