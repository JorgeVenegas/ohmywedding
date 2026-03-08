-- Update all demo weddings to Spanish locale and Mexican couples
-- Populate demo-luxury-noir with guests, guest groups, registry items, and contributions

DO $$
DECLARE
  -- Wedding IDs looked up dynamically (stable across local/prod)
  noir_id UUID;
  classic_id UUID;
  modern_id UUID;
  romantic_id UUID;
  rustic_id UUID;
  simple_id UUID;
  -- Guest group IDs for luxury-noir (new inserts, safe to hardcode)
  gg_familia_montoya UUID := 'a0000001-0001-4000-8000-000000000001';
  gg_familia_delvalle UUID := 'a0000001-0002-4000-8000-000000000002';
  gg_amigos_uni UUID := 'a0000001-0003-4000-8000-000000000003';
  gg_trabajo_ricardo UUID := 'a0000001-0004-4000-8000-000000000004';
  gg_trabajo_valentina UUID := 'a0000001-0005-4000-8000-000000000005';
  gg_padrinos UUID := 'a0000001-0006-4000-8000-000000000006';
  gg_familia_ext UUID := 'a0000001-0007-4000-8000-000000000007';
  gg_amigos_cercanos UUID := 'a0000001-0008-4000-8000-000000000008';
  -- Registry item IDs (new inserts, safe to hardcode)
  ri_honeymoon UUID := 'b0000001-0001-4000-8000-000000000001';
  ri_home UUID := 'b0000001-0002-4000-8000-000000000002';
  ri_dinner UUID := 'b0000001-0003-4000-8000-000000000003';
  ri_wine UUID := 'b0000001-0004-4000-8000-000000000004';
  ri_cooking UUID := 'b0000001-0005-4000-8000-000000000005';
BEGIN
  -- Look up wedding IDs dynamically by wedding_name_id
  SELECT id INTO noir_id FROM weddings WHERE wedding_name_id = 'demo-luxury-noir';
  SELECT id INTO classic_id FROM weddings WHERE wedding_name_id = 'demo-classic-elegance';
  SELECT id INTO modern_id FROM weddings WHERE wedding_name_id = 'demo-modern-minimal';
  SELECT id INTO romantic_id FROM weddings WHERE wedding_name_id = 'demo-romantic-garden';
  SELECT id INTO rustic_id FROM weddings WHERE wedding_name_id = 'demo-rustic-charm';
  SELECT id INTO simple_id FROM weddings WHERE wedding_name_id = 'demo-simple-love';

  -- Guard: skip if demo weddings don't exist yet
  IF noir_id IS NULL OR classic_id IS NULL OR modern_id IS NULL OR romantic_id IS NULL OR rustic_id IS NULL OR simple_id IS NULL THEN
    RAISE NOTICE 'Some demo weddings not found, skipping migration. Ensure seed_demo_weddings migration has run first.';
    RETURN;
  END IF;

  -- ============================================================
  -- 1. UPDATE ALL DEMOS: Spanish locale, Mexican couples, venues
  -- ============================================================

  -- demo-classic-elegance -> Carlos Ramirez & Andrea Sanchez
  UPDATE weddings SET
    partner1_first_name = 'Carlos',
    partner1_last_name = 'Ramirez',
    partner2_first_name = 'Andrea',
    partner2_last_name = 'Sanchez',
    ceremony_venue_name = 'Parroquia de San Fernando',
    ceremony_venue_address = 'Centro Historico, Ciudad de Mexico',
    reception_venue_name = 'Hacienda de los Morales',
    reception_venue_address = 'Vazquez de Mella 525, Polanco, CDMX',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              page_config,
              '{siteSettings,locale}', '"es"'
            ),
            '{sectionConfigs,hero,tagline}', '"Dos corazones, un solo amor"'
          ),
          '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en una gala de beneficencia en la Ciudad de Mexico. Carlos quedo cautivado por la gracia y el ingenio de Andrea. Un amor compartido por la musica clasica y el arte nos unio."'
        ),
        '{sectionConfigs,ourStory,proposalText}', '"En una fresca tarde de otono en el Bosque de Chapultepec, rodeados de hojas doradas y la suave luz del atardecer, Carlos se arrodillo con el anillo de su abuela."'
      ),
      '{sectionConfigs,eventDetails,showMap}', 'true'
    ),
    updated_at = now()
  WHERE id = classic_id;

  -- demo-modern-minimal -> Diego Torres & Mariana Lopez
  UPDATE weddings SET
    partner1_first_name = 'Diego',
    partner1_last_name = 'Torres',
    partner2_first_name = 'Mariana',
    partner2_last_name = 'Lopez',
    ceremony_venue_name = 'Museo MARCO',
    ceremony_venue_address = 'Zuazua y Jardon, Centro, Monterrey, NL',
    reception_venue_name = 'Museo MARCO',
    reception_venue_address = 'Zuazua y Jardon, Centro, Monterrey, NL',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            page_config,
            '{siteSettings,locale}', '"es"'
          ),
          '{sectionConfigs,hero,tagline}', '"Simplemente nosotros"'
        ),
        '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en una conferencia de diseno en Monterrey. Los dos alcanzamos el ultimo cafe frio del bar al mismo tiempo y decidimos compartirlo."'
      ),
      '{sectionConfigs,ourStory,proposalText}', '"En una manana tranquila en casa, rodeados de nuestras plantas favoritas y la suave luz del amanecer, Diego le propuso matrimonio a Mariana con un anillo hecho por un joyero local."'
    ),
    updated_at = now()
  WHERE id = modern_id;

  -- demo-romantic-garden -> Sebastian Flores & Isabella Reyes
  UPDATE weddings SET
    partner1_first_name = 'Sebastian',
    partner1_last_name = 'Flores',
    partner2_first_name = 'Isabella',
    partner2_last_name = 'Reyes',
    ceremony_venue_name = 'Jardines de Mexico',
    ceremony_venue_address = 'Tequesquitengo, Morelos',
    reception_venue_name = 'El Invernadero',
    reception_venue_address = 'Jardines de Mexico, Morelos',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            page_config,
            '{siteSettings,locale}', '"es"'
          ),
          '{sectionConfigs,hero,tagline}', '"Donde el amor florece eternamente"'
        ),
        '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en Jardines de Mexico durante un festival de primavera. Sebastian estaba dibujando las flores cuando Isabella se detuvo a admirar su trabajo. Un cafe se convirtio en cena, y la cena en para siempre."'
      ),
      '{sectionConfigs,ourStory,proposalText}', '"Bajo un arco de buganvilias en el mismo jardin donde nos conocimos, Sebastian sorprendio a Isabella con un picnic al atardecer y un anillo escondido dentro de un ramo de flores."'
    ),
    updated_at = now()
  WHERE id = romantic_id;

  -- demo-rustic-charm -> Emiliano Castillo & Camila Herrera
  UPDATE weddings SET
    partner1_first_name = 'Emiliano',
    partner1_last_name = 'Castillo',
    partner2_first_name = 'Camila',
    partner2_last_name = 'Herrera',
    ceremony_venue_name = 'Hacienda San Jose',
    ceremony_venue_address = 'Tixkokob, Yucatan',
    reception_venue_name = 'El Granero',
    reception_venue_address = 'Hacienda San Jose, Tixkokob, Yucatan',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            page_config,
            '{siteSettings,locale}', '"es"'
          ),
          '{sectionConfigs,hero,tagline}', '"Nuestra historia de amor, escrita en las estrellas"'
        ),
        '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en un mercado organico en Oaxaca. Emiliano vendia miel de la granja de su familia, y Camila no podia resistirse a volver cada semana. Al final, ella pidio algo mas que solo miel."'
      ),
      '{sectionConfigs,ourStory,proposalText}', '"En la hacienda de su familia, bajo un cielo lleno de estrellas y rodeados de luciernagas, Emiliano le pidio a Camila que fuera su para siempre. El anillo fue hecho con oro heredado por tres generaciones."'
    ),
    updated_at = now()
  WHERE id = rustic_id;

  -- demo-simple-love -> Daniel Ortega & Sofia Morales
  UPDATE weddings SET
    partner1_first_name = 'Daniel',
    partner1_last_name = 'Ortega',
    partner2_first_name = 'Sofia',
    partner2_last_name = 'Morales',
    ceremony_venue_name = 'Registro Civil',
    ceremony_venue_address = 'Centro, Merida, Yucatan',
    reception_venue_name = 'Celebracion en Casa',
    reception_venue_address = 'Nuestra Casa, Merida, Yucatan',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            page_config,
            '{siteSettings,locale}', '"es"'
          ),
          '{sectionConfigs,hero,tagline}', '"Amor, simplemente"'
        ),
        '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en la reunion de unos amigos en comun. Ninguno de los dos esperaba encontrar el amor ese dia, pero la vida tenia otros planes."'
      ),
      '{sectionConfigs,ourStory,proposalText}', '"Durante una caminata matutina en nuestro sendero favorito, Daniel se volteo, saco un anillo y le hizo a Sofia la pregunta mas simple con el significado mas grande."'
    ),
    updated_at = now()
  WHERE id = simple_id;

  -- ============================================================
  -- 2. UPDATE demo-luxury-noir: Mexican couple + full Spanish config
  -- ============================================================

  UPDATE weddings SET
    partner1_first_name = 'Ricardo',
    partner1_last_name = 'Montoya',
    partner2_first_name = 'Valentina',
    partner2_last_name = 'del Valle',
    ceremony_venue_name = 'Parroquia de la Santa Veracruz',
    ceremony_venue_address = 'Av. Hidalgo 19, Centro Historico, CDMX',
    reception_venue_name = 'Castillo de Chapultepec',
    reception_venue_address = 'Bosque de Chapultepec, CDMX',
    page_config = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    page_config,
                    '{siteSettings,locale}', '"es"'
                  ),
                  '{sectionConfigs,hero,tagline}', '"Una celebracion de amor extraordinario"'
                ),
                '{sectionConfigs,ourStory,howWeMetText}', '"Nos conocimos en una exclusiva subasta de arte en la Ciudad de Mexico. Ricardo estaba pujando por una escultura poco comun, pero encontro algo mucho mas valioso cuando vio a Valentina al otro lado de la sala."'
              ),
              '{sectionConfigs,ourStory,proposalText}', '"A bordo de un yate privado bajo el cielo estrellado de Los Cabos, Ricardo le propuso matrimonio a Valentina con un anillo personalizado mientras los fuegos artificiales iluminaban el cielo de medianoche."'
            ),
            '{sectionConfigs,eventDetails,showMap}', 'true'
          ),
          '{sectionConfigs,eventDetails,showMapLinks}', 'true'
        ),
        '{sectionConfigs,registry,showCustomRegistry}', 'true'
      ),
      '{sectionConfigs,registry,customItems}', '[
        {"id":"ri-honeymoon","title":"Luna de Miel en Europa","description":"Ayudanos a crear recuerdos inolvidables en nuestro viaje por Italia, Francia y Espana.","goalAmount":150000,"currentAmount":0},
        {"id":"ri-home","title":"Fondo para Nuestro Hogar","description":"Contribuye a nuestro sueno de amueblar y decorar nuestro primer hogar juntos.","goalAmount":100000,"currentAmount":0},
        {"id":"ri-dinner","title":"Cena Romantica en Paris","description":"Regalanos una noche magica en la Ciudad de la Luz.","goalAmount":25000,"currentAmount":0},
        {"id":"ri-wine","title":"Experiencia de Vinos en Toscana","description":"Un recorrido por los vinedos mas exclusivos de la Toscana italiana.","goalAmount":30000,"currentAmount":0},
        {"id":"ri-cooking","title":"Clase de Cocina en Italia","description":"Una experiencia culinaria autentica aprendiendo la cocina tradicional italiana.","goalAmount":15000,"currentAmount":0}
      ]'::jsonb
    ),
    updated_at = now()
  WHERE id = noir_id;

  -- Update event details for luxury-noir with Spanish event names
  UPDATE weddings SET
    page_config = jsonb_set(
      page_config,
      '{sectionConfigs,eventDetails,events}',
      '[
        {"id":"ceremony","date":"2026-12-31","time":"19:00:00","type":"religiousCeremony","order":0,"title":"Ceremonia Religiosa","venue":"Parroquia de la Santa Veracruz","address":"Av. Hidalgo 19, Centro Historico, CDMX","description":"","useWeddingDate":true},
        {"id":"reception","date":"2026-12-31","time":"20:30:00","type":"reception","order":1,"title":"Recepcion","venue":"Castillo de Chapultepec","address":"Bosque de Chapultepec, CDMX","description":"","useWeddingDate":true}
      ]'::jsonb
    )
  WHERE id = noir_id;

  -- Add custom events for luxury-noir
  UPDATE weddings SET
    page_config = jsonb_set(
      page_config,
      '{sectionConfigs,eventDetails,customEvents}',
      '[
        {"id":"cocktail-hour","time":"20:00","type":"cocktail","order":2,"title":"Hora del Coctel","venue":"Terraza del Castillo","address":"Castillo de Chapultepec, CDMX","description":"Acompananos con hors d''oeuvres y cocteles de autor mientras celebramos el inicio de nuestra vida juntos.","useWeddingDate":true},
        {"id":"dinner-reception","time":"21:30","type":"reception","order":3,"title":"Cena y Baile","venue":"Salon Principal","address":"Castillo de Chapultepec, CDMX","description":"Una velada de alta gastronomia, brindis emotivos y baile hasta la medianoche.","useWeddingDate":true},
        {"id":"countdown-nye","time":"23:45","type":"afterParty","order":4,"title":"Cuenta Regresiva de Ano Nuevo","venue":"Terraza Panoramica","address":"Castillo de Chapultepec","description":"Brindemos juntos el inicio del 2027 con fuegos artificiales y champana bajo las estrellas.","useWeddingDate":true}
      ]'::jsonb
    )
  WHERE id = noir_id;

  -- ============================================================
  -- 3. GUEST GROUPS for demo-luxury-noir
  -- ============================================================

  INSERT INTO guest_groups (id, wedding_id, name, notes, invitation_sent, rsvp_submitted_at)
  VALUES
    (gg_familia_montoya, noir_id, 'Familia Montoya', 'Familia directa del novio', true, '2026-02-15T10:00:00Z'),
    (gg_familia_delvalle, noir_id, 'Familia del Valle', 'Familia directa de la novia', true, '2026-02-20T14:30:00Z'),
    (gg_amigos_uni, noir_id, 'Amigos de la Universidad', 'Compas del ITESM', true, '2026-03-01T09:00:00Z'),
    (gg_trabajo_ricardo, noir_id, 'Amigos del Trabajo - Ricardo', 'Colegas de la oficina', true, NULL),
    (gg_trabajo_valentina, noir_id, 'Amigos del Trabajo - Valentina', 'Equipo del despacho', true, '2026-02-28T16:00:00Z'),
    (gg_padrinos, noir_id, 'Padrinos y Madrinas', 'Padrinos de la boda', true, '2026-02-10T08:00:00Z'),
    (gg_familia_ext, noir_id, 'Familia Extendida', 'Tios, primos y abuelos', true, NULL),
    (gg_amigos_cercanos, noir_id, 'Amigos Cercanos', 'Amigos de toda la vida', true, '2026-03-05T11:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    notes = EXCLUDED.notes,
    invitation_sent = EXCLUDED.invitation_sent,
    rsvp_submitted_at = EXCLUDED.rsvp_submitted_at;

  -- ============================================================
  -- 4. GUESTS for demo-luxury-noir
  -- ============================================================

  -- Familia Montoya (5 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0001-4000-8000-000000000001', noir_id, gg_familia_montoya, 'Roberto Montoya', '+525512340001', 'roberto@example.com', ARRAY['familia','padre'], 'confirmed', NULL, 'Papa del novio'),
    ('c0000001-0002-4000-8000-000000000002', noir_id, gg_familia_montoya, 'Elena Montoya', '+525512340002', 'elena@example.com', ARRAY['familia','madre'], 'confirmed', 'Sin gluten', 'Mama del novio'),
    ('c0000001-0003-4000-8000-000000000003', noir_id, gg_familia_montoya, 'Alejandro Montoya', '+525512340003', 'alex.m@example.com', ARRAY['familia','hermano'], 'confirmed', NULL, 'Hermano del novio'),
    ('c0000001-0004-4000-8000-000000000004', noir_id, gg_familia_montoya, 'Sofia Montoya', '+525512340004', 'sofia.m@example.com', ARRAY['familia','hermana'], 'confirmed', 'Vegetariana', 'Hermana del novio'),
    ('c0000001-0005-4000-8000-000000000005', noir_id, gg_familia_montoya, 'Abuela Carmen', '+525512340005', NULL, ARRAY['familia','abuelos'], 'confirmed', NULL, 'Abuela paterna')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Familia del Valle (5 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0006-4000-8000-000000000006', noir_id, gg_familia_delvalle, 'Fernando del Valle', '+525598760001', 'fernando@example.com', ARRAY['familia','padre'], 'confirmed', NULL, 'Papa de la novia'),
    ('c0000001-0007-4000-8000-000000000007', noir_id, gg_familia_delvalle, 'Patricia del Valle', '+525598760002', 'patricia@example.com', ARRAY['familia','madre'], 'confirmed', NULL, 'Mama de la novia'),
    ('c0000001-0008-4000-8000-000000000008', noir_id, gg_familia_delvalle, 'Daniela del Valle', '+525598760003', 'daniela@example.com', ARRAY['familia','hermana'], 'confirmed', 'Vegana', 'Hermana de la novia'),
    ('c0000001-0009-4000-8000-000000000009', noir_id, gg_familia_delvalle, 'Miguel del Valle', '+525598760004', 'miguel@example.com', ARRAY['familia','hermano'], 'confirmed', NULL, 'Hermano de la novia'),
    ('c0000001-0010-4000-8000-000000000010', noir_id, gg_familia_delvalle, 'Abuela Rosa', '+525598760005', NULL, ARRAY['familia','abuelos'], 'confirmed', 'Sin lactosa', 'Abuela materna')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Amigos de la Universidad (6 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0011-4000-8000-000000000011', noir_id, gg_amigos_uni, 'Andres Gutierrez', '+525511110001', 'andres.g@example.com', ARRAY['amigos','universidad'], 'confirmed', NULL, NULL),
    ('c0000001-0012-4000-8000-000000000012', noir_id, gg_amigos_uni, 'Laura Martinez', '+525511110002', 'laura.m@example.com', ARRAY['amigos','universidad'], 'confirmed', NULL, '+1 acompanante'),
    ('c0000001-0013-4000-8000-000000000013', noir_id, gg_amigos_uni, 'Pedro Sanchez', '+525511110003', 'pedro.s@example.com', ARRAY['amigos','universidad'], 'declined', NULL, 'Viaje de trabajo'),
    ('c0000001-0014-4000-8000-000000000014', noir_id, gg_amigos_uni, 'Monica Rivera', '+525511110004', 'monica.r@example.com', ARRAY['amigos','universidad'], 'confirmed', 'Sin mariscos', NULL),
    ('c0000001-0015-4000-8000-000000000015', noir_id, gg_amigos_uni, 'Roberto Diaz', '+525511110005', 'roberto.d@example.com', ARRAY['amigos','universidad'], 'confirmed', NULL, NULL),
    ('c0000001-0016-4000-8000-000000000016', noir_id, gg_amigos_uni, 'Carolina Vega', '+525511110006', 'caro.v@example.com', ARRAY['amigos','universidad'], 'pending', NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Amigos del Trabajo - Ricardo (4 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0017-4000-8000-000000000017', noir_id, gg_trabajo_ricardo, 'Marcos Hernandez', '+525533330001', 'marcos.h@example.com', ARRAY['amigos','trabajo'], 'confirmed', NULL, 'Director de area'),
    ('c0000001-0018-4000-8000-000000000018', noir_id, gg_trabajo_ricardo, 'Ana Garcia', '+525533330002', 'ana.g@example.com', ARRAY['amigos','trabajo'], 'confirmed', 'Vegetariana', NULL),
    ('c0000001-0019-4000-8000-000000000019', noir_id, gg_trabajo_ricardo, 'Luis Fernandez', '+525533330003', 'luis.f@example.com', ARRAY['amigos','trabajo'], 'pending', NULL, NULL),
    ('c0000001-0020-4000-8000-000000000020', noir_id, gg_trabajo_ricardo, 'Gabriela Torres', '+525533330004', 'gaby.t@example.com', ARRAY['amigos','trabajo'], 'confirmed', NULL, '+1 acompanante')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Amigos del Trabajo - Valentina (4 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0021-4000-8000-000000000021', noir_id, gg_trabajo_valentina, 'Fernanda Lopez', '+525555550001', 'fer.l@example.com', ARRAY['amigos','trabajo'], 'confirmed', NULL, NULL),
    ('c0000001-0022-4000-8000-000000000022', noir_id, gg_trabajo_valentina, 'Ricardo Navarro', '+525555550002', 'ricky.n@example.com', ARRAY['amigos','trabajo'], 'confirmed', 'Sin nueces', NULL),
    ('c0000001-0023-4000-8000-000000000023', noir_id, gg_trabajo_valentina, 'Paola Mendez', '+525555550003', 'paola.m@example.com', ARRAY['amigos','trabajo'], 'declined', NULL, 'Embarazada, no puede asistir'),
    ('c0000001-0024-4000-8000-000000000024', noir_id, gg_trabajo_valentina, 'Jorge Castaneda', '+525555550004', 'jorge.c@example.com', ARRAY['amigos','trabajo'], 'confirmed', NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Padrinos y Madrinas (4 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0025-4000-8000-000000000025', noir_id, gg_padrinos, 'Eduardo Ramirez', '+525577770001', 'eduardo.r@example.com', ARRAY['padrinos','velacion'], 'confirmed', NULL, 'Padrino de velacion'),
    ('c0000001-0026-4000-8000-000000000026', noir_id, gg_padrinos, 'Carmen Ramirez', '+525577770002', 'carmen.r@example.com', ARRAY['padrinos','velacion'], 'confirmed', NULL, 'Madrina de velacion'),
    ('c0000001-0027-4000-8000-000000000027', noir_id, gg_padrinos, 'Alfonso Delgado', '+525577770003', 'alfonso.d@example.com', ARRAY['padrinos','anillos'], 'confirmed', NULL, 'Padrino de anillos'),
    ('c0000001-0028-4000-8000-000000000028', noir_id, gg_padrinos, 'Lucia Delgado', '+525577770004', 'lucia.d@example.com', ARRAY['padrinos','anillos'], 'confirmed', 'Sin gluten', 'Madrina de anillos')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- Familia Extendida (5 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes, is_traveling, traveling_from)
  VALUES
    ('c0000001-0029-4000-8000-000000000029', noir_id, gg_familia_ext, 'Tio Javier Montoya', '+525599990001', 'javier.m@example.com', ARRAY['familia','tios'], 'confirmed', NULL, 'Tio paterno', true, 'Guadalajara, Jalisco'),
    ('c0000001-0030-4000-8000-000000000030', noir_id, gg_familia_ext, 'Tia Marta Montoya', '+525599990002', 'marta.m@example.com', ARRAY['familia','tios'], 'confirmed', NULL, 'Tia paterna', true, 'Guadalajara, Jalisco'),
    ('c0000001-0031-4000-8000-000000000031', noir_id, gg_familia_ext, 'Prima Valeria Montoya', '+525599990003', 'valeria.m@example.com', ARRAY['familia','primos'], 'confirmed', 'Vegetariana', 'Prima del novio', true, 'Guadalajara, Jalisco'),
    ('c0000001-0032-4000-8000-000000000032', noir_id, gg_familia_ext, 'Tio Raul del Valle', '+525599990004', 'raul.dv@example.com', ARRAY['familia','tios'], 'pending', NULL, 'Tio materno de la novia', true, 'Merida, Yucatan'),
    ('c0000001-0033-4000-8000-000000000033', noir_id, gg_familia_ext, 'Primo Diego del Valle', '+525599990005', 'diego.dv@example.com', ARRAY['familia','primos'], 'declined', NULL, 'Estudia en el extranjero', false, NULL)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes, is_traveling = EXCLUDED.is_traveling, traveling_from = EXCLUDED.traveling_from;

  -- Amigos Cercanos (5 guests)
  INSERT INTO guests (id, wedding_id, guest_group_id, name, phone_number, email, tags, confirmation_status, dietary_restrictions, notes)
  VALUES
    ('c0000001-0034-4000-8000-000000000034', noir_id, gg_amigos_cercanos, 'Santiago Ruiz', '+525522220001', 'santi.r@example.com', ARRAY['amigos','cercanos'], 'confirmed', NULL, 'Mejor amigo del novio'),
    ('c0000001-0035-4000-8000-000000000035', noir_id, gg_amigos_cercanos, 'Isabela Moreno', '+525522220002', 'isa.m@example.com', ARRAY['amigos','cercanos'], 'confirmed', NULL, 'Mejor amiga de la novia'),
    ('c0000001-0036-4000-8000-000000000036', noir_id, gg_amigos_cercanos, 'Mateo Cruz', '+525522220003', 'mateo.c@example.com', ARRAY['amigos','cercanos'], 'confirmed', 'Sin mariscos', NULL),
    ('c0000001-0037-4000-8000-000000000037', noir_id, gg_amigos_cercanos, 'Renata Ibarra', '+525522220004', 'renata.i@example.com', ARRAY['amigos','cercanos'], 'confirmed', NULL, '+1 acompanante'),
    ('c0000001-0038-4000-8000-000000000038', noir_id, gg_amigos_cercanos, 'Emilio Vargas', '+525522220005', 'emilio.v@example.com', ARRAY['amigos','cercanos'], 'pending', NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, confirmation_status = EXCLUDED.confirmation_status, dietary_restrictions = EXCLUDED.dietary_restrictions, notes = EXCLUDED.notes;

  -- ============================================================
  -- 5. CUSTOM REGISTRY ITEMS for demo-luxury-noir (in DB)
  -- ============================================================

  INSERT INTO custom_registry_items (id, wedding_id, title, description, goal_amount, current_amount, image_urls, is_active, display_order)
  VALUES
    (ri_honeymoon, noir_id, 'Luna de Miel en Europa', 'Ayudanos a crear recuerdos inolvidables en nuestro viaje por Italia, Francia y Espana.', 150000, 47500, ARRAY[]::text[], true, 0),
    (ri_home, noir_id, 'Fondo para Nuestro Hogar', 'Contribuye a nuestro sueno de amueblar y decorar nuestro primer hogar juntos.', 100000, 32000, ARRAY[]::text[], true, 1),
    (ri_dinner, noir_id, 'Cena Romantica en Paris', 'Regalanos una noche magica en la Ciudad de la Luz con una cena en un restaurante con estrella Michelin.', 25000, 15000, ARRAY[]::text[], true, 2),
    (ri_wine, noir_id, 'Experiencia de Vinos en Toscana', 'Un recorrido por los vinedos mas exclusivos de la Toscana italiana.', 30000, 8500, ARRAY[]::text[], true, 3),
    (ri_cooking, noir_id, 'Clase de Cocina en Italia', 'Una experiencia culinaria autentica aprendiendo la cocina tradicional italiana con un chef local.', 15000, 15000, ARRAY[]::text[], true, 4)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    goal_amount = EXCLUDED.goal_amount,
    current_amount = EXCLUDED.current_amount,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

  -- ============================================================
  -- 6. REGISTRY CONTRIBUTIONS for demo-luxury-noir
  -- ============================================================

  INSERT INTO registry_contributions (id, custom_registry_item_id, wedding_id, contributor_name, contributor_email, amount, message, payment_status, created_at)
  VALUES
    -- Luna de Miel contributions
    ('d0000001-0001-4000-8000-000000000001', ri_honeymoon, noir_id, 'Roberto y Elena Montoya', 'roberto@example.com', 15000, 'Para que disfruten al maximo su luna de miel. Los amamos!', 'succeeded', '2026-02-16T10:00:00Z'),
    ('d0000001-0002-4000-8000-000000000002', ri_honeymoon, noir_id, 'Fernando y Patricia del Valle', 'fernando@example.com', 20000, 'Vivan la experiencia de sus suenos. Con todo nuestro amor.', 'succeeded', '2026-02-21T15:00:00Z'),
    ('d0000001-0003-4000-8000-000000000003', ri_honeymoon, noir_id, 'Santiago Ruiz', 'santi.r@example.com', 5000, 'Pasensela increible en Europa, compas!', 'succeeded', '2026-03-01T12:00:00Z'),
    ('d0000001-0004-4000-8000-000000000004', ri_honeymoon, noir_id, 'Eduardo y Carmen Ramirez', 'eduardo.r@example.com', 7500, 'Que este viaje sea el inicio de muchas aventuras juntos.', 'succeeded', '2026-02-12T09:00:00Z'),

    -- Fondo para el Hogar contributions
    ('d0000001-0005-4000-8000-000000000005', ri_home, noir_id, 'Tio Javier y Tia Marta', 'javier.m@example.com', 10000, 'Para su nuevo hogar con mucho carino.', 'succeeded', '2026-02-25T14:00:00Z'),
    ('d0000001-0006-4000-8000-000000000006', ri_home, noir_id, 'Andres Gutierrez', 'andres.g@example.com', 3000, 'Felicidades! Que su casa se llene de amor.', 'succeeded', '2026-03-02T10:30:00Z'),
    ('d0000001-0007-4000-8000-000000000007', ri_home, noir_id, 'Laura Martinez', 'laura.m@example.com', 5000, 'Un regalo para su nidito de amor.', 'succeeded', '2026-03-02T11:00:00Z'),
    ('d0000001-0008-4000-8000-000000000008', ri_home, noir_id, 'Marcos Hernandez', 'marcos.h@example.com', 8000, 'Felicidades a los dos! Disfruten su nuevo hogar.', 'succeeded', '2026-02-28T16:00:00Z'),
    ('d0000001-0009-4000-8000-000000000009', ri_home, noir_id, 'Ana Garcia', 'ana.g@example.com', 3000, 'Con carino para su hogar.', 'succeeded', '2026-03-01T09:00:00Z'),
    ('d0000001-0010-4000-8000-000000000010', ri_home, noir_id, 'Fernanda Lopez', 'fer.l@example.com', 3000, 'Para su casita! Los quiero mucho.', 'succeeded', '2026-03-01T13:00:00Z'),

    -- Cena en Paris contributions
    ('d0000001-0011-4000-8000-000000000011', ri_dinner, noir_id, 'Isabela Moreno', 'isa.m@example.com', 5000, 'Disfruten Paris como se merecen!', 'succeeded', '2026-03-05T11:30:00Z'),
    ('d0000001-0012-4000-8000-000000000012', ri_dinner, noir_id, 'Monica Rivera', 'monica.r@example.com', 3000, 'Bon appetit en Paris!', 'succeeded', '2026-03-03T14:00:00Z'),
    ('d0000001-0013-4000-8000-000000000013', ri_dinner, noir_id, 'Alfonso y Lucia Delgado', 'alfonso.d@example.com', 7000, 'Que la cena en Paris sea inolvidable. Los queremos!', 'succeeded', '2026-02-15T08:00:00Z'),

    -- Experiencia de Vinos contributions
    ('d0000001-0014-4000-8000-000000000014', ri_wine, noir_id, 'Mateo Cruz', 'mateo.c@example.com', 3500, 'Salud por los novios!', 'succeeded', '2026-03-06T10:00:00Z'),
    ('d0000001-0015-4000-8000-000000000015', ri_wine, noir_id, 'Renata Ibarra', 'renata.i@example.com', 5000, 'Traigan un buen vino de recuerdo!', 'succeeded', '2026-03-06T15:00:00Z'),

    -- Clase de Cocina - fully funded
    ('d0000001-0016-4000-8000-000000000016', ri_cooking, noir_id, 'Gabriela Torres', 'gaby.t@example.com', 5000, 'Aprenden a cocinar pasta y me invitan!', 'succeeded', '2026-02-27T12:00:00Z'),
    ('d0000001-0017-4000-8000-000000000017', ri_cooking, noir_id, 'Roberto Diaz', 'roberto.d@example.com', 5000, 'Dale! Que aprendan a hacer pizza.', 'succeeded', '2026-03-01T16:00:00Z'),
    ('d0000001-0018-4000-8000-000000000018', ri_cooking, noir_id, 'Jorge Castaneda', 'jorge.c@example.com', 5000, 'Felicidades! Disfruten Italia.', 'succeeded', '2026-03-04T10:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    contributor_name = EXCLUDED.contributor_name,
    amount = EXCLUDED.amount,
    message = EXCLUDED.message,
    payment_status = EXCLUDED.payment_status;

  -- ============================================================
  -- 7. RSVP entries for demo-luxury-noir
  -- ============================================================

  INSERT INTO rsvps (id, wedding_id, guest_name, guest_email, attending, companions, dietary_restrictions, message, submitted_at)
  VALUES
    ('e0000001-0001-4000-8000-000000000001', noir_id, 'Roberto Montoya', 'roberto@example.com', 'yes', 1, NULL, 'No nos lo perdemos por nada! Felicidades, hijo.', '2026-02-15T10:05:00Z'),
    ('e0000001-0002-4000-8000-000000000002', noir_id, 'Fernando del Valle', 'fernando@example.com', 'yes', 1, NULL, 'Estaremos ahi para celebrar con ustedes.', '2026-02-20T14:35:00Z'),
    ('e0000001-0003-4000-8000-000000000003', noir_id, 'Andres Gutierrez', 'andres.g@example.com', 'yes', 0, NULL, 'Listos para la fiesta!', '2026-03-01T09:05:00Z'),
    ('e0000001-0004-4000-8000-000000000004', noir_id, 'Pedro Sanchez', 'pedro.s@example.com', 'no', 0, NULL, 'Lo siento mucho, tengo viaje de trabajo esa fecha. Los quiero!', '2026-03-01T09:30:00Z'),
    ('e0000001-0005-4000-8000-000000000005', noir_id, 'Eduardo Ramirez', 'eduardo.r@example.com', 'yes', 1, NULL, 'Sera un honor acompanarlos como padrinos.', '2026-02-10T08:10:00Z'),
    ('e0000001-0006-4000-8000-000000000006', noir_id, 'Santiago Ruiz', 'santi.r@example.com', 'yes', 0, NULL, 'Ahi estaremos, hermano!', '2026-03-05T11:05:00Z'),
    ('e0000001-0007-4000-8000-000000000007', noir_id, 'Isabela Moreno', 'isa.m@example.com', 'yes', 0, NULL, 'No me lo pierdo! Va a estar hermosa la boda.', '2026-03-05T11:15:00Z')
  ON CONFLICT (id) DO UPDATE SET
    guest_name = EXCLUDED.guest_name,
    attending = EXCLUDED.attending,
    message = EXCLUDED.message;

  RAISE NOTICE 'Demo weddings updated to Spanish and luxury-noir populated successfully';
END $$;
