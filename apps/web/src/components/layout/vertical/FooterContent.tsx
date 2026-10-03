'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()
  const t = useCommonTranslations()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>
          {t.footerCopyright.replace('{year}', String(new Date().getFullYear()))}{' '}
        </span>
        <Link href='https://pixinvent.com' target='_blank' className='text-primary uppercase'>
          {t.publisher}
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='https://themeforest.net/licenses/standard' target='_blank' className='text-primary'>
            {t.license}
          </Link>
          <Link href='https://themeforest.net/user/pixinvent/portfolio' target='_blank' className='text-primary'>
            {t.moreThemes}
          </Link>
          <Link
            href='https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation'
            target='_blank'
            className='text-primary'
          >
            {t.documentation}
          </Link>
          <Link href='https://pixinvent.ticksy.com' target='_blank' className='text-primary'>
            {t.support}
          </Link>
        </div>
      )}
    </div>
  )
}

export default FooterContent
