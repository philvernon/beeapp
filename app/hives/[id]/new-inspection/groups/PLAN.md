# Inspection Form Groups — Test Plan

All tests go in `app/hives/[id]/inspection-form/groups/*.test.tsx`.
Use the same pattern as `app/hives/[id]/__tests__/inspection-card.test.tsx`: simple `render` + `screen` assertions, no mocking needed.

## colony-fields.test.tsx

**Fields:** `eggsSeen`, `broodPatternOk`, `broodFrameCount`, `storeFrames`, `roomFrames`

| # | Test |
|---|------|
| 1 | Renders all five fields |
| 2 | `eggsSeen` renders Yes/No radio options |
| 3 | `broodPatternOk` renders Yes/No radio options |
| 4 | `broodFrameCount` renders a number input |
| 5 | `storeFrames` renders a number input |
| 6 | `roomFrames` renders a number input |

## health-fields.test.tsx

**Fields:** `healthOk`, `chalkBroodSuspected`, `efbSuspected`, `afbSuspected`, `varroaLevel`, `varroaCount`

| # | Test |
|---|------|
| 1 | Renders "No disease signs" Yes/No radio |
| 2 | Disease flags (chalk brood, EFB, AFB) are hidden when healthOk is true |
| 3 | Disease flags appear when healthOk is false |
| 4 | Varroa level renders Low/Medium/High options |
| 5 | Varroa count renders a number input |

## weather-fields.test.tsx

**Fields:** `temperamentScore`, `feedLitresLightSyrup`, `feedLitresHeavySyrup`, `supersChange`

| # | Test |
|---|------|
| 1 | Renders temperament score number input |
| 2 | Renders light syrup number input |
| 3 | Renders heavy syrup number input |
| 4 | Renders supers change number input |

## notes-fields.test.tsx

**Fields:** `weatherTemperatureC`, `weatherCondition`, `notes`

| # | Test |
|---|------|
| 1 | Renders temperature number input |
| 2 | Weather condition renders Cloudy/Sunny/Rain/Fair options |
| 3 | Notes renders a textarea |

## queen-fields.test.tsx

**Fields:** `queenSeen`, `queenColour`, `queenCellsFound`, `queenCellsRemoved`

| # | Test |
|---|------|
| 1 | Renders "Queen seen" Yes/No radio |
| 2 | Queen colour options are hidden when queenSeen is false |
| 3 | Queen colour options appear when queenSeen is true |
| 4 | Queen cells found renders a number input |
| 5 | Queen cells removed renders Yes/No radio |

## Finished when

All 24 tests pass: `npx vitest run app/hives/\[id\]/inspection-form/groups/`
