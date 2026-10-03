// Next Imports
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@moonwitness/ui/avatar'

// Styles Imports
import tableStyles from '@core/styles/table.module.css'
import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Types
type FeatureType = {
  feature: string
  starter: boolean
  pro: boolean
  enterprise: boolean
  addOnAvailable: {
    starter: boolean
    pro: boolean
    enterprise: boolean
  }
}
type PlanType = {
  variant: 'tonal' | 'contained'
  label: string
  plan: 'starter' | 'pro' | 'enterprise'
}

// Data
const features: FeatureType[] = [
  {
    feature: 'pricingFeatureTrial',
    starter: true,
    pro: true,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureUserLimit',
    starter: false,
    pro: false,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureProductSupport',
    starter: false,
    pro: true,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureEmailSupport',
    starter: false,
    pro: false,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: true,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureIntegrations',
    starter: false,
    pro: true,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureBrandRemoval',
    starter: false,
    pro: false,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: true,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureMaintenance',
    starter: false,
    pro: false,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  },
  {
    feature: 'pricingFeatureStorage',
    starter: false,
    pro: false,
    enterprise: true,
    addOnAvailable: {
      starter: false,
      pro: false,
      enterprise: false
    }
  }
]

const plans: PlanType[] = [
  { variant: 'tonal', label: 'pricingChoosePlan', plan: 'starter' },
  { variant: 'contained', label: 'pricingChoosePlan', plan: 'pro' },
  { variant: 'tonal', label: 'pricingChoosePlan', plan: 'enterprise' }
]

const Plans = () => {
  const t = useCommonTranslations()

  return (
    <section className='md:plb-[100px] plb-[50px] bg-backgroundPaper'>
      <div className={frontCommonStyles.layoutSpacing}>
        <div className='flex flex-col text-center gap-2 mbe-6'>
          <Typography variant='h3'>{t.pricingPlansTitle}</Typography>
          <Typography>{t.pricingMoneyBackDescription}</Typography>
        </div>
        <div className='overflow-x-auto border-x border-be rounded'>
          <table className={tableStyles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>
                  <>{t.pricingFeatures}</>
                  <Typography variant='body2' className='capitalize'>
                    {t.pricingNativeFeatures}
                  </Typography>
                </th>
                <th>
                  <>{t.pricingStarter}</>
                  <Typography variant='body2' className='capitalize'>
                    {t.pricingFree}
                  </Typography>
                </th>
                <th>
                  <div className='flex justify-center gap-x-2'>
                    <>{t.pricingPro}</>
                    <CustomAvatar size={20} color='primary'>
                      <i className='tabler-star text-[14px]' />
                    </CustomAvatar>
                  </div>
                  <Typography variant='body2' className='capitalize'>
                    {t.pricingProPrice}
                  </Typography>
                </th>
                <th>
                  <>{t.pricingEnterprise}</>
                  <Typography variant='body2' className='capitalize'>
                    {t.pricingEnterprisePrice}
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody className={classnames('border-be', styles.tableBody)}>
              {features.map((feature, index) => (
                <tr key={index}>
                  <td>
                    <Typography color='text.primary'>{t[feature.feature as keyof typeof t]}</Typography>
                  </td>
                  <td className='flex items-center justify-center'>
                    {feature.starter ? (
                      <CustomAvatar skin='light' color='primary' size={20}>
                        <i className='tabler-check text-primary text-[14px]' />
                      </CustomAvatar>
                    ) : (
                      <CustomAvatar skin='light' color='secondary' size={20}>
                        <i className='tabler-x text-[14px]' />
                      </CustomAvatar>
                    )}
                  </td>
                  <td>
                    <div className='flex items-center justify-center'>
                      {feature.pro ? (
                        <CustomAvatar skin='light' color='primary' size={20}>
                          <i className='tabler-check text-primary text-[14px]' />
                        </CustomAvatar>
                      ) : feature.addOnAvailable.pro && !feature.pro ? (
                        <Chip variant='tonal' size='small' color='primary' label={t.pricingAddonAvailable} />
                      ) : (
                        <CustomAvatar skin='light' color='secondary' size={20}>
                          <i className='tabler-x text-[14px]' />
                        </CustomAvatar>
                      )}
                    </div>
                  </td>
                  <td className='flex items-center justify-center'>
                    {feature.enterprise ? (
                      <CustomAvatar skin='light' color='primary' size={20}>
                        <i className='tabler-check text-primary text-[14px]' />
                      </CustomAvatar>
                    ) : (
                      <CustomAvatar skin='light' color='secondary' size={20}>
                        <i className='tabler-x text-[14px]' />
                      </CustomAvatar>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                {plans.map((plan, index) => (
                  <td key={index} className='text-center plb-[9px]'>
                    <Button component={Link} href='/front-pages/payment' variant={plan.variant}>
                      {t[plan.label as keyof typeof t]}
                    </Button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Plans
