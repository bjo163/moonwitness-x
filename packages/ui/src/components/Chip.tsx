"use client";

// React Imports
import React from "react";

// Mui Imports
import MuiChip from "@mui/material/Chip";
import { lighten, styled } from "@mui/material/styles";
import type { ChipProps } from "@mui/material/Chip";
import type { ThemeColor } from "../types";

export type CustomChipProps = ChipProps & {
  round?: "true" | "false";
  skin?: "filled" | "light" | "light-static";
};

const Chip = styled(MuiChip, {
  shouldForwardProp: (prop) => prop !== "skin" && prop !== "round",
})<CustomChipProps>(({ round, skin, color = "primary", theme }) => {
  return {
    ...(round === "true" && {
      borderRadius: 500,
    }),
    ...(skin === "light" && {
      backgroundColor: `var(--mui-palette-${color}-lightOpacity)`,
      color: `var(--mui-palette-${color}-main)`,
    }),
    ...(skin === "light-static" && {
      backgroundColor: lighten(theme.palette[color as ThemeColor].main, 0.84),
      color: `var(--mui-palette-${color}-main)`,
    }),
  };
});

const CustomChip = (props: CustomChipProps) => <Chip {...props} />;

export default CustomChip;
