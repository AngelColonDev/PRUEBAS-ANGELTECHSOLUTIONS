-- =============================================================
-- AngelTech Solutions — Script completo para Supabase SQL Editor
-- Ejecuta TODO esto en: Supabase → SQL Editor → New query
-- =============================================================

-- 1. EXTENSIONES
-- =============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- 2. TABLAS EXISTENTES (crear si no existen)
-- =============================================================

CREATE TABLE IF NOT EXISTS products (
  id            bigint        PRIMARY KEY,
  name          text          NOT NULL DEFAULT '',
  price_text    text          NOT NULL DEFAULT '—',
  numeric_price numeric(10,2),
  condition     text          NOT NULL DEFAULT 'Nuevo',
  category      text          NOT NULL DEFAULT '',
  icon          text          NOT NULL DEFAULT 'lucide:smartphone',
  color         text          NOT NULL DEFAULT 'text-slate-300',
  description   text          NOT NULL DEFAULT '',
  sort_order    int           NOT NULL DEFAULT 0,
  is_active     boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id          bigint        PRIMARY KEY,
  name        text          NOT NULL DEFAULT '',
  role        text          NOT NULL DEFAULT '',
  icon        text          NOT NULL DEFAULT 'lucide:globe',
  color       text          NOT NULL DEFAULT 'text-slate-300',
  description text          NOT NULL DEFAULT '',
  url         text          NOT NULL DEFAULT '',
  sort_order  int           NOT NULL DEFAULT 0,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id            bigint        PRIMARY KEY,
  name          text          NOT NULL DEFAULT '',
  email         text          NOT NULL DEFAULT '',
  phone         text          NOT NULL DEFAULT '',
  service       text          NOT NULL DEFAULT 'otro',
  other_service text          NOT NULL DEFAULT '',
  device_type   text          NOT NULL DEFAULT '',
  device_model  text          NOT NULL DEFAULT '',
  message       text          NOT NULL DEFAULT '',
  status        text          NOT NULL DEFAULT 'pendiente',
  source_page   text          NOT NULL DEFAULT 'index',
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id                 bigint        PRIMARY KEY,
  name               text          NOT NULL DEFAULT '',
  role               text          NOT NULL DEFAULT '',
  text               text          NOT NULL DEFAULT '',
  rating             smallint      NOT NULL DEFAULT 5,
  status             text          NOT NULL DEFAULT 'pendiente',
  photo              text          NOT NULL DEFAULT '',
  years              smallint      NOT NULL DEFAULT 0,
  website            text          NOT NULL DEFAULT '',
  instagram          text          NOT NULL DEFAULT '',
  linkedin           text          NOT NULL DEFAULT '',
  municipio          text          NOT NULL DEFAULT '',
  servicio           text          NOT NULL DEFAULT '',
  autoriza_publicar  boolean       NOT NULL DEFAULT true,
  created_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          bigint        PRIMARY KEY,
  description text          NOT NULL DEFAULT '',
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  category    text          NOT NULL DEFAULT 'Otros',
  spent_on    date          NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id          bigint        PRIMARY KEY,
  question    text          NOT NULL DEFAULT '',
  answer      text          NOT NULL DEFAULT '',
  sort_order  int           NOT NULL DEFAULT 0,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id            bigserial     PRIMARY KEY,
  setting_key   text          NOT NULL UNIQUE,
  setting_value jsonb         NOT NULL DEFAULT '{}',
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_metrics (
  id            bigserial     PRIMARY KEY,
  metric_key    text          NOT NULL UNIQUE,
  metric_value  bigint        NOT NULL DEFAULT 0,
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_hours (
  id          bigint        PRIMARY KEY DEFAULT 1,
  days_text   text          NOT NULL DEFAULT '',
  start_time  time,
  end_time    time,
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_config (
  id              bigint        PRIMARY KEY DEFAULT 1,
  business_info   text          NOT NULL DEFAULT '',
  topics          text          NOT NULL DEFAULT '',
  gemini_api_key  text,
  use_google_search boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz   NOT NULL DEFAULT now()
);


-- 3. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- (Agregar solo las que no existan — seguro de re-ejecutar)
-- =============================================================

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS device_type  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS device_model text NOT NULL DEFAULT '';

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photo     text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS years     smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website   text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin  text     NOT NULL DEFAULT '';


-- 4. NUEVAS TABLAS
-- =============================================================

-- Imágenes de productos (una por fila, referencia a products.id)
CREATE TABLE IF NOT EXISTS product_images (
  id          bigserial     PRIMARY KEY,
  product_id  bigint        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text          NOT NULL,
  sort_order  int           NOT NULL DEFAULT 1,
  created_at  timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Visitas diarias al sitio
CREATE TABLE IF NOT EXISTS page_views_daily (
  id          bigserial   PRIMARY KEY,
  view_date   date        NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  view_count  bigint      NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Usuarios del panel de administración
CREATE TABLE IF NOT EXISTS admin_users (
  id              bigserial     PRIMARY KEY,
  username        text          NOT NULL UNIQUE,
  password_hash   text          NOT NULL,
  full_name       text          NOT NULL DEFAULT '',
  role            text          NOT NULL DEFAULT 'editor',
  permissions     text[]        NOT NULL DEFAULT '{}',
  is_active       boolean       NOT NULL DEFAULT true,
  last_login      timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);


-- 5. FUNCIONES RPC
-- =============================================================

-- Incrementa el contador de visitas para la fecha de hoy
CREATE OR REPLACE FUNCTION increment_daily_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO page_views_daily (view_date, view_count, updated_at)
  VALUES (CURRENT_DATE, 1, now())
  ON CONFLICT (view_date)
  DO UPDATE SET
    view_count = page_views_daily.view_count + 1,
    updated_at = now();
END;
$$;

-- Login del panel de administración
-- Devuelve JSON con { success, user: { id, username, name, role, perms } }
CREATE OR REPLACE FUNCTION admin_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user admin_users%ROWTYPE;
  v_username text;
  v_password text;
BEGIN
  -- Validación y limpieza de los datos en el servidor:
  -- nunca se confía en lo que llegue del navegador.
  v_username := trim(both from coalesce(p_username, ''));
  v_password := coalesce(p_password, '');

  IF v_username = '' OR v_password = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario o contraseña incorrectos');
  END IF;

  IF length(v_username) > 100 OR length(v_password) > 200 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario o contraseña incorrectos');
  END IF;

  SELECT * INTO v_user
  FROM admin_users
  WHERE username = v_username
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario o contraseña incorrectos');
  END IF;

  IF v_user.password_hash <> crypt(v_password, v_user.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario o contraseña incorrectos');
  END IF;

  UPDATE admin_users SET last_login = now() WHERE id = v_user.id;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id',       v_user.id,
      'username', v_user.username,
      'name',     v_user.full_name,
      'role',     v_user.role,
      'perms',    to_jsonb(v_user.permissions)
    )
  );
END;
$$;

-- Crear o actualizar usuario admin (usado desde el panel)
CREATE OR REPLACE FUNCTION upsert_admin_user(
  p_username       text,
  p_plain_password text,
  p_full_name      text DEFAULT '',
  p_role           text DEFAULT 'editor',
  p_permissions    text[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_users (username, password_hash, full_name, role, permissions)
  VALUES (
    p_username,
    crypt(p_plain_password, gen_salt('bf')),
    p_full_name,
    p_role,
    p_permissions
  )
  ON CONFLICT (username)
  DO UPDATE SET
    password_hash = crypt(p_plain_password, gen_salt('bf')),
    full_name     = EXCLUDED.full_name,
    role          = EXCLUDED.role,
    permissions   = EXCLUDED.permissions,
    is_active     = true;
END;
$$;


-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_metrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;

-- ---- products ----
DROP POLICY IF EXISTS "products_anon_read"   ON products;
DROP POLICY IF EXISTS "products_anon_write"  ON products;
CREATE POLICY "products_anon_read"  ON products FOR SELECT USING (true);
CREATE POLICY "products_anon_write" ON products FOR ALL    USING (true) WITH CHECK (true);

-- ---- partners ----
DROP POLICY IF EXISTS "partners_anon_read"   ON partners;
DROP POLICY IF EXISTS "partners_anon_write"  ON partners;
CREATE POLICY "partners_anon_read"  ON partners FOR SELECT USING (true);
CREATE POLICY "partners_anon_write" ON partners FOR ALL    USING (true) WITH CHECK (true);

-- ---- contact_requests ----
DROP POLICY IF EXISTS "cr_anon_insert"  ON contact_requests;
DROP POLICY IF EXISTS "cr_anon_read"    ON contact_requests;
DROP POLICY IF EXISTS "cr_anon_write"   ON contact_requests;
CREATE POLICY "cr_anon_insert" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "cr_anon_read"   ON contact_requests FOR SELECT USING (true);
CREATE POLICY "cr_anon_write"  ON contact_requests FOR ALL    USING (true) WITH CHECK (true);

-- ---- reviews ----
DROP POLICY IF EXISTS "reviews_anon_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_anon_read"   ON reviews;
DROP POLICY IF EXISTS "reviews_anon_write"  ON reviews;
CREATE POLICY "reviews_anon_insert" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_anon_read"   ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_anon_write"  ON reviews FOR ALL    USING (true) WITH CHECK (true);

-- ---- expenses ----
DROP POLICY IF EXISTS "expenses_anon_read"  ON expenses;
DROP POLICY IF EXISTS "expenses_anon_write" ON expenses;
CREATE POLICY "expenses_anon_read"  ON expenses FOR SELECT USING (true);
CREATE POLICY "expenses_anon_write" ON expenses FOR ALL    USING (true) WITH CHECK (true);

-- ---- chatbot_faqs ----
DROP POLICY IF EXISTS "faqs_anon_read"  ON chatbot_faqs;
DROP POLICY IF EXISTS "faqs_anon_write" ON chatbot_faqs;
CREATE POLICY "faqs_anon_read"  ON chatbot_faqs FOR SELECT USING (true);
CREATE POLICY "faqs_anon_write" ON chatbot_faqs FOR ALL    USING (true) WITH CHECK (true);

-- ---- site_settings ----
DROP POLICY IF EXISTS "settings_anon_read"  ON site_settings;
DROP POLICY IF EXISTS "settings_anon_write" ON site_settings;
CREATE POLICY "settings_anon_read"  ON site_settings FOR SELECT USING (true);
CREATE POLICY "settings_anon_write" ON site_settings FOR ALL    USING (true) WITH CHECK (true);

-- ---- site_metrics ----
DROP POLICY IF EXISTS "metrics_anon_read"  ON site_metrics;
DROP POLICY IF EXISTS "metrics_anon_write" ON site_metrics;
CREATE POLICY "metrics_anon_read"  ON site_metrics FOR SELECT USING (true);
CREATE POLICY "metrics_anon_write" ON site_metrics FOR ALL    USING (true) WITH CHECK (true);

-- ---- business_hours ----
DROP POLICY IF EXISTS "bh_anon_read"  ON business_hours;
DROP POLICY IF EXISTS "bh_anon_write" ON business_hours;
CREATE POLICY "bh_anon_read"  ON business_hours FOR SELECT USING (true);
CREATE POLICY "bh_anon_write" ON business_hours FOR ALL    USING (true) WITH CHECK (true);

-- ---- chatbot_config ----
DROP POLICY IF EXISTS "chatbot_anon_read"  ON chatbot_config;
DROP POLICY IF EXISTS "chatbot_anon_write" ON chatbot_config;
CREATE POLICY "chatbot_anon_read"  ON chatbot_config FOR SELECT USING (true);
CREATE POLICY "chatbot_anon_write" ON chatbot_config FOR ALL    USING (true) WITH CHECK (true);

-- ---- product_images ----
DROP POLICY IF EXISTS "pimg_anon_read"  ON product_images;
DROP POLICY IF EXISTS "pimg_anon_write" ON product_images;
CREATE POLICY "pimg_anon_read"  ON product_images FOR SELECT USING (true);
CREATE POLICY "pimg_anon_write" ON product_images FOR ALL    USING (true) WITH CHECK (true);

-- ---- page_views_daily ----
DROP POLICY IF EXISTS "pvd_anon_read"  ON page_views_daily;
DROP POLICY IF EXISTS "pvd_anon_write" ON page_views_daily;
CREATE POLICY "pvd_anon_read"  ON page_views_daily FOR SELECT USING (true);
CREATE POLICY "pvd_anon_write" ON page_views_daily FOR ALL    USING (true) WITH CHECK (true);

-- ---- admin_users (solo el RPC puede leer/escribir — anon NO puede) ----
DROP POLICY IF EXISTS "au_no_direct_access" ON admin_users;
CREATE POLICY "au_no_direct_access" ON admin_users USING (false);


-- Recibe una reseña/testimonio enviado por un usuario (queda "pendiente"
-- hasta que el admin la apruebe desde el panel)
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


-- 7. PERMISOS DE LAS FUNCIONES RPC (acceso anon)
-- =============================================================
GRANT EXECUTE ON FUNCTION increment_daily_views()  TO anon;
GRANT EXECUTE ON FUNCTION admin_login(text, text)  TO anon;
GRANT EXECUTE ON FUNCTION upsert_admin_user(text, text, text, text, text[]) TO anon;
GRANT EXECUTE ON FUNCTION submit_review(
  text, text, text, integer, text, integer, text, text, text, text, text, boolean
) TO anon;


-- 8. USUARIO ADMIN INICIAL
-- =============================================================
-- Cambia 'admin123' por la contraseña que quieras usar
-- Este INSERT es seguro de re-ejecutar (ON CONFLICT lo ignora)
INSERT INTO admin_users (username, password_hash, full_name, role, permissions, is_active)
VALUES (
  'angeltech',
  crypt('admin123', gen_salt('bf')),
  'Angel Colón',
  'superadmin',
  ARRAY['solicitudes','resenas','productos','colaboradores','gastos','chatbot','configuracion','usuarios'],
  true
)
ON CONFLICT (username) DO NOTHING;

