// Component Imports
import WorkloadsDashboard from '@views/apps/workloads'
import type { Metadata } from 'next'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const dictionary = await getDictionary(getLocale(lang))

  return { title: dictionary.common.workloadsMetaTitle, description: dictionary.common.workloadsMetaDescription }
}

export default function WorkloadsPage() {
  return <WorkloadsDashboard />
}
