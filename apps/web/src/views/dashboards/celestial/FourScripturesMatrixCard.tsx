'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'

// Custom Components
import CustomChip from '@moonwitness/ui/chip'

import CustomAvatar from '@moonwitness/ui/avatar'

import CustomTabList from '@core/components/mui/TabList'
import type { CelestialDictionary } from '@/utils/getDictionary'

import OptionMenu from '@core/components/option-menu'

interface ScriptureVerse {
  reference: string
  originalText?: string
  translation: string
  scientificMeaning: string
  badge: string
}

export default function FourScripturesMatrixCard({
  translations: t
}: {
  translations: CelestialDictionary['scriptures']
}) {
  const [activeTab, setActiveTab] = useState('quran')
  const [dbConcordances, setDbConcordances] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/apps/celestial?endpoint=scriptures')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbConcordances(data)
        }
      })
      .catch(() => {})
  }, [])

  const handleTabChange = (_: SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const quranData: ScriptureVerse[] = [
    {
      reference: 'QS As-Sajdah 32:5 & QS Al-Hajj 22:47',
      originalText:
        'يُدَبِّرُ ٱلْأَمْرَ مِنَ ٱلسَّمَآءِ إِلَى ٱلْأَرْضِ ثُمَّ يَعْرُجُ إِلَيْهِ فِى يَوْمٍ كَانَ مِقْدَارُهُۥٓ أَلْفَ سَنَةٍ مِّمَّا تَعُدُّونَ',
      translation:
        'Dia mengatur urusan dari langit ke bumi, kemudian naik kepada-Nya dalam satu hari yang kadarnya seribu tahun menurut perhitunganmu.',
      scientificMeaning:
        'Derivasi kecepatan cahaya c = 299.792,5 km/s dari 12.000 lintasan bulan sideris dengan koreksi heliosentris α = 26.92848° (Dr. Mansour Hassab-Elnaby, deviasi < 0.0001%).',
      badge: 'Kecepatan Cahaya (c)'
    },
    {
      reference: "QS Al-Ma'arij 70:4",
      originalText:
        'تَعْرُجُ ٱلْمَلَـٰٓئِكَةُ وَٱلرُّوحُ إِلَيْهِ فِى يَوْمٍ كَانَ مِقْدَارُهُۥ خَمْسِينَ أَلْفَ سَنَةٍ',
      translation:
        'Malaikat-malaikat dan Jibril naik menghadap kepada Tuhan dalam sehari yang kadarnya lima puluh ribu tahun.',
      scientificMeaning:
        'Dilatasi waktu relativitas khusus (faktor Lorentz γ = 1.826 × 10⁷, kecepatan malaikat v = 0.9999999999999985 c).',
      badge: 'Relativitas Ekstrem (γ)'
    },
    {
      reference: "QS Fussilat 41:9-12 & QS Al-A'raf 7:54",
      originalText:
        'خَلَقَ ٱلْأَرْضَ فِى يَوْمَيْنِ ... وَجَعَلَ فِيهَا رَوَٰسِىَ مِن فَوْقِهَا ... فِىٓ أَرْبَعَةِ أَيَّامٍ ... فَقَضَىٰهُنَّ سَبْعَ سَمَـٰوَاتٍ فِى يَوْمَيْنِ',
      translation:
        'Menciptakan bumi dalam 2 masa ... memberkahi bumi dalam 4 masa ... menyempurnakan 7 langit dalam 2 masa (Total 6 masa).',
      scientificMeaning:
        'Rasio pembentukan Bumi (2 masa dari 6 masa = 33.3%) presisi dengan usia Bumi 4.543 Gyr dibanding usia Semesta 13.787 Gyr (32.95%).',
      badge: 'Kosmogoni 6 Masa'
    },
    {
      reference: 'QS Adz-Dzariyat 51:47',
      originalText: 'وَٱلسَّمَآءَ بَنَيْنَـٰهَا بِأَيْيْدٍ وَإِنَّا لَمُوسِعُونَ',
      translation: 'Dan langit itu Kami bangun dengan kekuasaan (Kami) dan sesungguhnya Kami benar-benar meluaskannya.',
      scientificMeaning:
        'Ekspansi dinamis metrik ruang alam semesta da/dt > 0, sesuai solusi persamaan medan Einstein oleh Alexander Friedmann (1922).',
      badge: 'Ekspansi Ruang FLRW'
    }
  ]

  const tauratData: ScriptureVerse[] = [
    {
      reference: 'Bereshit (Kejadian) 1:1 - 2:3',
      originalText: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
      translation: 'Pada mulanya Allah menciptakan langit dan bumi... dan genaplah 6 Eon (Yom) penciptaan.',
      scientificMeaning:
        'Partisi 6 Eon kosmis. Eon ke-4 pembentukan dan stabilisasi orbit benda penerang (Matahari & Bulan) untuk penentu waktu.',
      badge: '6 Eon Penciptaan'
    },
    {
      reference: 'Bereshit (Kejadian) 1:14',
      originalText: 'וְהָיוּ לְאֹתֹת וּלְמוֹעֲדִים וּלְיָמִים וְשָׁנִים',
      translation:
        'Dan biarlah benda-benda penerang itu menjadi tanda yang menunjukkan masa-masa yang tetap dan hari-hari dan tahun-tahun.',
      scientificMeaning: 'Matahari dan Bulan ditetapkan sebagai jam mekanika langit universal (True Celestial Clock).',
      badge: 'Jam Langit Sejati'
    },
    {
      reference: 'Imamat 25:1-12 (Shemitah & Yobel)',
      originalText: 'וְסָפַרְתָּ לְךָ שֶׁבַע שַׁבְּתֹת שָׁנִים שֶׁבַע שָׁנִים שֶׁבַע פְּעָמִים',
      translation:
        'Hitunglah tujuh tahun Sabat, tujuh kali tujuh tahun... lalu kamu harus menguduskan tahun yang kelima puluh (Yobel).',
      scientificMeaning:
        'Harmonisasi resonansi siklus 7 tahun (Sabat) dan 50 tahun (Yobel), sinkron dengan siklus gerhana dan interkalasi Metonik.',
      badge: 'Resonansi Sabat'
    }
  ]

  const zaburData: ScriptureVerse[] = [
    {
      reference: 'Tehillim (Mazmur) 90:4',
      originalText: 'כִּי אֶלֶף שָׁנִים בְּעֵינֶיךָ כְּיוֹם אֶתְמוֹל כִּי יַעֲבֹר וְאַשְׁמוּרָה בַלָּיְלָה',
      translation:
        'Sebab di mata-Mu seribu tahun sama seperti hari kemarin apabila berlalu, atau seperti suatu giliran jaga di waktu malam.',
      scientificMeaning:
        'Fondasi matematika dilatasi waktu: Rasio 1 hari = 1.000 tahun (1 : 365.242) dan giliran jaga malam Ashmurah (~3.5 jam) dengan rasio kompresi 1 : 2.500.000.',
      badge: 'Dilatasi Ilahiah'
    },
    {
      reference: 'Tehillim (Mazmur) 104:2',
      originalText: 'עֹטֶה אוֹר כַּשַּׂלְמָה נוֹטֶה שָׁמַיִם כַּיְרִיעָה',
      translation: 'Yang berselimutkan terang seperti kain, yang membentangkan langit seperti tenda/tirai.',
      scientificMeaning: 'Analogi pembentangan kain tenda selaras dengan perluasan metrik ruang kosmologis a(t).',
      badge: 'Membentangkan Langit'
    },
    {
      reference: 'Tehillim (Mazmur) 19:1-6 & 8:3-4',
      originalText: 'הַשָּׁמַיִם מְסַפְּרִים כְּבוֹad אֵל וּמַעֲשֵׂה יָדָיו מַגִּיד הָרָקִיעַ',
      translation: 'Langit menceritakan kemuliaan Allah, dan cakrawala memberitakan pekerjaan tangan-Nya.',
      scientificMeaning:
        'Keteraturan matematika dan ketelitian gerak orbital benda langit tanpa henti melintasi cakrawala.',
      badge: 'Mekanika Cakrawala'
    }
  ]

  const injilData: ScriptureVerse[] = [
    {
      reference: '2 Petrus 3:8',
      originalText: 'μία ἡμέρα παρὰ Κυρίῳ ὡς χίλια ἔτη, καὶ χίλια ἔτη ὡς ἡμέρα μία',
      translation: 'Satu hari di hadapan Tuhan adalah sama dengan seribu tahun dan seribu tahun sama dengan satu hari.',
      scientificMeaning:
        'Prinsip kesetaraan timbal balik relativistik (Frame Invariance): Transformasi koordinat waktu dua arah tanpa titik acuan absolut istimewa.',
      badge: 'Simetri Relativistik'
    },
    {
      reference: 'Ibrani 1:10-12 & Matius 24:35',
      originalText: 'πάντες ὡς ἱμάτιον παλαιωθήσονται, καὶ ὡσεὶ περιβόλαιον ἑλίξεις αὐτούς',
      translation: 'Semuanya itu akan menjadi usang seperti pakaian; seperti jubah Engkau akan menggulungnya.',
      scientificMeaning:
        'Hukum II Termodinamika (dS/dt ≥ 0) dan penuaan entropi materi semesta menuju rekolaps kosmologis.',
      badge: 'Entropi Semesta'
    },
    {
      reference: 'Wahyu 1:8 & 21:6',
      originalText: 'Ἐγώ εἰμι τὸ Ἄλφα καὶ τὸ Ὦ, λέγει Κύριος ὁ Θεός',
      translation: 'Aku adalah Alfa dan Omega, Yang Awal dan Yang Akhir.',
      scientificMeaning:
        'Batas batas kosmologis singularitas permulaan semesta (t = 0) dan akhir waktu kosmologis (Omega Point).',
      badge: 'Batas Kosmis Alfa-Omega'
    }
  ]

  const getVersesForScripture = (key: 'QURAN' | 'TAURAT' | 'ZABUR' | 'INJIL', fallback: ScriptureVerse[]) => {
    const matches = dbConcordances.filter(d => d.scripture === key)
    if (!matches || matches.length === 0) return fallback
    return matches.map(d => ({
      reference: d.reference,
      originalText: d.originalText || undefined,
      translation: d.translation,
      scientificMeaning: d.scientificValue || fallback[0]?.scientificMeaning || '',
      badge: d.cosmicTopic?.replace(/_/g, ' ') || 'Concordance'
    }))
  }

  const scriptureTabs = [
    { value: 'quran', label: 'Al-Qur`an', icon: 'tabler-book-2', data: getVersesForScripture('QURAN', quranData) },
    { value: 'taurat', label: 'Kitab Taurat (Torah)', icon: 'tabler-scroll', data: getVersesForScripture('TAURAT', tauratData) },
    { value: 'zabur', label: 'Kitab Zabur (Tehillim)', icon: 'tabler-music', data: getVersesForScripture('ZABUR', zaburData) },
    { value: 'injil', label: 'Kitab Injil (Gospels)', icon: 'tabler-feather', data: getVersesForScripture('INJIL', injilData) }
  ]

  return (
    <Card className='bs-full'>
      <CardHeader
        title={t.title}
        subheader={t.subtitle}
        action={
          <div className='flex items-center gap-2'>
            <CustomChip
              label={dbConcordances.length > 0 ? `${dbConcordances.length} Prisma Records` : t.badge}
              color={dbConcordances.length > 0 ? 'success' : 'secondary'}
              skin='light'
              size='small'
              round='true'
            />
            <OptionMenu options={[t.filter, t.print]} />
          </div>
        }
      />
      <CardContent>
        <TabContext value={activeTab}>
          <CustomTabList
            onChange={handleTabChange}
            variant='scrollable'
            className='mb-4 border-b border-[var(--mui-palette-divider)]'
          >
            {scriptureTabs.map(tab => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <div className='flex items-center gap-2'>
                    <i className={`${tab.icon} text-[18px]`} />
                    <span>{tab.label}</span>
                  </div>
                }
              />
            ))}
          </CustomTabList>

          {scriptureTabs.map(tab => (
            <TabPanel key={tab.value} value={tab.value} className='p-0 flex flex-col gap-3'>
              {tab.data.map((item, idx) => (
                <div key={idx} className='p-4 border rounded-xl border-[var(--mui-palette-divider)]'>
                  <div className='flex items-center justify-between mb-2 flex-wrap gap-2'>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar skin='light' color='primary' size={28} variant='rounded'>
                        <i className='tabler-bookmark text-[16px]' />
                      </CustomAvatar>
                      <Typography variant='subtitle1' className='font-bold' color='text.primary'>
                        {item.reference}
                      </Typography>
                    </div>
                    <CustomChip label={item.badge} color='primary' skin='light' size='small' round='true' />
                  </div>

                  {item.originalText && (
                    <Typography
                      variant='h6'
                      className='my-2 leading-relaxed'
                      color='primary.main'
                      sx={{
                        fontFamily: activeTab === 'quran' ? 'Amiri, serif' : 'serif',
                        textAlign:
                          activeTab === 'quran' || activeTab === 'taurat' || activeTab === 'zabur' ? 'right' : 'left',
                        direction:
                          activeTab === 'quran' || activeTab === 'taurat' || activeTab === 'zabur' ? 'rtl' : 'ltr'
                      }}
                    >
                      {item.originalText}
                    </Typography>
                  )}

                  <Typography variant='body2' color='text.secondary' className='italic mb-3'>
                    &ldquo;{item.translation}&rdquo;
                  </Typography>

                  <div className='p-3 rounded-lg border-l-4 border-primary bg-[var(--mui-palette-action-hover)]'>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <i className='tabler-microscope text-primary text-[16px]' />
                      <Typography variant='caption' className='font-bold' color='text.primary'>
                        {t.science}:
                      </Typography>
                    </div>
                    <Typography variant='caption' color='text.secondary' className='block'>
                      {item.scientificMeaning}
                    </Typography>
                  </div>
                </div>
              ))}
            </TabPanel>
          ))}
        </TabContext>
      </CardContent>
    </Card>
  )
}
