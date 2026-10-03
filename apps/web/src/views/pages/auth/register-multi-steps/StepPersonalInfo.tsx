// MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import DirectionalIcon from '@components/DirectionalIcon'
import { useAuthTranslations } from '@/contexts/AuthTranslationContext'

const StepPersonalInfo = ({ handleNext, handlePrev }: { handleNext: () => void; handlePrev: () => void }) => {
  const t = useAuthTranslations()

  return (
    <>
      <div className='mbe-5'>
        <Typography variant='h4'>{t.personalInformation}</Typography>
        <Typography>{t.enterPersonalInformation}</Typography>
      </div>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField fullWidth label={t.firstName} placeholder={t.firstName} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField fullWidth label={t.lastName} placeholder={t.lastName} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            fullWidth
            type='number'
            label={t.mobile}
            placeholder='202 555 0111'
            slotProps={{
              input: {
                startAdornment: <InputAdornment position='start'>{t.usDialCode}</InputAdornment>
              }
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField fullWidth type='number' label={t.pinCode} placeholder='689421' />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CustomTextField fullWidth label={t.address} placeholder={t.address} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CustomTextField fullWidth label={t.landmark} placeholder={t.landmark} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField fullWidth label={t.city} placeholder={t.city} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomTextField select fullWidth label={t.state} defaultValue='new-york'>
            <MenuItem value='new-york'>{t.stateNewYork}</MenuItem>
            <MenuItem value='california'>{t.stateCalifornia}</MenuItem>
            <MenuItem value='texas'>{t.stateTexas}</MenuItem>
            <MenuItem value='florida'>{t.stateFlorida}</MenuItem>
            <MenuItem value='washington'>{t.stateWashington}</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12 }} className='flex justify-between'>
          <Button
            variant='tonal'
            color='secondary'
            onClick={handlePrev}
            startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
          >
            {t.previous}
          </Button>
          <Button
            variant='contained'
            onClick={handleNext}
            endIcon={<DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
          >
            {t.next}
          </Button>
        </Grid>
      </Grid>
    </>
  )
}

export default StepPersonalInfo
