'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type ConnectedAccountsType = {
  title: string
  logo: string
  checked: boolean
  subtitleKey: keyof ReturnType<typeof useCommonTranslations>
}

type SocialAccountsType = {
  title: string
  logo: string
  username?: string
  isConnected: boolean
  href?: string
}

// Vars
const connectedAccountsArr: ConnectedAccountsType[] = [
  {
    checked: true,
    title: 'Google',
    logo: '/images/logos/google.png',
    subtitleKey: 'shortcutCalendarSubtitle'
  },
  {
    checked: false,
    title: 'Slack',
    logo: '/images/logos/slack.png',
    subtitleKey: 'notificationNewMessageBody'
  },
  {
    checked: true,
    title: 'Github',
    logo: '/images/logos/github.png',
    subtitleKey: 'shortcutRolesSubtitle'
  },
  {
    checked: true,
    title: 'Mailchimp',
    subtitleKey: 'emailMarketingService',
    logo: '/images/logos/mailchimp.png'
  },
  {
    title: 'Asana',
    checked: false,
    subtitleKey: 'taskCommunication',
    logo: '/images/logos/asana.png'
  }
]

const socialAccountsArr: SocialAccountsType[] = [
  {
    title: 'Facebook',
    isConnected: false,
    logo: '/images/logos/facebook.png'
  },
  {
    title: 'Twitter',
    isConnected: true,
    username: '@Pixinvent',
    logo: '/images/logos/twitter.png',
    href: 'https://twitter.com/pixinvents'
  },
  {
    title: 'Linkedin',
    isConnected: true,
    username: '@Pixinvent',
    logo: '/images/logos/linkedin.png',
    href: 'https://in.linkedin.com/company/pixinvent'
  },
  {
    title: 'Dribbble',
    isConnected: false,
    logo: '/images/logos/dribbble.png'
  },
  {
    title: 'Behance',
    isConnected: false,
    logo: '/images/logos/behance.png'
  }
]

const Connections = () => {
  const t = useCommonTranslations()

  return (
    <Card>
      <Grid container>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardHeader title={t.connectedAccounts} subheader={t.connectedAccountsDescription} />
          <CardContent className='flex flex-col gap-4'>
            {connectedAccountsArr.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={32} width={32} src={item.logo} alt={item.title} />
                  <div className='grow'>
                    <Typography className='text-textPrimary font-medium'>{item.title}</Typography>
                    <Typography variant='body2'>{t[item.subtitleKey]}</Typography>
                  </div>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </CardContent>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardHeader title={t.socialAccounts} subheader={t.socialAccountsDescription} />
          <CardContent className='flex flex-col gap-4'>
            {socialAccountsArr.map((item, index) => (
              <div key={index} className='flex items-center justify-between gap-4'>
                <div className='flex grow items-center gap-4'>
                  <img height={32} width={32} src={item.logo} alt={item.title} />
                  <div className='grow'>
                    <Typography className='text-textPrimary font-medium'>{item.title}</Typography>
                    {item.isConnected ? (
                      <Typography
                        variant='body2'
                        color='primary.main'
                        component={Link}
                        href={item.href || '/'}
                        target='_blank'
                      >
                        {item.username}
                      </Typography>
                    ) : (
                      <Typography variant='body2'>{t.notConnected}</Typography>
                    )}
                  </div>
                </div>
                <CustomIconButton variant='tonal' color={item.isConnected ? 'error' : 'secondary'}>
                  <i className={item.isConnected ? 'tabler-trash' : 'tabler-link'} />
                </CustomIconButton>
              </div>
            ))}
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default Connections
