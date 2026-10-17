-- Wedding invitations now start at ₹999 (Essential ₹999–₹2,499). Only an Essential row still holding the old seeded
-- ₹1,999 is changed, so a price that was edited in Studio → Packages is never overwritten.
UPDATE "wedding_packages" SET "price_min" = 999 WHERE "key" = 'ESSENTIAL' AND "price_min" = 1999;
