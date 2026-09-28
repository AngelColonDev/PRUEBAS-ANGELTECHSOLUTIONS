-- ============================================================
--  Crear el usuario y la contraseña del panel admin
--  Versión robusta: no depende de que supabase_setup.sql se haya
--  corrido antes, ni de en qué schema haya quedado instalado
--  pgcrypto (causa más común de que este tipo de script falle
--  con un error como "function crypt(text, text) does not exist").
-- ============================================================
--
-- CÓMO USARLO:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" (menú izquierdo) -> "New query"
--   3. Pega este archivo COMPLETO, de arriba a abajo
--   4. Presiona "Run" (o Ctrl+Enter / Cmd+Enter)
--   5. Entra a admin-login.html con:
--        Usuario:     ATechSolutions
--        Contraseña:  Angel9292
--
-- Es seguro correr este script las veces que quieras: no borra
-- nada, solo asegura que exista lo necesario y crea (o actualiza)
-- ese usuario con esa contraseña.
-- ============================================================


-- 1) Asegura la extensión de encriptación y corrige el "search_path"
--    para que crypt()/gen_salt() se encuentren sin importar en qué
--    schema los haya instalado Supabase (public o extensions).
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_schema text;
BEGIN
  SELECT n.nspname INTO v_schema
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'crypt'
  LIMIT 1;

  IF v_schema IS NOT NULL THEN
    EXECUTE format('SET search_path = public, %I', v_schema);
  END IF;
END $$;


-- 2) Asegura que exista la tabla de usuarios del panel
--    (y le agrega cualquier columna que le pudiera faltar si la
--    tabla ya existía de antes con una versión distinta)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id              bigserial     PRIMARY KEY,
  username        text          NOT NULL,
  password_hash   text          NOT NULL DEFAULT '',
  full_name       text          NOT NULL DEFAULT '',
  role            text          NOT NULL DEFAULT 'editor',
  permissions     text[]        NOT NULL DEFAULT '{}',
  is_active       boolean       NOT NULL DEFAULT true,
  last_login      timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name     text NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role          text NOT NULL DEFAULT 'editor';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS permissions   text[] NOT NULL DEFAULT '{}';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login    timestamptz;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_at    timestamptz NOT NULL DEFAULT now();

-- Asegura que "username" tenga restricción UNIQUE (la necesita
-- upsert_admin_user más abajo). Si ya existe, no hace nada.
DO $$
BEGIN
  BEGIN
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_username_key UNIQUE (username);
  EXCEPTION WHEN duplicate_object OR duplicate_table THEN
    NULL;
  END;
END $$;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "au_no_direct_access" ON admin_users;
CREATE POLICY "au_no_direct_access" ON admin_users USING (false);


-- 3) Asegura las funciones que usa el panel para iniciar sesión
--    y para crear/actualizar administradores
-- ------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION admin_login(text, text)  TO anon;
GRANT EXECUTE ON FUNCTION upsert_admin_user(text, text, text, text, text[]) TO anon;


-- ============================================================
-- 4) Crea (o actualiza) el usuario administrador
-- ============================================================
SELECT upsert_admin_user(
  'ATechSolutions',       -- usuario para entrar al panel
  'Angel9292',            -- contraseña
  'Angel Colón',          -- nombre completo (solo se muestra en el panel)
  'superadmin',           -- rol: 'superadmin' = acceso a todo
  ARRAY[
    'solicitudes',
    'resenas',
    'productos',
    'colaboradores',
    'gastos',
    'chatbot',
    'configuracion',
    'usuarios'
  ]
);


-- ============================================================
-- 5) Verifica que quedó creado y activo
--    (no muestra la contraseña, solo confirma los datos)
-- ============================================================
SELECT username, full_name, role, permissions, is_active, created_at, last_login
FROM admin_users
WHERE username = 'ATechSolutions';


-- ============================================================
-- OPCIONAL: desactivar un usuario sin borrarlo
-- ============================================================
-- UPDATE admin_users SET is_active = false WHERE username = 'usuario_a_desactivar';
