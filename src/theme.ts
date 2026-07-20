import type { ThemeConfig } from "antd";

export const DEFAULT_PRIMARY_COLOR = "#01ff69";
export const DEFAULT_SECONDARY_COLOR = "#0b0f0c";

const normalizeHex = (value: string | null | undefined, fallback: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value || "") ? (value as string) : fallback;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const mixHex = (base: string, overlay: string, overlayWeight: number) => {
  const a = hexToRgb(base);
  const b = hexToRgb(overlay);
  const mix = (first: number, second: number) =>
    Math.round(first * (1 - overlayWeight) + second * overlayWeight)
      .toString(16)
      .padStart(2, "0");

  return `#${mix(a.r, b.r)}${mix(a.g, b.g)}${mix(a.b, b.b)}`;
};

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getTenantColors = (
  primaryColor?: string | null,
  secondaryColor?: string | null,
) => {
  const primary = normalizeHex(primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondary = normalizeHex(secondaryColor, DEFAULT_SECONDARY_COLOR);

  return {
    primary,
    secondary,
    primaryHover: mixHex(primary, "#000000", 0.2),
    surface: mixHex(secondary, "#ffffff", 0.05),
    surface2: mixHex(secondary, "#ffffff", 0.09),
    surface3: mixHex(secondary, "#ffffff", 0.15),
  };
};

export const applyTenantCssVariables = (
  primaryColor?: string | null,
  secondaryColor?: string | null,
) => {
  const colors = getTenantColors(primaryColor, secondaryColor);
  const root = document.documentElement;

  root.style.setProperty("--primary", colors.primary);
  const primaryRgb = hexToRgb(colors.primary);
  root.style.setProperty("--primary-rgb", `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  root.style.setProperty("--primary-color", colors.primary);
  root.style.setProperty("--primary-hover", colors.primaryHover);
  root.style.setProperty("--bg", colors.secondary);
  root.style.setProperty("--bg-color", colors.secondary);
  root.style.setProperty("--surface", colors.surface);
  root.style.setProperty("--surface-2", colors.surface2);
  root.style.setProperty("--surface-3", colors.surface3);
  root.style.setProperty("--border-primary", rgba(colors.primary, 0.3));
  root.style.setProperty("--focus-ring", `0 0 0 3px ${rgba(colors.primary, 0.25)}`);
};

export const createTenantTheme = (
  primaryColor?: string | null,
  secondaryColor?: string | null,
): ThemeConfig => {
  const colors = getTenantColors(primaryColor, secondaryColor);

  return {
    token: {
      colorPrimary: colors.primary,
      colorInfo: "#2f9bff",
      colorWarning: "#ff9f1a",
      colorError: "#ff4d4f",
      colorBgBase: colors.secondary,
      colorBgContainer: colors.surface,
      colorBorder: rgba(colors.primary, 0.22),
      colorText: "rgba(255,255,255,0.92)",
      colorTextSecondary: "rgba(255,255,255,0.72)",
      colorTextDisabled: "rgba(255,255,255,0.45)",
      colorBgContainerDisabled: "rgba(255,255,255,0.08)",
      borderRadius: 14,
      controlHeight: 38,
      fontSize: 14,
    },
    components: {
      Layout: {
        bodyBg: colors.secondary,
        headerBg: colors.surface,
        siderBg: colors.surface2,
      },
      Card: {
        headerBg: "transparent",
        colorBorderSecondary: rgba(colors.primary, 0.22),
      },
      Menu: {
        itemBg: "transparent",
        itemSelectedBg: rgba(colors.primary, 0.14),
        itemSelectedColor: colors.primary,
        itemColor: "rgba(255,255,255,0.78)",
      },
      Table: {
        headerBg: colors.surface2,
        headerColor: "rgba(255,255,255,0.92)",
        colorBorderSecondary: rgba(colors.primary, 0.22),
      },
      Input: {
        colorBgContainer: colors.surface2,
        colorBorder: "rgba(255,255,255,0.10)",
        colorTextPlaceholder: "rgba(255,255,255,0.45)",
      },
      Select: {
        selectorBg: colors.surface2,
        colorBgElevated: colors.surface2,
        optionSelectedBg: rgba(colors.primary, 0.2),
        optionActiveBg: rgba(colors.primary, 0.14),
        colorText: "rgba(255,255,255,0.92)",
        colorTextPlaceholder: "rgba(255,255,255,0.45)",
        colorBorder: "rgba(255,255,255,0.10)",
      },
      Button: {
        borderRadius: 10,
        colorTextDisabled: "rgba(255,255,255,0.5)",
        colorBgContainerDisabled: "rgba(255,255,255,0.1)",
        borderColorDisabled: "rgba(255,255,255,0.15)",
        fontWeight: 600,
        paddingInline: 12,
        colorText: "#000",
      },
      Modal: {
        borderRadiusLG: 8,
      },
      Tag: {
        borderRadiusSM: 6,
      },
      Radio: {
        buttonSolidCheckedBg: colors.primary,
        colorTextDisabled: "#ffffff",
      },
    },
  };
};

export const theme = createTenantTheme();
