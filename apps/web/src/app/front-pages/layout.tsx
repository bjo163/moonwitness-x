// MUI Imports
import Button from '@mui/material/Button'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Metadata } from 'next'

// Context Imports
import { IntersectionProvider } from '@/contexts/intersectionContext'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'
import { CommonTranslationProvider } from '@/contexts/CommonTranslationContext'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const generateMetadata = async (): Promise<Metadata> => {
  const dictionary = await getDictionary(getLocale('en'))

  return {
    title: { default: dictionary.common.siteMetaTitle, template: `%s | ${dictionary.common.siteBrand}` },
    description: dictionary.common.siteMetaDescription
  }
}

const Layout = async ({ children, params }: ChildrenType & { params: Promise<{ lang?: string }> }) => {
  // Vars
  const systemMode = await getSystemMode()
  const routeParams = await params
  const dictionary = await getDictionary(getLocale(routeParams.lang ?? 'en'))

  return (
    <html id='__next' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <Providers direction='ltr'>
          <CommonTranslationProvider translations={dictionary.common}>
            <BlankLayout systemMode={systemMode}>
              <IntersectionProvider>
                <FrontLayout>
                  {children}
                  <ScrollToTop className='mui-fixed'>
                    <Button
                      variant='contained'
                      className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
                    >
                      <i className='tabler-arrow-up' />
                    </Button>
                  </ScrollToTop>
                </FrontLayout>
              </IntersectionProvider>
            </BlankLayout>
          </CommonTranslationProvider>
        </Providers>
      </body>
    </html>
  )
}

export default Layout
