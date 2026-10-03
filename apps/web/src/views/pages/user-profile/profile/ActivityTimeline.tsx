'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import { styled } from '@mui/material/styles'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'

//Component Imports
import CustomAvatar from '@moonwitness/ui/avatar'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Styled Components
const Timeline = styled(MuiTimeline)<TimelineProps>({
  '& .MuiTimelineItem-root': {
    '&:before': {
      display: 'none'
    }
  }
})

const ActivityTimeline = () => {
  const t = useCommonTranslations()

  return (
    <Card>
      <CardHeader
        title={t.activityTimeline}
        avatar={<i className='tabler-chart-bar text-textSecondary' />}
        titleTypographyProps={{ variant: 'h5' }}
      />
      <CardContent>
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='primary' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex items-center justify-between flex-wrap gap-x-4 pbe-[7px]'>
                <Typography className='text-textPrimary font-medium'>{t.invoicePaidTitle}</Typography>
                <Typography variant='caption'>{t.timeTwelveMinutesAgo}</Typography>
              </div>
              <Typography className='mbe-2'>{t.invoicePaidDescription}</Typography>
              <div className='flex'>
                <div className='flex gap-2.5 items-center pli-2.5 bg-actionHover plb-[0.3125rem] rounded'>
                  <img alt={t.invoiceFileName} src='/images/icons/pdf-document.png' className='bs-5' />
                  <Typography className='font-medium'>{t.invoiceFileName}</Typography>
                </div>
              </div>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='success' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex items-center justify-between flex-wrap gap-x-4 pbe-[7px]'>
                <Typography className='text-textPrimary font-medium'>{t.clientMeeting}</Typography>
                <Typography variant='caption'>{t.timeFortyFiveMinutesAgo}</Typography>
              </div>
              <Typography className='mbe-2'>{t.projectMeetingDescription}</Typography>
              <div className='flex items-center gap-2.5'>
                <CustomAvatar src='/images/avatars/1.png' size={32} />
                <div>
                  <Typography className='font-medium' variant='body2'>
                    {t.clientContactName}
                  </Typography>
                  <Typography variant='body2'>{t.clientExecutiveTitle}</Typography>
                </div>
              </div>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='info' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex items-center justify-between flex-wrap gap-x-4 pbe-[7px]'>
                <Typography className='text-textPrimary font-medium'>{t.newClientProject}</Typography>
                <Typography variant='caption'>{t.timeTwoDaysAgo}</Typography>
              </div>
              <Typography className='mbe-2'>{t.projectTeamCount.replace('{count}', '6')}</Typography>
              <AvatarGroup total={6}>
                <Avatar alt={t.team} src='/images/avatars/1.png' />
                <Avatar alt={t.team} src='/images/avatars/2.png' />
                <Avatar alt={t.team} src='/images/avatars/3.png' />
              </AvatarGroup>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
