// MUI Imports
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'

// Type Imports
import CustomAvatar from '@moonwitness/ui/avatar'

import type { ProjectsTabType } from '@/types/pages/profileTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import Link from '@components/Link'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const Projects = ({ data }: { data?: ProjectsTabType[] }) => {
  const t = useCommonTranslations()

  return (
    <Grid container spacing={6}>
      {data &&
        data.map((item, index) => {
          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card>
                <CardContent className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <CustomAvatar src={item.avatar} size={38} />
                      <div>
                        <Typography variant='h5' component={Link} className='hover:text-primary'>
                          {t[item.title as keyof typeof t] ?? item.title}
                        </Typography>
                        <Typography>
                          <span className='font-medium'>{t.clientLabel} </span>
                          {item.client}
                        </Typography>
                      </div>
                    </div>
                    <OptionMenu
                      iconClassName='text-textDisabled'
                      options={[
                        t.renameProject,
                        t.viewDetails,
                        t.addToFavorite,
                        { divider: true },
                        {
                          text: t.leaveProject,
                          menuItemProps: { className: 'text-error hover:bg-[var(--mui-palette-error-lightOpacity)]' }
                        }
                      ]}
                    />
                  </div>
                  <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='rounded bg-actionHover plb-2 pli-3'>
                      <div className='flex'>
                        <Typography className='font-medium' color='text.primary'>
                          {item.budgetSpent}
                        </Typography>
                        <Typography>{`/${item.budget}`}</Typography>
                      </div>
                      <Typography>{t.totalBudget}</Typography>
                    </div>
                    <div className='flex flex-col'>
                      <div className='flex'>
                        <Typography className='font-medium' color='text.primary'>
                          {t.startDate}
                        </Typography>
                        <Typography>{item.startDate}</Typography>
                      </div>
                      <div className='flex'>
                        <Typography className='font-medium' color='text.primary'>
                          {t.deadline}
                        </Typography>
                        <Typography>{item.deadline}</Typography>
                      </div>
                    </div>
                  </div>
                  <Typography>{t[item.description as keyof typeof t] ?? item.description}</Typography>
                </CardContent>
                <Divider />
                <CardContent className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between '>
                    <div className='flex'>
                      <Typography className='font-medium' color='text.primary'>
                        {t.allHours}
                      </Typography>
                      <Typography>{item.hours}</Typography>
                    </div>
                    <Chip
                      variant='tonal'
                      size='small'
                      color={item.chipColor}
                      label={t.daysLeft.replace('{count}', String(item.daysLeft))}
                    />
                  </div>
                  <div>
                    <div className='flex items-center justify-between mbe-2'>
                      <Typography variant='caption' className='text-textSecondary'>
                        {t.tasksProgress
                          .replace('{completed}', String(item.completedTask))
                          .replace('{total}', String(item.totalTask))}
                      </Typography>
                      <Typography variant='caption' className='text-textSecondary'>
                        {t.completedPercent.replace(
                          '{percent}',
                          String(Math.round((item.completedTask / item.totalTask) * 100))
                        )}
                      </Typography>
                    </div>
                    <LinearProgress
                      color='primary'
                      variant='determinate'
                      value={Math.round((item.completedTask / item.totalTask) * 100)}
                      className='bs-2'
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center grow gap-3'>
                      <AvatarGroup className='items-center pull-up'>
                        {item.avatarGroup.map((person, index) => {
                          return (
                            <Tooltip key={index} title={person.name}>
                              <CustomAvatar src={person.avatar} alt={person.name} size={32} />
                            </Tooltip>
                          )
                        })}
                      </AvatarGroup>
                      <Typography variant='body2' className='grow'>
                        {t.profileMemberCount.replace('{count}', item.members.replace(/\D/g, ''))}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-1'>
                      <i className='tabler-message-dots' />
                      <Typography>{item.comments}</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
    </Grid>
  )
}

export default Projects
