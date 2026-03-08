-- Add demo supplier data for demo-luxury-noir wedding
DO $$
DECLARE
  noir_id uuid;
BEGIN
  SELECT id INTO noir_id FROM weddings WHERE wedding_name_id = 'demo-luxury-noir';
  IF noir_id IS NULL THEN
    RAISE NOTICE 'demo-luxury-noir not found, skipping suppliers';
    RETURN;
  END IF;

  -- Clean existing demo supplier data
  DELETE FROM suppliers WHERE wedding_id = noir_id;

  -- Insert suppliers
  INSERT INTO suppliers (id, wedding_id, name, category, contact_info, contact_type, total_amount, notes, display_order) VALUES
    ('e0000001-0001-4000-8000-000000000001', noir_id, 'Studio Noir Photography',        'photography',   'contacto@studionoir.mx',         'email',   35000.00, 'Paquete completo: ceremonia + cóctel + recepción. 8 horas de cobertura, álbum digital y 2 impresiones 40x50.',           1),
    ('e0000001-0002-4000-8000-000000000002', noir_id, 'Cinematic Films CDMX',            'videography',   '+52 55 4123 9876',                'phone',   28000.00, 'Video cinematográfico de la boda. Incluye trailer de 3 min, película completa y clip para redes sociales.',              2),
    ('e0000001-0003-4000-8000-000000000003', noir_id, 'Jardín de Luxe Florería',          'decoration',    'pedidos@jardinluxe.com.mx',       'email',   45000.00, 'Arreglo floral completo: altar, centro de mesas (18), arco entrada, pétalos pasillo. Tema noir con rosas negras y blancas.', 3),
    ('e0000001-0004-4000-8000-000000000004', noir_id, 'À La Carte Banquetes',             'catering',      'eventos@alacarte.mx',             'email',   85000.00, 'Cena de gala para 250 personas. Menú de 4 tiempos, barra de cócteles, personal de servicio incluido.',                   4),
    ('e0000001-0005-4000-8000-000000000005', noir_id, 'Hacienda Los Cedros',              'venue',         'reservas@haciendacedros.mx',      'email',   65000.00, 'Renta de salón principal + jardín exterior. Capacidad 300 personas. Incluye mobiliario básico y estacionamiento.',         5),
    ('e0000001-0006-4000-8000-000000000006', noir_id, 'Cuarteto Bellas Artes',            'music',         '+52 55 3098 7654',                'phone',   22000.00, 'Cuarteto de cuerdas para ceremonia y cóctel (3 horas). Repertorio clásico + contemporáneo personalizado.',               6),
    ('e0000001-0007-4000-8000-000000000007', noir_id, 'DJ Omar — Luxury Events',          'music',         'djomar@luxuryevents.mx',          'email',   18000.00, 'DJ para recepción y baile (5 horas). Equipo profesional de sonido e iluminación incluido.',                              7),
    ('e0000001-0008-4000-8000-000000000008', noir_id, 'Atelier Pastelero Mon Gâteau',     'cake',          'hola@mongateaumx.com',            'email',   12000.00, 'Pastel de bodas 6 pisos, diseño noir en negro y dorado. Degustación incluida. Entrega e instalación en el venue.',       8),
    ('e0000001-0009-4000-8000-000000000009', noir_id, 'Carruajes Elegantes CDMX',         'transport',     'reservas@carruajescdmx.mx',       'email',   15000.00, 'Transporte de novios: limusina clásica + van para cortejo (4 unidades). Traslados ceremonia y hotel.',                  9),
    ('e0000001-0010-4000-8000-000000000010', noir_id, 'Papelería Fina Invitations',       'stationery',    'studio@papeleriafina.mx',         'email',    8500.00, 'Invitaciones impresas (270 piezas): sobre, tarjeta principal, RSVP y mapa. Diseño noir con foil dorado.',              10);

  -- Supplier payments (partial payments already made)
  INSERT INTO supplier_payments (id, supplier_id, wedding_id, amount, payment_date, notes) VALUES
    -- Photography: 50% anticipo
    ('e0000002-0001-4000-8000-000000000001', 'e0000001-0001-4000-8000-000000000001', noir_id, 17500.00, '2026-01-15', 'Anticipo 50% para separar la fecha'),
    -- Decoration: 40% anticipo
    ('e0000002-0002-4000-8000-000000000002', 'e0000001-0003-4000-8000-000000000003', noir_id, 18000.00, '2026-02-01', 'Anticipo 40% para confirmar pedido de flores'),
    -- Catering: 30% anticipo
    ('e0000002-0003-4000-8000-000000000003', 'e0000001-0004-4000-8000-000000000004', noir_id, 25500.00, '2026-01-20', 'Anticipo 30% para reservar el servicio'),
    -- Venue: pago completo ya realizado
    ('e0000002-0004-4000-8000-000000000004', 'e0000001-0005-4000-8000-000000000005', noir_id, 32500.00, '2025-11-10', 'Primer pago 50% — salon reservado'),
    ('e0000002-0005-4000-8000-000000000005', 'e0000001-0005-4000-8000-000000000005', noir_id, 32500.00, '2026-03-01', 'Segundo pago 50% — liquidado'),
    -- Cuarteto: 50% anticipo
    ('e0000002-0006-4000-8000-000000000006', 'e0000001-0006-4000-8000-000000000006', noir_id, 11000.00, '2026-02-15', 'Anticipo 50% para confirmar fecha'),
    -- Stationery: pagado completo
    ('e0000002-0007-4000-8000-000000000007', 'e0000001-0009-4000-8000-000000000009', noir_id,  8500.00, '2025-12-05', 'Pago completo para iniciar produccion'),
    -- DJ: anticipo
    ('e0000002-0008-4000-8000-000000000008', 'e0000001-0007-4000-8000-000000000007', noir_id,  9000.00, '2026-02-20', 'Anticipo 50%'),
    -- Video: anticipo
    ('e0000002-0009-4000-8000-000000000009', 'e0000001-0002-4000-8000-000000000002', noir_id, 14000.00, '2026-01-25', 'Anticipo 50%');

  RAISE NOTICE 'Demo suppliers inserted for demo-luxury-noir (% suppliers, % payments)', 10, 9;
END $$;
