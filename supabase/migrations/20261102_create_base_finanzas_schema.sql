-- NEXO FINANZAS — base schema for the replacement test environment.
-- Mirrors the six core public tables and RLS policies in the existing production schema.
-- This migration is for the isolated test project; do not apply to production.

begin;

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('Gasto','Ingreso')),
  created_at timestamptz not null default now(),
  constraint categorias_usuario_id_nombre_tipo_key unique (usuario_id,nombre,tipo)
);

create table public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  constraint subcategorias_usuario_id_categoria_id_nombre_key unique (usuario_id,categoria_id,nombre)
);

create table public.transacciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  descripcion text not null,
  monto numeric not null check (monto >= 0),
  tipo text not null check (tipo in ('Gasto','Ingreso')),
  categoria_id uuid references public.categorias(id) on delete set null,
  subcategoria_id uuid references public.subcategorias(id) on delete set null,
  cuenta text,
  origen text,
  estado text not null default 'pendiente' check (estado in ('categorizado','pendiente')),
  referencia text,
  referencia_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transacciones_usuario_id_referencia_id_key unique (usuario_id,referencia_id)
);

create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  subcategoria_id uuid references public.subcategorias(id) on delete cascade,
  mes date not null,
  monto numeric not null default 0 check (monto >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presupuestos_usuario_id_categoria_id_subcategoria_id_mes_key unique (usuario_id,categoria_id,subcategoria_id,mes)
);

create table public.reglas_categorizacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  palabra_clave text not null,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  subcategoria_id uuid references public.subcategorias(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint reglas_categorizacion_usuario_id_palabra_clave_key unique (usuario_id,palabra_clave)
);

create table public.usuario_config (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  datos_inicializados boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transacciones_usuario_fecha_idx on public.transacciones(usuario_id,fecha desc);
create index transacciones_usuario_tipo_idx on public.transacciones(usuario_id,tipo);
create index subcategorias_categoria_idx on public.subcategorias(categoria_id);
create index presupuestos_usuario_mes_idx on public.presupuestos(usuario_id,mes);
create index reglas_categorizacion_usuario_idx on public.reglas_categorizacion(usuario_id);

alter table public.categorias enable row level security;
alter table public.subcategorias enable row level security;
alter table public.transacciones enable row level security;
alter table public.presupuestos enable row level security;
alter table public.reglas_categorizacion enable row level security;
alter table public.usuario_config enable row level security;

create policy categorias_usuario on public.categorias for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy subcategorias_usuario on public.subcategorias for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy transacciones_usuario on public.transacciones for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy presupuestos_usuario on public.presupuestos for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
create policy reglas_usuario on public.reglas_categorizacion for all to authenticated
  using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

create policy usuario_config_delete_own on public.usuario_config for delete to authenticated using (auth.uid() = usuario_id);
create policy usuario_config_insert_own on public.usuario_config for insert to authenticated with check (auth.uid() = usuario_id);
create policy usuario_config_select_own on public.usuario_config for select to authenticated using (auth.uid() = usuario_id);
create policy usuario_config_update_own on public.usuario_config for update to authenticated using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

grant select,insert,update,delete on public.categorias,public.subcategorias,public.transacciones,public.presupuestos,public.reglas_categorizacion,public.usuario_config to authenticated;

commit;
