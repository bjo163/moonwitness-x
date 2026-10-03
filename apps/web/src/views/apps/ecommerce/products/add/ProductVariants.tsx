'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

// Components Imports
import CustomTextField from '@moonwitness/ui/text-field'

import CustomIconButton from '@core/components/mui/IconButton'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const ProductVariants = () => {
  const t = useCommonTranslations()

  // States
  const [count, setCount] = useState(1)

  const deleteForm = (e: SyntheticEvent) => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  return (
    <Card>
      <CardHeader title={t.productVariants} />
      <CardContent>
        <Grid container spacing={6}>
          {Array.from(Array(count).keys()).map((item, index) => (
            <Grid key={index} size={{ xs: 12 }} className='repeater-item'>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomTextField select fullWidth label={t.productOptions} defaultValue='size'>
                    <MenuItem value='size'>{t.productSize}</MenuItem>
                    <MenuItem value='color'>{t.productColor}</MenuItem>
                    <MenuItem value='weight'>{t.productWeight}</MenuItem>
                    <MenuItem value='scent'>{t.productScent}</MenuItem>
                  </CustomTextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }} alignSelf='end'>
                  <div className='flex items-center gap-6'>
                    <CustomTextField fullWidth placeholder={t.productVariantValuePlaceholder} />
                    <CustomIconButton onClick={deleteForm} className='min-is-fit'>
                      <i className='tabler-x' />
                    </CustomIconButton>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button variant='contained' onClick={() => setCount(count + 1)} startIcon={<i className='tabler-plus' />}>
              {t.productAddAnotherOption}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProductVariants
