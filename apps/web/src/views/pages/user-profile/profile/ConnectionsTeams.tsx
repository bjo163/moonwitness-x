// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'

// Type Imports
import CustomAvatar from '@moonwitness/ui/avatar'

import type { ProfileTeamsTechType, ProfileConnectionsType } from '@/types/pages/profileTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomIconButton from '@core/components/mui/IconButton'
import Link from '@components/Link'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type Props = {
  teamsTech?: ProfileTeamsTechType[]
  connections?: ProfileConnectionsType[]
}

const ConnectionsTeams = (props: Props) => {
  // props
  const { teamsTech, connections } = props
  const t = useCommonTranslations()

  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader
            title={t.connectionsTab}
            action={<OptionMenu options={[t.shareConnections, t.suggestEdits, { divider: true }, t.reportBug]} />}
          />
          <CardContent className='flex flex-col gap-4'>
            {connections &&
              connections.map((connection, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <div className='flex items-center grow gap-2'>
                    <CustomAvatar src={connection.avatar} size={38} />
                    <div className='flex grow flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {connection.name}
                      </Typography>
                      <Typography variant='body2'>{`${connection.connections} ${t.connectionsTab}`}</Typography>
                    </div>
                  </div>
                  <CustomIconButton color='primary' variant={connection.isFriend ? 'tonal' : 'contained'}>
                    <i className={connection.isFriend ? 'tabler-user-check' : 'tabler-user-x'} />
                  </CustomIconButton>
                </div>
              ))}
          </CardContent>
          <CardActions className='flex justify-center'>
            <Typography component={Link} color='primary.main'>
              {t.viewAllConnections}
            </Typography>
          </CardActions>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader
            title={t.teamsTab}
            action={<OptionMenu options={[t.shareTeams, t.suggestEdits, { divider: true }, t.reportBug]} />}
          />
          <CardContent className='flex flex-col gap-4'>
            {teamsTech &&
              teamsTech.map((team: ProfileTeamsTechType, index) => (
                <div key={index} className='flex'>
                  <div className='flex grow  items-center gap-2'>
                    <CustomAvatar src={team.avatar} size={38} />
                    <div className='flex grow flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {t[team.title as keyof typeof t] ?? team.title}
                      </Typography>
                      <Typography variant='body2'>{t.membersCount.replace('{count}', String(team.members))}</Typography>
                    </div>
                  </div>
                  <Chip
                    color={team.ChipColor}
                    label={t[team.chipText as keyof typeof t] ?? team.chipText}
                    size='small'
                    variant='tonal'
                  />
                </div>
              ))}
          </CardContent>
          <CardActions className='flex justify-center'>
            <Typography component={Link} color='primary.main'>
              {t.viewAllTeams}
            </Typography>
          </CardActions>
        </Card>
      </Grid>
    </>
  )
}

export default ConnectionsTeams
