// Component Imports
import ErpDashboardView from '@views/apps/erp'
import type { Metadata } from 'next'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const dictionary = await getDictionary(getLocale(lang))

  return { title: dictionary.common.erpMetaTitle, description: dictionary.common.erpMetaDescription }
}

export default function ErpPage() {
  return <ErpDashboardView />
}
