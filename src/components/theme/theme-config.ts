import type {
  BaseColor,
  CustomThemeConfig,
  FontOption,
  RadiusOption,
  ThemeColor,
} from "@/types/theme";

export const DEFAULT_THEME_CONFIG: CustomThemeConfig = {
  style: "nova",
  baseColor: "slate",
  themeColor: "blue",
  chartColor: "blue",
  headingFont: "inter",
  bodyFont: "inter",
  radius: "0.75",
  menuStyle: "default",
  menuAccent: "subtle",
};

export const THEME_COLORS: Record<
  ThemeColor,
  { label: string; lightHsl: string; darkHsl: string; previewHex: string }
> = {
  neutral: {
    label: "Neutral",
    lightHsl: "0 0% 9%",
    darkHsl: "0 0% 98%",
    previewHex: "#737373",
  },
  blue: {
    label: "Blue",
    lightHsl: "221.2 83.2% 53.3%",
    darkHsl: "217.2 91.2% 59.8%",
    previewHex: "#2563eb",
  },
  violet: {
    label: "Violet",
    lightHsl: "262.1 83.3% 57.8%",
    darkHsl: "263.4 70% 50.4%",
    previewHex: "#7c3aed",
  },
  emerald: {
    label: "Emerald",
    lightHsl: "142.1 76.2% 36.3%",
    darkHsl: "142.1 70.6% 45.3%",
    previewHex: "#059669",
  },
  rose: {
    label: "Rose",
    lightHsl: "346.8 77.2% 49.8%",
    darkHsl: "346.8 77.2% 49.8%",
    previewHex: "#e11d48",
  },
  orange: {
    label: "Orange",
    lightHsl: "24.6 95% 53.1%",
    darkHsl: "20.5 90.2% 48.2%",
    previewHex: "#ea580c",
  },
  amber: {
    label: "Amber",
    lightHsl: "38 92% 50%",
    darkHsl: "48 96% 53%",
    previewHex: "#d97706",
  },
  cyan: {
    label: "Cyan",
    lightHsl: "189 94% 43%",
    darkHsl: "189 94% 53%",
    previewHex: "#0891b2",
  },
};

export const BASE_COLORS: Record<
  BaseColor,
  {
    label: string;
    previewHex: string;
    light: { background: string; card: string; border: string; muted: string };
    dark: { background: string; card: string; border: string; muted: string };
  }
> = {
  neutral: {
    label: "Neutral",
    previewHex: "#525252",
    light: {
      background: "0 0% 100%",
      card: "0 0% 100%",
      border: "0 0% 89.8%",
      muted: "0 0% 96.1%",
    },
    dark: {
      background: "0 0% 3.9%",
      card: "0 0% 7%",
      border: "0 0% 14.9%",
      muted: "0 0% 14.9%",
    },
  },
  zinc: {
    label: "Zinc",
    previewHex: "#71717a",
    light: {
      background: "0 0% 100%",
      card: "0 0% 100%",
      border: "240 5.9% 90%",
      muted: "240 4.8% 95.9%",
    },
    dark: {
      background: "240 10% 3.9%",
      card: "240 10% 6.5%",
      border: "240 3.7% 15.9%",
      muted: "240 3.7% 15.9%",
    },
  },
  slate: {
    label: "Slate",
    previewHex: "#64748b",
    light: {
      background: "0 0% 100%",
      card: "0 0% 100%",
      border: "214.3 31.8% 91.4%",
      muted: "210 40% 96.1%",
    },
    dark: {
      background: "224 71% 4%",
      card: "224 71% 7%",
      border: "217.2 32.6% 17.5%",
      muted: "217.2 32.6% 17.5%",
    },
  },
  stone: {
    label: "Stone",
    previewHex: "#78716c",
    light: {
      background: "0 0% 100%",
      card: "0 0% 100%",
      border: "60 4.8% 90%",
      muted: "60 4.8% 95.9%",
    },
    dark: {
      background: "24 9.8% 3.9%",
      card: "24 9.8% 6.5%",
      border: "12 6.5% 15.1%",
      muted: "12 6.5% 15.1%",
    },
  },
  gray: {
    label: "Gray",
    previewHex: "#6b7280",
    light: {
      background: "0 0% 100%",
      card: "0 0% 100%",
      border: "220 13% 91%",
      muted: "220 14.3% 95.9%",
    },
    dark: {
      background: "220 20% 5%",
      card: "220 20% 8%",
      border: "215 27.9% 16.9%",
      muted: "215 27.9% 16.9%",
    },
  },
};

export const FONT_OPTIONS: Record<FontOption, { label: string; family: string; sample: string }> = {
  inter: {
    label: "Inter",
    family: "'Inter', sans-serif",
    sample: "Aa",
  },
  outfit: {
    label: "Outfit",
    family: "'Outfit', sans-serif",
    sample: "Aa",
  },
  jakarta: {
    label: "Plus Jakarta",
    family: "'Plus Jakarta Sans', sans-serif",
    sample: "Aa",
  },
  roboto: {
    label: "Roboto",
    family: "'Roboto', sans-serif",
    sample: "Aa",
  },
  playfair: {
    label: "Playfair (Serif)",
    family: "'Playfair Display', serif",
    sample: "Aa",
  },
  mono: {
    label: "JetBrains Mono",
    family: "'JetBrains Mono', monospace",
    sample: "Aa",
  },
};

export const RADIUS_OPTIONS: Record<RadiusOption, { label: string; value: string }> = {
  "0": { label: "0 (Reto)", value: "0rem" },
  "0.3": { label: "0.3 (Sutil)", value: "0.3rem" },
  "0.5": { label: "0.5 (Médio)", value: "0.5rem" },
  "0.75": { label: "0.75 (Padrão)", value: "0.75rem" },
  "1.0": { label: "1.0 (Curvo)", value: "1.0rem" },
};

/**
 * Applies the user-selected theme configuration directly to the live document in real-time.
 * Injects a dynamic <style id="genia-dynamic-theme-style"> tag to ensure instant live transformation
 * across all cards, buttons, fonts, and corner radiuses without needing a page refresh or obscuring the screen.
 */
export function applyThemeConfig(config: CustomThemeConfig) {
  if (typeof document === "undefined") return;

  const themeSpec = THEME_COLORS[config.themeColor] || THEME_COLORS.blue;
  const baseSpec = BASE_COLORS[config.baseColor] || BASE_COLORS.slate;
  const headingSpec = FONT_OPTIONS[config.headingFont] || FONT_OPTIONS.inter;
  const bodySpec = FONT_OPTIONS[config.bodyFont] || FONT_OPTIONS.inter;

  const radiusNum = Number.parseFloat(config.radius) || 0.75;
  const isZeroRadius = config.radius === "0";

  // Calculate dynamic radius variations
  const radXl = isZeroRadius ? "0px" : `${radiusNum * 1.33}rem`;
  const rad2xl = isZeroRadius ? "0px" : `${radiusNum * 1.66}rem`;
  const radLg = isZeroRadius ? "0px" : `${radiusNum}rem`;
  const radMd = isZeroRadius ? "0px" : `${radiusNum * 0.75}rem`;
  const radSm = isZeroRadius ? "0px" : `${radiusNum * 0.5}rem`;

  // Dynamic CSS injection for 100% instant live visual feedback
  const dynamicCss = `
    :root {
      --radius: ${config.radius}rem !important;
      --radius-sm: ${radSm} !important;
      --radius-md: ${radMd} !important;
      --radius-lg: ${radLg} !important;
      --radius-xl: ${radXl} !important;
      --primary: ${themeSpec.lightHsl} !important;
      --ring: ${themeSpec.lightHsl} !important;
      --background: ${baseSpec.light.background} !important;
      --card: ${baseSpec.light.card} !important;
      --border: ${baseSpec.light.border} !important;
      --muted: ${baseSpec.light.muted} !important;
      --font-heading: ${headingSpec.family} !important;
      --font-body: ${bodySpec.family} !important;
    }

    .dark {
      --primary: ${themeSpec.darkHsl} !important;
      --ring: ${themeSpec.darkHsl} !important;
      --background: ${baseSpec.dark.background} !important;
      --card: ${baseSpec.dark.card} !important;
      --border: ${baseSpec.dark.border} !important;
      --muted: ${baseSpec.dark.muted} !important;
    }

    body, button, input, select, textarea {
      font-family: ${bodySpec.family} !important;
    }

    h1, h2, h3, h4, h5, h6, .font-extrabold, .font-black {
      font-family: ${headingSpec.family} !important;
    }

    /* Live Radius Transformation Across All Components */
    .rounded-2xl { border-radius: ${rad2xl} !important; }
    .rounded-xl { border-radius: ${radXl} !important; }
    .rounded-lg { border-radius: ${radLg} !important; }
    .rounded-md { border-radius: ${radMd} !important; }
    .rounded-sm { border-radius: ${radSm} !important; }

    /* Live Accent Harmonization */
    .text-blue-600, .dark .text-blue-400 { color: hsl(var(--primary)) !important; }
    .bg-blue-600, .bg-blue-500 { background-color: hsl(var(--primary)) !important; }
    .border-blue-500\\/20, .border-blue-300 { border-color: hsla(var(--primary) / 0.25) !important; }
    .bg-blue-500\\/10 { background-color: hsla(var(--primary) / 0.12) !important; }
    .shadow-blue-600\\/20 { box-shadow: 0 10px 15px -3px hsla(var(--primary) / 0.25) !important; }
  `;

  let styleTag = document.getElementById("genia-dynamic-theme-style");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "genia-dynamic-theme-style";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = dynamicCss;

  // Persist to localStorage
  try {
    localStorage.setItem("genia_theme_config", JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Generates copyable CSS variables in standard shadcn format
 */
export function generateCssSnippet(config: CustomThemeConfig): string {
  const themeSpec = THEME_COLORS[config.themeColor] || THEME_COLORS.blue;
  const baseSpec = BASE_COLORS[config.baseColor] || BASE_COLORS.slate;
  const radiusVal = RADIUS_OPTIONS[config.radius]?.value || "0.75rem";
  const headingFamily = FONT_OPTIONS[config.headingFont]?.family || "'Inter', sans-serif";
  const bodyFamily = FONT_OPTIONS[config.bodyFont]?.family || "'Inter', sans-serif";

  return `@layer base {
  :root {
    --background: ${baseSpec.light.background};
    --card: ${baseSpec.light.card};
    --border: ${baseSpec.light.border};
    --muted: ${baseSpec.light.muted};
    --primary: ${themeSpec.lightHsl};
    --ring: ${themeSpec.lightHsl};
    --radius: ${radiusVal};
    --font-heading: ${headingFamily};
    --font-body: ${bodyFamily};
  }
  .dark {
    --background: ${baseSpec.dark.background};
    --card: ${baseSpec.dark.card};
    --border: ${baseSpec.dark.border};
    --muted: ${baseSpec.dark.muted};
    --primary: ${themeSpec.darkHsl};
    --ring: ${themeSpec.darkHsl};
  }
}`;
}
