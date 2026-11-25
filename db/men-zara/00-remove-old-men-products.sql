-- Removes the old MEN sample products (ladies and kids are untouched).
DELETE FROM product WHERE category = 'MEN';
