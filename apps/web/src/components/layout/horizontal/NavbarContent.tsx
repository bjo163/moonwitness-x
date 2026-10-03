// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'
import type { NotificationsType } from '@components/layout/shared/NotificationsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import NavSearch from '@components/layout/shared/search'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getLocalizedUrl } from '@/utils/i18n'

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
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const { lang: locale } = useParams()

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && (
          <Link href={getLocalizedUrl('/', locale as Locale)}>
            <Logo />
          </Link>
        )}
      </div>

      <div className='flex items-center'>
        <NavSearch />
        <LanguageDropdown />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown notifications={notifications} />
        <UserDropdown />
        {/* Language Dropdown, Notification Dropdown, quick access menu dropdown, user dropdown will be placed here */}
      </div>
    </div>
  )
}

export default NavbarContent
