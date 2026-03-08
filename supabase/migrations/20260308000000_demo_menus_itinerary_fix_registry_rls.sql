-- Fix RLS policies for demo weddings (owner_id IS NULL), add menus, itinerary, and fix registry progress
-- for demo-luxury-noir wedding

DO $$
DECLARE
  noir_id uuid;

  -- Dish IDs
  dish_crema       uuid := 'f0000001-0001-4000-8000-000000000001'::uuid;
  dish_costillas   uuid := 'f0000001-0002-4000-8000-000000000002'::uuid;
  dish_risotto     uuid := 'f0000001-0003-4000-8000-000000000003'::uuid;
  dish_tarta       uuid := 'f0000001-0004-4000-8000-000000000004'::uuid;
  dish_brie        uuid := 'f0000001-0005-4000-8000-000000000005'::uuid;

  -- Menu IDs
  menu_clasico   uuid := 'f0000002-0001-4000-8000-000000000001'::uuid;
  menu_veggie    uuid := 'f0000002-0002-4000-8000-000000000002'::uuid;

  -- Itinerary event IDs (parent events)
  evt_llegada    uuid := 'f0000003-0001-4000-8000-000000000001'::uuid;
  evt_ceremonia  uuid := 'f0000003-0002-4000-8000-000000000002'::uuid;
  evt_coctel     uuid := 'f0000003-0003-4000-8000-000000000003'::uuid;
  evt_cena       uuid := 'f0000003-0004-4000-8000-000000000004'::uuid;
  evt_baile      uuid := 'f0000003-0005-4000-8000-000000000005'::uuid;
  evt_countdown  uuid := 'f0000003-0006-4000-8000-000000000006'::uuid;

  -- Itinerary sub-event IDs
  evt_entrada_padrinos uuid := 'f0000003-0011-4000-8000-000000000011'::uuid;
  evt_entrada_novios   uuid := 'f0000003-0012-4000-8000-000000000012'::uuid;
  evt_primer_baile     uuid := 'f0000003-0021-4000-8000-000000000021'::uuid;
  evt_brindis          uuid := 'f0000003-0022-4000-8000-000000000022'::uuid;
  evt_fuegos           uuid := 'f0000003-0031-4000-8000-000000000031'::uuid;

BEGIN
  -- Resolve demo-luxury-noir ID
  SELECT id INTO noir_id FROM weddings WHERE wedding_name_id = 'demo-luxury-noir';

  IF noir_id IS NULL THEN
    RAISE NOTICE 'demo-luxury-noir not found, skipping';
    RETURN;
  END IF;

  -- ============================================================
  -- 1. FIX RLS POLICIES — add owner_id IS NULL support
  --    (allows authenticated users to access demo weddings)
  -- ============================================================

  -- dishes
  DROP POLICY IF EXISTS "Users can view dishes for their weddings" ON dishes;
  CREATE POLICY "Users can view dishes for their weddings" ON dishes
    FOR SELECT USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  DROP POLICY IF EXISTS "Users can manage dishes for their weddings" ON dishes;
  CREATE POLICY "Users can manage dishes for their weddings" ON dishes
    FOR ALL USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  -- guest_dish_assignments
  DROP POLICY IF EXISTS "Users can view dish assignments for their weddings" ON guest_dish_assignments;
  CREATE POLICY "Users can view dish assignments for their weddings" ON guest_dish_assignments
    FOR SELECT USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  DROP POLICY IF EXISTS "Users can manage dish assignments for their weddings" ON guest_dish_assignments;
  CREATE POLICY "Users can manage dish assignments for their weddings" ON guest_dish_assignments
    FOR ALL USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  -- itinerary_events
  DROP POLICY IF EXISTS "Users can view itinerary for their weddings" ON itinerary_events;
  CREATE POLICY "Users can view itinerary for their weddings" ON itinerary_events
    FOR SELECT USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  DROP POLICY IF EXISTS "Users can manage itinerary for their weddings" ON itinerary_events;
  CREATE POLICY "Users can manage itinerary for their weddings" ON itinerary_events
    FOR ALL USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  -- menus
  DROP POLICY IF EXISTS "Users can view menus for their weddings" ON menus;
  CREATE POLICY "Users can view menus for their weddings" ON menus
    FOR SELECT USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  DROP POLICY IF EXISTS "Users can manage menus for their weddings" ON menus;
  CREATE POLICY "Users can manage menus for their weddings" ON menus
    FOR ALL USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  -- menu_courses
  DROP POLICY IF EXISTS "Users can view menu courses for their weddings" ON menu_courses;
  CREATE POLICY "Users can view menu courses for their weddings" ON menu_courses
    FOR SELECT USING (
      menu_id IN (
        SELECT id FROM menus WHERE
          wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
          OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
      )
    );

  DROP POLICY IF EXISTS "Users can manage menu courses for their weddings" ON menu_courses;
  CREATE POLICY "Users can manage menu courses for their weddings" ON menu_courses
    FOR ALL USING (
      menu_id IN (
        SELECT id FROM menus WHERE
          wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
          OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
      )
    );

  -- guest_menu_assignments
  DROP POLICY IF EXISTS "Users can view menu assignments for their weddings" ON guest_menu_assignments;
  CREATE POLICY "Users can view menu assignments for their weddings" ON guest_menu_assignments
    FOR SELECT USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  DROP POLICY IF EXISTS "Users can manage menu assignments for their weddings" ON guest_menu_assignments;
  CREATE POLICY "Users can manage menu assignments for their weddings" ON guest_menu_assignments
    FOR ALL USING (
      wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid() OR owner_id IS NULL)
      OR wedding_id IN (SELECT id FROM weddings WHERE auth.jwt()->>'email' = ANY(collaborator_emails))
    );

  -- ============================================================
  -- 2. FIX REGISTRY PROGRESS
  --    a) Update page_config customItems with correct currentAmount values
  --    b) Recompute custom_registry_items.current_amount from contributions
  -- ============================================================

  -- Update page_config JSON with correct currentAmount values
  UPDATE weddings SET
    page_config = jsonb_set(
      page_config,
      '{sectionConfigs,registry,customItems}',
      '[
        {"id":"ri-honeymoon","title":"Luna de Miel en Europa","description":"Ayudanos a crear recuerdos inolvidables en nuestro viaje por Italia, Francia y Espana.","goalAmount":150000,"currentAmount":47500},
        {"id":"ri-home","title":"Fondo para Nuestro Hogar","description":"Contribuye a nuestro sueno de amueblar y decorar nuestro primer hogar juntos.","goalAmount":100000,"currentAmount":32000},
        {"id":"ri-dinner","title":"Cena Romantica en Paris","description":"Regalanos una noche magica en la Ciudad de la Luz.","goalAmount":25000,"currentAmount":15000},
        {"id":"ri-wine","title":"Experiencia de Vinos en Toscana","description":"Un recorrido por los vinedos mas exclusivos de la Toscana italiana.","goalAmount":30000,"currentAmount":8500},
        {"id":"ri-cooking","title":"Clase de Cocina en Italia","description":"Una experiencia culinaria autentica aprendiendo la cocina tradicional italiana.","goalAmount":15000,"currentAmount":15000}
      ]'::jsonb
    )
  WHERE id = noir_id;

  -- Recompute current_amount in custom_registry_items from actual contributions
  UPDATE custom_registry_items
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM registry_contributions
    WHERE custom_registry_item_id = custom_registry_items.id
      AND payment_status = 'succeeded'
  )
  WHERE wedding_id = noir_id;

  -- ============================================================
  -- 3. DISHES for demo-luxury-noir
  -- ============================================================

  INSERT INTO dishes (id, wedding_id, name, description, category, is_vegetarian, is_vegan, is_gluten_free, allergens, display_order)
  VALUES
    (dish_crema,     noir_id, 'Crema de Trufa con Brioche',             'Crema suave de trufa negra servida con tostadas de brioche artesanal y aceite de trufa blanca al terminar.',   'soup',      false, false, false, NULL,       0),
    (dish_costillas, noir_id, 'Costillas de Res con Reduccion de Merlot','Costillas de res braseadas durante 12 horas, glaseadas con reduccion de vino Merlot y servidas con pure de papa trufado.', 'main',  false, false, true,  NULL,       1),
    (dish_risotto,   noir_id, 'Risotto de Hongos Silvestres con Trufa', 'Risotto cremoso de hongos porcini, shiitake y trufa negra, terminado con parmesano reggiano y aceite de albahaca.', 'main',  true,  false, true,  'Lacteos',  2),
    (dish_tarta,     noir_id, 'Tarta de Chocolate con Helado de Vainilla','Tarta de chocolate belga 70% cacao con helado de vainilla de Madagascar y coulis de frambuesa fresca.',    'dessert',   true,  false, false, 'Lacteos',  3),
    (dish_brie,      noir_id, 'Brie Horneado con Mermelada de Higos',   'Queso brie artesanal horneado con miel de trufa, mermelada casera de higos y nueces caramelizadas sobre crostini.',  'appetizer', true,  false, false, 'Lacteos, Gluten', 4)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_vegan = EXCLUDED.is_vegan,
    is_gluten_free = EXCLUDED.is_gluten_free,
    allergens = EXCLUDED.allergens,
    display_order = EXCLUDED.display_order;

  -- ============================================================
  -- 4. MENUS with courses for demo-luxury-noir
  -- ============================================================

  -- Menu A: Clasico (3 courses: entrada, principal: res, postre)
  INSERT INTO menus (id, wedding_id, name, description, courses_count, display_order)
  VALUES
    (menu_clasico, noir_id, 'Menu Clasico', 'Menu principal de la velada con opciones seleccionadas por nuestros chefs para una experiencia gastronomica sublime.', 3, 0),
    (menu_veggie,  noir_id, 'Menu Vegetariano', 'Propuesta vegetariana elaborada con los mejores ingredientes de temporada, pensada para quienes prefieren una opcion sin carne.', 3, 1)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    courses_count = EXCLUDED.courses_count,
    display_order = EXCLUDED.display_order;

  -- Menu A courses
  INSERT INTO menu_courses (menu_id, course_number, course_name, dish_id)
  VALUES
    (menu_clasico, 1, 'Entrada', dish_crema),
    (menu_clasico, 2, 'Plato Principal', dish_costillas),
    (menu_clasico, 3, 'Postre', dish_tarta)
  ON CONFLICT (menu_id, course_number) DO UPDATE SET
    course_name = EXCLUDED.course_name,
    dish_id = EXCLUDED.dish_id;

  -- Menu B courses
  INSERT INTO menu_courses (menu_id, course_number, course_name, dish_id)
  VALUES
    (menu_veggie, 1, 'Entrada', dish_brie),
    (menu_veggie, 2, 'Plato Principal', dish_risotto),
    (menu_veggie, 3, 'Postre', dish_tarta)
  ON CONFLICT (menu_id, course_number) DO UPDATE SET
    course_name = EXCLUDED.course_name,
    dish_id = EXCLUDED.dish_id;

  -- ============================================================
  -- 5. MENU ASSIGNMENTS — vegetarian/vegan guests get Menu B
  -- ============================================================

  -- Assign Menu B to guests with vegetarian/vegan dietary restrictions
  INSERT INTO guest_menu_assignments (wedding_id, guest_id, menu_id)
  VALUES
    -- Sofia Montoya (Vegetariana)
    (noir_id, 'c0000001-0004-4000-8000-000000000004'::uuid, menu_veggie),
    -- Daniela del Valle (Vegana)
    (noir_id, 'c0000001-0008-4000-8000-000000000008'::uuid, menu_veggie),
    -- Ana Garcia (Vegetariana)
    (noir_id, 'c0000001-0018-4000-8000-000000000018'::uuid, menu_veggie),
    -- Prima Valeria Montoya (Vegetariana)
    (noir_id, 'c0000001-0031-4000-8000-000000000031'::uuid, menu_veggie)
  ON CONFLICT (wedding_id, guest_id) DO UPDATE SET menu_id = EXCLUDED.menu_id;

  -- Assign Menu A to all remaining guests
  INSERT INTO guest_menu_assignments (wedding_id, guest_id, menu_id)
  VALUES
    (noir_id, 'c0000001-0001-4000-8000-000000000001'::uuid, menu_clasico),
    (noir_id, 'c0000001-0002-4000-8000-000000000002'::uuid, menu_clasico),
    (noir_id, 'c0000001-0003-4000-8000-000000000003'::uuid, menu_clasico),
    (noir_id, 'c0000001-0005-4000-8000-000000000005'::uuid, menu_clasico),
    (noir_id, 'c0000001-0006-4000-8000-000000000006'::uuid, menu_clasico),
    (noir_id, 'c0000001-0007-4000-8000-000000000007'::uuid, menu_clasico),
    (noir_id, 'c0000001-0009-4000-8000-000000000009'::uuid, menu_clasico),
    (noir_id, 'c0000001-0010-4000-8000-000000000010'::uuid, menu_clasico),
    (noir_id, 'c0000001-0011-4000-8000-000000000011'::uuid, menu_clasico),
    (noir_id, 'c0000001-0012-4000-8000-000000000012'::uuid, menu_clasico),
    (noir_id, 'c0000001-0013-4000-8000-000000000013'::uuid, menu_clasico),
    (noir_id, 'c0000001-0014-4000-8000-000000000014'::uuid, menu_clasico),
    (noir_id, 'c0000001-0015-4000-8000-000000000015'::uuid, menu_clasico),
    (noir_id, 'c0000001-0016-4000-8000-000000000016'::uuid, menu_clasico),
    (noir_id, 'c0000001-0017-4000-8000-000000000017'::uuid, menu_clasico),
    (noir_id, 'c0000001-0019-4000-8000-000000000019'::uuid, menu_clasico),
    (noir_id, 'c0000001-0020-4000-8000-000000000020'::uuid, menu_clasico),
    (noir_id, 'c0000001-0021-4000-8000-000000000021'::uuid, menu_clasico),
    (noir_id, 'c0000001-0022-4000-8000-000000000022'::uuid, menu_clasico),
    (noir_id, 'c0000001-0023-4000-8000-000000000023'::uuid, menu_clasico),
    (noir_id, 'c0000001-0024-4000-8000-000000000024'::uuid, menu_clasico),
    (noir_id, 'c0000001-0025-4000-8000-000000000025'::uuid, menu_clasico),
    (noir_id, 'c0000001-0026-4000-8000-000000000026'::uuid, menu_clasico),
    (noir_id, 'c0000001-0027-4000-8000-000000000027'::uuid, menu_clasico),
    (noir_id, 'c0000001-0028-4000-8000-000000000028'::uuid, menu_clasico),
    (noir_id, 'c0000001-0029-4000-8000-000000000029'::uuid, menu_clasico),
    (noir_id, 'c0000001-0030-4000-8000-000000000030'::uuid, menu_clasico),
    (noir_id, 'c0000001-0032-4000-8000-000000000032'::uuid, menu_clasico),
    (noir_id, 'c0000001-0033-4000-8000-000000000033'::uuid, menu_clasico),
    (noir_id, 'c0000001-0034-4000-8000-000000000034'::uuid, menu_clasico),
    (noir_id, 'c0000001-0035-4000-8000-000000000035'::uuid, menu_clasico),
    (noir_id, 'c0000001-0036-4000-8000-000000000036'::uuid, menu_clasico),
    (noir_id, 'c0000001-0037-4000-8000-000000000037'::uuid, menu_clasico),
    (noir_id, 'c0000001-0038-4000-8000-000000000038'::uuid, menu_clasico)
  ON CONFLICT (wedding_id, guest_id) DO UPDATE SET menu_id = EXCLUDED.menu_id;

  -- ============================================================
  -- 6. ITINERARY EVENTS for demo-luxury-noir (2026-12-31, CDMX CST = UTC-6)
  -- ============================================================

  -- Delete existing itinerary events to avoid duplicates on re-run
  DELETE FROM itinerary_events WHERE wedding_id = noir_id;

  -- Parent events
  INSERT INTO itinerary_events (id, wedding_id, parent_id, title, description, location, start_time, end_time, icon, display_order)
  VALUES
    (evt_llegada,
     noir_id, NULL,
     'Llegada de los Invitados',
     'Por favor llegar con 30 minutos de anticipacion para acomodarse antes del inicio de la ceremonia.',
     'Parroquia de la Santa Veracruz, Av. Hidalgo 19, Centro Historico, CDMX',
     '2026-12-31T18:00:00-06:00',
     '2026-12-31T19:00:00-06:00',
     'entrance', 0),

    (evt_ceremonia,
     noir_id, NULL,
     'Ceremonia Religiosa',
     'Ricardo y Valentina intercambian votos en la historica Parroquia de la Santa Veracruz.',
     'Parroquia de la Santa Veracruz, Av. Hidalgo 19, Centro Historico, CDMX',
     '2026-12-31T19:00:00-06:00',
     '2026-12-31T20:00:00-06:00',
     'ceremony', 1),

    (evt_coctel,
     noir_id, NULL,
     'Coctel de Bienvenida',
     'Disfruta hors d''oeuvres y cocteles de autor mientras celebramos el inicio de la nueva vida de Ricardo y Valentina.',
     'Terraza del Castillo de Chapultepec, CDMX',
     '2026-12-31T20:00:00-06:00',
     '2026-12-31T21:30:00-06:00',
     'cocktail', 2),

    (evt_cena,
     noir_id, NULL,
     'Cena de Gala',
     'Una velada de alta gastronomia con menu degustacion de cinco tiempos elaborado por el chef Rodrigo Villanueva.',
     'Salon Principal del Castillo de Chapultepec, CDMX',
     '2026-12-31T21:30:00-06:00',
     '2026-12-31T23:00:00-06:00',
     'dinner', 3),

    (evt_baile,
     noir_id, NULL,
     'Primer Baile y Fiesta',
     'Celebra con nosotros al ritmo de musica en vivo, brindis y mucho baile.',
     'Salon Principal del Castillo de Chapultepec, CDMX',
     '2026-12-31T23:00:00-06:00',
     '2026-12-31T23:45:00-06:00',
     'dancing', 4),

    (evt_countdown,
     noir_id, NULL,
     'Cuenta Regresiva de Ano Nuevo',
     'Cerremos el 2026 juntos. Brindemos por el amor de Ricardo y Valentina y por el inicio del 2027.',
     'Terraza Panoramica del Castillo de Chapultepec, CDMX',
     '2026-12-31T23:45:00-06:00',
     '2027-01-01T01:00:00-06:00',
     'toast', 5);

  -- Sub-events of la Ceremonia
  INSERT INTO itinerary_events (id, wedding_id, parent_id, title, description, location, start_time, icon, display_order)
  VALUES
    (evt_entrada_padrinos,
     noir_id, evt_ceremonia,
     'Entrada de los Padrinos',
     'Los padrinos de velacion y anillos toman su lugar en el altar.',
     NULL,
     '2026-12-31T19:05:00-06:00',
     'preparation', 0),

    (evt_entrada_novios,
     noir_id, evt_ceremonia,
     'Entrada de los Novios',
     'Ricardo y Valentina hacen su entrada al altar acompanados de sus familias.',
     NULL,
     '2026-12-31T19:15:00-06:00',
     'ceremony', 1);

  -- Sub-events of la Cena/Baile
  INSERT INTO itinerary_events (id, wedding_id, parent_id, title, description, location, start_time, icon, display_order)
  VALUES
    (evt_primer_baile,
     noir_id, evt_baile,
     'Primer Baile',
     'Vals de los novios: "La Vie en Rose" interpretada en vivo.',
     NULL,
     '2026-12-31T23:00:00-06:00',
     'firstDance', 0),

    (evt_brindis,
     noir_id, evt_baile,
     'Brindis de los Padrinos',
     'Eduardo y Carmen Ramirez, padrinos de velacion, ofrecen las palabras de honor.',
     NULL,
     '2026-12-31T23:15:00-06:00',
     'toast', 1);

  -- Sub-event of Cuenta Regresiva
  INSERT INTO itinerary_events (id, wedding_id, parent_id, title, description, location, start_time, icon, display_order)
  VALUES
    (evt_fuegos,
     noir_id, evt_countdown,
     'Fuegos Artificiales y Brindis de Ano Nuevo',
     'Damos la bienvenida al 2027 con champana, fuegos artificiales y la promesa de un ano lleno de amor.',
     'Terraza Panoramica del Castillo',
     '2027-01-01T00:00:00-06:00',
     'other', 0);

  RAISE NOTICE 'Demo data updated: menus, itinerary, registry progress fixed, RLS policies updated';
END $$;
