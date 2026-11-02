import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const migration1=readFileSync(new URL('../supabase/migrations/20261019_add_contrapartes_and_transaction_links.sql',import.meta.url),'utf8');
const migration2=readFileSync(new URL('../supabase/migrations/20261102_add_multiple_counterparties.sql',import.meta.url),'utf8');
const migration3=readFileSync(new URL('../supabase/migrations/20261102_update_reset_finanzas_for_counterparties.sql',import.meta.url),'utf8');

test('release frontend uses only production Supabase config',()=>{
  assert.ok(html.includes('https://femwcgsptumpmwjqnhxp.supabase.co'));
  assert.ok(html.includes('sb_publishable_781kJpE3AFS1aBz6VYLDFg_HxHS38d_'));
  assert.ok(!html.includes('zzpmkvhcfoilkuvtegzh'));
  assert.ok(!html.includes('ENTORNO DE PRUEBAS'));
  assert.ok(!html.includes('service_role'));
});

test('all inline JavaScript compiles',()=>{
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  assert.ok(scripts.length>0);
  scripts.forEach((source,i)=>assert.doesNotThrow(()=>new Function(source),'script block '+i));
});

test('multi-counterparty UI validates and persists individual shares',()=>{
  assert.ok(html.includes('id="eCounterparties"'));
  assert.ok(html.includes('id="mCounterparties"'));
  assert.ok(html.includes('contrapartesAsignadas'));
  assert.ok(html.includes('allocatedEdit>monto+0.001'));
  assert.ok(html.includes('allocatedManual>monto+0.001'));
  assert.ok(html.includes("from('transaccion_contrapartes').select('*')"));
  assert.ok(html.includes("from('transaccion_contrapartes').delete()"));
  assert.ok(html.includes('.insert(assignments)'));
});

test('base migration isolates counterparties and related transactions by owner',()=>{
  assert.ok(migration1.includes('create table public.contrapartes'));
  assert.ok(migration1.includes('create table public.transacciones_relacionadas'));
  assert.ok(migration1.includes('foreign key (contraparte_id, usuario_id)'));
  assert.ok(migration1.includes('alter table public.contrapartes enable row level security'));
  assert.ok(migration1.includes('alter table public.transacciones_relacionadas enable row level security'));
});

test('allocation migration enforces same-user ownership and positive amount',()=>{
  assert.ok(migration2.includes('create table public.transaccion_contrapartes'));
  assert.ok(migration2.includes('foreign key (transaccion_id, usuario_id)'));
  assert.ok(migration2.includes('foreign key (contraparte_id, usuario_id)'));
  assert.ok(migration2.includes('monto_asignado numeric(14,2) not null check (monto_asignado > 0)'));
  assert.ok(migration2.includes('alter table public.transaccion_contrapartes enable row level security'));
  assert.ok(migration2.includes('(select auth.uid()) = usuario_id'));
});

test('account reset removes counterparties after deleting related transactions',()=>{
  assert.ok(migration3.includes('create or replace function public.reset_my_finanzas()'));
  assert.ok(migration3.includes('v_user_id uuid := (select auth.uid())'));
  assert.ok(migration3.includes("raise exception 'No authenticated user'"));
  assert.ok(migration3.includes('delete from public.contrapartes where usuario_id = v_user_id'));
  assert.ok(migration3.includes('set search_path to'));
});
