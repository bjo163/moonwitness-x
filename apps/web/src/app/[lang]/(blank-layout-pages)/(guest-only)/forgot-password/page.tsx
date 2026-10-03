// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ForgotPassword from '@views/ForgotPassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'
import { getLocale } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const { auth } = await getDictionary(getLocale(lang))

  return { title: auth.forgotMetaTitle, description: auth.forgotMetaDescription }
}

const ForgotPasswordPage = async () => {
  const mode = await getServerMode()

  return <ForgotPassword mode={mode} />
}

export default ForgotPasswordPage
