'use client'

import { createContext, useContext } from 'react'

import type { ChildrenType } from '@core/types'
import type { AuthDictionary } from '@/utils/getDictionary'

const AuthTranslationContext = createContext<AuthDictionary | null>(null)

export const AuthTranslationProvider = ({
  translations,
  children
}: ChildrenType & { translations: AuthDictionary }) => (
  <AuthTranslationContext.Provider value={translations}>{children}</AuthTranslationContext.Provider>
)

export const useAuthTranslations = () => {
  const translations = useContext(AuthTranslationContext)

  if (!translations) throw new Error('Auth translations are not available in this route.')

  return translations
}
