-- Fashion catalog (men, women, kids) for the product table.
-- WARNING: this REPLACES all existing products.
-- Run after the backend has started once (so the new columns exist):
--   mysql -u root -p product_db < db/fashion-products.sql

DELETE FROM product;
ALTER TABLE product AUTO_INCREMENT = 1;

INSERT INTO product (name, description, price, quantity, category, colors, sizes, image_key) VALUES
-- MEN
('Oversize Faux Leather Jacket', 'Relaxed boxy fit with a soft faux leather finish and zip pockets.', 49.99, 24, 'MEN', 'Brown,Black', 'XS,S,M,L,XL', 'jacket'),
('Classic Straight Jeans', 'Mid-rise straight leg in durable stretch denim.', 39.99, 40, 'MEN', 'Denim,Black', 'S,M,L,XL,XXL', 'jeans'),
('Essential Cotton T-Shirt', 'Soft 100% cotton crew neck tee for everyday wear.', 14.99, 120, 'MEN', 'White,Black,Navy', 'S,M,L,XL,XXL', 'tshirt'),
('Oxford Button-Down Shirt', 'Crisp oxford weave with a classic button-down collar.', 29.99, 55, 'MEN', 'White,Blue', 'S,M,L,XL', 'shirt'),
('Heavy Fleece Hoodie', 'Brushed fleece lining, kangaroo pocket and drawstring hood.', 34.99, 60, 'MEN', 'Grey,Black,Navy', 'S,M,L,XL,XXL', 'hoodie'),
('Everyday White Sneakers', 'Clean low-top leather-look sneakers with cushioned insoles.', 59.99, 35, 'MEN', 'White,Black', '40,41,42,43,44,45', 'sneakers'),
('Lace-Up Work Boots', 'Rugged boots with a grippy rubber sole and padded collar.', 79.99, 18, 'MEN', 'Beige,Brown', '40,41,42,43,44,45', 'boots'),
('Merino Crew Sweater', 'Lightweight merino blend knit, warm and breathable.', 44.99, 30, 'MEN', 'Navy,Grey,Green', 'S,M,L,XL', 'sweater'),
('Relaxed Chino Shorts', 'Cotton twill shorts with a relaxed fit and side pockets.', 24.99, 48, 'MEN', 'Beige,Olive', 'S,M,L,XL', 'shorts'),
-- WOMEN
('Floral Midi Dress', 'Flowing midi length with a flattering waist and floral print.', 54.99, 22, 'WOMEN', 'Pink,Cream', 'XS,S,M,L,XL', 'dress'),
('Pleated Mini Skirt', 'High-waist pleated skirt with a hidden side zip.', 27.99, 36, 'WOMEN', 'Red,Black', 'XS,S,M,L', 'skirt'),
('Wide-Leg Cargo Jeans', 'Baggy wide-leg fit with utility pockets in soft denim.', 44.99, 28, 'WOMEN', 'Brown,Denim', 'XS,S,M,L,XL', 'jeans'),
('Cropped Knit Sweater', 'Cozy cropped sweater in a soft textured knit.', 32.99, 33, 'WOMEN', 'Cream,Pink', 'XS,S,M,L', 'sweater'),
('Satin Slip Dress', 'Smooth satin finish with adjustable straps.', 49.99, 20, 'WOMEN', 'Black,Red', 'XS,S,M,L,XL', 'dress'),
('Oversize Hoodie', 'Dropped shoulders and a relaxed, extra-roomy fit.', 36.99, 45, 'WOMEN', 'Beige,Grey', 'XS,S,M,L,XL', 'hoodie'),
('Chunky Platform Boots', 'Lace-up boots with a chunky platform sole.', 74.99, 16, 'WOMEN', 'Black,Brown', '36,37,38,39,40,41', 'boots'),
('Linen Summer Shirt', 'Breathable linen blend shirt for warm days.', 28.99, 38, 'WOMEN', 'White,Blue', 'XS,S,M,L,XL', 'shirt'),
('Classic Baseball Cap', 'Adjustable cotton cap with a curved brim.', 12.99, 70, 'WOMEN', 'Black,Pink', 'One Size', 'cap'),
-- KIDS
('Kids Graphic T-Shirt', 'Fun printed tee in soft, easy-wash cotton.', 9.99, 90, 'KIDS', 'Yellow,Blue,Red', '4Y,6Y,8Y,10Y,12Y', 'tshirt'),
('Kids Denim Jeans', 'Comfort-stretch jeans with an adjustable waistband.', 22.99, 42, 'KIDS', 'Denim,Black', '4Y,6Y,8Y,10Y,12Y', 'jeans'),
('Kids Zip Hoodie', 'Warm zip-up hoodie with two front pockets.', 24.99, 50, 'KIDS', 'Green,Grey', '4Y,6Y,8Y,10Y,12Y', 'hoodie'),
('Kids Sneakers', 'Lightweight sneakers with hook-and-loop straps.', 29.99, 44, 'KIDS', 'White,Blue', '28,29,30,31,32,33,34', 'sneakers'),
('Girls Party Dress', 'Twirly party dress with a soft tulle skirt.', 31.99, 26, 'KIDS', 'Pink,Yellow', '4Y,6Y,8Y,10Y', 'dress'),
('Kids Puffer Jacket', 'Water-resistant padded jacket for cold days.', 39.99, 28, 'KIDS', 'Red,Navy', '4Y,6Y,8Y,10Y,12Y', 'jacket'),
('Kids Cotton Shorts', 'Elastic-waist shorts made for playtime.', 11.99, 65, 'KIDS', 'Blue,Olive', '4Y,6Y,8Y,10Y,12Y', 'shorts'),
('Kids Sun Cap', 'Sun-safe cotton cap with an adjustable strap.', 8.99, 80, 'KIDS', 'Yellow,Blue', 'One Size', 'cap');
