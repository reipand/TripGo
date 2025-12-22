-- TripGo Flights Schema
-- Add this to your Supabase SQL editor

-- CITIES Table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT DEFAULT 'Indonesia',
  timezone TEXT DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROUTES Table
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  origin_city_id UUID REFERENCES public.cities(id) ON DELETE RESTRICT,
  destination_city_id UUID REFERENCES public.cities(id) ON DELETE RESTRICT,
  distance_km INTEGER,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(origin_city_id, destination_city_id)
);

-- TRANSPORTATIONS Table (Airlines & Trains)
CREATE TABLE IF NOT EXISTS public.transportations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Pesawat', 'Kereta')),
  logo_url TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHEDULES Table (Flights & Trains)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id) ON DELETE RESTRICT,
  transportation_id UUID REFERENCES public.transportations(id) ON DELETE RESTRICT,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 180,
  booked_seats INTEGER DEFAULT 0,
  available_seats INTEGER GENERATED ALWAYS AS (total_seats - booked_seats) STORED,
  aircraft_type TEXT,
  baggage_allowance TEXT DEFAULT '20kg',
  meal_included BOOLEAN DEFAULT FALSE,
  wifi_available BOOLEAN DEFAULT FALSE,
  entertainment BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled')),
  gate TEXT,
  terminal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_cities_code ON public.cities(code);
CREATE INDEX IF NOT EXISTS idx_routes_origin ON public.routes(origin_city_id);
CREATE INDEX IF NOT EXISTS idx_routes_destination ON public.routes(destination_city_id);
CREATE INDEX IF NOT EXISTS idx_routes_active ON public.routes(is_active);
CREATE INDEX IF NOT EXISTS idx_transportations_type ON public.transportations(type);
CREATE INDEX IF NOT EXISTS idx_transportations_active ON public.transportations(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON public.schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_transportation ON public.schedules(transportation_id);
CREATE INDEX IF NOT EXISTS idx_schedules_departure ON public.schedules(departure_time);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);

-- RLS POLICIES
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Public can view routes" ON public.routes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view transportations" ON public.transportations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view schedules" ON public.schedules
  FOR SELECT USING (status != 'cancelled');

-- GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT SELECT ON public.routes TO anon, authenticated;
GRANT SELECT ON public.transportations TO anon, authenticated;
GRANT SELECT ON public.schedules TO anon, authenticated;

-- SAMPLE DATA
-- Cities
INSERT INTO public.cities (code, name, country) VALUES
('CGK', 'Jakarta', 'Indonesia'),
('DPS', 'Denpasar', 'Indonesia'),
('JOG', 'Yogyakarta', 'Indonesia'),
('SUB', 'Surabaya', 'Indonesia'),
('BDO', 'Bandung', 'Indonesia'),
('MDC', 'Manado', 'Indonesia')
ON CONFLICT (code) DO NOTHING;

-- Transportations (Airlines & Trains)
INSERT INTO public.transportations (name, type, logo_url, country) VALUES
('Garuda Indonesia', 'Pesawat', '/images/airline-logo-garuda.png', 'Indonesia'),
('Lion Air', 'Pesawat', '/images/airline-logo-lion.png', 'Indonesia'),
('Citilink', 'Pesawat', '/images/airline-logo-citilink.png', 'Indonesia'),
('Batik Air', 'Pesawat', NULL, 'Indonesia'),
('AirAsia', 'Pesawat', NULL, 'Malaysia'),
('KAI (Kereta Api Indonesia)', 'Kereta', '/images/train-logo-kai.png', 'Indonesia'),
('Argo Parahyangan', 'Kereta', NULL, 'Indonesia'),
('Taksaka', 'Kereta', NULL, 'Indonesia')
ON CONFLICT DO NOTHING;

-- Routes (CGK to DPS)
DO $$
DECLARE
  cgk_id UUID;
  dps_id UUID;
  route_id_var UUID;
  garuda_id UUID;
  lion_id UUID;
  citilink_id UUID;
BEGIN
  -- Get city IDs
  SELECT id INTO cgk_id FROM public.cities WHERE code = 'CGK';
  SELECT id INTO dps_id FROM public.cities WHERE code = 'DPS';
  
  -- Get airline IDs
  SELECT id INTO garuda_id FROM public.transportations WHERE name = 'Garuda Indonesia';
  SELECT id INTO lion_id FROM public.transportations WHERE name = 'Lion Air';
  SELECT id INTO citilink_id FROM public.transportations WHERE name = 'Citilink';
  
  -- Create route
  INSERT INTO public.routes (origin_city_id, destination_city_id, distance_km, estimated_duration_minutes)
  VALUES (cgk_id, dps_id, 1000, 90)
  ON CONFLICT (origin_city_id, destination_city_id) DO UPDATE SET is_active = true
  RETURNING id INTO route_id_var;
  
  -- Create sample schedules for tomorrow
  IF route_id_var IS NOT NULL THEN
    -- Garuda flights
    INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
    VALUES
    (route_id_var, garuda_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes'), 1500000, 180),
    (route_id_var, garuda_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours 30 minutes'), 1600000, 180)
    ON CONFLICT DO NOTHING;
    
    -- Lion Air flights
    INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
    VALUES
    (route_id_var, lion_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '6 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '7 hours 30 minutes'), 1200000, 180),
    (route_id_var, lion_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '13 hours 30 minutes'), 1300000, 180),
    (route_id_var, lion_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '18 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '19 hours 30 minutes'), 1400000, 180)
    ON CONFLICT DO NOTHING;
    
    -- Citilink flights
    INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
    VALUES
    (route_id_var, citilink_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '11 hours 30 minutes'), 1100000, 180)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Train Routes and Schedules (Jakarta to Bandung)
DO $$
DECLARE
  jkt_id UUID;
  bdg_id UUID;
  train_route_id UUID;
  kai_id UUID;
  argo_id UUID;
  taksaka_id UUID;
BEGIN
  -- Get city IDs
  SELECT id INTO jkt_id FROM public.cities WHERE code = 'CGK' LIMIT 1;
  SELECT id INTO bdg_id FROM public.cities WHERE code = 'BDO' LIMIT 1;
  
  -- Get transportation IDs
  SELECT id INTO kai_id FROM public.transportations WHERE name = 'KAI (Kereta Api Indonesia)' LIMIT 1;
  SELECT id INTO argo_id FROM public.transportations WHERE name = 'Argo Parahyangan' LIMIT 1;
  SELECT id INTO taksaka_id FROM public.transportations WHERE name = 'Taksaka' LIMIT 1;
  
  -- Create train route if cities exist
  IF jkt_id IS NOT NULL AND bdg_id IS NOT NULL THEN
    -- Create route
    INSERT INTO public.routes (origin_city_id, destination_city_id, distance_km, estimated_duration_minutes)
    VALUES (jkt_id, bdg_id, 150, 180)
    ON CONFLICT (origin_city_id, destination_city_id) DO UPDATE SET is_active = true
    RETURNING id INTO train_route_id;
    
    -- Create sample train schedules for tomorrow
    IF train_route_id IS NOT NULL THEN
      -- KAI trains
      INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
      VALUES
      (train_route_id, kai_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '6 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours'), 150000, 500),
      (train_route_id, kai_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours'), 160000, 500)
      ON CONFLICT DO NOTHING;
      
      -- Argo Parahyangan
      INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
      VALUES
      (train_route_id, argo_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '7 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours 30 minutes'), 200000, 300),
      (train_route_id, argo_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours 30 minutes'), 210000, 300)
      ON CONFLICT DO NOTHING;
      
      -- Taksaka
      INSERT INTO public.schedules (route_id, transportation_id, departure_time, arrival_time, price, total_seats)
      VALUES
      (train_route_id, taksaka_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes'), 180000, 400),
      (train_route_id, taksaka_id, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '17 hours 30 minutes'), 190000, 400)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

