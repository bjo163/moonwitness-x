// Next Imports
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Vars
const products = [
  {
    imgSrc: '/images/pages/google-home.png',
    imgAlt: 'checkoutProductGoogleAlt',
    productName: 'checkoutProductGoogle',
    soldBy: 'checkoutGoogle',
    inStock: true,
    price: 299,
    originalPrice: 359
  },
  {
    imgSrc: '/images/pages/iPhone-11.png',
    imgAlt: 'checkoutProductAppleAlt',
    productName: 'checkoutProductApple',
    soldBy: 'checkoutApple',
    inStock: false,
    price: 899,
    originalPrice: 999
  }
]

const StepConfirmation = () => {
  const t = useCommonTranslations()
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex items-center flex-col text-center gap-4'>
          <Typography variant='h4'>{t.checkoutThankYou} 😇</Typography>
          <Typography>
            {t.checkoutOrderPlaced.replace('{orderId}', '#1536548131')}
          </Typography>
          <div>
            <Typography>
              {t.checkoutConfirmationSent.replace('{email}', 'john.doe@example.com')}
            </Typography>
            <Typography>
              {t.checkoutCheckSpam}
            </Typography>
          </div>
          <div className='flex items-center'>
            <i className='tabler-clock text-xl' />
            <Typography>{t.checkoutTimePlaced}: 25/05/2020 13:35</Typography>
          </div>
        </div>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-col md:flex-row border rounded'>
          <div className='flex flex-col is-full items-center p-6 sm:items-start max-md:[&:not(:last-child)]:border-be md:[&:not(:last-child)]:border-ie'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-map-pin text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                {t.checkoutShipping}
              </Typography>
            </div>
            <Typography>{t.checkoutJaneDoe}</Typography>
            <Typography>{t.checkoutHomeAddress}</Typography>
            <Typography>{t.checkoutHomeCity}</Typography>
            <Typography className='mbe-4'>{t.checkoutUsa}</Typography>
            <Typography>+1 555 010 2020</Typography>
          </div>
          <div className='flex flex-col is-full items-center p-6 sm:items-start max-md:[&:not(:last-child)]:border-be md:[&:not(:last-child)]:border-ie'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-credit-card text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                {t.checkoutBillingAddress}
              </Typography>
            </div>
            <Typography>{t.checkoutJaneDoe}</Typography>
            <Typography>{t.checkoutHomeAddress}</Typography>
            <Typography>{t.checkoutHomeCity}</Typography>
            <Typography className='mbe-4'>{t.checkoutUsa}</Typography>
            <Typography>+1 555 010 2020</Typography>
          </div>
          <div className='flex flex-col is-full items-center p-6 sm:items-start'>
            <div className='flex items-center gap-2 mbe-4'>
              <i className='tabler-ship text-xl text-textPrimary' />
              <Typography color='text.primary' className='font-medium'>
                {t.checkoutShippingMethod}
              </Typography>
            </div>
            <Typography className='mbe-4'>{t.checkoutPreferredMethod}</Typography>
            <Typography>{t.checkoutDeliveryStandard}</Typography>
            <Typography>{t.checkoutDeliveryThreeToFourDays}</Typography>
          </div>
        </div>
      </Grid>
      <Grid size={{ xs: 12, md: 8, xl: 9 }}>
        <div className='border rounded'>
          {products.map((product, index) => (
            <div
              key={index}
              className='flex flex-col sm:flex-row items-center gap-4 p-6 [&:not(:last-child)]:border-be'
            >
              <img height={80} width={80} src={product.imgSrc} alt={product.imgAlt} />
              <div className='flex justify-between is-full flex-col sm:flex-row items-center gap-2'>
                <div className='flex flex-col items-center sm:items-start gap-2'>
                  <Typography color='text.primary' className='font-medium'>
                    {t[product.productName as keyof typeof t]}
                  </Typography>
                  <div className='flex flex-col items-baseline gap-2'>
                    <div className='flex gap-0.5'>
                      <Typography>{t.checkoutSoldBy}</Typography>
                      <Typography href='/' component={Link} onClick={e => e.preventDefault()} color='primary.main'>
                        {t[product.soldBy as keyof typeof t]}
                      </Typography>
                    </div>
                    {product.inStock && <Chip variant='tonal' size='small' color='success' label={t.checkoutInStock} />}
                  </div>
                </div>
                <div className='flex items-center'>
                  <Typography color='primary.main'>{`$${product.price}/`}</Typography>
                  <Typography color='text.disabled' className='line-through'>{`$${product.originalPrice}`}</Typography>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Grid>
      <Grid size={{ xs: 12, md: 4, xl: 3 }}>
        <div className='border rounded'>
          <CardContent className='flex gap-4 flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {t.checkoutPriceDetails}
            </Typography>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>{t.checkoutOrderTotal}</Typography>
                <Typography color='text.primary'>$1198.00</Typography>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>{t.paymentTax}</Typography>
                <div className='flex gap-2'>
                  <Typography color='text.disabled' className='line-through'>
                    $5.00
                  </Typography>
                  <Chip variant='tonal' size='small' color='success' label={t.checkoutFree} />
                </div>
              </div>
            </div>
          </CardContent>
          <Divider />
          <CardContent>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                {t.paymentTotal}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                $1198.00
              </Typography>
            </div>
          </CardContent>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepConfirmation
