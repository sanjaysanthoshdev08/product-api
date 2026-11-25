-- Indian-wear sample products (women, men, kids). ADDS to the catalog;
-- nothing is deleted. Brand names, prices and descriptions are sample data
-- for the demo shop, not real listings.
--   mysql -u root -p product_db < db/indian-wear-products.sql

INSERT INTO product (name, description, price, quantity, category, colors, sizes, image_key) VALUES
-- WOMEN
('Biba Anarkali Kurta Dress', 'Flared Anarkali kurta dress in soft cotton with a printed yoke.', 64.99, 25, 'WOMEN', 'Maroon,Teal,Mustard', 'XS,S,M,L,XL,XXL', 'dress'),
('Fabindia Block Print Cotton Kurta', 'Hand block printed straight kurta in breathable cotton.', 39.99, 40, 'WOMEN', 'Blue,Cream,Green', 'XS,S,M,L,XL', 'shirt'),
('W Flared Palazzo Pants', 'Wide-leg palazzo pants with an elastic waist, easy for daily wear.', 29.99, 45, 'WOMEN', 'Black,Ivory,Rust', 'XS,S,M,L,XL', 'jeans'),
('Libas Embroidered Straight Kurta Set', 'Straight kurta with thread embroidery, set with matching bottoms.', 74.99, 18, 'WOMEN', 'Pink,Emerald', 'S,M,L,XL,XXL', 'dress'),
('Global Desi Floral Maxi Dress', 'Floor-length maxi dress in a bright floral print with a tie waist.', 59.99, 22, 'WOMEN', 'Turquoise,Magenta', 'XS,S,M,L,XL', 'dress'),
('Aurelia Printed A-Line Skirt', 'Printed A-line skirt in a light cotton blend, ideal with a kurti.', 26.99, 34, 'WOMEN', 'Mustard,Navy', 'XS,S,M,L,XL', 'skirt'),
('Biba Banarasi Silk Lehenga Set', 'Festive lehenga set with a Banarasi weave border and dupatta.', 129.99, 8, 'WOMEN', 'Red,Magenta,Gold', 'S,M,L,XL', 'dress'),
('Fabindia Handloom Cotton Saree', 'Handloom cotton saree with a woven border, drapes lightly.', 84.99, 12, 'WOMEN', 'Ivory,Maroon', 'Free Size', 'dress'),
-- MEN
('Manyavar Silk Blend Sherwani', 'Knee-length silk blend sherwani for weddings and festive occasions.', 149.99, 9, 'MEN', 'Ivory,Maroon,Gold', 'S,M,L,XL,XXL', 'jacket'),
('Fabindia Cotton Kurta', 'Classic straight-fit cotton kurta with a mandarin collar.', 34.99, 50, 'MEN', 'White,Cream,Blue', 'S,M,L,XL,XXL', 'shirt'),
('Raymond Nehru Jacket', 'Tailored Nehru jacket in a textured blend, worn over a kurta.', 79.99, 20, 'MEN', 'Navy,Black,Maroon', 'S,M,L,XL,XXL', 'jacket'),
('Manyavar Kurta Pyjama Set', 'Festive kurta pyjama set in a soft woven fabric.', 69.99, 24, 'MEN', 'Ivory,Mustard', 'S,M,L,XL,XXL', 'shirt'),
('Allen Solly Formal Shirt', 'Regular fit formal shirt in easy-iron cotton.', 32.99, 55, 'MEN', 'White,Blue', 'S,M,L,XL,XXL', 'shirt'),
('Peter England Slim Fit Trousers', 'Slim fit formal trousers with a flat front.', 36.99, 42, 'MEN', 'Black,Grey,Navy', 'S,M,L,XL', 'jeans'),
('Fabindia Cotton Dhoti Pants', 'Relaxed dhoti-style pants in soft handwoven cotton.', 31.99, 30, 'MEN', 'Cream,Rust', 'S,M,L,XL', 'jeans'),
-- KIDS
('Biba Girls Lehenga Choli', 'Girls lehenga choli with a flared skirt and gota detailing.', 49.99, 20, 'KIDS', 'Pink,Yellow,Red', '4Y,6Y,8Y,10Y', 'dress'),
('Manyavar Boys Kurta Pyjama', 'Boys kurta pyjama set in a soft, comfortable fabric.', 34.99, 28, 'KIDS', 'Cream,Blue', '4Y,6Y,8Y,10Y', 'shirt'),
('Fabindia Kids Nehru Jacket', 'Kids Nehru jacket with a button front, pairs with a kurta.', 27.99, 24, 'KIDS', 'Navy,Maroon', '4Y,6Y,8Y,10Y', 'jacket'),
('Global Desi Girls Anarkali Dress', 'Twirly girls Anarkali dress in a light printed fabric.', 38.99, 26, 'KIDS', 'Teal,Magenta', '4Y,6Y,8Y,10Y', 'dress');
