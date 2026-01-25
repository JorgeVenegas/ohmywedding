-- Demo Weddings Seed Data
-- Generated: 2026-01-25T07:16:05.395Z
-- 
-- This migration seeds demo wedding data for production
-- Make sure to upload images to the production storage bucket before running this migration
-- 
-- Image files are in: scripts/demo-images/
-- Upload them to: Storage > wedding-assets bucket in production

-- Use a DO block to handle potential conflicts gracefully
DO $$
DECLARE
  wedding_record RECORD;
BEGIN
  -- Temporarily disable RLS for seeding
  -- (This runs as postgres user which bypasses RLS anyway)
  
  -- Wedding: demo-classic-elegance
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    'dbcf3fa8-b57a-4328-838a-2504303fe1f0',
    'demo-classic-elegance',
    'demo-classic-elegance',
    'James',
    'Wellington',
    'Victoria',
    'Ashford',
    '2026-06-20',
    '16:00:00',
    '18:00:00',
    '#7A5A62',
    '#F8F5F5',
    '#D4AF37',
    'St. Patrick''s Cathedral',
    '5th Avenue, New York, NY',
    'The Plaza Hotel',
    '768 5th Avenue, New York, NY',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"countdown","type":"countdown","order":1,"enabled":true},{"id":"event-details","type":"event-details","order":2,"enabled":true},{"id":"banner","type":"banner","order":3,"props":{"title":"","imageUrl":"","showText":true,"subtitle":"","bannerHeight":"large","gradientColor1":"palette:primary","gradientColor2":"palette:accent","overlayOpacity":40,"imageBrightness":100,"backgroundGradient":false},"enabled":true},{"id":"our-story","type":"our-story","order":4,"enabled":true},{"id":"gallery","type":"gallery","order":5,"enabled":true},{"id":"rsvp","type":"rsvp","order":6,"enabled":true},{"id":"registry","type":"registry","order":7,"props":{"variant":"cards","registries":[],"customItems":[],"showCustomRegistry":false},"enabled":true},{"id":"faq","type":"faq","order":8,"enabled":true}],"lastModified":"2026-01-25T06:56:56.771Z","siteSettings":{"theme":{"fonts":{"body":"Montserrat","display":"Great Vibes","heading":"Cormorant Garamond","bodyFamily":"\"Montserrat\", sans-serif","googleFonts":"Great+Vibes&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600","displayFamily":"\"Great Vibes\", cursive","headingFamily":"\"Cormorant Garamond\", serif"},"colors":{"muted":"#6b7280","accent":"#D4AF37","primary":"#7A5A62","secondary":"#F8F5F5","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","navigation":{"showNavLinks":true,"useColorBackground":true,"backgroundColorChoice":"accent"},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"elegant","backgroundColorChoice":"primary"},"hero":{"tagline":"Two hearts, one love, forever","variant":"side-by-side","showTagline":true,"heroImageUrl":"/images/demo_images/demo-img-1.jpg","imagePosition":"left","showCountdown":true,"gradientColor1":"palette:primary","gradientColor2":"palette:accent-light","overlayOpacity":18,"showRSVPButton":true,"imageBrightness":100,"backgroundGradient":true},"rsvp":{"variant":"elegant","useColorBackground":true,"backgroundColorChoice":"primary"},"banner":{"imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233745103-g95g7u.jpg","bannerHeight":"medium"},"gallery":{"photos":[{"id":"photo-1769234874411-b9ousq","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233745103-g95g7u.jpg","caption":""},{"id":"photo-1769234874411-ctyyum","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233745056-c4rs1r.jpg","caption":""},{"id":"photo-1769234874411-5iuq4e","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233745021-gq61u.jpg","caption":""},{"id":"photo-1769234874411-5iakg8g","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233744954-1aah0r.jpg","caption":""},{"id":"photo-1769234874411-6blbdl","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233744806-81mlqq.jpg","caption":""},{"id":"photo-1769234874411-nej0o","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233744756-79fbz9.jpg","caption":""},{"id":"photo-1769234874411-r4ypfr","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-classic-elegance/1769233744581-mr0n1n.jpg","caption":""}],"variant":"masonry","masonryColumns":2,"backgroundColorChoice":"primary-lighter"},"ourStory":{"variant":"timeline","howWeMetText":"We met at a charity gala in Manhattan, where James was immediately captivated by Victoria''s grace and wit. A shared love for classical music and fine art brought us together.","proposalText":"On a crisp autumn evening in Central Park, surrounded by golden leaves and the soft glow of fairy lights, James got down on one knee with his grandmother''s vintage ring.","howWeMetImageUrl":"/images/demo_images/demo-img-2.jpg","proposalImageUrl":"/images/demo_images/demo-img-3.jpg","backgroundColorChoice":"primary-lighter"},"registry":{"useColorBackground":true,"backgroundColorChoice":"primary-lighter"},"countdown":{"variant":"elegant","backgroundColorChoice":"primary"},"eventDetails":{"events":[{"id":"ceremony","date":"2026-06-20","time":"16:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"St. Patrick''s Cathedral","address":"5th Avenue, New York, NY","imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/1769234261299-6gp1wqfrvxu.jpg","description":"","useWeddingDate":true},{"id":"reception","date":"2026-06-20","time":"18:00","type":"reception","order":1,"title":"Reception","venue":"The Plaza Hotel","address":"768 5th Avenue, New York, NY","imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/1769234269774-jaxerpzs57o.jpg","description":"","useWeddingDate":true}],"variant":"timeline","showPhotos":true,"customEvents":[{"id":"cocktail-hour","time":"17:00","type":"cocktail","order":2,"title":"Champagne Reception","venue":"The Grand Terrace","address":"East Wing, The Plaza Hotel","imageUrl":"/images/demo_images/demo-img-7.jpg","description":"Join us for hors d''oeuvres and signature cocktails as we celebrate the beginning of our journey together.","useWeddingDate":true},{"id":"dinner-reception","time":"19:00","type":"reception","order":3,"title":"Dinner & Dancing","venue":"The Grand Ballroom","address":"The Plaza Hotel, 768 5th Avenue","imageUrl":"/images/demo_images/demo-img-8.jpg","description":"An evening of fine dining, heartfelt toasts, and dancing until midnight.","useWeddingDate":true}],"ceremonyImageUrl":"/images/demo_images/demo-img-5.jpg","receptionImageUrl":"/images/demo_images/demo-img-6.jpg","backgroundColorChoice":"primary-lighter"}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-25T06:56:56.874+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  -- Wedding: demo-luxury-noir
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    'f274f09d-a98f-48f7-b757-9329a2d13d5c',
    'demo-luxury-noir',
    'demo-luxury-noir',
    'Alexander',
    'Sterling',
    'Camille',
    'Laurent',
    '2026-12-31',
    '19:00:00',
    '20:30:00',
    '#1E3A5F',
    '#F5F7FA',
    '#D4AF37',
    'Opéra de Monte-Carlo',
    'Place du Casino, Monaco',
    'Hôtel de Paris',
    'Place du Casino, Monte-Carlo',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"countdown","type":"countdown","order":1,"enabled":true},{"id":"event-details","type":"event-details","order":2,"enabled":true},{"id":"banner-1769236752509","type":"banner","order":3,"props":{"title":"","imageUrl":"","showText":true,"subtitle":"","bannerHeight":"large","gradientColor1":"palette:primary","gradientColor2":"palette:accent","overlayOpacity":40,"imageBrightness":100,"backgroundGradient":false},"enabled":true},{"id":"our-story","type":"our-story","order":4,"enabled":true},{"id":"gallery","type":"gallery","order":5,"enabled":true},{"id":"rsvp","type":"rsvp","order":6,"enabled":true},{"id":"registry","type":"registry","order":7,"enabled":true},{"id":"faq","type":"faq","order":8,"enabled":true}],"lastModified":"2026-01-25T04:28:00.930Z","siteSettings":{"theme":{"fonts":{"body":"Montserrat","display":"Cinzel","heading":"Cormorant Garamond","bodyFamily":"\"Montserrat\", sans-serif","googleFonts":"Cinzel:wght@400;600&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;600","displayFamily":"\"Cinzel\", serif","headingFamily":"\"Cormorant Garamond\", serif"},"colors":{"muted":"#6b7280","accent":"#D4AF37","primary":"#1E3A5F","secondary":"#F5F7FA","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","envelope":{"colorChoice":"primary"},"navigation":{"showNavLinks":true,"useColorBackground":true,"backgroundColorChoice":"accent"},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"elegant","backgroundColorChoice":"primary"},"hero":{"tagline":"A celebration of extraordinary love","variant":"background","showTagline":true,"heroImageUrl":"/images/demo_images/demo-img-28.jpg","showCountdown":false,"showRSVPButton":true},"rsvp":{"variant":"elegant","useColorBackground":true,"backgroundColorChoice":"accent-lighter"},"banner":{"imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236757903-ql3o7n.jpg"},"gallery":{"photos":[{"id":"photo-1769236798275-bnk69p","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236785031-2rh4g.jpg","caption":""},{"id":"photo-1769236798275-eexcfj","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236785012-xhcfy.jpg","caption":""},{"id":"photo-1769236798275-ss541k","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784885-fv0k6o.jpg","caption":""},{"id":"photo-1769236798275-mdt4ca","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784753-lpzv25.jpg","caption":""},{"id":"photo-1769236798275-fch00c","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784839-sfagy.jpg","caption":""},{"id":"photo-1769236798275-k3c4bk","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784788-s23pg1.jpg","caption":""},{"id":"photo-1769236798275-1u3s3q","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784919-tyfp4i.jpg","caption":""},{"id":"photo-1769236798275-5wemu","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236757903-ql3o7n.jpg","caption":""},{"id":"photo-1769236798275-zxsrwf","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-luxury-noir/1769236784706-6kowcc.jpg","caption":""}],"variant":"collage","gradientColor1":"palette:primary","gradientColor2":"palette:primary","overlayOpacity":32,"useGradientOverlay":true,"backgroundColorChoice":"primary"},"ourStory":{"variant":"split","backgroundColorChoice":"accent-lighter"},"registry":{"variant":"elegant","registries":[{"id":"registry-1769237005456","url":"","name":"Liverpool","logoUrl":"/images/registries/liverpool.png","isCustom":false,"description":"Premium department store registry in Mexico"},{"id":"registry-1769237018323","url":"","name":"El Palacio de Hierro","logoUrl":"/images/registries/palacio.png","isCustom":false,"description":"Luxury department store registry"}],"useColorBackground":true,"backgroundColorChoice":"accent-lighter"},"countdown":{"variant":"elegant","backgroundColorChoice":"primary"},"eventDetails":{"events":[{"id":"ceremony","date":"2026-12-31","time":"19:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"Opéra de Monte-Carlo","address":"Place du Casino, Monaco","description":"","useWeddingDate":true},{"id":"reception","date":"2026-12-31","time":"18:00","type":"reception","order":1,"title":"Reception","venue":"Hôtel de Paris","address":"Place du Casino, Monte-Carlo","description":"","useWeddingDate":true}],"showMap":false,"variant":"split","showMapLinks":false,"backgroundColorChoice":"accent-lighter"}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-25T04:28:01.085+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  -- Wedding: demo-modern-minimal
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    '6da821a3-dbac-4b07-b614-4fcb443203a1',
    'demo-modern-minimal',
    'demo-modern-minimal',
    'Alex',
    'Chen',
    'Jordan',
    'Park',
    '2026-09-12',
    '18:00:00',
    '19:30:00',
    '#303030',
    '#F8F8F8',
    '#D4AF37',
    'SFMOMA Rooftop',
    '151 Third Street, San Francisco, CA',
    'SFMOMA Rooftop',
    '151 Third Street, San Francisco, CA',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"countdown","type":"countdown","order":1,"enabled":true},{"id":"event-details","type":"event-details","order":2,"enabled":true},{"id":"banner-1769235047410","type":"banner","order":3,"props":{"title":"","imageUrl":"","showText":true,"subtitle":"","bannerHeight":"large","gradientColor1":"palette:primary","gradientColor2":"palette:accent","overlayOpacity":40,"imageBrightness":100,"backgroundGradient":false},"enabled":true},{"id":"our-story","type":"our-story","order":4,"enabled":true},{"id":"gallery","type":"gallery","order":5,"enabled":true},{"id":"rsvp","type":"rsvp","order":6,"enabled":true},{"id":"faq","type":"faq","order":7,"enabled":true}],"lastModified":"2026-01-25T06:59:30.835Z","siteSettings":{"theme":{"fonts":{"body":"Crimson Pro","display":"Cinzel","heading":"Cormorant","bodyFamily":"\"Crimson Pro\", serif","googleFonts":"Cinzel:wght@400;600;700&family=Cormorant:wght@400;600&family=Crimson+Pro:wght@300;400;600","displayFamily":"\"Cinzel\", serif","headingFamily":"\"Cormorant\", serif"},"colors":{"muted":"#6b7280","accent":"#D4AF37","primary":"#782030","secondary":"#FAF5F2","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","navigation":{"showNavLinks":true},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"minimal","backgroundColorChoice":"accent-lighter"},"hero":{"tagline":"Simply us","variant":"stacked","imageWidth":"full","imageHeight":"large","showTagline":true,"heroImageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235104661-o212au.jpg","showCountdown":false,"showRSVPButton":true},"rsvp":{"variant":"minimalistic","useColorBackground":true,"backgroundColorChoice":"primary"},"banner":{"imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235053821-vcjtn9.jpg"},"gallery":{"photos":[{"id":"photo-1769235141126-ykyz8j","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125784-kkjz6h.jpg","caption":""},{"id":"photo-1769235141126-8kp7pn","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125496-8xqve.jpg","caption":""},{"id":"photo-1769235141126-o8jq8s","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125553-hmqzwb.jpg","caption":""},{"id":"photo-1769235141126-idohsr","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125596-heu6gp.jpg","caption":""},{"id":"photo-1769235141126-9xunl8","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125637-86oyo.jpg","caption":""},{"id":"photo-1769235141126-14a5a5","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125758-2syg5f.jpg","caption":""},{"id":"photo-1769235141126-pidaru","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125726-9bxq11.jpg","caption":""},{"id":"photo-1769235141126-fgoemg","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125688-9ykfwh.jpg","caption":""},{"id":"photo-1769235141126-gzcpt","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235125340-qluk6.jpg","caption":""},{"id":"photo-1769235141126-mdx72","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-modern-minimal/1769235069977-gql47d.jpg","caption":""}],"variant":"collage","gridColumns":5,"gradientColor1":"palette:primary-light","gradientColor2":"palette:primary","overlayOpacity":18,"subtitleAlignment":"center","useGradientOverlay":true},"ourStory":{"variant":"minimal","howWeMetText":"We met at a design conference in San Francisco. Both of us reached for the last cold brew at the coffee bar—and decided to share.","proposalText":"During a quiet morning at home, surrounded by our favorite plants and the soft light of sunrise, Jordan asked Alex with a ring designed by a local jeweler.","howWeMetImageUrl":"/images/demo_images/demo-img-11.jpg","proposalImageUrl":"/images/demo_images/demo-img-12.jpg","backgroundColorChoice":"accent-lighter"},"countdown":{"variant":"modern","backgroundColorChoice":"accent-lighter"},"eventDetails":{"events":[{"id":"ceremony","date":"2026-09-12","time":"18:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"SFMOMA Rooftop","address":"151 Third Street, San Francisco, CA","description":"","useWeddingDate":true},{"id":"reception","date":"2026-09-12","time":"19:30:00","type":"reception","order":1,"title":"Reception","venue":"SFMOMA Rooftop","address":"151 Third Street, San Francisco, CA","description":"","useWeddingDate":true}],"showMap":false,"variant":"minimal","showPhotos":true,"customEvents":[{"id":"cocktails","time":"17:30","type":"cocktail","order":2,"title":"Cocktails","venue":"Rooftop Terrace","address":"SFMOMA, 151 Third Street","description":"Craft cocktails and contemporary bites with skyline views.","useWeddingDate":true},{"id":"dinner","time":"19:00","type":"reception","order":3,"title":"Dinner","venue":"Gallery Space","address":"SFMOMA","description":"Farm-to-table dinner with curated wine pairings.","useWeddingDate":true}],"showMapLinks":false,"ceremonyImageUrl":"/images/demo_images/demo-img-14.jpg","receptionImageUrl":"/images/demo_images/demo-img-15.jpg","backgroundColorChoice":"accent-lighter"},"banner-1769235047410":{"gradientColor1":"palette:accent","gradientColor2":"palette:primary","overlayOpacity":25,"backgroundGradient":true}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-25T06:59:30.945+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  -- Wedding: demo-romantic-garden
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    'f3fed13f-ceca-4f18-befa-0f10206f747c',
    'demo-romantic-garden',
    'demo-romantic-garden',
    'Sebastian',
    'Rose',
    'Isabella',
    'Bloom',
    '2026-05-15',
    '15:00:00',
    '18:00:00',
    '#7A9A68',
    '#F8F2F0',
    '#E8B4B8',
    'Longwood Gardens',
    'Kennett Square, Pennsylvania',
    'The Conservatory',
    'Longwood Gardens, PA',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"our-story","type":"our-story","order":1,"enabled":true},{"id":"countdown","type":"countdown","order":2,"enabled":true},{"id":"event-details","type":"event-details","order":3,"enabled":true},{"id":"gallery","type":"gallery","order":4,"enabled":true},{"id":"rsvp","type":"rsvp","order":5,"enabled":true},{"id":"faq","type":"faq","order":6,"enabled":true}],"lastModified":"2026-01-24T06:34:06.595Z","siteSettings":{"theme":{"fonts":{"body":"Open Sans","display":"Allura","heading":"Montserrat","bodyFamily":"\"Open Sans\", sans-serif","googleFonts":"Allura&family=Montserrat:wght@400;600&family=Open+Sans:wght@300;400;600","displayFamily":"\"Allura\", cursive","headingFamily":"\"Montserrat\", sans-serif"},"colors":{"muted":"#6b7280","accent":"#E8B4B8","primary":"#7A9A68","secondary":"#F8F2F0","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","navigation":{"showNavLinks":true,"useColorBackground":true,"backgroundColorChoice":"primary-lighter"},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"cards","backgroundColorChoice":"primary"},"hero":{"tagline":"Where love blooms eternal","variant":"framed","imageSize":"large","frameStyle":"polaroid","imageWidth":"centered","imageHeight":"large","showTagline":true,"heroImageUrl":"/images/demo_images/demo-img-16.jpg","showCountdown":true,"showRSVPButton":true},"rsvp":{"variant":"elegant","useColorBackground":true,"backgroundColorChoice":"primary-lighter"},"gallery":{"photos":[{"id":"photo-1769236365763-pk334","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359853-68sask.jpg","caption":""},{"id":"photo-1769236365763-w4uo15","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359662-or2j7m.jpg","caption":""},{"id":"photo-1769236365763-bnshm","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359630-nsn2q.jpg","caption":""},{"id":"photo-1769236365763-nb1i3n","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359787-0tj0b.jpg","caption":""},{"id":"photo-1769236365763-oym4zq","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359753-bhk18.jpg","caption":""},{"id":"photo-1769236365763-6zjhs7","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359605-a31su.jpg","caption":""},{"id":"photo-1769236365763-farww","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359526-w3jale.jpg","caption":""},{"id":"photo-1769236365763-vchucs","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-romantic-garden/1769236359714-vuwc8y.jpg","caption":""}],"variant":"collage","gridColumns":6,"sectionTitle":"","backgroundColorChoice":"primary"},"ourStory":{"variant":"zigzag","howWeMetText":"We met at a botanical garden during a spring festival. Sebastian was sketching the flowers when Isabella stopped to admire his work. Coffee turned into dinner, and dinner turned into forever.","proposalText":"Under a canopy of wisteria in the same garden where we first met, Sebastian surprised Isabella with a picnic at sunset and a ring hidden inside a flower bouquet.","howWeMetImageUrl":"/images/demo_images/demo-img-20.jpg","proposalImageUrl":"/images/demo_images/demo-img-21.jpg"},"countdown":{"variant":"elegant","backgroundColorChoice":"primary"},"our-story":{"variant":"booklet","backgroundColorChoice":"primary-lighter"},"eventDetails":{"variant":"split","showPhotos":true,"customEvents":[{"id":"garden-ceremony","time":"15:00","type":"religiousCeremony","order":0,"title":"Garden Ceremony","venue":"The Rose Pavilion","address":"Longwood Gardens, PA","imageUrl":"/images/demo_images/demo-img-17.jpg","description":"Exchange vows surrounded by blooming roses and the gentle sound of a string quartet.","useWeddingDate":true},{"id":"garden-cocktails","time":"16:00","type":"cocktail","order":1,"title":"Cocktails in the Garden","venue":"The Flower Walk","address":"Longwood Gardens","imageUrl":"/images/demo_images/demo-img-19.jpg","description":"Sip lavender lemonade and garden-inspired cocktails among the wisteria.","useWeddingDate":true},{"id":"dinner-conservatory","time":"18:00","type":"reception","order":2,"title":"Dinner in The Conservatory","venue":"The Glass Conservatory","address":"Longwood Gardens, PA","imageUrl":"/images/demo_images/demo-img-18.jpg","description":"A romantic candlelit dinner beneath the stars and surrounded by exotic blooms.","useWeddingDate":true}],"ceremonyImageUrl":"/images/demo_images/demo-img-17.jpg","receptionImageUrl":"/images/demo_images/demo-img-18.jpg"},"event-details":{"events":[{"id":"ceremony","date":"2026-05-15","time":"15:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"Longwood Gardens","address":"Kennett Square, Pennsylvania","description":"","useWeddingDate":true},{"id":"reception","date":"2026-05-15","time":"18:00:00","type":"reception","order":1,"title":"Reception","venue":"The Conservatory","address":"Longwood Gardens, PA","description":"","useWeddingDate":true}],"backgroundColorChoice":"primary-lighter"}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-24T06:34:06.7+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  -- Wedding: demo-rustic-charm
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    '0b8e6aea-d4b8-4e16-8eda-f3b642ae8598',
    'demo-rustic-charm',
    'demo-rustic-charm',
    'Mason',
    'Brooks',
    'Savannah',
    'Fields',
    '2026-10-03',
    '17:00:00',
    '19:30:00',
    '#B86A50',
    '#FAF5F0',
    '#D4AF37',
    'Brooks Family Farm',
    'Franklin, Tennessee',
    'The Red Barn',
    'Brooks Family Farm, Franklin, TN',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"our-story","type":"our-story","order":1,"enabled":true},{"id":"event-details","type":"event-details","order":2,"enabled":true},{"id":"countdown","type":"countdown","order":3,"enabled":true},{"id":"gallery","type":"gallery","order":4,"enabled":true},{"id":"rsvp","type":"rsvp","order":5,"enabled":true},{"id":"faq","type":"faq","order":6,"enabled":true}],"lastModified":"2026-01-25T07:01:02.552Z","siteSettings":{"theme":{"fonts":{"body":"Quicksand","display":"Dancing Script","heading":"Raleway","bodyFamily":"\"Quicksand\", sans-serif","googleFonts":"Dancing+Script:wght@400;700&family=Raleway:wght@400;600&family=Quicksand:wght@300;400;600","displayFamily":"\"Dancing Script\", cursive","headingFamily":"\"Raleway\", sans-serif"},"colors":{"muted":"#6b7280","accent":"#D4AF37","primary":"#B86A50","secondary":"#FAF5F0","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","navigation":{"showNavLinks":true,"useColorBackground":true,"backgroundColorChoice":"accent"},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"accordion","backgroundColorChoice":"primary-lighter"},"hero":{"tagline":"Our love story, written in the stars","variant":"background","showTagline":true,"heroImageUrl":"/images/demo_images/demo-img-22.jpg","showCountdown":false,"showRSVPButton":true},"rsvp":{"variant":"minimalistic","useColorBackground":true,"backgroundColorChoice":"primary"},"gallery":{"photos":[{"id":"photo-1769236614411-busm2p","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236600070-rj7f2.jpg","caption":""},{"id":"photo-1769236614411-ygtpl9","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599850-uaj72.jpg","caption":""},{"id":"photo-1769236614411-vpx6us","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599970-4bxp5c.jpg","caption":""},{"id":"photo-1769236614411-fu0pcj","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599813-1tja1.jpg","caption":""},{"id":"photo-1769236614411-hj5jbk","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599921-gaw3hr.jpg","caption":""},{"id":"photo-1769236614411-9srmuj","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599776-9aqryj.jpg","caption":""},{"id":"photo-1769236614411-4bv47ai","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599880-njp7xu.jpg","caption":""},{"id":"photo-1769236614411-ltm5t","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599749-65x9bk.jpg","caption":""},{"id":"photo-1769236614411-l56xsm","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599720-nz76d2.jpg","caption":""},{"id":"photo-1769236614411-kk9ba","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599704-evk6ru.jpg","caption":""},{"id":"photo-1769236614411-h1814i","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599640-wmlsui.jpg","caption":""},{"id":"photo-1769236614411-xz9kvs","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236599588-5vug7i.jpg","caption":""}],"variant":"masonry","backgroundColorChoice":"primary-lighter"},"ourStory":{"variant":"cards","howWeMetText":"We met at a farmers market in Nashville. Mason was selling honey from his family''s farm, and Savannah couldn''t resist coming back every week. Eventually, she asked for more than just honey.","proposalText":"On his family''s farm, under a sky full of stars and surrounded by fireflies, Mason asked Savannah to be his forever. The ring was crafted from gold passed down three generations.","howWeMetPhoto":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236564843-0mots9.jpg","proposalPhoto":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-rustic-charm/1769236571896-l7s26a.jpg","howWeMetImageUrl":"/images/demo_images/demo-img-26.jpg","proposalImageUrl":"/images/demo_images/demo-img-27.jpg","showHowWeMetPhoto":true,"showProposalPhoto":true,"backgroundColorChoice":"primary-lighter"},"countdown":{"variant":"classic","backgroundColorChoice":"primary"},"eventDetails":{"events":[{"id":"ceremony","date":"2026-10-03","time":"17:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"Brooks Family Farm","address":"Franklin, Tennessee","imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/1769236494157-m0mry6m5nqk.jpg","description":"","useWeddingDate":true},{"id":"reception","date":"2026-10-03","time":"18:00","type":"reception","order":1,"title":"Reception","venue":"The Red Barn","address":"Brooks Family Farm, Franklin, TN","imageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/1769236501301-9ff8q40fzy.jpg","description":"","useWeddingDate":true}],"showMap":false,"variant":"split","showPhotos":true,"customEvents":[{"id":"meadow-ceremony","time":"17:00","type":"religiousCeremony","order":0,"title":"Meadow Ceremony","venue":"Wildflower Meadow","address":"Brooks Family Farm, Franklin, TN","imageUrl":"/images/demo_images/demo-img-23.jpg","description":"Say \"I do\" in our family''s meadow, with the rolling hills as our witness.","useWeddingDate":true},{"id":"barn-cocktails","time":"18:00","type":"cocktail","order":1,"title":"Cocktails & Lawn Games","venue":"The Farmhouse Patio","address":"Brooks Family Farm","imageUrl":"/images/demo_images/demo-img-25.jpg","description":"Enjoy craft cocktails, local beer, and yard games under the oak trees.","useWeddingDate":true},{"id":"barn-dinner","time":"19:30","type":"reception","order":2,"title":"Barn Dinner & Dancing","venue":"The Red Barn","address":"Brooks Family Farm, Franklin, TN","imageUrl":"/images/demo_images/demo-img-24.jpg","description":"Farm-to-table feast followed by boot-scootin'' dancing under the string lights!","useWeddingDate":true},{"id":"bonfire","time":"22:00","type":"afterParty","order":3,"title":"Bonfire & S''mores","venue":"The Fire Pit","address":"Brooks Family Farm","description":"End the night with a bonfire, s''mores, and stargazing.","useWeddingDate":true}],"showMapLinks":true,"ceremonyImageUrl":"/images/demo_images/demo-img-23.jpg","receptionImageUrl":"/images/demo_images/demo-img-24.jpg","backgroundColorChoice":"primary-lighter"}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-25T07:01:02.671+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  -- Wedding: demo-simple-love
  INSERT INTO weddings (
    id, date_id, wedding_name_id, partner1_first_name, partner1_last_name,
    partner2_first_name, partner2_last_name, wedding_date, wedding_time,
    reception_time, primary_color, secondary_color, accent_color,
    ceremony_venue_name, ceremony_venue_address, reception_venue_name,
    reception_venue_address, page_config, owner_id, collaborator_emails,
    og_title, og_description, og_image_url, is_demo, created_at, updated_at
  ) VALUES (
    'e63aeb62-9ff1-4958-be39-9b9e469e7b02',
    'demo-simple-love',
    'demo-simple-love',
    'Sam',
    'Taylor',
    'Riley',
    'Morgan',
    '2026-08-08',
    '14:00:00',
    '16:00:00',
    '#6890A0',
    '#F5F8FA',
    '#D4AF37',
    'City Hall',
    'Downtown, Austin, TX',
    'Backyard Celebration',
    'Our Home, Austin, TX',
    '{"version":"1.0","components":[{"id":"hero","type":"hero","order":0,"enabled":true},{"id":"countdown","type":"countdown","order":1,"enabled":true},{"id":"event-details","type":"event-details","order":2,"enabled":true},{"id":"our-story","type":"our-story","order":3,"enabled":true},{"id":"gallery","type":"gallery","order":4,"enabled":true},{"id":"rsvp","type":"rsvp","order":5,"enabled":true},{"id":"faq","type":"faq","order":6,"enabled":true}],"lastModified":"2026-01-25T07:03:38.833Z","siteSettings":{"theme":{"fonts":{"body":"Open Sans","display":"Poppins","heading":"Lato","bodyFamily":"\"Open Sans\", sans-serif","googleFonts":"Poppins:wght@400;600&family=Lato:wght@400;600&family=Open+Sans:wght@300;400;600","displayFamily":"\"Poppins\", sans-serif","headingFamily":"\"Lato\", sans-serif"},"colors":{"muted":"#6b7280","accent":"#D4AF37","primary":"#6890A0","secondary":"#F5F8FA","background":"#ffffff","foreground":"#1f2937"}},"layout":{"spacing":"normal","maxWidth":"1200px"},"locale":"en","navigation":{"showNavLinks":true},"showLanguageSwitcher":true},"sectionConfigs":{"faq":{"variant":"accordion","backgroundColorChoice":"accent-lighter"},"hero":{"tagline":"Love, simply","variant":"framed","imageSize":"large","frameStyle":"rounded","imageWidth":"centered","showTagline":false,"heroImageUrl":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324514039-e830uw.jpg","showCountdown":true,"textAlignment":"center","showRSVPButton":true},"rsvp":{"variant":"minimalistic","useColorBackground":true,"backgroundColorChoice":"primary"},"gallery":{"photos":[{"id":"photo-1769324574951-aa5ba9","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568802-x7i6gv.jpg","caption":""},{"id":"photo-1769324574951-jr3kcs","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568773-819xo8.jpg","caption":""},{"id":"photo-1769324574951-hhhrr","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568664-icjwdm.jpg","caption":""},{"id":"photo-1769324574951-cyc6dj","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568624-nountl.jpg","caption":""},{"id":"photo-1769324574951-87zzx","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568738-klw3ywj.jpg","caption":""},{"id":"photo-1769324574951-ngwqh4","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568579-hldd2k.jpg","caption":""},{"id":"photo-1769324574951-lsi78","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568704-2jhlsk.jpg","caption":""},{"id":"photo-1769324574951-xh6t2","alt":"","url":"https://YOUR_PROJECT.supabase.co/storage/v1/object/public/wedding-images/demo-simple-love/1769324568496-jj10ug.jpg","caption":""}],"variant":"grid","backgroundColorChoice":"accent-lighter"},"ourStory":{"variant":"minimal","howWeMetText":"We met through mutual friends at a backyard barbecue. Neither of us expected to find love that day, but life had other plans.","proposalText":"During a morning hike at our favorite trail, Sam turned around, pulled out a ring, and asked the simplest question with the biggest meaning.","howWeMetImageUrl":"/images/demo_images/demo-img-38.jpg","proposalImageUrl":"/images/demo_images/demo-img-39.jpg","backgroundColorChoice":"accent-lighter"},"countdown":{"variant":"minimal","backgroundColorChoice":"primary"},"eventDetails":{"events":[{"id":"ceremony","date":"2026-08-08","time":"14:00:00","type":"religiousCeremony","order":0,"title":"Religious Ceremony","venue":"City Hall","address":"Downtown, Austin, TX","imageUrl":"/images/demo_images/demo-img-36.jpg","description":"","useWeddingDate":true},{"id":"reception","date":"2026-08-08","time":"18:00","type":"reception","order":1,"title":"Reception","venue":"Backyard Celebration","address":"Our Home, Austin, TX","imageUrl":"/images/demo_images/demo-img-37.jpg","description":"","useWeddingDate":true}],"variant":"minimal","showPhotos":true,"customEvents":[{"id":"ceremony-simple","time":"14:00","type":"civilCeremony","order":0,"title":"Quick Ceremony","venue":"City Hall","address":"Downtown Austin, TX","description":"Short, sweet, and official!","useWeddingDate":true},{"id":"backyard-party","time":"16:00","type":"reception","order":1,"title":"Backyard Party","venue":"Our Place","address":"Austin, TX","description":"Food, drinks, music, and good vibes with our favorite people.","useWeddingDate":true}],"ceremonyImageUrl":"/images/demo_images/demo-img-36.jpg","receptionImageUrl":"/images/demo_images/demo-img-37.jpg","backgroundColorChoice":"accent-lighter"}}}'::jsonb,
    NULL, -- owner_id is null for demos
    '{}'::text[],
    NULL,
    NULL,
    NULL,
    true,
    '2026-01-24T05:38:49.959179+00:00',
    '2026-01-25T07:03:39.054+00:00'
  )
  ON CONFLICT (wedding_name_id) DO UPDATE SET
    page_config = EXCLUDED.page_config,
    partner1_first_name = EXCLUDED.partner1_first_name,
    partner1_last_name = EXCLUDED.partner1_last_name,
    partner2_first_name = EXCLUDED.partner2_first_name,
    partner2_last_name = EXCLUDED.partner2_last_name,
    wedding_date = EXCLUDED.wedding_date,
    wedding_time = EXCLUDED.wedding_time,
    reception_time = EXCLUDED.reception_time,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    ceremony_venue_name = EXCLUDED.ceremony_venue_name,
    ceremony_venue_address = EXCLUDED.ceremony_venue_address,
    reception_venue_name = EXCLUDED.reception_venue_name,
    reception_venue_address = EXCLUDED.reception_venue_address,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    og_image_url = EXCLUDED.og_image_url,
    updated_at = now();

  RAISE NOTICE 'Demo weddings seeded successfully';
END $$;

-- Verification query (you can run this to verify the data)
-- SELECT wedding_name_id, partner1_first_name, partner2_first_name FROM weddings WHERE is_demo = true;
