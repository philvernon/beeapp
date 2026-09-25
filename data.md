# NHBKA Bee Hive Record Sheet — Field Reference

## Header Section (Hive-level metadata, filled once per hive)

| Field              | Meaning                                  | DB Column                                |
| ------------------ | ---------------------------------------- | ---------------------------------------- |
| Apiary             | Location/site name (shared across hives) | `apiaries.name` → `hives.apiary_id` (FK) |
| Colony             | Hive identifier                          | `hives.name`                             |
| Queen breed from   | Queen lineage/breed                      | `hives.queen_breed`                      |
| Queen Clipped? Y/N | Whether queen is marked/clipped          | `hives.queen_clipped` (boolean)          |

## Inspection Row Columns (filled per inspection)

### Q — Queen Presence

| DB Column       | Type    | Meaning                        |
| --------------- | ------- | ------------------------------ |
| `queen_seen`    | BOOLEAN | true = seen, false = not found |
| `queen_clipped` | BOOLEAN | true if queen is clipped/mark  |
| `queen_colour`  | TEXT    | W, Y, R, G, B (colour code)    |

### QC — Queen Cells

| DB Column             | Type    | Meaning                                |
| --------------------- | ------- | -------------------------------------- |
| `queen_cells_found`   | INTEGER | number of queen cells seen             |
| `queen_cells_removed` | BOOLEAN | true = all removed, false = left alone |

### Brood

| DB Column           | Type    | Meaning                     |
| ------------------- | ------- | --------------------------- |
| `eggs_seen`         | BOOLEAN | e = eggs present            |
| `brood_pattern_ok`  | BOOLEAN | • = pattern ok              |
| `brood_frame_count` | INTEGER | number of frames with brood |

### Stores — Honey/Pollen Quantity

| DB Column      | Type    | Meaning                                             |
| -------------- | ------- | --------------------------------------------------- |
| `store_frames` | INTEGER | super-frame equivalents (e.g. 10 = 10 super frames) |

### Room — Available Laying Space

| DB Column     | Type    | Meaning                                               |
| ------------- | ------- | ----------------------------------------------------- |
| `room_frames` | INTEGER | brood-frame equivalents (e.g. 5 = 5 frames available) |

### Health — Disease Status

| DB Column               | Type    | Meaning       |
| ----------------------- | ------- | ------------- |
| `health_ok`             | BOOLEAN | true = all ok |
| `chalk_brood_suspected` | BOOLEAN | CB?           |
| `efb_suspected`         | BOOLEAN | EFB?          |
| `afb_suspected`         | BOOLEAN | AFB?          |

### Varroa — Mite Load

| DB Column      | Type        | Meaning                                |
| -------------- | ----------- | -------------------------------------- |
| `varroa_level` | TEXT (enum) | l = low, m = medium, h = high          |
| `varroa_count` | INTEGER     | estimated population from natural drop |

### Temper — Docility Score

| DB Column           | Type           | Meaning                            |
| ------------------- | -------------- | ---------------------------------- |
| `temperament_score` | INTEGER (1-10) | 10 = calm, lower = more aggressive |

### Feed — Feeding Amount

| DB Column                 | Type    | Meaning                          |
| ------------------------- | ------- | -------------------------------- |
| `feed_litres_light_syrup` | NUMERIC | e.g. 2 LS = 2 litres light syrup |
| `feed_litres_heavy_syrup` | NUMERIC | e.g. 1 HS = 1 litre heavy syrup  |

### Supers — Added/Removed

| DB Column       | Type    | Meaning                               |
| --------------- | ------- | ------------------------------------- |
| `supers_change` | NUMERIC | +1 = added 1, -0.5 = removed 5 frames |

### Weather — Conditions

| DB Column             | Type        | Meaning                                    |
| --------------------- | ----------- | ------------------------------------------ |
| `weather_temperature` | TEXT        | Temperature reading                        |
| `weather_condition`   | TEXT (enum) | c = cloudy, s = sunny, r = rainy, f = fair |

### Notes

| DB Column | Type | Meaning                                            |
| --------- | ---- | -------------------------------------------------- |
| `notes`   | TEXT | Freeform observations (propolis, box repair, etc.) |

## Example Row (from original sheet)

| Field   | Paper Value  | DB Columns                                                                                  |
| ------- | ------------ | ------------------------------------------------------------------------------------------- |
| Date    | 2017         | `inspection_date` = '2017-01-01'                                                            |
| Q       | ✓ x c WYRGB  | `queen_seen`=true, `queen_clipped`=true, `queen_colour`='WYRGB'                             |
| QC      | X 10X 2L     | `queen_cells_found`=10, `queen_cells_removed`=true (all removed)                            |
| Brood   | ✓ e 3        | `eggs_seen`=true, `brood_pattern_ok`=true, `brood_frame_count`=3                            |
| Stores  | 0 - 11 SF    | `store_frames`=11                                                                           |
| Room    | Available    | `room_frames`=5 (example)                                                                   |
| Health  | ✓ CB EFB AFB | `health_ok`=false, `chalk_brood_suspected`=true, `efb_suspected`=true, `afb_suspected`=true |
| Varroa  | L M H        | `varroa_level`='m' (example), `varroa_count`=null                                           |
| Temper  | 10G - 1B     | `temperament_score`=10 (calm)                                                               |
| Feed    | 2LS 1HS      | `feed_litres_light_syrup`=2, `feed_litres_heavy_syrup`=1                                    |
| Supers  | +1 -1        | `supers_change`=0 (net), or separate entries                                                |
| Weather | CSRF         | `weather_condition`='c' (cloudy)                                                            |
| Notes   | —            | `notes`=null                                                                                |
