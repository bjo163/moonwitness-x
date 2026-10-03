'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// Component Imports
import CustomTextField from '@moonwitness/ui/text-field'

import Link from '@components/Link'
import Form from '@components/Form'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type TableDataType = {
  type: keyof ReturnType<typeof useCommonTranslations>
  app: boolean
  email: boolean
  browser: boolean
}

// Vars
const tableData: TableDataType[] = [
  {
    app: true,
    email: true,
    browser: true,
    type: 'newForYou'
  },
  {
    app: true,
    email: true,
    browser: true,
    type: 'accountActivity'
  },
  {
    app: false,
    email: true,
    browser: true,
    type: 'newBrowserSignIn'
  },
  {
    app: false,
    email: true,
    browser: false,
    type: 'newDeviceLinked'
  }
]

const Notifications = () => {
  const t = useCommonTranslations()

  return (
    <Card>
      <CardHeader
        title={t.recentDevices}
        subheader={
          <>
            {t.notificationPermissionRequest}
            <Link className='text-primary'> {t.requestPermission}</Link>
          </>
        }
      />
      <Form>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>{t.type}</th>
                <th>{t.email}</th>
                <th>{t.browser}</th>
                <th>{t.app}</th>
              </tr>
            </thead>
            <tbody className='border-be'>
              {tableData.map((data, index) => (
                <tr key={index}>
                  <td>
                    <Typography color='text.primary'>{t[data.type]}</Typography>
                  </td>
                  <td>
                    <Checkbox defaultChecked={data.email} />
                  </td>
                  <td>
                    <Checkbox defaultChecked={data.browser} />
                  </td>
                  <td>
                    <Checkbox defaultChecked={data.app} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardContent>
          <Typography className='mbe-6 font-medium'>{t.notifyWhen}</Typography>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <CustomTextField select fullWidth defaultValue='online'>
                <MenuItem value='online'>{t.onlyWhenOnline}</MenuItem>
                <MenuItem value='anytime'>{t.anytime}</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit'>
                {t.saveChanges}
              </Button>
              <Button variant='tonal' color='secondary' type='reset'>
                {t.discard}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Form>
    </Card>
  )
}

export default Notifications
