-- Migration 011: Fix name capitalization and standardize locations

-- 1. Fix name capitalization (Title Case)
-- Capitalize first letter of each word, lowercase the rest
UPDATE alumni_v2.users
SET first_name = INITCAP(LOWER(first_name))
WHERE first_name != INITCAP(LOWER(first_name));

UPDATE alumni_v2.users
SET last_name = INITCAP(LOWER(last_name))
WHERE last_name != INITCAP(LOWER(last_name));

-- 2. Standardize common location variations
UPDATE alumni_v2.users SET location = 'San Pedro, Laguna' WHERE LOWER(location) IN ('san pedro laguna', 'spl', 'san pedro', 'san pedro, laguna');
UPDATE alumni_v2.users SET location = 'Biñan, Laguna' WHERE LOWER(location) IN ('binan laguna', 'binan', 'biñan', 'biñan laguna', 'biñan, laguna');
UPDATE alumni_v2.users SET location = 'Santa Rosa, Laguna' WHERE LOWER(location) IN ('sta rosa laguna', 'sta rosa', 'sta. rosa', 'sta. rosa laguna', 'sta. rosa, laguna', 'santa rosa', 'santa rosa laguna');
UPDATE alumni_v2.users SET location = 'Cabuyao, Laguna' WHERE LOWER(location) IN ('cabuyao', 'cabuyao laguna', 'cabuyao, laguna');
UPDATE alumni_v2.users SET location = 'Calamba, Laguna' WHERE LOWER(location) IN ('calamba', 'calamba laguna', 'calamba, laguna');
UPDATE alumni_v2.users SET location = 'Los Baños, Laguna' WHERE LOWER(location) IN ('los banos', 'los baños', 'los banos laguna', 'los baños laguna');
UPDATE alumni_v2.users SET location = 'NCR - Muntinlupa' WHERE LOWER(location) IN ('muntinlupa', 'muntinlupa city', 'mntinlupa', 'muntinlupa, ncr');
UPDATE alumni_v2.users SET location = 'NCR - Manila' WHERE LOWER(location) IN ('manila', 'manila, ncr', 'ncr manila');
UPDATE alumni_v2.users SET location = 'NCR - Makati' WHERE LOWER(location) IN ('makati', 'makati city', 'makati, ncr', 'ncr makati');
UPDATE alumni_v2.users SET location = 'NCR - Pasig' WHERE LOWER(location) IN ('pasig', 'pasig city', 'pasig, ncr', 'ncr pasig');
UPDATE alumni_v2.users SET location = 'NCR - Taguig' WHERE LOWER(location) IN ('taguig', 'taguig city', 'taguig, ncr', 'ncr taguig', 'bgc', 'bonifacio global city');
UPDATE alumni_v2.users SET location = 'NCR - Quezon City' WHERE LOWER(location) IN ('quezon city', 'qc', 'quezon city, ncr');
UPDATE alumni_v2.users SET location = 'NCR - Parañaque' WHERE LOWER(location) IN ('paranaque', 'paranaque city', 'paranaque, ncr');
UPDATE alumni_v2.users SET location = 'NCR - Las Piñas' WHERE LOWER(location) IN ('las pinas', 'las piñas', 'las pinas city', 'las piñas city');
UPDATE alumni_v2.users SET location = 'NCR - Caloocan' WHERE LOWER(location) IN ('caloocan', 'caloocan city');
UPDATE alumni_v2.users SET location = 'NCR - Pasay' WHERE LOWER(location) IN ('pasay', 'pasay city');
UPDATE alumni_v2.users SET location = 'NCR - San Juan' WHERE LOWER(location) IN ('san juan', 'san juan city');
UPDATE alumni_v2.users SET location = 'NCR - Mandaluyong' WHERE LOWER(location) IN ('mandaluyong', 'mandaluyong city');
UPDATE alumni_v2.users SET location = 'NCR - Marikina' WHERE LOWER(location) IN ('marikina', 'marikina city');
UPDATE alumni_v2.users SET location = 'NCR - Malabon' WHERE LOWER(location) IN ('malabon', 'malabon city');
UPDATE alumni_v2.users SET location = 'NCR - Navotas' WHERE LOWER(location) IN ('navotas', 'navotas city');
UPDATE alumni_v2.users SET location = 'NCR - Valenzuela' WHERE LOWER(location) IN ('valenzuela', 'valenzuela city');
UPDATE alumni_v2.users SET location = 'Cavite' WHERE LOWER(location) IN ('cavite', 'cavite city');
UPDATE alumni_v2.users SET location = 'Batangas City' WHERE LOWER(location) IN ('batangas', 'batangas city');
UPDATE alumni_v2.users SET location = 'Pampanga' WHERE LOWER(location) IN ('pampanga', 'pampanga, philippines');
UPDATE alumni_v2.users SET location = 'Bulacan' WHERE LOWER(location) IN ('bulacan', 'bulacan, philippines');
UPDATE alumni_v2.users SET location = 'NCR' WHERE LOWER(location) IN ('ncr', 'national capital region', 'metro manila', 'metro-manila');
