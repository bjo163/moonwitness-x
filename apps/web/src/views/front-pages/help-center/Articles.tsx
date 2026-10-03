// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// SVG Imports
import Gift from '@assets/svg/front-pages/help-center/Gift'
import Rocket from '@assets/svg/front-pages/help-center/Rocket'
import File from '@assets/svg/front-pages/help-center/File'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Types
type popularArticlesType = {
  slug: string
  title: string
  svg: ReactNode
  subtitle: string
}

// Data
const popularArticles: popularArticlesType[] = [
  {
    slug: 'getting-started',
    title: 'helpArticleGettingStarted',
    svg: <Rocket color='var(--mui-palette-text-secondary)' />,
    subtitle: 'helpArticleGettingStartedDescription'
  },
  {
    slug: 'first-steps',
    title: 'helpArticleFirstSteps',
    svg: <Gift color='var(--mui-palette-text-secondary)' />,
    subtitle: 'helpArticleFirstStepsDescription'
  },
  {
    slug: 'external-content',
    title: 'helpArticleExternalContent',
    svg: <File color='var(--mui-palette-text-secondary)' />,
    subtitle: 'helpArticleExternalContentDescription'
  }
]

const Articles = () => {
  const t = useCommonTranslations()

  return (
    <section className='md:plb-[100px] plb-[50px] bg-backgroundPaper'>
      <div className={frontCommonStyles.layoutSpacing}>
        <Typography variant='h4' className='text-center mbe-6'>
          {t.helpPopularArticles}
        </Typography>
        <Grid container spacing={6}>
          {popularArticles.map((article, index) => {
            return (
              <Grid size={{ xs: 12, lg: 4 }} key={index}>
                <Card variant='outlined'>
                  <CardContent className='flex flex-col items-center justify-center gap-3 text-center'>
                    {article.svg}
                    <Typography variant='h5'>{t[article.title as keyof typeof t]}</Typography>
                    <Typography>{t[article.subtitle as keyof typeof t]}</Typography>
                    <Button
                      component={Link}
                      href='/front-pages/help-center/article/how-to-add-product-in-cart'
                      variant='tonal'
                      size='small'
                    >
                      {t.helpReadMore}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </div>
    </section>
  )
}

export default Articles
