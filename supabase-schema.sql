-- Ejecuta este SQL en el SQL Editor de Supabase

-- Tabla de productos/catálogo
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  codigo text not null unique,
  categoria text not null,
  descripcion text not null,
  dimensiones text not null,
  precio numeric(10,2) not null,
  stock integer not null default 0,
  unidad text not null default 'pieza',
  imagen text,
  created_at timestamptz default now()
);

-- Tabla de cotizaciones
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  folio text not null unique,
  fecha timestamptz not null default now(),
  estado text not null default 'pendiente',
  datos jsonb not null,
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Tabla de items de cotización
create table if not exists quote_items (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid references quotes(id) on delete cascade,
  codigo text not null,
  categoria text not null,
  descripcion text not null,
  dimensiones text not null,
  precio numeric(10,2) not null,
  cantidad integer not null,
  subtotal numeric(10,2) generated always as (precio * cantidad) stored
);

-- Tabla de configuración de empresa (una sola fila)
create table if not exists company_settings (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  giro text,
  direccion text,
  telefono text,
  whatsapp text,
  logo text,
  updated_at timestamptz default now()
);

-- Políticas RLS (Row Level Security)
alter table products enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table company_settings enable row level security;

-- Lectura pública del catálogo
create policy "products_public_read" on products
  for select using (true);

-- Inserción pública de cotizaciones (los clientes crean cotizaciones)
create policy "quotes_public_insert" on quotes
  for insert with check (true);

create policy "quotes_public_read" on quotes
  for select using (true);

create policy "quote_items_public_insert" on quote_items
  for insert with check (true);

create policy "quote_items_public_read" on quote_items
  for select using (true);

-- Actualizaciones (admin)
create policy "quotes_public_update" on quotes
  for update using (true);

create policy "quotes_public_delete" on quotes
  for delete using (true);

-- Catálogo (admin puede modificar)
create policy "products_public_insert" on products
  for insert with check (true);

create policy "products_public_update" on products
  for update using (true);

create policy "products_public_delete" on products
  for delete using (true);

-- Empresa (lectura pública, escritura pública para MVP)
create policy "company_public_read" on company_settings
  for select using (true);

create policy "company_public_insert" on company_settings
  for insert with check (true);

create policy "company_public_update" on company_settings
  for update using (true);
