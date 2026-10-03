'use client'

// React Imports
import { Fragment, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

type ConfirmationType = 'delete-account' | 'unsubscribe' | 'suspend-account' | 'delete-order' | 'delete-customer'

type ConfirmationDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  type: ConfirmationType
}

const ConfirmationDialog = ({ open, setOpen, type }: ConfirmationDialogProps) => {
  // States
  const [secondDialog, setSecondDialog] = useState(false)
  const [userInput, setUserInput] = useState(false)
  const t = useCommonTranslations()

  // Vars
  const Wrapper = type === 'suspend-account' ? 'div' : Fragment

  const handleSecondDialogClose = () => {
    setSecondDialog(false)
    setOpen(false)
  }

  const handleConfirmation = (value: boolean) => {
    setUserInput(value)
    setSecondDialog(true)
    setOpen(false)
  }

  return (
    <>
      <Dialog fullWidth maxWidth='xs' open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i className='tabler-alert-circle text-[88px] mbe-6 text-warning' />
          <Wrapper
            {...(type === 'suspend-account' && {
              className: 'flex flex-col items-center gap-2'
            })}
          >
            <Typography variant='h4'>
              {type === 'delete-account' && t.confirmDeactivateAccount}
              {type === 'unsubscribe' && t.confirmCancelSubscription}
              {(type === 'suspend-account' || type === 'delete-order' || type === 'delete-customer') && t.confirmAction}
            </Typography>
            {type === 'suspend-account' && <Typography color='text.primary'>{t.cannotRevertUser}</Typography>}
            {type === 'delete-order' && <Typography color='text.primary'>{t.cannotRevertOrder}</Typography>}
            {type === 'delete-customer' && <Typography color='text.primary'>{t.cannotRevertCustomer}</Typography>}
          </Wrapper>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' onClick={() => handleConfirmation(true)}>
            {type === 'suspend-account'
              ? t.confirmSuspendUser
              : type === 'delete-order'
                ? t.confirmDeleteOrder
                : type === 'delete-customer'
                  ? t.confirmDeleteCustomer
                  : t.yes}
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              handleConfirmation(false)
            }}
          >
            {t.cancel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={secondDialog} onClose={handleSecondDialogClose} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i
            className={classnames('text-[88px] mbe-6', {
              'tabler-circle-check': userInput,
              'text-success': userInput,
              'tabler-circle-x': !userInput,
              'text-error': !userInput
            })}
          />
          <Typography variant='h4' className='mbe-2'>
            {userInput
              ? type === 'delete-account'
                ? t.deactivated
                : type === 'unsubscribe'
                  ? t.unsubscribed
                  : type === 'delete-order' || type === 'delete-customer'
                    ? t.deleted
                    : t.suspended
              : t.cancelled}
          </Typography>
          <Typography color='text.primary'>
            {userInput ? (
              <>
                {type === 'delete-account' && t.accountDeactivatedSuccessfully}
                {type === 'unsubscribe' && t.subscriptionCancelledSuccessfully}
                {type === 'suspend-account' && t.userSuspended}
                {type === 'delete-order' && t.orderDeletedSuccessfully}
                {type === 'delete-customer' && t.customerRemovedSuccessfully}
              </>
            ) : (
              <>
                {type === 'delete-account' && t.accountDeactivationCancelled}
                {type === 'unsubscribe' && t.unsubscriptionCancelled}
                {type === 'suspend-account' && t.suspensionCancelled}
                {type === 'delete-order' && t.orderDeletionCancelled}
                {type === 'delete-customer' && t.customerDeletionCancelled}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' color='success' onClick={handleSecondDialogClose}>
            {t.ok}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmationDialog
