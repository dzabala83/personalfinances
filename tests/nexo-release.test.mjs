import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const migration1=readFileSync(new URL('../supabase/migrations/20261019_add_contrapartes_and_transaction_links.sql',import.meta.url),'utf8');
const migration2=readFileSync(new URL('../supabase/migrations/20261102_add_multiple_counterparties.sql',import.meta.url),'utf8');
test('release frontend uses only production Supabase config',()=>{
 assert.match(html,/https:\/\/femwcgsptumpmwjqnhxp\.supabase\.co/);
 assert.match(html,/sb_publishable_781kJpE3AFS1aBz6VYLDFg_HxHS38d_/);
 assert.doesNotMatch(html,/zzpmkvhcfoilkuvtegzh|ENTORNO DE PRUEBAS|service_role/i);
});
test('all inline JavaScript compiles',()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 assert.ok(scripts.length>0);
 scripts.forEach((source,i)=>assert.doesNotThrow(()=>new Function(source),`script block ${i}`));
});
test('multi-counterparty UI validates and persists individual shares',()=>{
 assert.match(html,/id="eCounterparties"/);
 assert.match(html,/id="mCounterparties"/);
 assert.match(html,/contrapartesAsignadas/);
 assert.match(html,/allocatedEdit>monto/);
 assert.match(html,/allocatedManual>monto/);
 assert.match(html,/from\('transaccion_contrapartes'\)\.select\('\*'\)/);
 assert.match(html,/from\('transaccion_contrapartes'\)\.insert\(assignments\)/);
});
test('base migration isolates counterparties and related transactions by owner',()=>{
 assert.match(migration1,/create table public\.contrapartes/);
 assert.match(migration1,/create table public\.transacciones_relacionadas/);
 assert.match(migration1,/foreign key \(contraparte_id, usuario_id\)/);
 assert.match(migration1,/alter table public\.contrapartes enable row level security/);
 assert.match(migration1,/alter table public\.transacciones_relacionadas enable row level security/);
});
test('allocation migration enforces same-user ownership and positive amount',()=>{
 assert.match(migration2,/create table public\.transaccion_contrapartes/);
 assert.match(migration2,/foreign key \(transaccion_id, usuario_id\)/);
 assert.match(migration2,/foreign key \(contraparte_id, usuario_id\)/);
 assert.match(migration2,/monto_asignado numeric\(14,2\) not null check \(monto_asignado > 0\)/);
 assert.match(migration2,/alter table public\.transaccion_contrapartes enable row level security/);
 assert.match(migration2,/auth\.uid\(\)\) = usuario_id/);
});
