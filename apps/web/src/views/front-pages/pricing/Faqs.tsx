// MUI Imports
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

// Third-party Imports
import classnames from 'classnames'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import { useCommonTranslations } from '@/contexts/CommonTranslationContext'

// Types
type faqsDataTypes = {
  id: string
  question: string
  answer: string
  defaultExpanded?: boolean
}

// Data
const faqsData: faqsDataTypes[] = [
  {
    id: 'panel1',
    question: 'pricingFaqResponseQuestion',
    answer: 'pricingFaqResponseAnswer'
  },
  {
    id: 'panel2',
    question: 'pricingFaqPaymentQuestion',
    answer: 'pricingFaqPaymentAnswer',
    defaultExpanded: true
  },
  {
    id: 'panel3',
    question: 'pricingFaqMethodsQuestion',
    answer: 'pricingFaqMethodsAnswer'
  },
  {
    id: 'panel4',
    question: 'pricingFaqRefundQuestion',
    answer: 'pricingFaqRefundAnswer'
  },
  {
    id: 'panel5',
    question: 'pricingFaqHelpQuestion',
    answer: 'pricingFaqHelpAnswer'
  }
]

const Faqs = () => {
  const t = useCommonTranslations()

  return (
    <section className={classnames('md:plb-[100px] plb-[50px]', frontCommonStyles.layoutSpacing)}>
      <div className='flex flex-col text-center gap-2 mbe-6'>
        <Typography variant='h4'>{t.landingFaqTitle}</Typography>
        <Typography>{t.landingFaqSubtitle}</Typography>
      </div>
      <div>
        {faqsData.map((data, index) => {
          return (
            <Accordion key={index} defaultExpanded={data.defaultExpanded}>
              <AccordionSummary aria-controls={data.id + '-content'} id={data.id + '-header'} className='font-medium'>
                <Typography component='span'>{t[data.question as keyof typeof t]}</Typography>
              </AccordionSummary>
              <AccordionDetails className='text-textSecondary'>{t[data.answer as keyof typeof t]}</AccordionDetails>
            </Accordion>
          )
        })}
      </div>
    </section>
  )
}

export default Faqs
