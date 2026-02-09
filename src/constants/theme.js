export const darkTheme = {
  // Backgrounds
  bg: "#F1F4F7",
  cardBg: "#FFFFFF",
  cardBgElevated: "#F7F9FB",
  overlay: "rgba(0,0,0,0.35)",

  // Text
  text: "#2B2F33",
  textSecondary: "#6B7280",
  textMuted: "#8B95A1",
  textPlaceholder: "#9AA4B2",

  // Accents
  accent: "#3E8ED0",
  accentLight: "#D9ECFB",
  green: "#2FA84F",
  greenLight: "#E1F5E7",
  red: "#D9534F",
  redLight: "#FBE4E3",
  orange: "#F0AD4E",
  orangeLight: "#FFF0D6",
  purple: "#8E7CC3",
  purpleLight: "#E6E0F4",
  yellow: "#F1C40F",

  // Borders & Dividers
  border: "#D3DAE3",
  divider: "#E1E7EF",

  // Component tokens
  tabBg: "#E7EEF6",
  tabActive: "#FFFFFF",
  inputBg: "#F0F4F8",

  // State colors
  disabled: "#B0B8C4",
  accentDark: "#2D6FA3",

  // Radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,

  // Gradients (Hex pairs for LinearGradients)
  gradients: {
    accent: ["#3E8ED0", "#2575B0"],
    green: ["#2FA84F", "#1E7D35"],
    red: ["#D9534F", "#A93F3B"],
    glass: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"],
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#3E8ED0",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
  },

  // Premium UI Tokens
  glassIntensity: 20,
  springConfig: {
    damping: 15,
    mass: 1,
    stiffness: 120,
  },
  glow: {
    accent: "rgba(62, 142, 208, 0.4)",
    green: "rgba(47, 168, 79, 0.4)",
  },
};
