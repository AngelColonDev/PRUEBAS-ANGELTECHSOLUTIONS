-- ============================================================
--  Agregar Municipio, Servicio recibido y Autorización de
--  publicación a las reseñas/testimonios
-- ============================================================
--
-- CÓMO USARLO:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" -> "New query"
--   3. Pega este archivo COMPLETO
--   4. Presiona "Run"
--
-- Es seguro correr este script las veces que quieras.
-- ============================================================


-- 1) Agrega las columnas nuevas a la tabla reviews (si no existen)
-- ------------------------------------------------------------
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS municipio          text NOT NULL DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS servicio           text NOT NULL DEFAULT '';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS autoriza_publicar  boolean NOT NULL DEFAULT true;


-- 2) Reemplaza la función submit_review para que acepte y guarde
--    los campos nuevos (se elimina la versión anterior sin
--    importar cuántos parámetros tenía, para evitar conflictos)
-- ------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'submit_review' AND n.nspname = 'public'
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION submit_review(
  p_name        text,
  p_role        text DEFAULT '',
  p_text        text DEFAULT '',
  p_rating      integer DEFAULT 5,
  p_photo       text DEFAULT '',
  p_years       integer DEFAULT 0,
  p_website     text DEFAULT '',
  p_instagram   text DEFAULT '',
  p_linkedin    text DEFAULT '',
  p_municipio   text DEFAULT '',
  p_servicio    text DEFAULT '',
  p_autoriza    boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id bigint;
BEGIN
  v_id := (extract(epoch FROM clock_timestamp()) * 1000)::bigint + floor(random() * 1000)::int;

  INSERT INTO reviews (
    id, name, role, text, rating, status, photo, years,
    website, instagram, linkedin, municipio, servicio, autoriza_publicar
  ) VALUES (
    v_id, p_name, p_role, p_text, p_rating, 'pendiente', p_photo, p_years,
    p_website, p_instagram, p_linkedin, p_municipio, p_servicio, p_autoriza
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_review(
  text, text, text, integer, text, integer, text, text, text, text, text, boolean
) TO anon;
