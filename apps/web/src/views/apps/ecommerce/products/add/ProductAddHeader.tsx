// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const ProductAddHeader = () => {
  const t = useCommonTranslations()

  return (
    <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
      <div>
        <Typography variant='h4' className='mbe-1'>
          {t.productAddNew}
        </Typography>
        <Typography>{t.productOrdersAcrossStore}</Typography>
      </div>
      <div className='flex flex-wrap max-sm:flex-col gap-4'>
        <Button variant='tonal' color='secondary'>
          {t.commonDiscard}
        </Button>
        <Button variant='tonal'>{t.productSaveDraft}</Button>
        <Button variant='contained'>{t.productPublish}</Button>
      </div>
    </div>
  )
}

export default ProductAddHeader
