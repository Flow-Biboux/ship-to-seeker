import { DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { MD3DarkTheme } from "react-native-paper";

export const BG = "#030014";
export const PANEL = "#0d0a24";
export const PURPLE = "#9945ff";
export const GREEN = "#00ffbd";
export const FG = "#f9fafb";
export const MUTED = "#a19fba";
export const SCREEN_PADDING = 16;
export const CARD_RADIUS = 16;

export const seekerTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: GREEN,
    onPrimary: BG,
    secondary: PURPLE,
    background: BG,
    surface: PANEL,
    onSurface: FG,
    onBackground: FG,
    outline: "#241d4a",
  },
};

export const seekerNavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: GREEN,
    background: BG,
    card: PANEL,
    text: FG,
    border: "#241d4a",
    notification: PURPLE,
  },
};
