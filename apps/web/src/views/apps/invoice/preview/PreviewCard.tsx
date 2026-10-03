// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import './print.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const PreviewCard = ({ invoiceData, id }: { invoiceData?: InvoiceType; id: string }) => {
  const t = useCommonTranslations()

  const data = [
    { Item: t.invoiceDemoItemBranding, Description: t.invoiceDemoDescriptionBranding, Hours: 48, Qty: 1, Total: '$32' },
    { Item: t.invoiceDemoItemSocial, Description: t.invoiceDemoDescriptionSocial, Hours: 42, Qty: 1, Total: '$28' },
    { Item: t.invoiceDemoItemWeb, Description: t.invoiceDemoDescriptionWeb, Hours: 46, Qty: 1, Total: '$24' },
    { Item: t.invoiceDemoItemSeo, Description: t.invoiceDemoDescriptionSeo, Hours: 40, Qty: 1, Total: '$22' }
  ]

  return (
    <Card className='previewCard'>
      <CardContent className='sm:!p-12'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className='p-6 bg-actionHover rounded'>
              <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                <div className='flex flex-col gap-6'>
                  <div className='flex items-center gap-2.5'>
                    <Logo />
                  </div>
                  <div>
                    <Typography color='text.primary'>{t.invoiceDemoAddressLine1}</Typography>
                    <Typography color='text.primary'>{t.invoiceDemoAddressLine2}</Typography>
                    <Typography color='text.primary'>+1 (123) 456 7891, +44 (876) 543 2198</Typography>
                  </div>
                </div>
                <div className='flex flex-col gap-6'>
                  <Typography variant='h5'>{t.invoiceNumberFormat.replace('{id}', id)}</Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography color='text.primary'>
                      {t.invoiceDateIssuedFormat.replace('{date}', invoiceData?.issuedDate ?? '')}
                    </Typography>
                    <Typography color='text.primary'>
                      {t.invoiceDateDueFormat.replace('{date}', invoiceData?.dueDate ?? '')}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    {t.invoiceToLabel}
                  </Typography>
                  <div>
                    <Typography>{invoiceData?.name}</Typography>
                    <Typography>{invoiceData?.company}</Typography>
                    <Typography>{invoiceData?.address}</Typography>
                    <Typography>{invoiceData?.contact}</Typography>
                    <Typography>{invoiceData?.companyEmail}</Typography>
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    {t.invoiceBillTo}
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceTotalDue}</Typography>
                      <Typography>$12,110.55</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceBankName}</Typography>
                      <Typography>{t.invoiceDemoBankName}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceCountry}</Typography>
                      <Typography>{t.invoiceDemoCountry}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceIban}</Typography>
                      <Typography>{t.invoiceDemoIban}</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>{t.invoiceSwiftCode}</Typography>
                      <Typography>{t.invoiceDemoSwift}</Typography>
                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <div className='overflow-x-auto border rounded'>
              <table className={tableStyles.table}>
                <thead className='border-bs-0'>
                  <tr>
                    <th className='!bg-transparent'>{t.invoiceItem}</th>
                    <th className='!bg-transparent'>{t.invoiceDescription}</th>
                    <th className='!bg-transparent'>{t.invoiceHours}</th>
                    <th className='!bg-transparent'>{t.invoiceQuantity}</th>
                    <th className='!bg-transparent'>{t.invoiceTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Typography color='text.primary'>{item.Item}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{item.Description}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{item.Hours}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{item.Qty}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{item.Total}</Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-between flex-col gap-y-4 sm:flex-row'>
              <div className='flex flex-col gap-1 order-2 sm:order-[unset]'>
                <div className='flex items-center gap-2'>
                  <Typography className='font-medium' color='text.primary'>
                    {t.invoiceSalesperson}
                  </Typography>
                  <Typography>{t.invoiceDemoSalesperson}</Typography>
                </div>
                <Typography>{t.invoiceThanks}</Typography>
              </div>
              <div className='min-is-[200px]'>
                <div className='flex items-center justify-between'>
                  <Typography>{t.invoiceSubtotal}</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    $1800
                  </Typography>
                </div>
                <div className='flex items-center justify-between'>
                  <Typography>{t.invoiceDiscount}</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    $28
                  </Typography>
                </div>
                <div className='flex items-center justify-between'>
                  <Typography>{t.invoiceTax}</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    21%
                  </Typography>
                </div>
                <Divider className='mlb-2' />
                <div className='flex items-center justify-between'>
                  <Typography>{t.invoiceTotal}</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    $1690
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider className='border-dashed' />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography>
              <Typography component='span' className='font-medium' color='text.primary'>
                {t.invoiceNote}
              </Typography>{' '}
              {t.invoiceDemoNote}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PreviewCard
