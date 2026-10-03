// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// Type Imports
import type { ProfileTeamsType, ProfileCommonType, ProfileTabType } from '@/types/pages/profileTypes'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const renderList = (list: ProfileCommonType[], translate: (key: string) => string) => {
  return (
    list.length > 0 &&
    list.map((item, index) => {
      return (
        <div key={index} className='flex items-center gap-2'>
          <i className={item.icon} />
          <div className='flex items-center flex-wrap gap-2'>
            <Typography className='font-medium'>{`${translate(item.property)}:`}</Typography>
            <Typography> {translate(item.value)}</Typography>
          </div>
        </div>
      )
    })
  )
}

const renderTeams = (teams: ProfileTeamsType[], translate: (key: string) => string, memberTemplate: string) => {
  return (
    teams.length > 0 &&
    teams.map((item, index) => {
      return (
        <div key={index} className='flex items-center flex-wrap gap-2'>
          <Typography className='font-medium'>{translate(item.property)}</Typography>
          <Typography>{memberTemplate.replace('{count}', item.value.match(/\d+/)?.[0] ?? '0')}</Typography>
        </div>
      )
    })
  )
}

const AboutOverview = ({ data }: { data?: ProfileTabType }) => {
  const t = useCommonTranslations()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                {t.about}
              </Typography>
              {data?.about && renderList(data?.about, key => t[key as keyof typeof t] ?? key)}
            </div>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                {t.contacts}
              </Typography>
              {data?.contacts && renderList(data?.contacts, key => t[key as keyof typeof t] ?? key)}
            </div>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                {t.teamsTab}
              </Typography>
              {data?.teams && renderTeams(data?.teams, key => t[key as keyof typeof t] ?? key, t.membersCount)}
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              <Typography className='uppercase' variant='body2' color='text.disabled'>
                {t.overview}
              </Typography>
              {data?.overview && renderList(data?.overview, key => t[key as keyof typeof t] ?? key)}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AboutOverview
