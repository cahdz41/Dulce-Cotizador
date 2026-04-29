-- Ejecuta este SQL en el SQL Editor de Supabase

-- Tabla de productos/catálogo
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  grupo TEXT NOT NULL,
  subclasificacion TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado TEXT NOT NULL DEFAULT 'pendiente',
  datos JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de cotización
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  grupo TEXT NOT NULL,
  subclasificacion TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  cantidad INTEGER NOT NULL
);

-- Tabla de ventas cerradas
CREATE TABLE IF NOT EXISTS closed_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  folio TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_email TEXT,
  monto NUMERIC(10,2) NOT NULL,
  productos JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de empresa (una sola fila)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  giro TEXT,
  direccion TEXT,
  telefono TEXT,
  whatsapp TEXT,
  logo TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública del catálogo
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (TRUE);

-- Inserción pública de cotizaciones (los clientes crean cotizaciones)
CREATE POLICY "quotes_public_insert" ON quotes
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "quotes_public_read" ON quotes
  FOR SELECT USING (TRUE);

CREATE POLICY "quote_items_public_insert" ON quote_items
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "quote_items_public_read" ON quote_items
  FOR SELECT USING (TRUE);

-- Actualizaciones (admin)
CREATE POLICY "quotes_public_update" ON quotes
  FOR UPDATE USING (TRUE);

CREATE POLICY "quotes_public_delete" ON quotes
  FOR DELETE USING (TRUE);

-- Catálogo (admin puede modificar)
CREATE POLICY "products_public_insert" ON products
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "products_public_update" ON products
  FOR UPDATE USING (TRUE);

CREATE POLICY "products_public_delete" ON products
  FOR DELETE USING (TRUE);

-- Ventas cerradas (admin puede gestionar)
CREATE POLICY "closed_sales_public_read" ON closed_sales
  FOR SELECT USING (TRUE);

CREATE POLICY "closed_sales_public_insert" ON closed_sales
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "closed_sales_public_update" ON closed_sales
  FOR UPDATE USING (TRUE);

CREATE POLICY "closed_sales_public_delete" ON closed_sales
  FOR DELETE USING (TRUE);

-- Empresa (lectura pública, escritura pública para MVP)
CREATE POLICY "company_public_read" ON company_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "company_public_insert" ON company_settings
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "company_public_update" ON company_settings
  FOR UPDATE USING (TRUE);
