-- Enable pg_trgm extension for trigram similarity search
-- This must be created before other objects in fresh database setups
CREATE EXTENSION IF NOT EXISTS pg_trgm;
