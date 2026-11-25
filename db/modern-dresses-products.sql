-- Modern fashion dresses (sample data). ADDS to the catalog; nothing is deleted.
--   mysql -u root -p product_db < db/modern-dresses-products.sql

INSERT INTO product (name, description, price, quantity, category, colors, sizes, image_key) VALUES
-- WOMEN
('Satin Slip Midi Dress', 'Bias-cut satin slip dress with thin straps and a soft cowl neckline.', 69.99, 24, 'WOMEN', 'Black,Emerald,Beige', 'XS,S,M,L,XL', 'dress'),
('Wrap Midi Dress', 'Flowing wrap dress with a tie waist and flutter sleeves.', 59.99, 30, 'WOMEN', 'Red,Navy,Pink', 'XS,S,M,L,XL', 'dress'),
('Bodycon Ribbed Dress', 'Stretch ribbed knit dress that hugs the body, knee length.', 44.99, 36, 'WOMEN', 'Black,Grey,Maroon', 'XS,S,M,L', 'dress'),
('Blazer Dress', 'Double-breasted tailored blazer dress with a belted waist.', 89.99, 14, 'WOMEN', 'Black,Cream,Olive', 'XS,S,M,L,XL', 'dress'),
('Linen Shirt Dress', 'Relaxed button-down shirt dress in breathable linen, with a belt.', 64.99, 26, 'WOMEN', 'White,Beige,Blue', 'XS,S,M,L,XL', 'dress'),
('Puff Sleeve Mini Dress', 'Playful mini dress with puff sleeves and a square neckline.', 49.99, 32, 'WOMEN', 'Yellow,Pink,White', 'XS,S,M,L', 'dress'),
('Tiered Maxi Dress', 'Boho tiered maxi dress with a smocked bodice, floor length.', 74.99, 20, 'WOMEN', 'Teal,Mustard,Cream', 'XS,S,M,L,XL', 'dress'),
('Pleated Satin Skirt', 'Metallic-sheen pleated midi skirt with an elastic waist.', 39.99, 28, 'WOMEN', 'Gold,Black,Emerald', 'XS,S,M,L,XL', 'skirt'),
('Evening Gown', 'Floor-length evening gown with a fitted bodice and a side slit.', 149.99, 8, 'WOMEN', 'Black,Red,Navy', 'XS,S,M,L', 'dress'),
-- KIDS
('Girls Tulle Party Dress', 'Twirly tulle party dress with a sparkly bodice.', 36.99, 22, 'KIDS', 'Pink,Yellow,Teal', '4Y,6Y,8Y,10Y', 'dress'),
('Girls Denim Pinafore Dress', 'Everyday denim pinafore dress with front pockets.', 28.99, 26, 'KIDS', 'Denim,Navy', '4Y,6Y,8Y,10Y', 'dress');
