-- NEXO FINANZAS — PRODUCTION RELEASE
-- Keep the user's reset operation complete after adding counterparties.
-- Existing SECURITY DEFINER behavior is preserved; auth.uid() is mandatory,
-- search_path is empty, and all object references are schema-qualified.

begin;

create or replace function public.reset_my_finanzas()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'No authenticated user';
  end if;

  delete from public.presupuestos where usuario_id = v_user_id;
  delete from public.reglas_categorizacion where usuario_id = v_user_id;
  delete from public.transacciones where usuario_id = v_user_id;
  delete from public.subcategorias where usuario_id = v_user_id;
  delete from public.categorias where usuario_id = v_user_id;
  delete from public.contrapartes where usuario_id = v_user_id;

  insert into public.usuario_config (usuario_id, datos_inicializados, updated_at)
  values (v_user_id, true, now())
  on conflict (usuario_id)
  do update set datos_inicializados = true, updated_at = now();
end;
$function$;

commit;
