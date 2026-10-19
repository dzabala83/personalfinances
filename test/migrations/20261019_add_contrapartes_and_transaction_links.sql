-- NEXO FINANZAS — TEST ONLY
-- Applied to Supabase project zzpmkvhcfoilkuvtegzh on 2026-10-19.
-- Adds counterparties and transaction-to-transaction relationships.
-- This migration is recorded for traceability; it has already been applied.

begin;

create table public.contrapartes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text,
  email text,
  tipo text not null default 'Persona'
    check (tipo in ('Persona','Negocio','Empresa','Comercio','Institución','Servicio','Otro')),
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contrapartes_id_usuario_unique unique (id, usuario_id)
);

alter table public.transacciones
  add constraint transacciones_id_usuario_unique unique (id, usuario_id);

alter table public.transacciones
  add column contraparte_id uuid null;

alter table public.transacciones
  add constraint transacciones_contraparte_usuario_fkey
  foreign key (contraparte_id, usuario_id)
  references public.contrapartes(id, usuario_id)
  on delete set null (contraparte_id);

create table public.transacciones_relacionadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  transaccion_id uuid not null,
  transaccion_relacionada_id uuid not null,
  tipo_relacion text not null
    check (tipo_relacion in ('REEMBOLSO','PRESTAMO','DEVOLUCION','PAGO_DEUDA','RELACIONADA','OTRO')),
  monto_relacionado numeric(14,2) not null check (monto_relacionado > 0),
  notas text,
  created_at timestamptz not null default now(),
  constraint transacciones_relacionadas_no_self check (transaccion_id <> transaccion_relacionada_id),
  constraint transacciones_relacionadas_transaccion_usuario_fkey
    foreign key (transaccion_id, usuario_id)
    references public.transacciones(id, usuario_id) on delete cascade,
  constraint transacciones_relacionadas_relacionada_usuario_fkey
    foreign key (transaccion_relacionada_id, usuario_id)
    references public.transacciones(id, usuario_id) on delete cascade
);

create index contrapartes_usuario_nombre_idx
  on public.contrapartes(usuario_id, lower(nombre));
create index transacciones_contraparte_idx
  on public.transacciones(usuario_id, contraparte_id);
create index transacciones_relacionadas_usuario_idx
  on public.transacciones_relacionadas(usuario_id);
create index transacciones_relacionadas_transaccion_idx
  on public.transacciones_relacionadas(transaccion_id);
create index transacciones_relacionadas_relacionada_idx
  on public.transacciones_relacionadas(transaccion_relacionada_id);

alter table public.contrapartes enable row level security;
create policy contrapartes_usuario on public.contrapartes
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

alter table public.transacciones_relacionadas enable row level security;
create policy transacciones_relacionadas_usuario on public.transacciones_relacionadas
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

grant select, insert, update, delete on public.contrapartes to authenticated;
grant select, insert, update, delete on public.transacciones_relacionadas to authenticated;

commit;
