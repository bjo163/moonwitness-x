// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import Form from '@components/Form'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const ProductPricing = () => {
  const t = useCommonTranslations()

  return (
    <Card>
      <CardHeader title={t.productPricing} />
      <CardContent>
        <Form>
          <CustomTextField
            fullWidth
            label={t.productBasePrice}
            placeholder={t.productBasePricePlaceholder}
            className='mbe-6'
          />
          <CustomTextField fullWidth label={t.productDiscountedPrice} placeholder='$499' className='mbe-6' />
          <FormControlLabel control={<Checkbox defaultChecked />} label={t.productChargeTax} />
          <Divider className='mlb-2' />
          <div className='flex items-center justify-between'>
            <Typography>{t.productInStock}</Typography>
            <Switch defaultChecked />
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProductPricing
