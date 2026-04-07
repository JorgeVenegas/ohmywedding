-- Update hacienda-elegance font pairing for sydney-marco wedding
-- Replaces Pinyon Script / Raleway with Playfair Display / Cormorant Garamond / Lato
-- for a more luxurious editorial feel.

UPDATE wedding_websites
SET page_config = jsonb_set(
  page_config,
  '{siteSettings,theme,fonts}',
  '{
    "display":       "Playfair Display",
    "heading":       "Cormorant Garamond",
    "body":          "Lato",
    "displayFamily": "\"Playfair Display\", serif",
    "headingFamily": "\"Cormorant Garamond\", serif",
    "bodyFamily":    "\"Lato\", sans-serif",
    "googleFonts":   "Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Lato:wght@300;400;700"
  }'::jsonb,
  true
)
WHERE wedding_id = (SELECT id FROM weddings WHERE wedding_name_id = 'sydney-marco');
