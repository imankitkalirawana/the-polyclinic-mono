-- Fix null name values in users table
-- Run this SQL script in your database to fix existing null values
-- before enabling TypeORM synchronize

UPDATE users 
SET name = COALESCE(email, 'User ' || id::text)
WHERE name IS NULL;

-- Verify no null values remain
SELECT COUNT(*) as null_names_count 
FROM users 
WHERE name IS NULL;

