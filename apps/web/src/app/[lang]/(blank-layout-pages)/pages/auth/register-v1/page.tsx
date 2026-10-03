// Component Imports
import RegisterV1 from '@views/pages/auth/RegisterV1'
import type { Metadata } from 'next'
import { getDictionary } from '@/utils/getDictionary'
import { getLocale } from '@configs/i18n'

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const { lang } = await params
  const dictionary = await getDictionary(getLocale(lang))

  return {
    title: dictionary.auth.registerExampleMetaTitle,
    description: dictionary.auth.registerExampleMetaDescription
  }
}

const RegisterV1Page = () => {
  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <RegisterV1 />
    </div>
  )
}

export default RegisterV1Page
