-- Create Hacienda Deluxe Wedding
-- A custom deluxe wedding with the "Lush Hacienda Charro Elegance" aesthetic
-- Owner can be assigned later via UPDATE weddings SET owner_id = '<user-uuid>' WHERE wedding_name_id = 'sydney-marco';

DO $$
DECLARE
  v_wedding_id UUID;
BEGIN

-- Insert the wedding record
INSERT INTO public.weddings (
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
  has_website,
  og_title,
  og_description
) VALUES (
  'sydney-marco-20260309',
  'sydney-marco',
  'Sydney',
  NULL,
  'Marco',
  NULL,
  '2026-03-09',
  '17:00:00',
  '19:00:00',
  '#2D4A32',
  '#FAF6EF',
  '#C0A882',
  'Hacienda San Gabriel',
  'Hacienda San Gabriel, Morelos, Mexico',
  'Hacienda San Gabriel',
  'Hacienda San Gabriel, Morelos, Mexico',
  true,
  'Sydney & Marco - March 9, 2026',
  'Join us for our wedding celebration'
)
RETURNING id INTO v_wedding_id;

-- Insert subscription as deluxe
INSERT INTO public.wedding_subscriptions (wedding_id, plan)
VALUES (v_wedding_id, 'deluxe');

-- Insert wedding settings
INSERT INTO public.wedding_settings (wedding_id, language, timezone)
VALUES (v_wedding_id, 'es', 'America/Mexico_City');

-- Insert wedding website with full hacienda page config
INSERT INTO public.wedding_websites (wedding_id, page_config)
VALUES (v_wedding_id, '{
  "version": "1.0",
  "components": [
    { "id": "hero",          "type": "hero",          "order": 0, "enabled": true },
    { "id": "countdown",     "type": "countdown",     "order": 1, "enabled": true },
    { "id": "our-story",     "type": "our-story",     "order": 2, "enabled": true },
    { "id": "event-details", "type": "event-details", "order": 3, "enabled": true },
    { "id": "gallery",       "type": "gallery",       "order": 4, "enabled": true },
    { "id": "registry",      "type": "registry",      "order": 5, "enabled": true },
    { "id": "rsvp",          "type": "rsvp",          "order": 6, "enabled": true },
    { "id": "faq",           "type": "faq",           "order": 7, "enabled": true }
  ],
  "siteSettings": {
    "locale": "es",
    "showLanguageSwitcher": true,
    "theme": {
      "colors": {
        "primary":    "#2D4A32",
        "secondary":  "#FAF6EF",
        "accent":     "#C0A882",
        "foreground": "#1f2937",
        "background": "#ffffff",
        "muted":      "#6b7280"
      },
      "fonts": {
        "display":       "Pinyon Script",
        "heading":       "Cormorant Garamond",
        "body":          "Raleway",
        "displayFamily": "\"Pinyon Script\", cursive",
        "headingFamily": "\"Cormorant Garamond\", serif",
        "bodyFamily":    "\"Raleway\", sans-serif",
        "googleFonts":   "Pinyon+Script&family=Cormorant+Garamond:wght@400;500;600;700&family=Raleway:wght@300;400;500;600"
      }
    },
    "layout": {
      "maxWidth": "1200px",
      "spacing": "normal"
    },
    "navigation": {
      "showNavLinks": true,
      "useColorBackground": true,
      "backgroundColorChoice": "primary"
    },
    "envelope": {
      "colorChoice": "primary"
    }
  },
  "sectionConfigs": {
    "hero": {
      "variant": "hacienda",
      "showTagline": true,
      "tagline": "Dos almas, un destino",
      "showCountdown": false,
      "showRSVPButton": true,
      "overlayOpacity": 50,
      "imageBrightness": 85
    },
    "countdown": {
      "variant": "hacienda"
    },
    "ourStory": {
      "variant": "hacienda",
      "showHowWeMet": true,
      "showProposal": true,
      "showPhotos": true,
      "showHowWeMetPhoto": true,
      "showProposalPhoto": true
    },
    "eventDetails": {
      "variant": "hacienda",
      "showMap": true,
      "showMapLinks": true,
      "events": [
        {
          "id": "ceremony",
          "type": "religiousCeremony",
          "order": 0,
          "title": "Ceremonia Religiosa",
          "time": "17:00:00",
          "venue": "Capilla de la Hacienda",
          "address": "Hacienda San Gabriel, Morelos, Mexico",
          "description": "",
          "useWeddingDate": true
        },
        {
          "id": "cocktail",
          "type": "cocktail",
          "order": 1,
          "title": "Coctel de Bienvenida",
          "time": "18:00:00",
          "venue": "Jardines de la Hacienda",
          "address": "Hacienda San Gabriel, Morelos, Mexico",
          "description": "",
          "useWeddingDate": true
        },
        {
          "id": "reception",
          "type": "reception",
          "order": 2,
          "title": "Recepcion",
          "time": "19:00:00",
          "venue": "Salon Principal",
          "address": "Hacienda San Gabriel, Morelos, Mexico",
          "description": "",
          "useWeddingDate": true
        },
        {
          "id": "party",
          "type": "afterParty",
          "order": 3,
          "title": "Fiesta",
          "time": "22:00:00",
          "venue": "Terraza de la Hacienda",
          "address": "Hacienda San Gabriel, Morelos, Mexico",
          "description": "",
          "useWeddingDate": true
        }
      ]
    },
    "rsvp": {
      "variant": "hacienda"
    },
    "gallery": {
      "variant": "hacienda",
      "sectionTitle": "Galeria",
      "sectionSubtitle": "Momentos que atesoramos",
      "masonryColumns": 3
    },
    "registry": {
      "variant": "hacienda",
      "sectionTitle": "Mesa de Regalos",
      "sectionSubtitle": "Su presencia es nuestro mejor regalo"
    },
    "faq": {
      "variant": "hacienda",
      "showContactNote": true
    }
  }
}'::jsonb);

-- Insert some default FAQ questions
INSERT INTO public.wedding_faqs (wedding_id, question, answer, display_order) VALUES
  (v_wedding_id, 'Cual es el codigo de vestimenta?', 'Formal / Etiqueta. Los caballeros de traje oscuro y las damas con vestido largo o cocktail.', 0),
  (v_wedding_id, 'Puedo llevar acompanante?', 'La invitacion es personal. Si tu invitacion incluye acompanante, estara indicado en ella.', 1),
  (v_wedding_id, 'Donde puedo hospedarme?', 'La hacienda cuenta con habitaciones disponibles. Tambien hay hoteles cercanos en la zona. Contactanos para mas informacion.', 2),
  (v_wedding_id, 'Hay estacionamiento?', 'Si, la hacienda cuenta con amplio estacionamiento para todos los invitados.', 3),
  (v_wedding_id, 'Puedo tomar fotos durante la ceremonia?', 'Les pedimos que durante la ceremonia religiosa se abstengan de tomar fotos. Habra un fotografo profesional. Durante la recepcion pueden tomar todas las fotos que deseen.', 4);

RAISE NOTICE 'Hacienda Deluxe wedding created with ID: %', v_wedding_id;
RAISE NOTICE 'View at: http://localhost:3000/sydney-marco';

END $$;
