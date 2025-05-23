-- Add plinko setting to settings table
INSERT INTO settings (id, key, value)
VALUES (gen_random_uuid(), 'plinko', 'off'); 