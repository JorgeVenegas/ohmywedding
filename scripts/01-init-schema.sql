-- Create weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT UNIQUE NOT NULL,
  partner1_first_name TEXT NOT NULL,
  partner1_last_name TEXT NOT NULL,
  partner2_first_name TEXT NOT NULL,
  partner2_last_name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  wedding_time TIME NOT NULL,
  story TEXT,
  primary_color TEXT DEFAULT '#a86b8f',
  secondary_color TEXT DEFAULT '#8b9d6f',
  accent_color TEXT DEFAULT '#e8a76a',
  ceremony_venue_name TEXT,
  ceremony_venue_address TEXT,
  reception_venue_name TEXT,
  reception_venue_address TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  attending TEXT DEFAULT 'pending', -- 'yes', 'no', 'pending'
  companions INTEGER DEFAULT 0,
  dietary_restrictions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  attending TEXT NOT NULL, -- 'yes', 'no', 'maybe'
  companions INTEGER DEFAULT 0,
  dietary_restrictions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by TEXT,
  is_official BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create guest moments table (user-uploaded photos)
CREATE TABLE IF NOT EXISTS guest_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  event_time TIME NOT NULL,
  event_name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  registry_name TEXT NOT NULL,
  registry_url TEXT NOT NULL,
  registry_type TEXT, -- 'amazon', 'target', 'custom', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create FAQ table
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(wedding_id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weddings_owner_id ON weddings(owner_id);
CREATE INDEX IF NOT EXISTS idx_weddings_wedding_id ON weddings(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_wedding_id ON rsvps(wedding_id);
CREATE INDEX IF NOT EXISTS idx_gallery_wedding_id ON gallery(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_moments_wedding_id ON guest_moments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_messages_wedding_id ON messages(wedding_id);
CREATE INDEX IF NOT EXISTS idx_schedule_wedding_id ON schedule(wedding_id);
CREATE INDEX IF NOT EXISTS idx_gifts_wedding_id ON gifts(wedding_id);
CREATE INDEX IF NOT EXISTS idx_faq_wedding_id ON faq(wedding_id);

-- Enable Row Level Security
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weddings table
CREATE POLICY "Users can view their own weddings" ON weddings
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own weddings" ON weddings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own weddings" ON weddings
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for public access to wedding data
CREATE POLICY "Anyone can view public wedding data" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert RSVPs" ON rsvps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view gallery" ON gallery
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view schedule" ON schedule
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view gifts" ON gifts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view FAQ" ON faq
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view approved guest moments" ON guest_moments
  FOR SELECT USING (approved = true);

CREATE POLICY "Owners can view all guest moments" ON guest_moments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.wedding_id = guest_moments.wedding_id
      AND weddings.owner_id = auth.uid()
    )
  );
