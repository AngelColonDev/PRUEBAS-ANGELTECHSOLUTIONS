-- ============================================================
--  Sincronizar con Supabase todo lo que faltaba por guardar:
--  1) "Vender mi dispositivo" (antes solo se guardaba en el
--     navegador del cliente, nunca llegaba a la base de datos)
--  2) Horario de atención: faltaban los minutos de aviso antes
--     de cerrar y los días de la semana seleccionados
--
-- CÓMO USARLO:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" -> "New query"
--   3. Pega este archivo COMPLETO
--   4. Presiona "Run"
--
-- Es seguro correr este script las veces que quieras: usa
-- IF NOT EXISTS / OR REPLACE en todo, así que nunca borra datos
-- ni duplica columnas.
-- ============================================================


-- 1) TABLA NUEVA: device_listings ("Vender mi dispositivo")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_listings (
  id              bigint        PRIMARY KEY,
  name            text          NOT NULL DEFAULT '',
  phone           text          NOT NULL DEFAULT '',
  contact_method  text          NOT NULL DEFAULT 'whatsapp',
  device_type     text          NOT NULL DEFAULT '',
  device_model    text          NOT NULL DEFAULT '',
  message         text          NOT NULL DEFAULT '',
  photos          jsonb         NOT NULL DEFAULT '[]',
  status          text          NOT NULL DEFAULT 'pending',
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- Por si la tabla ya existía con menos columnas de una prueba anterior
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS name           text        NOT NULL DEFAULT '';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS phone          text        NOT NULL DEFAULT '';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS contact_method text        NOT NULL DEFAULT 'whatsapp';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS device_type    text        NOT NULL DEFAULT '';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS device_model   text        NOT NULL DEFAULT '';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS message        text        NOT NULL DEFAULT '';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS photos         jsonb       NOT NULL DEFAULT '[]';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS status         text        NOT NULL DEFAULT 'pending';
ALTER TABLE device_listings ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now();

ALTER TABLE device_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dl_anon_insert" ON device_listings;
DROP POLICY IF EXISTS "dl_anon_read"   ON device_listings;
DROP POLICY IF EXISTS "dl_anon_write"  ON device_listings;
CREATE POLICY "dl_anon_insert" ON device_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "dl_anon_read"   ON device_listings FOR SELECT USING (true);
CREATE POLICY "dl_anon_write"  ON device_listings FOR ALL    USING (true) WITH CHECK (true);


-- 2) HORARIO DE ATENCIÓN: agregar columnas que faltaban
--    (minutos de aviso antes de cerrar y días de la semana)
-- ------------------------------------------------------------
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS warn_minutes int   NOT NULL DEFAULT 30;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS days_of_week int[] NOT NULL DEFAULT '{}';


-- 3) Confirmar que todo tenga RLS activo (no borra ni cambia datos)
-- ------------------------------------------------------------
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_metrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_listings   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Verificación rápida: deben aparecer todas con rowsecurity=true
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
