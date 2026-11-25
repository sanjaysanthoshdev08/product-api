-- Points each men's product at its photo in frontend/public/images/zara/.
-- If a file is missing the shop falls back to the built-in drawing.
-- (the image_url column is created automatically when the backend starts)
UPDATE product SET image_url = '/images/zara/technical-bomber-jacket.jpg' WHERE name = 'Technical Bomber Jacket';
UPDATE product SET image_url = '/images/zara/combined-quilted-jacket.jpg' WHERE name = 'Combined Quilted Jacket';
UPDATE product SET image_url = '/images/zara/regular-fit-padded-bomber-jacket.jpg' WHERE name = 'Regular Fit Padded Bomber Jacket';
UPDATE product SET image_url = '/images/zara/relaxed-fit-leather-effect-jacket.jpg' WHERE name = 'Relaxed Fit Leather Effect Jacket';
UPDATE product SET image_url = '/images/zara/balloon-fit-trousers-side-pleats.jpg' WHERE name = 'Balloon Fit Trousers With Side Pleats';
UPDATE product SET image_url = '/images/zara/abstract-print-balloon-fit-trousers.jpg' WHERE name = 'Abstract Print Balloon Fit Trousers';
UPDATE product SET image_url = '/images/zara/lyocell-relaxed-fit-trousers.jpg' WHERE name = '100% Lyocell Relaxed Fit Trousers';
UPDATE product SET image_url = '/images/zara/comfort-suit-regular-fit-trousers.jpg' WHERE name = 'Comfort Suit Regular Fit Trousers';
UPDATE product SET image_url = '/images/zara/basic-heavyweight-tshirt-03.jpg' WHERE name = 'Basic Heavyweight T-Shirt /03';
UPDATE product SET image_url = '/images/zara/basic-medium-weight-tshirt-02.jpg' WHERE name = 'Basic Medium Weight T-Shirt /02';
UPDATE product SET image_url = '/images/zara/basic-slim-fit-tshirt-01.jpg' WHERE name = 'Basic Slim Fit T-Shirt /01';
UPDATE product SET image_url = '/images/zara/easy-care-textured-shirt.jpg' WHERE name = 'Easy Care Textured Shirt';
UPDATE product SET image_url = '/images/zara/regular-fit-textured-shirt.jpg' WHERE name = 'Regular Fit Textured Shirt';
