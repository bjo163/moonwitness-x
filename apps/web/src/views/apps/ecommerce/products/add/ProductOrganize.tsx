'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import CustomIconButton from '@core/components/mui/IconButton'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const ProductOrganize = () => {
  const t = useCommonTranslations()

  // States
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [collection, setCollection] = useState('')
  const [status, setStatus] = useState('')

  return (
    <Card>
      <CardHeader title={t.productOrganize} />
      <CardContent>
        <form onSubmit={e => e.preventDefault()} className='flex flex-col gap-6'>
          <CustomTextField
            select
            fullWidth
            label={t.productVendor}
            value={vendor}
            onChange={e => setVendor(e.target.value)}
          >
            <MenuItem value='mens-clothing'>{t.productMensClothing}</MenuItem>
            <MenuItem value='womens-clothing'>{t.productWomensClothing}</MenuItem>
            <MenuItem value='kids-clothing'>{t.productKidsClothing}</MenuItem>
          </CustomTextField>
          <div className='flex items-end gap-4'>
            <CustomTextField
              select
              fullWidth
              label={t.productCategory}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <MenuItem value='household'>{t.productHousehold}</MenuItem>
              <MenuItem value='office'>{t.productOffice}</MenuItem>
              <MenuItem value='electronics'>{t.productElectronics}</MenuItem>
              <MenuItem value='management'>{t.productManagement}</MenuItem>
              <MenuItem value='automotive'>{t.productAutomotive}</MenuItem>
            </CustomTextField>
            <CustomIconButton variant='tonal' color='primary' className='min-is-fit' aria-label={t.productAddCategory}>
              <i className='tabler-plus' />
            </CustomIconButton>
          </div>
          <CustomTextField
            select
            fullWidth
            label={t.productCollection}
            value={collection}
            onChange={e => setCollection(e.target.value)}
          >
            <MenuItem value='mens-clothing'>{t.productMensClothing}</MenuItem>
            <MenuItem value='womens-clothing'>{t.productWomensClothing}</MenuItem>
            <MenuItem value='kids-clothing'>{t.productKidsClothing}</MenuItem>
          </CustomTextField>
          <CustomTextField
            select
            fullWidth
            label={t.productStatus}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <MenuItem value='published'>{t.productPublished}</MenuItem>
            <MenuItem value='inactive'>{t.productInactive}</MenuItem>
            <MenuItem value='scheduled'>{t.productScheduled}</MenuItem>
          </CustomTextField>
          <CustomTextField fullWidth label={t.productEnterTags} placeholder={t.productTagsPlaceholder} />
        </form>
      </CardContent>
    </Card>
  )
}

export default ProductOrganize
