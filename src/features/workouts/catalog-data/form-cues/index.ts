import { HOLD_CUES } from './holds'
import { LOWER_CUES } from './lower'
import { UPPER_CUES } from './upper'

/** Catalog form cues by exact exercise name, merged into each catalog entry
 * as `formCues` when seeding (see seedCatalog). Cardio has none — pacing
 * and effort are logged, not coached. */
export const FORM_CUES: Record<string, string[]> = { ...UPPER_CUES, ...LOWER_CUES, ...HOLD_CUES }
