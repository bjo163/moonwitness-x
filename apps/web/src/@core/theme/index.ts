/**
 * @deprecated Import the theme factory from `@moonwitness/ui/theme`.
 * This adapter preserves the former application-level settings signature.
 */
import type { Theme } from '@mui/material/styles'
import createMoonwitnessTheme from '@moonwitness/ui/theme'
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

const coreTheme = (settings: Settings, mode: SystemMode, direction: Theme['direction']): Theme =>
  createMoonwitnessTheme({
    skin: settings.skin ?? 'default',
    mode,
    direction,
    fontFamily: '"Public Sans", sans-serif'
  })

export default coreTheme
