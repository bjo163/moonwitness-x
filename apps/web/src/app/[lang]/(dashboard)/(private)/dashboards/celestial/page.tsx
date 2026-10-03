// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CelestialClockHero from '@views/dashboards/celestial/CelestialClockHero'
import CosmicTimeEngineCard from '@views/dashboards/celestial/CosmicTimeEngineCard'
import AntikytheraTelemetryCard from '@views/dashboards/celestial/AntikytheraTelemetryCard'
import PrayerAndQiblaCard from '@views/dashboards/celestial/PrayerAndQiblaCard'
import FourScripturesMatrixCard from '@views/dashboards/celestial/FourScripturesMatrixCard'
import ConjunctionAndHilalCard from '@views/dashboards/celestial/ConjunctionAndHilalCard'
import ObservatoryNetworkCard from '@views/dashboards/celestial/ObservatoryNetworkCard'
import { getLocale } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'

const DashboardCelestial = async ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang: routeLang } = await params
  const lang = getLocale(routeLang)
  const { celestial } = await getDictionary(lang)

  return (
    <Grid container spacing={6}>
      {/* 1. True Celestial Clock (TCC) Hero */}
      <Grid size={{ xs: 12 }}>
        <CelestialClockHero translations={celestial.clock} />
      </Grid>

      {/* 2. Antikythera Gear Telemetry & Living Clockwork Mechanism */}
      <Grid size={{ xs: 12 }}>
        <AntikytheraTelemetryCard translations={celestial.mechanism} />
      </Grid>

      {/* 3. Astronomical Prayer Times & Qibla Compass */}
      <Grid size={{ xs: 12 }}>
        <PrayerAndQiblaCard />
      </Grid>

      {/* 4. Western Horizon Rukyat Hilal & Conjunction Engine */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <ConjunctionAndHilalCard translations={celestial.hilal} />
      </Grid>

      {/* 5. Cosmic Time Engine (FLRW & Planck 2018) */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <CosmicTimeEngineCard translations={celestial.cosmic} locale={lang} />
      </Grid>

      {/* 6. 4 Revealed Scriptures Concordance Matrix */}
      <Grid size={{ xs: 12 }}>
        <FourScripturesMatrixCard translations={celestial.scriptures} />
      </Grid>

      {/* 7. Global Rukyat Observatory Network (Prisma ORM) */}
      <Grid size={{ xs: 12 }}>
        <ObservatoryNetworkCard translations={celestial.observatory} />
      </Grid>
    </Grid>
  )
}

export default DashboardCelestial
