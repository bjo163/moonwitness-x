// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import { AuthTranslationProvider } from '@/contexts/AuthTranslationContext'

// Config Imports
import { getLocale, i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'
import { getDictionary } from '@/utils/getDictionary'

type Props = ChildrenType & {
  params: Promise<{ lang: string }>
}

const Layout = async (props: Props) => {
  const params = await props.params
  const { children } = props

  const lang = getLocale(params.lang)

  // Vars
  const direction = i18n.langDirection[lang]
  const [systemMode, { auth }] = await Promise.all([getSystemMode(), getDictionary(lang)])

  return (
    <AuthTranslationProvider translations={auth}>
      <Providers direction={direction}>
        <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
      </Providers>
    </AuthTranslationProvider>
  )
}

export default Layout
