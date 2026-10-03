// Component Imports
import RegisterV2 from '@views/pages/auth/RegisterV2'
import type { Metadata } from 'next'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const dictionary = await getDictionary(getLocale(lang))

  return {
    title: dictionary.auth.registerExampleMetaTitle,
    description: dictionary.auth.registerExampleMetaDescription
  }
}

const RegisterV2Page = async () => {
  // Vars
  const mode = await getServerMode()

  return <RegisterV2 mode={mode} />
}

export default RegisterV2Page
