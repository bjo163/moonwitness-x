import { tokens } from "../tokens";

const spacing = {
  spacing: (factor: number) => `${tokens.spacingUnitRem * factor}rem`,
};

export default spacing;
