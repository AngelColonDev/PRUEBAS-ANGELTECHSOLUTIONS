-- ============================================================
--  Confirmar Row Level Security en TODAS las tablas
-- ============================================================
--
-- Este script es seguro de correr las veces que quieras: solo
-- confirma/reactiva RLS, no borra ni cambia datos.
--
-- CÓMO USARLO:
--   1. Supabase -> SQL Editor -> New query
--   2. Pega este archivo completo -> Run
-- ============================================================

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

-- ============================================================
-- Verifica el resultado: "rowsecurity" debe decir "true" en
-- TODAS las filas de esta lista
-- ============================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
