// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const NeedHelp = () => {
  const t = useCommonTranslations()

  return (
    <section
      className={classnames(
        'flex flex-col justify-center items-center gap-4 md:plb-[100px] plb-[50px]',
        frontCommonStyles.layoutSpacing
      )}
    >
      <Typography variant='h4' className='text-center'>
        {t.helpNeedMoreHelp}
      </Typography>
      <Typography className='text-center'>{t.helpNeedMoreDescription}</Typography>
      <div className='flex flex-wrap items-center justify-center gap-4'>
        <Button variant='contained'>{t.helpVisitCommunity}</Button>
        <Button variant='contained'>{t.landingContactTitle}</Button>
      </div>
    </section>
  )
}

export default NeedHelp
