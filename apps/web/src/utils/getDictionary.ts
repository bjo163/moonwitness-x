// Third-party Imports
import 'server-only'

// Type Imports
import type { Locale } from '@configs/i18n'
import type enDictionary from '@/data/dictionaries/en.json'

const dictionaries = {
  en: () => import('@/data/dictionaries/en.json').then(module => module.default),
  fr: () => import('@/data/dictionaries/fr.json').then(module => module.default),
  ar: () => import('@/data/dictionaries/ar.json').then(module => module.default),
  id: () => import('@/data/dictionaries/id.json').then(module => module.default)
}

export type Dictionary = typeof enDictionary
export type AuthDictionary = Dictionary['auth']
export type CommonDictionary = Dictionary['common']
export type CelestialDictionary = Dictionary['celestial']

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const english = await dictionaries.en()

  if (locale === 'en') return english

  const localized = (await dictionaries[locale]()) as Partial<Dictionary>
  const localizedCelestial = (localized.celestial ?? {}) as Partial<Dictionary['celestial']>

  return {
    ...english,
    ...localized,
    common: { ...english.common, ...(localized.common ?? {}) },
    auth: { ...english.auth, ...(localized.auth ?? {}) },
    navigation: { ...english.navigation, ...(localized.navigation ?? {}) },
    celestial: {
      ...english.celestial,
      ...localizedCelestial,
      clock: { ...english.celestial.clock, ...(localizedCelestial.clock ?? {}) },
      cosmic: { ...english.celestial.cosmic, ...(localizedCelestial.cosmic ?? {}) },
      mechanism: { ...english.celestial.mechanism, ...(localizedCelestial.mechanism ?? {}) },
      scriptures: { ...english.celestial.scriptures, ...(localizedCelestial.scriptures ?? {}) },
      hilal: { ...english.celestial.hilal, ...(localizedCelestial.hilal ?? {}) },
      observatory: { ...english.celestial.observatory, ...(localizedCelestial.observatory ?? {}) }
    }
  }
}
