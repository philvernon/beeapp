CREATE TABLE apiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiary_id UUID NOT NULL REFERENCES apiaries(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  queen_breed TEXT,
  queen_clipped BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,

  -- Q: Queen presence
  queen_seen BOOLEAN,
  queen_colour TEXT CHECK (queen_colour IN ('W', 'Y', 'R', 'G', 'B')),

  -- QC: Queen cells
  queen_cells_found INTEGER CHECK (queen_cells_found >= 0),
  queen_cells_removed BOOLEAN,

  -- Brood
  eggs_seen BOOLEAN,
  brood_pattern_ok BOOLEAN,
  brood_frame_count INTEGER CHECK (brood_frame_count >= 0),

  -- Stores: honey/pollen quantity (integer super-frame equivalents)
  store_frames INTEGER CHECK (store_frames >= 0),

  -- Room: available laying space (integer brood-frame equivalents)
  room_frames INTEGER CHECK (room_frames >= 0),

  -- Health: disease status
  health_ok BOOLEAN,
  chalk_brood_suspected BOOLEAN,
  efb_suspected BOOLEAN,
  afb_suspected BOOLEAN,

  -- Varroa
  varroa_level TEXT CHECK (varroa_level IN ('l', 'm', 'h')),
  varroa_count INTEGER CHECK (varroa_count >= 0),

  -- Temper: docility score (integer 1-10)
  temperament_score INTEGER CHECK (temperament_score BETWEEN 1 AND 10),

  -- Feed
  feed_litres_light_syrup NUMERIC(5,2) CHECK (feed_litres_light_syrup >= 0),
  feed_litres_heavy_syrup NUMERIC(5,2) CHECK (feed_litres_heavy_syrup >= 0),

  -- Supers
  supers_change NUMERIC(5,2),

  -- Weather
  weather_temperature_c NUMERIC(4,1),
  weather_condition TEXT CHECK (weather_condition IN ('c', 's', 'r', 'f')),

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hives_apiary_id ON hives(apiary_id);
CREATE INDEX idx_inspections_hive_date ON inspections (hive_id, inspection_date DESC);
