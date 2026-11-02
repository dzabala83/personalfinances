-- NEXO FINANZAS — PRODUCTION RELEASE
-- Multiple counterparties and individual allocation per transaction.
-- Apply after 20261019_add_contrapartes_and_transaction_links.sql.
begin;
create table public.transaccion_contrapartes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  transaccion_id uuid not null,
  contraparte_id uuid not null,
  tipo_participacion text not null default 'DEBE_REEMBOLSAR'
    check (tipo_participacion in ('DEBE_REEMBOLSAR','PAGA','RECIBE','PARTICIPA','OTRO')),
  monto_asignado numeric(14,2) not null check (monto_asignado > 0),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaccion_contrapartes_unique unique (transaccion_id, contraparte_id, tipo_participacion),
  constraint transaccion_contrapartes_tx_user_fkey
    foreign key (transaccion_id, usuario_id) references public.transacciones(id, usuario_id) on delete cascade,
  constraint transaccion_contrapartes_counterparty_user_fkey
    foreign key (contraparte_id, usuario_id) references public.contrapartes(id, usuario_id) on delete cascade
);
create index transaccion_contrapartes_user_idx on public.transaccion_contrapartes(usuario_id);
create index transaccion_contrapartes_tx_idx on public.transaccion_contrapartes(transaccion_id);
create index transaccion_contrapartes_cp_idx on public.transaccion_contrapartes(contraparte_id);
alter table public.transaccion_contrapartes enable row level security;
create policy transaccion_contrapartes_usuario on public.transaccion_contrapartes
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
grant select, insert, update, delete on public.transaccion_contrapartes to authenticated;
commit;
