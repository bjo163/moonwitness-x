'use client'

import { createContext, useContext } from 'react'

import type { ChildrenType } from '@core/types'
import type { CommonDictionary } from '@/utils/getDictionary'

const CommonTranslationContext = createContext<CommonDictionary | null>(null)

export const CommonTranslationProvider = ({
  translations,
  children
}: ChildrenType & { translations: CommonDictionary }) => (
  <CommonTranslationContext.Provider value={translations}>{children}</CommonTranslationContext.Provider>
)

export const useCommonTranslations = () => {
  const translations = useContext(CommonTranslationContext)

  if (!translations) throw new Error('Common translations are not available in this route.')

  return translations
}

export const useOptionalCommonTranslations = () => useContext(CommonTranslationContext)
