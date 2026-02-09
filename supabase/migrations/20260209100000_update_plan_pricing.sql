-- Update plan pricing: Premium $7,000 MXN ($350 USD), Deluxe $15,000 MXN ($750 USD)
update plan_pricing set
  price_usd = 35000,   -- $350 USD in cents
  price_mxn = 700000,  -- $7,000 MXN in centavos
  updated_at = now()
where plan = 'premium';

update plan_pricing set
  price_usd = 75000,    -- $750 USD in cents
  price_mxn = 1500000,  -- $15,000 MXN in centavos
  updated_at = now()
where plan = 'deluxe';
