// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'
import type { NotificationsType } from '@components/layout/shared/NotificationsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Vars
const shortcuts: ShortcutsType[] = [
  {
    url: '/apps/calendar',
    icon: 'tabler-calendar',
    titleKey: 'shortcutCalendar',
    subtitleKey: 'shortcutCalendarSubtitle'
  },
  {
    url: '/apps/invoice/list',
    icon: 'tabler-file-dollar',
    titleKey: 'shortcutInvoice',
    subtitleKey: 'shortcutInvoiceSubtitle'
  },
  {
    url: '/apps/user/list',
    icon: 'tabler-user',
    titleKey: 'shortcutUsers',
    subtitleKey: 'shortcutUsersSubtitle'
  },
  {
    url: '/apps/roles',
    icon: 'tabler-users-group',
    titleKey: 'shortcutRoles',
    subtitleKey: 'shortcutRolesSubtitle'
  },
  {
    url: '/',
    icon: 'tabler-device-desktop-analytics',
    titleKey: 'shortcutDashboard',
    subtitleKey: 'shortcutDashboardSubtitle'
  },
  {
    url: '/pages/account-settings',
    icon: 'tabler-settings',
    titleKey: 'shortcutSettings',
    subtitleKey: 'shortcutSettingsSubtitle'
  }
]

const notifications: NotificationsType[] = [
  {
    avatarImage: '/images/avatars/8.png',
    titleKey: 'notificationCongratsTitle',
    subtitleKey: 'notificationCongratsBody',
    timeKey: 'timeOneHourAgo',
    read: false
  },
  {
    titleKey: 'notificationContactTitle',
    avatarColor: 'secondary',
    subtitleKey: 'notificationContactBody',
    timeKey: 'timeTwelveHoursAgo',
    read: false
  },
  {
    avatarImage: '/images/avatars/3.png',
    titleKey: 'notificationMessageTitle',
    subtitleKey: 'notificationMessageBody',
    timeKey: 'timeMayEighteen',
    read: true
  },
  {
    avatarIcon: 'tabler-chart-bar',
    titleKey: 'notificationReportTitle',
    subtitleKey: 'notificationReportBody',
    avatarColor: 'info',
    timeKey: 'timeAprilTwentyFour',
    read: true
  },
  {
    avatarText: 'MG',
    titleKey: 'notificationApprovedTitle',
    subtitleKey: 'notificationApprovedBody',
    avatarColor: 'success',
    timeKey: 'timeFebruarySeventeen',
    read: true
  },
  {
    avatarIcon: 'tabler-mail',
    titleKey: 'notificationNewMessageTitle',
    subtitleKey: 'notificationNewMessageBody',
    avatarColor: 'error',
    timeKey: 'timeJanuarySix',
    read: true
  }
]

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <LanguageDropdown />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown notifications={notifications} />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
