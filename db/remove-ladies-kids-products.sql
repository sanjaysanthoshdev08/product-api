-- Removes the Ladies (WOMEN) and Kids sample products, leaving only Men.
-- The sample files db/fashion-products.sql, db/indian-wear-products.sql and
-- db/modern-dresses-products.sql can add them back if ever needed.
DELETE FROM product WHERE category IN ('WOMEN', 'KIDS');
