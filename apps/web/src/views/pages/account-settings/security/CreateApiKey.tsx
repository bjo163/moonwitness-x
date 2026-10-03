'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const CreateApiKey = () => {
  const t = useCommonTranslations()

  return (
    <Card>
      <CardHeader title={t.createApiKey} />
      <CardContent className='!pb-0'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <form className='flex justify-end items-end bs-full flex-col gap-5 pbe-6'>
              <CustomTextField select fullWidth label={t.apiKeyTypePrompt} defaultValue=''>
                <MenuItem value='full-control'>{t.fullControl}</MenuItem>
                <MenuItem value='modify'>{t.modifyAccess}</MenuItem>
                <MenuItem value='read-execute'>{t.readExecute}</MenuItem>
                <MenuItem value='list-folder-contents'>{t.listFolderContents}</MenuItem>
                <MenuItem value='read-only'>{t.readOnly}</MenuItem>
                <MenuItem value='read-write'>{t.readWrite}</MenuItem>
              </CustomTextField>
              <CustomTextField label={t.nameApiKey} placeholder={t.apiKeyNamePlaceholder} fullWidth />
              <Button variant='contained' fullWidth>
                {t.createKey}
              </Button>
            </form>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} className='flex items-end justify-center '>
            <img src='/images/illustrations/characters/4.png' width={197} height={224} alt={t.apiIllustrationAlt} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CreateApiKey
