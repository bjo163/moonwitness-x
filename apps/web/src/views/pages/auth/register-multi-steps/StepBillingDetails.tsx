// React Imports
import { useState } from 'react'
import type { ChangeEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { TypographyProps } from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import CustomInputVertical from '@core/components/custom-inputs/Vertical'
import DirectionalIcon from '@components/DirectionalIcon'
import type { CustomInputVerticalData } from '@core/components/custom-inputs/types'
import { useAuthTranslations } from '@/contexts/AuthTranslationContext'

// Styled Components
const Content = styled(Typography, {
  name: 'MuiCustomInputVertical',
  slot: 'content'
})<TypographyProps>(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center'
}))

const StepBillingDetails = ({ handlePrev }: { handlePrev: () => void }) => {
  const t = useAuthTranslations()

  const customInputData: CustomInputVerticalData[] = [
    {
      title: t.basicPlan,
      value: 'basic',
      content: <PlanContent description={t.basicPlanDescription} price='0' t={t} />
    },
    {
      title: t.standardPlan,
      value: 'standard',
      content: <PlanContent description={t.standardPlanDescription} price='99' t={t} />,
      isSelected: true
    },
    {
      title: t.enterprisePlan,
      value: 'enterprise',
      content: <PlanContent description={t.enterprisePlanDescription} price='499' t={t} />
    }
  ]

  const initialSelectedOption = 'standard'

  // States
  const [selectedOption, setSelectedOption] = useState<string>(initialSelectedOption)

  const handleOptionChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    if (typeof prop === 'string') {
      setSelectedOption(prop)
    } else {
      setSelectedOption((prop.target as HTMLInputElement).value)
    }
  }

  return (
    <>
      <div className='mbe-5'>
        <Typography variant='h4'>{t.selectPlan}</Typography>
        <Typography>{t.selectPlanDescription}</Typography>
      </div>
      <Grid container spacing={5}>
        {customInputData.map((item, index) => (
          <CustomInputVertical
            type='radio'
            key={index}
            data={item}
            gridProps={{ size: { xs: 12, sm: 4 } }}
            selected={selectedOption}
            name='custom-radios-basic'
            handleChange={handleOptionChange}
          />
        ))}
      </Grid>
      <div className='mbs-6 md:mbs-12 mbe-6'>
        <Typography variant='h4'>{t.paymentInformation}</Typography>
        <Typography>{t.enterCardInformation}</Typography>
      </div>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <CustomTextField fullWidth label={t.cardNumber} placeholder='1356 3215 6548 7898' />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField fullWidth label={t.nameOnCard} placeholder={t.nameOnCard} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField fullWidth label={t.expiryDate} placeholder={t.expiryPlaceholder} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField fullWidth label={t.cvvCode} placeholder='654' />
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
          <Button variant='contained' color='success' onClick={() => alert(t.registrationSubmitted)}>
            {t.submit}
          </Button>
        </Grid>
      </Grid>
    </>
  )
}

const PlanContent = ({
  description,
  price,
  t
}: {
  description: string
  price: string
  t: ReturnType<typeof useAuthTranslations>
}) => (
  <Content component='div' className='flex flex-col justify-center items-center bs-full gap-2'>
    <Typography>{description}</Typography>
    <div className='flex items-baseline'>
      <Typography component='sup' className='self-start' color='primary.main'>
        $
      </Typography>
      <Typography component='span' variant='h3' color='primary.main'>
        {price}
      </Typography>
      <Typography component='sub' className='self-baseline text-textDisabled'>
        {t.perMonth}
      </Typography>
    </div>
  </Content>
)

export default StepBillingDetails
