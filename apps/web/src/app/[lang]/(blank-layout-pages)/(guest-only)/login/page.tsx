// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Login from '@views/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'
import { getLocale } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const { auth } = await getDictionary(getLocale(lang))

  return { title: auth.loginMetaTitle, description: auth.loginMetaDescription }
}

const LoginPage = async () => {
  const mode = await getServerMode()

  return <Login mode={mode} />
}

export default LoginPage
