# @moonwitness/ui

Shared React and MUI presentation components and the Moonwitness theme.

## Use in the workspace

```tsx
import TextField from "@moonwitness/ui/text-field";
import Avatar from "@moonwitness/ui/avatar";
import Chip from "@moonwitness/ui/chip";
```

The root entry exports the selected components, their public prop types, and design tokens. The theme factory is available from `@moonwitness/ui/theme` and receives application choices explicitly:

```ts
import createMoonwitnessTheme from "@moonwitness/ui/theme";

const theme = createMoonwitnessTheme({
  skin: "default",
  mode: "light",
  direction: "ltr",
  fontFamily: "Inter, sans-serif",
  disableRipple: false,
});
```

The consuming app owns font loading, routing, server rendering/cache integration, user settings, and provider composition. This package has no Next.js, database, SDK, or domain-data dependency. MUI, Emotion, React, and React DOM are peer dependencies so a consuming app shares one runtime and theme context.

The workspace currently consumes TypeScript source through pnpm and Next.js `transpilePackages`. Package type checking runs with `pnpm --filter @moonwitness/ui typecheck`.
