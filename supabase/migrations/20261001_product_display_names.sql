with replacements(source_id, product_name) as (
  values
    ('11', 'Control Yourself Washed Tee'),
    ('13', 'Rose Brushstroke Boxy Tee'),
    ('14', 'Faded Typography Ombre Tee'),
    ('15', 'Cloud Wash Mini-Print Tee'),
    ('16', 'Floral Script Washed Tee'),
    ('17', 'Boneless Retrospect Boxy Tee'),
    ('18', 'Trend Logo Green Tee'),
    ('19', '11:11 Rose Graphic Tee'),
    ('20', 'Boneless Chest Logo Tee'),
    ('21', 'Minimal Heart Emblem Tee'),
    ('22', 'John Seafood Graphic Tee'),
    ('23', 'Studded Wordmark Black Tee'),
    ('24', 'Trust Issues 02 Graphic Tee'),
    ('25', 'Summum Studios Washed Tee'),
    ('h5', 'SAWN Contrast-Piped Hoodie'),
    ('h6', 'Circle Star Logo Hoodie'),
    ('h7', 'Legendary Piped Hoodie'),
    ('h8', 'Scuffers Colorblock Hoodie'),
    ('j5', 'WB 23 Varsity Jacket'),
    ('p4', 'Black Embroidered Wide-Leg Sweatpants'),
    ('p5', 'Grey Patch-Pocket Baggy Joggers'),
    ('p6', 'Statement Print Sweat Set'),
    ('c2-alt', 'Creme Logo Cap'),
    ('c4', 'Citizens Beverly Hills Cap'),
    ('c5', 'Discipline Patch Trucker Cap'),
    ('c6', 'Camouflage Patch Trucker Cap'),
    ('c7', 'Burgundy Corduroy Initial Cap')
),
updated as (
  update public.products as product
  set name = replacement.product_name
  from replacements as replacement
  where coalesce(
    product.details ->> 'source_id',
    product.details ->> 'sourceId',
    product.details ->> 'id'
  ) = replacement.source_id
    and product.name is distinct from replacement.product_name
  returning product.id
)
select count(*) as updated_product_rows
from updated;
