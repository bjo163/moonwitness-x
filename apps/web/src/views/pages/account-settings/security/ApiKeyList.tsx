// MUI Imports
import { useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

import type { Locale } from '@configs/i18n'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type ApiKeyListType = {
  titleKey: 'serverKeyOne' | 'serverKeyTwo' | 'serverKeyThree'
  accessKey: 'fullAccess' | 'readOnly'
  date: string
  key: string
}

const ApiKeyList = () => {
  const t = useCommonTranslations()
  const { lang } = useParams()
  const locale = (lang as Locale) || 'en'

  const apiKeyList: ApiKeyListType[] = [
    {
      titleKey: 'serverKeyOne',
      accessKey: 'fullAccess',
      date: '2021-04-28T18:20:00+04:10',
      key: '23eaf7f0-f4f7-495e-8b86-fad3261282ac'
    },
    {
      titleKey: 'serverKeyTwo',
      accessKey: 'readOnly',
      date: '2021-02-12T10:30:00+02:30',
      key: 'bb98e571-a2e2-4de8-90a9-2e231b5e99'
    },
    {
      titleKey: 'serverKeyThree',
      accessKey: 'fullAccess',
      date: '2021-12-28T12:21:00+04:10',
      key: '2e915e59-3105-47f2-8838-6e46bf83b711'
    }
  ]

  return (
    <Card>
      <CardHeader title={t.apiKeyListTitle} className='pbe-4' />
      <CardContent className='flex flex-col gap-6'>
        <Typography>{t.apiKeyDescription}</Typography>
        {apiKeyList.map((item, index) => (
          <div key={index} className='flex flex-col gap-2 p-4 rounded bg-actionHover'>
            <div className='flex items-center gap-3'>
              <Typography variant='h5'>{t[item.titleKey]}</Typography>
              <Chip color='primary' variant='tonal' label={t[item.accessKey]} size='small' />
            </div>
            <div className='flex items-center gap-1'>
              <Typography className='font-medium'>{item.key}</Typography>
              <div className='flex'>
                <IconButton size='small'>
                  <i className='tabler-copy text-textSecondary' />
                </IconButton>
              </div>
            </div>
            <Typography color='text.disabled'>
              {t.createdOn.replace(
                '{date}',
                new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.date))
              )}
            </Typography>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ApiKeyList
