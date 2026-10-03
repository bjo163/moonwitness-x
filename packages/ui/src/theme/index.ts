import "./types";
// Next Imports

// MUI Imports
import type { Theme } from "@mui/material/styles";

// Type Imports
import type { SystemMode, Skin } from "../types";
import { tokens } from "../tokens";

// Theme Options Imports
import overrides from "./overrides";
import colorSchemes from "./colorSchemes";
import spacing from "./spacing";
import shadows from "./shadows";
import customShadows from "./customShadows";
import typography from "./typography";

export type MoonwitnessThemeOptions = {
  skin: Skin;
  mode: SystemMode;
  direction: Theme["direction"];
  fontFamily?: string;
  disableRipple?: boolean;
};

const theme = ({
  skin,
  mode,
  direction,
  fontFamily,
  disableRipple = false,
}: MoonwitnessThemeOptions): Theme => {
  return {
    direction,
    components: overrides(skin, disableRipple),
    colorSchemes: colorSchemes(skin),
    ...spacing,
    shape: {
      borderRadius: tokens.radius.md,
      customBorderRadius: {
        xs: 2,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 10,
      },
    },
    shadows: shadows(mode),
    typography: typography(fontFamily ?? ""),
    customShadows: customShadows(mode),
    mainColorChannels: {
      light: "47 43 61",
      dark: "225 222 245",
      lightShadow: "47 43 61",
      darkShadow: "19 17 32",
    },
  } as Theme;
};

export default theme;
