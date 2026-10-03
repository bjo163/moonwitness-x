import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌌 Seeding Moonwitness Celestial Database...')

  // 1. Observation Stations
  const stations = [
    {
      name: 'Observatorium Bosscha',
      code: 'ID-BOS',
      latitude: -6.8252,
      longitude: 107.6169,
      elevation: 1310,
      country: 'Indonesia',
      city: 'Lembang, Bandung Barat'
    },
    {
      name: 'Pos Observasi Bulan Cibeas / Pelabuhan Ratu',
      code: 'ID-PLR',
      latitude: -7.0261,
      longitude: 106.5447,
      elevation: 105,
      country: 'Indonesia',
      city: 'Sukabumi, Jawa Barat'
    },
    {
      name: 'Observatorium Nasional Timau',
      code: 'ID-TMU',
      latitude: -9.5855,
      longitude: 123.9472,
      elevation: 1300,
      country: 'Indonesia',
      city: 'Gunung Timau, Kupang NTT'
    },
    {
      name: 'Makkah Clock Royal Tower Astronomy Center',
      code: 'SA-MAK',
      latitude: 21.4194,
      longitude: 39.8256,
      elevation: 600,
      country: 'Saudi Arabia',
      city: 'Makkah Al-Mukarramah'
    },
    {
      name: 'Royal Greenwich Observatory',
      code: 'UK-RGO',
      latitude: 51.4769,
      longitude: 0.0005,
      elevation: 48,
      country: 'United Kingdom',
      city: 'London'
    }
  ]

  for (const st of stations) {
    await prisma.observationStation.upsert({
      where: { code: st.code },
      update: st,
      create: st
    })
  }
  console.log(`✅ ${stations.length} Observation Stations seeded.`)

  // 2. Cosmic Scripture Concordance Records
  const concordances = [
    {
      scripture: 'QURAN',
      reference: 'QS As-Sajdah 32:5 & Al-Hajj 22:47',
      originalText: 'يُدَبِّرُ ٱلْأَمْرَ مِنَ ٱلسَّمَآءِ إِلَى ٱلْأَرْضِ ثُمَّ يَعْرُجُ إِلَيْهِ فِى يَوْمٍ كَانَ مِقْدَارُهُۥٓ أَلْفَ سَنَةٍ مِّمَّا تَعُدُّونَ',
      translation: 'Dia mengatur urusan dari langit ke bumi, kemudian (urusan itu) naik kepada-Nya dalam satu hari yang kadarnya seribu tahun menurut perhitunganmu.',
      cosmicTopic: 'SPEED_OF_LIGHT',
      scientificValue: 'c = 299,792.5 km/s (Derivasi Dr. Mansour Hassab-Elnaby, deviasi < 0.0001%)',
      correlationRatio: 299792.5
    },
    {
      scripture: 'QURAN',
      reference: 'QS Al-Ma\'arij 70:4',
      originalText: 'تَعْرُجُ ٱلْمَلَـٰٓئِكَةُ وَٱلرُّوحُ إِلَيْهِ فِى يَوْمٍ كَانَ مِقْدَارُهُۥ خَمْسِينَ أَلْفَ سَنَةٍ',
      translation: 'Malaikat-malaikat dan Jibril naik (menghadap) kepada Tuhan dalam sehari yang kadarnya lima puluh ribu tahun.',
      cosmicTopic: 'DIVINE_TIME_DILATION',
      scientificValue: 'Faktor Lorentz γ = 1.826 × 10^7, v = 0.9999999999999985 c',
      correlationRatio: 18262100.0
    },
    {
      scripture: 'QURAN',
      reference: 'QS Fussilat 41:9-12 & Al-A\'raf 7:54',
      originalText: 'قُلْ أَئِنَّكُمْ لَتَكْفُرُونَ بِٱلَّذِى خَلَقَ ٱلْأَرْضَ فِى يَوْمَيْنِ ... وَجَعَلَ فِيهَا رَوَٰسِىَ مِن فَوْقِهَا ... فِىٓ أَرْبَعَةِ أَيَّامٍ',
      translation: 'Katakanlah: Pantaskah kamu ingkar kepada Yang menciptakan bumi dalam dua masa?... dan menciptakan langit dalam dua masa (total 6 masa).',
      cosmicTopic: 'CREATION_EONS',
      scientificValue: 'Rasio Usia Bumi (4.543 Gyr) / Semesta (13.787 Gyr) = 32.95% ≈ 2/6 = 33.33%',
      correlationRatio: 32.95
    },
    {
      scripture: 'QURAN',
      reference: 'QS Adz-Dzariyat 51:47',
      originalText: 'وَٱلسَّمَآءَ بَنَيْنَـٰهَا بِأَيْيْدٍ وَإِنَّا لَمُوسِعُونَ',
      translation: 'Dan langit itu Kami bangun dengan kekuasaan (Kami) dan sesungguhnya Kami benar-benar meluaskannya.',
      cosmicTopic: 'FLRW_EXPANSION',
      scientificValue: 'Hubble parameter H0 = 67.36 km/s/Mpc, metrik FLRW da/dt > 0',
      correlationRatio: 67.36
    },
    {
      scripture: 'TAURAT',
      reference: 'Bereshit (Kejadian) 1:1-2:3 & 1:14',
      originalText: 'וַיֹּאמֶר אֱלֹהִים יְהִי מְאֹרֹת בִּרְקִיעַ הַשָּׁמַיִם לְהַבְדִּיל בֵּין הַיּוֹם וּבֵין הַלָּיְלָה וְהָיוּ לְאֹתֹת וּלְמוֹעֲדִים וּלְיָמִים וְשָׁנִים',
      translation: 'Jadilah benda-benda penerang pada cakrawala untuk memisahkan siang dari malam. Biarlah benda-benda penerang itu menjadi tanda yang menunjukkan masa-masa yang tetap dan hari-hari dan tahun-tahun.',
      cosmicTopic: 'CELESTIAL_CLOCK',
      scientificValue: 'Penetapan Matahari & Bulan pada Eon ke-4 (rasio evolusi tata surya)',
      correlationRatio: 66.67
    },
    {
      scripture: 'ZABUR',
      reference: 'Tehillim (Mazmur) 90:4',
      originalText: 'כִּי אֶלֶף שָׁנִים בְּעֵינֶיךָ כְּיוֹם אֶתְמוֹל כִּי יַעֲבֹר וְאַשְׁמוּרָה בַלָּיְלָה',
      translation: 'Sebab di mata-Mu seribu tahun sama seperti hari kemarin, apabila berlalu, atau seperti suatu giliran jaga di waktu malam.',
      cosmicTopic: 'DIVINE_TIME_DILATION',
      scientificValue: 'Kompresi waktu 1 hari = 1.000 tahun (1:365.242) dan giliran jaga malam (1:2.500.000)',
      correlationRatio: 365242.0
    },
    {
      scripture: 'INJIL',
      reference: '2 Petrus 3:8',
      originalText: 'μία ἡμέρα παρὰ Κυρίῳ ὡς χίλια ἔτη, καὶ χίλια ἔτη ὡς ἡμέρα μία',
      translation: 'Satu hari di hadapan Tuhan adalah sama dengan seribu tahun dan seribu tahun sama dengan satu hari.',
      cosmicTopic: 'BIDIRECTIONAL_RELATIVITY',
      scientificValue: 'Prinsip kesetaraan invarian relativistik timbal-balik (Frame Invariance)',
      correlationRatio: 1000.0
    }
  ]

  for (const item of concordances) {
    const existing = await prisma.cosmicScriptureConcordance.findFirst({
      where: { reference: item.reference }
    })
    if (!existing) {
      await prisma.cosmicScriptureConcordance.create({ data: item })
    }
  }
  console.log(`✅ ${concordances.length} Cosmic Scripture Concordances seeded.`)

  // 3. Celestial Events
  const events = [
    {
      eventType: 'CONJUNCTION',
      title: 'Ijtimak Astronomis Ramadan 1447 H',
      eventDateUtc: new Date('2026-02-17T12:00:00Z'),
      julianDay: 2461089.0,
      description: 'Konjungsi geosentris Matahari dan Bulan penanda awal bulan suci Ramadan 1447 H.',
      metadataJson: JSON.stringify({ elongation: 0.0, phase: 'New Moon', cycle: 'Metonic Month 182' })
    },
    {
      eventType: 'SOLAR_ECLIPSE',
      title: 'Gerhana Matahari Total Luxor 2027',
      eventDateUtc: new Date('2027-08-02T10:07:00Z'),
      julianDay: 2461619.92,
      description: 'Gerhana matahari total terpanjang abad ke-21 (durasi totalitas 6 menit 23 detik di Luxor, Mesir).',
      metadataJson: JSON.stringify({ saros_series: 136, magnitude: 1.079, duration_seconds: 383 })
    }
  ]

  for (const ev of events) {
    const existing = await prisma.celestialEvent.findFirst({
      where: { title: ev.title }
    })
    if (!existing) {
      await prisma.celestialEvent.create({ data: ev })
    }
  }
  console.log(`✅ ${events.length} Celestial Events seeded.`)

  // 4. Celestial Settings
  const settings = [
    { key: 'default_criteria', value: 'MABIMS', description: 'Kriteria default evaluasi hilal (MABIMS 3° / 6.4°)' },
    { key: 'time_daemon_url', value: 'http://localhost:5155', description: 'URL endpoint Rust Time Daemon' },
    { key: 'gateway_url', value: 'http://localhost:5150', description: 'URL endpoint Go Celestial API Gateway' },
    { key: 'analytics_url', value: 'http://localhost:5156', description: 'URL endpoint Python Analytics Service' }
  ]

  for (const s of settings) {
    await prisma.celestialSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s
    })
  }
  console.log('✅ Celestial Settings configured.')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
