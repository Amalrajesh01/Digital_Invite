-- One language per invitation: the studio no longer offers a second ("local") language, so the setting is cleared.
-- Nothing is deleted: the second-language text stays inside each invitation's document, unused, and can be restored by setting this column again.
UPDATE "weddings" SET "secondary_locale" = NULL WHERE "secondary_locale" IS NOT NULL;
