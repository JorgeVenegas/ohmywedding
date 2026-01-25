-- Add is_demo flag to weddings table
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Create index for demo weddings
CREATE INDEX IF NOT EXISTS idx_weddings_is_demo ON weddings(is_demo) WHERE is_demo = true;

-- Add RLS policy for public read access to demo weddings
DROP POLICY IF EXISTS "Anyone can read demo weddings" ON weddings;
CREATE POLICY "Anyone can read demo weddings" ON weddings
  FOR SELECT
  USING (is_demo = true);

-- Demo wedding 1: Classic Elegance - James & Victoria
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-classic-elegance',
  'demo-classic-elegance',
  'James',
  'Wellington',
  'Victoria',
  'Ashford',
  '2026-06-20',
  '16:00',
  '18:00',
  '#7A5A62',
  '#F8F5F5',
  '#D4AF37',
  'St. Patrick''s Cathedral',
  '5th Avenue, New York, NY',
  'The Plaza Hotel',
  '768 5th Avenue, New York, NY',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#7A5A62",
          "secondary": "#F8F5F5",
          "accent": "#D4AF37",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Playfair Display",
          "heading": "Cormorant Garamond",
          "body": "Lato",
          "displayFamily": "\"Playfair Display\", serif",
          "headingFamily": "\"Cormorant Garamond\", serif",
          "bodyFamily": "\"Lato\", sans-serif",
          "googleFonts": "Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;600&family=Lato:wght@300;400;700"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "background",
        "tagline": "Two hearts, one love, forever",
        "heroImageUrl": "/images/demo_images/demo-img-1.jpg",
        "showTagline": true,
        "showCountdown": true,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "elegant"
      },
      "eventDetails": {
        "variant": "elegant",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-5.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-6.jpg",
        "customEvents": [
          {
            "id": "cocktail-hour",
            "type": "cocktail",
            "title": "Champagne Reception",
            "time": "17:00",
            "venue": "The Grand Terrace",
            "address": "East Wing, The Plaza Hotel",
            "description": "Join us for hors d''oeuvres and signature cocktails as we celebrate the beginning of our journey together.",
            "imageUrl": "/images/demo_images/demo-img-7.jpg",
            "order": 2,
            "useWeddingDate": true
          },
          {
            "id": "dinner-reception",
            "type": "reception",
            "title": "Dinner & Dancing",
            "time": "19:00",
            "venue": "The Grand Ballroom",
            "address": "The Plaza Hotel, 768 5th Avenue",
            "description": "An evening of fine dining, heartfelt toasts, and dancing until midnight.",
            "imageUrl": "/images/demo_images/demo-img-8.jpg",
            "order": 3,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "timeline",
        "howWeMetText": "We met at a charity gala in Manhattan, where James was immediately captivated by Victoria''s grace and wit. A shared love for classical music and fine art brought us together.",
        "proposalText": "On a crisp autumn evening in Central Park, surrounded by golden leaves and the soft glow of fairy lights, James got down on one knee with his grandmother''s vintage ring.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-2.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-3.jpg"
      },
      "gallery": {
        "variant": "masonry"
      },
      "rsvp": {
        "variant": "elegant"
      },
      "faq": {
        "variant": "elegant"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 1},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 2},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Demo wedding 2: Modern Minimal - Alex & Jordan
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-modern-minimal',
  'demo-modern-minimal',
  'Alex',
  'Chen',
  'Jordan',
  'Park',
  '2026-09-12',
  '18:00',
  '19:30',
  '#303030',
  '#F8F8F8',
  '#D4AF37',
  'SFMOMA Rooftop',
  '151 Third Street, San Francisco, CA',
  'SFMOMA Rooftop',
  '151 Third Street, San Francisco, CA',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#303030",
          "secondary": "#F8F8F8",
          "accent": "#D4AF37",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Raleway",
          "heading": "Lato",
          "body": "Open Sans",
          "displayFamily": "\"Raleway\", sans-serif",
          "headingFamily": "\"Lato\", sans-serif",
          "bodyFamily": "\"Open Sans\", sans-serif",
          "googleFonts": "Raleway:wght@400;600;700&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "minimal",
        "tagline": "Simply us",
        "showTagline": false,
        "showCountdown": false,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "modern"
      },
      "eventDetails": {
        "variant": "minimal",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-14.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-15.jpg",
        "customEvents": [
          {
            "id": "cocktails",
            "type": "cocktail",
            "title": "Cocktails",
            "time": "17:30",
            "venue": "Rooftop Terrace",
            "address": "SFMOMA, 151 Third Street",
            "description": "Craft cocktails and contemporary bites with skyline views.",
            "order": 2,
            "useWeddingDate": true
          },
          {
            "id": "dinner",
            "type": "reception",
            "title": "Dinner",
            "time": "19:00",
            "venue": "Gallery Space",
            "address": "SFMOMA",
            "description": "Farm-to-table dinner with curated wine pairings.",
            "order": 3,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "minimal",
        "howWeMetText": "We met at a design conference in San Francisco. Both of us reached for the last cold brew at the coffee bar—and decided to share.",
        "proposalText": "During a quiet morning at home, surrounded by our favorite plants and the soft light of sunrise, Jordan asked Alex with a ring designed by a local jeweler.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-11.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-12.jpg"
      },
      "gallery": {
        "variant": "grid"
      },
      "rsvp": {
        "variant": "minimalistic"
      },
      "faq": {
        "variant": "minimal"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 1},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 2},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Demo wedding 3: Romantic Garden - Sebastian & Isabella
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-romantic-garden',
  'demo-romantic-garden',
  'Sebastian',
  'Rose',
  'Isabella',
  'Bloom',
  '2026-05-15',
  '15:00',
  '18:00',
  '#7A9A68',
  '#F8F2F0',
  '#E8B4B8',
  'Longwood Gardens',
  'Kennett Square, Pennsylvania',
  'The Conservatory',
  'Longwood Gardens, PA',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#7A9A68",
          "secondary": "#F8F2F0",
          "accent": "#E8B4B8",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Parisienne",
          "heading": "Playfair Display",
          "body": "Lato",
          "displayFamily": "\"Parisienne\", cursive",
          "headingFamily": "\"Playfair Display\", serif",
          "bodyFamily": "\"Lato\", sans-serif",
          "googleFonts": "Parisienne&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "framed",
        "tagline": "Where love blooms eternal",
        "heroImageUrl": "/images/demo_images/demo-img-16.jpg",
        "showTagline": true,
        "showCountdown": true,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "elegant"
      },
      "eventDetails": {
        "variant": "split",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-17.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-18.jpg",
        "customEvents": [
          {
            "id": "garden-ceremony",
            "type": "religiousCeremony",
            "title": "Garden Ceremony",
            "time": "15:00",
            "venue": "The Rose Pavilion",
            "address": "Longwood Gardens, PA",
            "description": "Exchange vows surrounded by blooming roses and the gentle sound of a string quartet.",
            "imageUrl": "/images/demo_images/demo-img-17.jpg",
            "order": 0,
            "useWeddingDate": true
          },
          {
            "id": "garden-cocktails",
            "type": "cocktail",
            "title": "Cocktails in the Garden",
            "time": "16:00",
            "venue": "The Flower Walk",
            "address": "Longwood Gardens",
            "description": "Sip lavender lemonade and garden-inspired cocktails among the wisteria.",
            "imageUrl": "/images/demo_images/demo-img-19.jpg",
            "order": 1,
            "useWeddingDate": true
          },
          {
            "id": "dinner-conservatory",
            "type": "reception",
            "title": "Dinner in The Conservatory",
            "time": "18:00",
            "venue": "The Glass Conservatory",
            "address": "Longwood Gardens, PA",
            "description": "A romantic candlelit dinner beneath the stars and surrounded by exotic blooms.",
            "imageUrl": "/images/demo_images/demo-img-18.jpg",
            "order": 2,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "zigzag",
        "howWeMetText": "We met at a botanical garden during a spring festival. Sebastian was sketching the flowers when Isabella stopped to admire his work. Coffee turned into dinner, and dinner turned into forever.",
        "proposalText": "Under a canopy of wisteria in the same garden where we first met, Sebastian surprised Isabella with a picnic at sunset and a ring hidden inside a flower bouquet.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-20.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-21.jpg"
      },
      "gallery": {
        "variant": "collage"
      },
      "rsvp": {
        "variant": "elegant"
      },
      "faq": {
        "variant": "cards"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 1},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 2},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Demo wedding 4: Rustic Charm - Mason & Savannah
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-rustic-charm',
  'demo-rustic-charm',
  'Mason',
  'Brooks',
  'Savannah',
  'Fields',
  '2026-10-03',
  '17:00',
  '19:30',
  '#B86A50',
  '#FAF5F0',
  '#D4AF37',
  'Brooks Family Farm',
  'Franklin, Tennessee',
  'The Red Barn',
  'Brooks Family Farm, Franklin, TN',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#B86A50",
          "secondary": "#FAF5F0",
          "accent": "#D4AF37",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Dancing Script",
          "heading": "Raleway",
          "body": "Quicksand",
          "displayFamily": "\"Dancing Script\", cursive",
          "headingFamily": "\"Raleway\", sans-serif",
          "bodyFamily": "\"Quicksand\", sans-serif",
          "googleFonts": "Dancing+Script:wght@400;700&family=Raleway:wght@400;600&family=Quicksand:wght@300;400;600"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "background",
        "tagline": "Our love story, written in the stars",
        "heroImageUrl": "/images/demo_images/demo-img-22.jpg",
        "showTagline": true,
        "showCountdown": false,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "classic"
      },
      "eventDetails": {
        "variant": "timeline",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-23.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-24.jpg",
        "customEvents": [
          {
            "id": "meadow-ceremony",
            "type": "religiousCeremony",
            "title": "Meadow Ceremony",
            "time": "17:00",
            "venue": "Wildflower Meadow",
            "address": "Brooks Family Farm, Franklin, TN",
            "description": "Say \"I do\" in our family''s meadow, with the rolling hills as our witness.",
            "imageUrl": "/images/demo_images/demo-img-23.jpg",
            "order": 0,
            "useWeddingDate": true
          },
          {
            "id": "barn-cocktails",
            "type": "cocktail",
            "title": "Cocktails & Lawn Games",
            "time": "18:00",
            "venue": "The Farmhouse Patio",
            "address": "Brooks Family Farm",
            "description": "Enjoy craft cocktails, local beer, and yard games under the oak trees.",
            "imageUrl": "/images/demo_images/demo-img-25.jpg",
            "order": 1,
            "useWeddingDate": true
          },
          {
            "id": "barn-dinner",
            "type": "reception",
            "title": "Barn Dinner & Dancing",
            "time": "19:30",
            "venue": "The Red Barn",
            "address": "Brooks Family Farm, Franklin, TN",
            "description": "Farm-to-table feast followed by boot-scootin'' dancing under the string lights!",
            "imageUrl": "/images/demo_images/demo-img-24.jpg",
            "order": 2,
            "useWeddingDate": true
          },
          {
            "id": "bonfire",
            "type": "afterParty",
            "title": "Bonfire & S''mores",
            "time": "22:00",
            "venue": "The Fire Pit",
            "address": "Brooks Family Farm",
            "description": "End the night with a bonfire, s''mores, and stargazing.",
            "order": 3,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "cards",
        "howWeMetText": "We met at a farmers market in Nashville. Mason was selling honey from his family''s farm, and Savannah couldn''t resist coming back every week. Eventually, she asked for more than just honey.",
        "proposalText": "On his family''s farm, under a sky full of stars and surrounded by fireflies, Mason asked Savannah to be his forever. The ring was crafted from gold passed down three generations.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-26.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-27.jpg"
      },
      "gallery": {
        "variant": "masonry"
      },
      "rsvp": {
        "variant": "cards"
      },
      "faq": {
        "variant": "accordion"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 1},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 2},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Demo wedding 5: Luxury Noir - Alexander & Camille
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-luxury-noir',
  'demo-luxury-noir',
  'Alexander',
  'Sterling',
  'Camille',
  'Laurent',
  '2026-12-31',
  '19:00',
  '20:30',
  '#1E3A5F',
  '#F5F7FA',
  '#D4AF37',
  'Opéra de Monte-Carlo',
  'Place du Casino, Monaco',
  'Hôtel de Paris',
  'Place du Casino, Monte-Carlo',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#1E3A5F",
          "secondary": "#F5F7FA",
          "accent": "#D4AF37",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Cinzel",
          "heading": "Cormorant Garamond",
          "body": "Montserrat",
          "displayFamily": "\"Cinzel\", serif",
          "headingFamily": "\"Cormorant Garamond\", serif",
          "bodyFamily": "\"Montserrat\", sans-serif",
          "googleFonts": "Cinzel:wght@400;600&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "background",
        "tagline": "A celebration of extraordinary love",
        "heroImageUrl": "/images/demo_images/demo-img-28.jpg",
        "showTagline": true,
        "showCountdown": false,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "elegant"
      },
      "eventDetails": {
        "variant": "elegant",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-29.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-30.jpg",
        "customEvents": [
          {
            "id": "champagne-reception",
            "type": "cocktail",
            "title": "Champagne Reception",
            "time": "18:00",
            "venue": "The Crystal Foyer",
            "address": "Opéra de Monte-Carlo, Monaco",
            "description": "Moët & Chandon champagne and canapés in the grand foyer with live harp music.",
            "imageUrl": "/images/demo_images/demo-img-31.jpg",
            "order": 0,
            "useWeddingDate": true
          },
          {
            "id": "ceremony",
            "type": "civilCeremony",
            "title": "The Ceremony",
            "time": "19:00",
            "venue": "Main Stage",
            "address": "Opéra de Monte-Carlo",
            "description": "An intimate ceremony on the legendary opera stage.",
            "imageUrl": "/images/demo_images/demo-img-29.jpg",
            "order": 1,
            "useWeddingDate": true
          },
          {
            "id": "gala-dinner",
            "type": "reception",
            "title": "Black Tie Gala Dinner",
            "time": "20:30",
            "venue": "Salle Empire",
            "address": "Hôtel de Paris, Monte-Carlo",
            "description": "A Michelin-starred dining experience with views of the Mediterranean.",
            "imageUrl": "/images/demo_images/demo-img-30.jpg",
            "order": 2,
            "useWeddingDate": true
          },
          {
            "id": "midnight-fireworks",
            "type": "afterParty",
            "title": "Midnight Fireworks & Dancing",
            "time": "00:00",
            "venue": "Private Yacht",
            "address": "Port Hercule, Monaco",
            "description": "Ring in the new year with champagne, fireworks over Monaco, and dancing until dawn.",
            "imageUrl": "/images/demo_images/demo-img-32.jpg",
            "order": 3,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "booklet",
        "howWeMetText": "We met at an exclusive art auction in Monaco. Alexander was bidding on a rare sculpture, but found something far more valuable when he saw Camille across the room.",
        "proposalText": "Aboard a private yacht under the Monaco skyline, Alexander proposed with a custom Harry Winston ring as fireworks lit up the midnight sky.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-33.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-34.jpg"
      },
      "gallery": {
        "variant": "list"
      },
      "rsvp": {
        "variant": "elegant"
      },
      "faq": {
        "variant": "elegant"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 1},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 2},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Demo wedding 6: Simple Love - Sam & Riley
INSERT INTO weddings (
  date_id,
  wedding_name_id,
  partner1_first_name,
  partner1_last_name,
  partner2_first_name,
  partner2_last_name,
  wedding_date,
  wedding_time,
  reception_time,
  primary_color,
  secondary_color,
  accent_color,
  ceremony_venue_name,
  ceremony_venue_address,
  reception_venue_name,
  reception_venue_address,
  is_demo,
  page_config
) VALUES (
  'demo-simple-love',
  'demo-simple-love',
  'Sam',
  'Taylor',
  'Riley',
  'Morgan',
  '2026-08-08',
  '14:00',
  '16:00',
  '#6890A0',
  '#F5F8FA',
  '#D4AF37',
  'City Hall',
  'Downtown, Austin, TX',
  'Backyard Celebration',
  'Our Home, Austin, TX',
  true,
  '{
    "version": "1.0",
    "lastModified": "2026-01-23T00:00:00Z",
    "siteSettings": {
      "locale": "en",
      "showLanguageSwitcher": true,
      "theme": {
        "colors": {
          "primary": "#6890A0",
          "secondary": "#F5F8FA",
          "accent": "#D4AF37",
          "foreground": "#1f2937",
          "background": "#ffffff",
          "muted": "#6b7280"
        },
        "fonts": {
          "display": "Poppins",
          "heading": "Lato",
          "body": "Open Sans",
          "displayFamily": "\"Poppins\", sans-serif",
          "headingFamily": "\"Lato\", sans-serif",
          "bodyFamily": "\"Open Sans\", sans-serif",
          "googleFonts": "Poppins:wght@400;600&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600"
        }
      }
    },
    "sectionConfigs": {
      "hero": {
        "variant": "stacked",
        "tagline": "Love, simply",
        "heroImageUrl": "/images/demo_images/demo-img-35.jpg",
        "showTagline": false,
        "showCountdown": true,
        "showRSVPButton": true
      },
      "countdown": {
        "variant": "minimal"
      },
      "eventDetails": {
        "variant": "minimal",
        "showPhotos": true,
        "ceremonyImageUrl": "/images/demo_images/demo-img-36.jpg",
        "receptionImageUrl": "/images/demo_images/demo-img-37.jpg",
        "customEvents": [
          {
            "id": "ceremony-simple",
            "type": "civilCeremony",
            "title": "Quick Ceremony",
            "time": "14:00",
            "venue": "City Hall",
            "address": "Downtown Austin, TX",
            "description": "Short, sweet, and official!",
            "order": 0,
            "useWeddingDate": true
          },
          {
            "id": "backyard-party",
            "type": "reception",
            "title": "Backyard Party",
            "time": "16:00",
            "venue": "Our Place",
            "address": "Austin, TX",
            "description": "Food, drinks, music, and good vibes with our favorite people.",
            "order": 1,
            "useWeddingDate": true
          }
        ]
      },
      "ourStory": {
        "variant": "minimal",
        "howWeMetText": "We met through mutual friends at a backyard barbecue. Neither of us expected to find love that day, but life had other plans.",
        "proposalText": "During a morning hike at our favorite trail, Sam turned around, pulled out a ring, and asked the simplest question with the biggest meaning.",
        "howWeMetImageUrl": "/images/demo_images/demo-img-38.jpg",
        "proposalImageUrl": "/images/demo_images/demo-img-39.jpg"
      },
      "gallery": {
        "variant": "grid"
      },
      "rsvp": {
        "variant": "minimalistic"
      },
      "faq": {
        "variant": "accordion"
      }
    },
    "components": [
      {"id": "hero", "type": "hero", "enabled": true, "order": 0},
      {"id": "countdown", "type": "countdown", "enabled": true, "order": 1},
      {"id": "event-details", "type": "event-details", "enabled": true, "order": 2},
      {"id": "our-story", "type": "our-story", "enabled": true, "order": 3},
      {"id": "gallery", "type": "gallery", "enabled": true, "order": 4},
      {"id": "rsvp", "type": "rsvp", "enabled": true, "order": 5},
      {"id": "faq", "type": "faq", "enabled": true, "order": 6}
    ]
  }'::jsonb
) ON CONFLICT (wedding_name_id) DO UPDATE SET
  page_config = EXCLUDED.page_config,
  is_demo = true;

-- Insert gallery photos for demo weddings (unique images for each)
-- Classic Elegance gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w, 
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-1.jpg',
  '/images/demo_images/demo-img-2.jpg',
  '/images/demo_images/demo-img-3.jpg',
  '/images/demo_images/demo-img-4.jpg',
  '/images/demo_images/demo-img-5.jpg',
  '/images/demo_images/demo-img-6.jpg',
  '/images/demo_images/demo-img-7.jpg',
  '/images/demo_images/demo-img-8.jpg',
  '/images/demo_images/demo-img-9.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-classic-elegance'
ON CONFLICT DO NOTHING;

-- Modern Minimal gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w,
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-10.jpg',
  '/images/demo_images/demo-img-11.jpg',
  '/images/demo_images/demo-img-12.jpg',
  '/images/demo_images/demo-img-13.jpg',
  '/images/demo_images/demo-img-14.jpg',
  '/images/demo_images/demo-img-15.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-modern-minimal'
ON CONFLICT DO NOTHING;

-- Romantic Garden gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w,
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-16.jpg',
  '/images/demo_images/demo-img-17.jpg',
  '/images/demo_images/demo-img-18.jpg',
  '/images/demo_images/demo-img-19.jpg',
  '/images/demo_images/demo-img-20.jpg',
  '/images/demo_images/demo-img-21.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-romantic-garden'
ON CONFLICT DO NOTHING;

-- Rustic Charm gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w,
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-22.jpg',
  '/images/demo_images/demo-img-23.jpg',
  '/images/demo_images/demo-img-24.jpg',
  '/images/demo_images/demo-img-25.jpg',
  '/images/demo_images/demo-img-26.jpg',
  '/images/demo_images/demo-img-27.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-rustic-charm'
ON CONFLICT DO NOTHING;

-- Luxury Noir gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w,
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-28.jpg',
  '/images/demo_images/demo-img-29.jpg',
  '/images/demo_images/demo-img-30.jpg',
  '/images/demo_images/demo-img-31.jpg',
  '/images/demo_images/demo-img-32.jpg',
  '/images/demo_images/demo-img-33.jpg',
  '/images/demo_images/demo-img-34.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-luxury-noir'
ON CONFLICT DO NOTHING;

-- Simple Love gallery
INSERT INTO gallery_photos (wedding_id, photo_url, display_order)
SELECT w.id, url, idx
FROM weddings w,
LATERAL unnest(ARRAY[
  '/images/demo_images/demo-img-35.jpg',
  '/images/demo_images/demo-img-36.jpg',
  '/images/demo_images/demo-img-37.jpg',
  '/images/demo_images/demo-img-38.jpg',
  '/images/demo_images/demo-img-39.jpg',
  '/images/demo_images/demo-img-40.jpg'
]) WITH ORDINALITY AS t(url, idx)
WHERE w.wedding_name_id = 'demo-simple-love'
ON CONFLICT DO NOTHING;

-- Insert FAQs for demo weddings
-- Classic Elegance FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('What is the dress code?', 'Black tie optional. Gentlemen are encouraged to wear dark suits or tuxedos, and ladies may wear formal evening gowns or elegant cocktail dresses.', 1),
  ('When should I arrive?', 'Please arrive at least 30 minutes before the ceremony begins at 4:00 PM. This allows time for seating and ensures you don''t miss our grand entrance.', 2),
  ('Is there parking available?', 'Yes, complimentary valet parking will be provided for all guests at the venue entrance. Self-parking is also available in the adjacent lot.', 3),
  ('Can I bring a plus one?', 'Due to venue capacity, we can only accommodate guests named on the invitation. Please check your invitation for the number of seats reserved in your honor.', 4),
  ('Will there be dietary accommodations?', 'Absolutely! Please indicate any dietary restrictions or allergies when you RSVP. Our chef can accommodate vegetarian, vegan, gluten-free, and kosher options.', 5),
  ('Is the venue wheelchair accessible?', 'Yes, the entire venue is wheelchair accessible with ramps and elevators available. Please let us know if you need any special accommodations.', 6)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-classic-elegance'
ON CONFLICT DO NOTHING;

-- Modern Minimal FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('Dress code?', 'Modern cocktail attire. Think clean lines, contemporary style. Neutral colors welcome.', 1),
  ('Arrival time?', 'Ceremony starts at 5 PM sharp. Doors open at 4:30 PM.', 2),
  ('Parking?', 'Street parking available. Rideshare recommended for downtown venue.', 3),
  ('Plus ones?', 'See your invitation for guest count details.', 4),
  ('Dietary needs?', 'Note any restrictions in your RSVP. Plant-based options available.', 5)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-modern-minimal'
ON CONFLICT DO NOTHING;

-- Romantic Garden FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('What should I wear?', 'Garden party attire is requested. Light, flowing fabrics and floral prints are encouraged! Please wear comfortable shoes suitable for walking on grass and garden paths.', 1),
  ('What if it rains?', 'Don''t worry! We have a beautiful indoor backup location within the garden estate. The celebration will go on rain or shine!', 2),
  ('Can I take photos during the ceremony?', 'We kindly ask for an unplugged ceremony to ensure our photographers can capture every moment. Feel free to take photos during the reception!', 3),
  ('Are children welcome?', 'While we love your little ones, we have planned an adults-only evening. We hope you''ll enjoy a night out!', 4),
  ('Will the ceremony be outdoors?', 'Yes! The ceremony will take place in the rose garden. We''ll have parasols available for sun protection.', 5),
  ('Is there accommodation nearby?', 'We have reserved a room block at the Garden Inn, just 5 minutes away. Use code "LOVE2026" for our special rate.', 6)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-romantic-garden'
ON CONFLICT DO NOTHING;

-- Rustic Charm FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('What''s the dress code?', 'Rustic elegant! Think sundresses, khakis, boots, and bowties. Comfortable yet polished attire that works for a barn setting.', 1),
  ('Where should I park?', 'There''s a large gravel parking area right at the barn. Golf carts will shuttle guests who need assistance from the lot to the ceremony site.', 2),
  ('Will the event be indoors or outdoors?', 'Both! The ceremony is in the meadow, cocktail hour in the courtyard, and dinner and dancing in the restored barn.', 3),
  ('What time does the party end?', 'We have the venue until midnight, and we plan to dance until the very last song! A late-night snack will be served at 10 PM.', 4),
  ('Can I bring a gift?', 'Your presence is the greatest gift! If you wish to give something, we have a registry and a honeymoon fund linked on our website.', 5),
  ('Are there any nearby hotels?', 'The Countryside Inn is just 10 minutes away and offers cozy rooms. We also have a few glamping tents available on the property!', 6)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-rustic-charm'
ON CONFLICT DO NOTHING;

-- Luxury Noir FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('What is the expected attire?', 'Black tie. Gentlemen in tuxedos or formal dark suits, ladies in floor-length gowns. This is an evening of elegance.', 1),
  ('What time should guests arrive?', 'The grand ballroom opens at 6:00 PM for champagne reception. The ceremony commences at 7:00 PM precisely.', 2),
  ('Is valet parking available?', 'Complimentary valet service is provided. Simply pull up to the main entrance and our attendants will take care of your vehicle.', 3),
  ('Will there be entertainment?', 'We have arranged a live jazz quartet for cocktail hour and a 12-piece orchestra for dinner and dancing.', 4),
  ('Are accommodations arranged?', 'We have secured an exclusive room block at The Grand Hotel. Mention our names for the special suite rate.', 5),
  ('What about gifts?', 'Your presence honors us. If you wish to contribute, our registry is available, or donations to our chosen charity are welcome.', 6)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-luxury-noir'
ON CONFLICT DO NOTHING;

-- Simple Love FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, display_order, is_visible)
SELECT w.id, q.question, q.answer, q.ord, true
FROM weddings w,
LATERAL (VALUES
  ('What should I wear?', 'Casual dressy. Whatever makes you feel comfortable and happy! We just want you there.', 1),
  ('Where do I park?', 'Free parking at the venue. It''s pretty easy to find!', 2),
  ('Kids allowed?', 'Yes! Kids are welcome. We''ll have activities for them.', 3),
  ('Can I bring a dish?', 'That''s so sweet, but we''ve got it covered! Just bring yourselves.', 4),
  ('When does it end?', 'We''ll wrap up around 10 PM, but you''re welcome to stay until the last dance!', 5)
) AS q(question, answer, ord)
WHERE w.wedding_name_id = 'demo-simple-love'
ON CONFLICT DO NOTHING;
