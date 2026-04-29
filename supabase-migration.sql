-- MIGRACIÓN: Actualizar schema de Supabase sin perder datos
-- Ejecuta esto en el SQL Editor de Supabase

-- =====================================================
-- 1. TABLA PRODUCTS
-- =====================================================

-- Agregar columnas nuevas si no existen
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS grupo TEXT,
  ADD COLUMN IF NOT EXISTS subclasificacion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '';

-- Migrar datos: copiar categoria → grupo
UPDATE products SET grupo = categoria WHERE grupo IS NULL OR grupo = '';

-- Eliminar columnas viejas si existen
ALTER TABLE products
  DROP COLUMN IF EXISTS categoria,
  DROP COLUMN IF EXISTS dimensiones,
  DROP COLUMN IF EXISTS precio,
  DROP COLUMN IF EXISTS unidad;

-- Asegurar que grupo no sea nulo
ALTER TABLE products ALTER COLUMN grupo SET NOT NULL;

-- =====================================================
-- 2. TABLA QUOTE_ITEMS
-- =====================================================

-- Agregar columnas nuevas si no existen
ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS grupo TEXT,
  ADD COLUMN IF NOT EXISTS subclasificacion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '';

-- Migrar datos: copiar categoria → grupo
UPDATE quote_items SET grupo = categoria WHERE grupo IS NULL OR grupo = '';

-- Eliminar columna subtotal primero (depende de precio)
ALTER TABLE quote_items DROP COLUMN IF EXISTS subtotal;

-- Eliminar columnas viejas si existen
ALTER TABLE quote_items
  DROP COLUMN IF EXISTS categoria,
  DROP COLUMN IF EXISTS dimensiones,
  DROP COLUMN IF EXISTS precio;

-- Asegurar que grupo no sea nulo
ALTER TABLE quote_items ALTER COLUMN grupo SET NOT NULL;

-- =====================================================
-- 3. TABLA QUOTES (eliminar columna total)
-- =====================================================
ALTER TABLE quotes DROP COLUMN IF EXISTS total;

-- =====================================================
-- 4. POLÍTICAS: eliminar y recrear
-- =====================================================
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "quotes_public_insert" ON quotes;
DROP POLICY IF EXISTS "quotes_public_read" ON quotes;
DROP POLICY IF EXISTS "quote_items_public_insert" ON quote_items;
DROP POLICY IF EXISTS "quote_items_public_read" ON quote_items;
DROP POLICY IF EXISTS "quotes_public_update" ON quotes;
DROP POLICY IF EXISTS "quotes_public_delete" ON quotes;
DROP POLICY IF EXISTS "products_public_insert" ON products;
DROP POLICY IF EXISTS "products_public_update" ON products;
DROP POLICY IF EXISTS "products_public_delete" ON products;
DROP POLICY IF EXISTS "company_public_read" ON company_settings;
DROP POLICY IF EXISTS "company_public_insert" ON company_settings;
DROP POLICY IF EXISTS "company_public_update" ON company_settings;

CREATE POLICY "products_public_read" ON products FOR SELECT USING (TRUE);
CREATE POLICY "quotes_public_insert" ON quotes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "quotes_public_read" ON quotes FOR SELECT USING (TRUE);
CREATE POLICY "quote_items_public_insert" ON quote_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "quote_items_public_read" ON quote_items FOR SELECT USING (TRUE);
CREATE POLICY "quotes_public_update" ON quotes FOR UPDATE USING (TRUE);
CREATE POLICY "quotes_public_delete" ON quotes FOR DELETE USING (TRUE);
CREATE POLICY "products_public_insert" ON products FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "products_public_update" ON products FOR UPDATE USING (TRUE);
CREATE POLICY "products_public_delete" ON products FOR DELETE USING (TRUE);
CREATE POLICY "company_public_read" ON company_settings FOR SELECT USING (TRUE);
CREATE POLICY "company_public_insert" ON company_settings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "company_public_update" ON company_settings FOR UPDATE USING (TRUE);

-- =====================================================
-- 5. (OPCIONAL) Cargar catálogo nuevo a Supabase
-- Descomenta las siguientes líneas si quieres reemplazar
-- todos los productos existentes con los del archivo nuevo
-- =====================================================
-- TRUNCATE TABLE products;
-- INSERT INTO products (codigo, descripcion, grupo, subclasificacion, color, stock)
-- SELECT codigo, descripcion, grupo, subclasificacion, color, stock
-- FROM (VALUES
--   ('02P012', 'PERFIL VINIL NEGRO 02-8.5', 'EMPAQUE', 'VINILES', 'NEGRO', 300),
--   ('02P016', 'PERFIL VINIL NEGRO 02-9', 'EMPAQUE', 'VINILES', 'NEGRO', 600)
--   -- ... (agrega aquí todos los productos o usa el panel de admin para subir el Excel)
-- ) AS t(codigo, descripcion, grupo, subclasificacion, color, stock);
