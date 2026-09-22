import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);

test('all inline JavaScript blocks compile',()=>{
  assert.ok(scripts.length>0);
  scripts.forEach((source,i)=>{
    assert.doesNotThrow(()=>new Function(source),`script block ${i} must parse`);
  });
});

test('Sync Manager has persistent per-user queue and bounded batches',()=>{
  assert.match(html,/SYNC MANAGER V1/);
  assert.ok(html.includes("nexo_sync_queue_v1_'+currentUser.id"));
  assert.match(html,/pendingSyncQueue\.slice\(0,25\)/);
  assert.match(html,/scheduleSyncRetry/);
  assert.match(html,/hydrateStateFromSyncQueue/);
});

test('pending assignment is non-blocking and incremental',()=>{
  const start=html.indexOf("div.querySelector('[data-assign]').onclick=async()=>");
  assert.ok(start>=0);
  const end=html.indexOf('\n      };',start);
  assert.ok(end>start);
  const handler=html.slice(start,end);
  assert.doesNotMatch(handler,/await savePendingAssignment/);
  assert.doesNotMatch(handler,/render\(\)/);
  assert.match(handler,/savePendingAssignment\(t,newRuleIds\)/);
  assert.match(handler,/refreshPendingNavBadge\(\)/);
});

test('state sync uses entity cache instead of full category/subcategory SELECTs',()=>{
  const start=html.indexOf('async function saveState(){');
  const end=html.indexOf('\nasync function initApp(){',start);
  assert.ok(start>=0 && end>start);
  const block=html.slice(start,end);
  assert.match(block,/Usamos la caché de entidades/);
  assert.doesNotMatch(block,/from\('categorias'\)\.select\('id,tipo,nombre'\)/);
  assert.doesNotMatch(block,/from\('subcategorias'\)\.select\('id,categoria_id,nombre'\)/);
});
