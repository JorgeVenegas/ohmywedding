-- Add gallery and registry sections to the Hacienda wedding page config
-- Updates the components array and sectionConfigs for the sydney-marco wedding

UPDATE public.wedding_websites
SET page_config = jsonb_set(
  jsonb_set(
    page_config,
    '{components}',
    '[
      { "id": "hero",          "type": "hero",          "order": 0, "enabled": true },
      { "id": "countdown",     "type": "countdown",     "order": 1, "enabled": true },
      { "id": "our-story",     "type": "our-story",     "order": 2, "enabled": true },
      { "id": "event-details", "type": "event-details", "order": 3, "enabled": true },
      { "id": "gallery",       "type": "gallery",       "order": 4, "enabled": true },
      { "id": "registry",      "type": "registry",      "order": 5, "enabled": true },
      { "id": "rsvp",          "type": "rsvp",          "order": 6, "enabled": true },
      { "id": "faq",           "type": "faq",           "order": 7, "enabled": true }
    ]'::jsonb
  ),
  '{sectionConfigs,gallery}',
  '{
    "variant": "hacienda",
    "sectionTitle": "Galeria",
    "sectionSubtitle": "Momentos que atesoramos",
    "masonryColumns": 3
  }'::jsonb
)
WHERE wedding_id = (SELECT id FROM public.weddings WHERE wedding_name_id = 'sydney-marco');

UPDATE public.wedding_websites
SET page_config = jsonb_set(
  page_config,
  '{sectionConfigs,registry}',
  '{
    "variant": "hacienda",
    "sectionTitle": "Mesa de Regalos",
    "sectionSubtitle": "Su presencia es nuestro mejor regalo"
  }'::jsonb
)
WHERE wedding_id = (SELECT id FROM public.weddings WHERE wedding_name_id = 'sydney-marco');
