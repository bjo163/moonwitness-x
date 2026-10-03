// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@moonwitness/ui/avatar'
import DirectionalIcon from '@components/DirectionalIcon'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Types
type popularArticlesType = {
  title: string
  icon: string
  articles: { title: string }[]
}

// Data
const allArticles: popularArticlesType[] = [
  {
    title: 'helpKbBuying',
    icon: 'tabler-shopping-cart',
    articles: [
      { title: 'helpKbBuyingFavourites' },
      { title: 'helpKbBuyingPurchase' },
      { title: 'helpKbBuyingDetails' },
      { title: 'helpKbBuyingRefunds' },
      { title: 'helpKbBuyingRefund' },
      { title: 'helpKbBuyingFindItem' }
    ]
  },
  {
    title: 'helpKbItemSupport',
    icon: 'tabler-help',
    articles: [
      { title: 'helpKbSupportDefinition' },
      { title: 'helpKbSupportContact' },
      { title: 'helpKbSupportCode' },
      { title: 'helpKbSupportRenew' },
      { title: 'helpKbSupportFaq' },
      { title: 'helpKbSupportRemoved' }
    ]
  },
  {
    title: 'helpKbLicenses',
    icon: 'tabler-currency-dollar',
    articles: [
      { title: 'helpKbLicenseReuse' },
      { title: 'helpKbLicenseContact' },
      { title: 'helpKbLicenseTestSite' },
      { title: 'helpKbLicenseChoose' },
      { title: 'helpKbLicenseMultipleProducts' },
      { title: 'helpKbLicenseLogo' }
    ]
  },
  {
    title: 'helpKbTemplateKits',
    icon: 'tabler-color-swatch',
    articles: [
      { title: 'helpKbTemplateOverview' },
      { title: 'helpKbTemplateElementor' },
      { title: 'helpKbTemplateImported' },
      { title: 'helpKbTemplateTroubleshoot' },
      { title: 'helpKbTemplateWordPress' },
      { title: 'helpKbTemplateImport' }
    ]
  },
  {
    title: 'helpKbAccountPassword',
    icon: 'tabler-lock-open',
    articles: [
      { title: 'helpKbAccountSocialLogin' },
      { title: 'helpKbAccountLocked' },
      { title: 'helpKbAccountVerificationEmail' },
      { title: 'helpKbAccountForgotCredentials' },
      { title: 'helpKbAccountNewPassword' },
      { title: 'helpKbAccountSignInVerification' }
    ]
  },
  {
    title: 'helpKbAccountSettings',
    icon: 'tabler-user',
    articles: [
      { title: 'helpKbSettingsPassword' },
      { title: 'helpKbSettingsUsername' },
      { title: 'helpKbSettingsCloseAccount' },
      { title: 'helpKbSettingsEmail' },
      { title: 'helpKbSettingsRegainAccess' },
      { title: 'helpKbSettingsRss' }
    ]
  }
]

const KnowledgeBase = () => {
  const t = useCommonTranslations()

  return (
    <section className={classnames('flex flex-col gap-6 md:plb-[100px] plb-[50px]', frontCommonStyles.layoutSpacing)}>
      <Typography variant='h4' className='text-center'>
        {t.helpKnowledgeBase}
      </Typography>
      <Grid container spacing={6}>
        {allArticles.map((article, index) => {
          return (
            <Grid size={{ xs: 12, lg: 4 }} key={index}>
              <Card>
                <CardContent className='flex flex-col items-start gap-6 text-center'>
                  <div className='flex gap-3 items-center'>
                    <CustomAvatar skin='light' variant='rounded' color='primary' size={32}>
                      <i className={classnames('text-xl', article.icon)} />
                    </CustomAvatar>
                    <Typography variant='h5'>{t[article.title as keyof typeof t]}</Typography>
                  </div>
                  <div className='flex flex-col gap-2 is-full'>
                    {article.articles.map((data, index) => {
                      return (
                        <div key={index} className='flex justify-between items-center gap-2'>
                          <Typography
                            color='text.primary'
                            component={Link}
                            href='/front-pages/help-center/article/how-to-add-product-in-cart'
                            className='truncate'
                          >
                            {t[data.title as keyof typeof t]}
                          </Typography>
                          <DirectionalIcon
                            ltrIconClass='tabler-chevron-right text-textDisabled text-xl'
                            rtlIconClass='tabler-chevron-left text-textDisabled text-xl'
                          />
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    href='/front-pages/help-center/article/how-to-add-product-in-cart'
                    className='flex items-center gap-x-2 text-primary'
                  >
                    <span className='font-medium'>{t.helpSeeAllArticles}</span>
                    <DirectionalIcon
                      className='text-lg'
                      ltrIconClass='tabler-arrow-right'
                      rtlIconClass='tabler-arrow-left'
                    />
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </section>
  )
}

export default KnowledgeBase
