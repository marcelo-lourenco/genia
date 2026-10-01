export type ThemeStyle = "nova" | "default" | "new-york" | "compact";
export type BaseColor = "neutral" | "zinc" | "slate" | "stone" | "gray";
export type ThemeColor =
  | "neutral"
  | "blue"
  | "violet"
  | "emerald"
  | "rose"
  | "orange"
  | "amber"
  | "cyan";
export type FontOption = "inter" | "outfit" | "jakarta" | "roboto" | "playfair" | "mono";
export type RadiusOption = "0" | "0.3" | "0.5" | "0.75" | "1.0";
export type MenuStyle = "default" | "solid";
export type MenuAccent = "subtle" | "bold";

export interface CustomThemeConfig {
  style: ThemeStyle;
  baseColor: BaseColor;
  themeColor: ThemeColor;
  chartColor: ThemeColor;
  headingFont: FontOption;
  bodyFont: FontOption;
  radius: RadiusOption;
  menuStyle: MenuStyle;
  menuAccent: MenuAccent;
}
