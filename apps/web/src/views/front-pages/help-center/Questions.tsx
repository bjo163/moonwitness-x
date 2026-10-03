// MUI Imports
import Typography from '@mui/material/Typography'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import Link from '@components/Link'
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@moonwitness/ui/text-field'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Data
const articleList = [
  'helpKbTemplateKits',
  'helpArticleElementorZip',
  'helpArticleEnvatoTemplates',
  'helpArticleEnvatoTemplates',
  'helpArticleUseWordPressTemplate',
  'helpArticleUseTemplateImporter'
]

const Questions = () => {
  const t = useCommonTranslations()

  return (
    <section className='flex flex-col justify-center items-center gap-4 md:plb-[100px] plb-[50px] pbs-[70px] -mbs-[70px] bg-backgroundPaper'>
      <div className={classnames('pbs-10 md:pbs-16', frontCommonStyles.layoutSpacing)}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <div className='flex flex-col gap-2'>
              <Breadcrumbs aria-label={t.helpBreadcrumb}>
                <Link className='hover:text-primary' href='/front-pages/help-center'>
                  {t.helpKnowledgeBase}
                </Link>
                <Typography className='text-textPrimary'>{t.helpArticleAddToCartTitle}</Typography>
              </Breadcrumbs>
              <Typography variant='h4'>{t.helpArticleAddToCartQuestion}</Typography>
              <Typography>{t.helpArticleUpdated}</Typography>
            </div>
            <Divider className='mlb-6' />
            <div className='flex flex-col gap-6'>
              <div>
                <Typography className='mbe-4'>{t.helpArticleBuyNow}</Typography>
                <Typography>{t.helpArticleAddToCart}</Typography>
              </div>
              <img
                src='/images/front-pages/product.png'
                alt={t.helpProductImageAlt}
                className='rounded is-full max-is-auto'
              />
              <Typography>{t.helpArticleReturnToCart}</Typography>
              <img
                src='/images/front-pages/checkout.png'
                alt={t.helpCheckoutImageAlt}
                className='rounded is-full max-is-auto'
              />
            </div>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }} className='flex flex-col gap-6'>
            <CustomTextField
              placeholder={t.helpSearchPlaceholder}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search' />
                    </InputAdornment>
                  )
                }
              }}
            />
            <div className='flex flex-col gap-4'>
              <div className='pli-5 plb-2 bg-actionHover rounded'>
                <Typography variant='h5'>{t.helpArticlesInSection}</Typography>
              </div>
              <div className='flex flex-col gap-4'>
                {articleList.map((article, index) => (
                  <Typography key={index} component={Link} className='flex gap-2 justify-between hover:text-primary'>
                    <Typography color='inherit'>{t[article as keyof typeof t]}</Typography>
                    <DirectionalIcon
                      ltrIconClass='tabler-chevron-right text-textDisabled text-xl'
                      rtlIconClass='tabler-chevron-left text-textDisabled text-xl'
                      className='text-textDisabled'
                    />
                  </Typography>
                ))}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </section>
  )
}

export default Questions
