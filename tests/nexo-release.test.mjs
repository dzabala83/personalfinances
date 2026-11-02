import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const migration1=readFileSync(new URL('../supabase/migrations/20261019_add_contrapartes_and_transaction_links.sql',import.meta.url),'utf8');
const migration2=readFileSync(new URL('../supabase/migrations/20261102_add_multiple_counterparties.sql',import.meta.url),'utf8');
const migration3=readFileSync(new URL('../supabase/migrations/20261102_update_reset_finanzas_for_counterparties.sql',import.meta.url),'utf8');

test('release frontend points to production Supabase only',()=>{
 assert.ok(html.includes('https://femwcgsptumpmwjqnhxp.supabase.co'));
 assert.ok(html.includes('sb_publishable_781kJpE3AFS1aBz6VYLDFg_HxHS38d_'));
 assert.ok(!html.includes('zzpmkvhcfoilkuvtegzh'));
 assert.ok(!html.includes('ENTORNO DE PRUEBAS'));
 assert.ok(!html.includes('service_role'));
});

test('inline JavaScript blocks compile',()=>{
 const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 assert.ok(scripts.length>0);
 scripts.forEach((source,i)=>assert.doesNotThrow(()=>new Function(source),'script block '+i));
});

test('multi-counterparty UI validates positive individual amounts and saves assignments',()=>{
 for(const token of ['id="eCounterparties"','id="mCounterparties"','contrapartesAsignadas','allocatedEdit>monto+0.001','allocatedManual>monto+0.001',"from('transaccion_contrapartes').select('*')","from('transaccion_contrapartes').delete()",'.insert(assignments)']) assert.ok(html.includes(token),token);
});

test('base migration isolates counterparties and transaction links by owner',()=>{
 for(const token of ['create table public.contrapartes','create table public.transacciones_relacionadas','foreign key (contraparte_id, usuario_id)','alter table public.contrapartes enable row level security','alter table public.transacciones_relacionadas enable row level security']) assert.ok(migration1.includes(token),token);
});

test('allocation migration enforces same-user ownership and positive amount',()=>{
 for(const token of ['create table public.transaccion_contrapartes','foreign key (transaccion_id, usuario_id)','foreign key (contraparte_id, usuario_id)','monto_asignado numeric(14,2) not null check (monto_asignado > 0)','alter table public.transaccion_contrapartes enable row level security','(select auth.uid()) = usuario_id']) assert.ok(migration2.includes(token),token);
});

test('account reset migration cleans counterparties safely',()=>{
 for(const token of ['create or replace function public.reset_my_finanzas()','v_user_id := (select auth.uid())',"raise exception 'No authenticated user'","delete from public.contrapartes where usuario_id = v_user_id",'set search_path to']) assert.ok(migration3.includes(token),token);
});
