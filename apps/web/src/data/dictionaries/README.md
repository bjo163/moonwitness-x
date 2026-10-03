# UI translation policy

- Put every user-facing label, message, validation error, accessible name, and page title in a locale dictionary.
- Keep keys grouped by feature namespace (`navigation`, `auth`, `celestial`, and `common` for shared dashboard/account UI).
- Treat en.json as the key/type reference. Keep translated locales structurally aligned; English is the fallback for missing namespaces.
- On server routes, load strings with `getDictionary(locale)` and pass only the needed namespace to the view. Dashboard layout provides `common` through `CommonTranslationProvider`; blank-layout routes provide `auth` through `AuthTranslationProvider`.
- Add interpolation values as placeholders (for example {appName}); do not concatenate translated sentence fragments.
- Run `pnpm lint:i18n` in `apps/web`. It checks changed/new TSX and JSX files and fails on literal rendered text, accessible names and placeholders, visible UI props, alert/confirm/prompt/toast messages, common Valibot validation errors, and page metadata. Only technical props such as `className`, `href`, `htmlFor`, `accept`, and internal option values are excluded.
- The same gate requires en.json and id.json to have matching keys and interpolation placeholders, so new English copy cannot silently fall back in Indonesian.
- Existing untranslated areas are tracked in the repository TODO. Touching a TSX/JSX file with user-facing copy requires migrating that copy before the change can pass the gate.
