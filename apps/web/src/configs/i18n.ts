export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'fr', 'ar', 'id'],
  langDirection: {
    en: 'ltr',
    fr: 'ltr',
    ar: 'rtl',
    id: 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]

export const getLocale = (routeLang: string): Locale =>
  i18n.locales.includes(routeLang as Locale) ? (routeLang as Locale) : i18n.defaultLocale
