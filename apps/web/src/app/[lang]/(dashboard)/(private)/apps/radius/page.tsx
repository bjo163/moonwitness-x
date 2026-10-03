// Component Imports
import RadiusDashboard from '@views/apps/radius'
import type { Metadata } from 'next'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const dictionary = await getDictionary(getLocale(lang))

  return { title: dictionary.common.radiusMetaTitle, description: dictionary.common.radiusMetaDescription }
}

export default function RadiusPage() {
  return <RadiusDashboard />
}
