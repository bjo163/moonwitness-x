'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

// Style Imports
import CustomTextField from '@moonwitness/ui/text-field'

import ConfirmationDialog from '../confirmation-dialog'

//Component Imports
import DialogCloseButton from '../DialogCloseButton'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type UpgradePlanProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

const UpgradePlan = ({ open, setOpen }: UpgradePlanProps) => {
  const t = useCommonTranslations()

  // States
  const [openConfirmation, setOpenConfirmation] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        onClose={handleClose}
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
        <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          {t.upgradePlan}
          <Typography component='span' className='flex flex-col text-center'>
            {t.chooseBestPlan}
          </Typography>
        </DialogTitle>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16 sm:pbe-16'>
          <div className='flex items-end gap-4 flex-col sm:flex-row'>
            <CustomTextField select fullWidth label={t.choosePlan} defaultValue='standard' id='user-view-plans-select'>
              <MenuItem value='basic'>
                {t.basicPlan} - $0{t.perMonth}
              </MenuItem>
              <MenuItem value='standard'>
                {t.standardPlan} - $99{t.perMonth}
              </MenuItem>
              <MenuItem value='enterprise'>
                {t.enterprisePlan} - $499{t.perMonth}
              </MenuItem>
              <MenuItem value='company'>
                {t.companyPlan} - $999{t.perMonth}
              </MenuItem>
            </CustomTextField>
            <Button variant='contained' className='capitalize max-sm:is-full'>
              {t.upgrade}
            </Button>
          </div>
          <Divider className='mlb-6' />
          <div className='flex flex-col gap-1'>
            <Typography variant='body2'>{t.userCurrentPlanStandard}</Typography>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div className='flex justify-center items-baseline gap-1'>
                <Typography component='sup' className='self-start mbs-3' color='primary.main'>
                  $
                </Typography>
                <Typography component='span' color='primary.main' variant='h1'>
                  99
                </Typography>
                <Typography variant='body2' component='sub' className='self-baseline'>
                  {t.perMonth}
                </Typography>
              </div>
              <Button variant='tonal' className='capitalize' color='error' onClick={() => setOpenConfirmation(true)}>
                {t.cancelSubscription}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog open={openConfirmation} setOpen={setOpenConfirmation} type='unsubscribe' />
    </>
  )
}

export default UpgradePlan
