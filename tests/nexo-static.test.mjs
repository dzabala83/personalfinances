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

test('BMSC parser handles repeated table headers page by page',()=>{
  assert.match(html,/__NEXO_PDF_PAGE_BREAK__/);
  const start=html.indexOf('function processBmscPdfLines(lines){');
  const end=html.indexOf('\nfunction findHeaderRow',start);
  assert.ok(start>=0 && end>start);
  const block=html.slice(start,end);
  assert.match(block,/const pageGroups=\[\]/);
  assert.match(block,/line==='__NEXO_PDF_PAGE_BREAK__'/);
  assert.match(block,/const tablePages=pageGroups\.map/);
  assert.match(block,/for\(const tableLines of tablePages\)/);
  assert.match(block,/const allTableLines=tablePages\.flat\(\)/);
});

test('BMSC parser only reads transactions after the table header',()=>{
  const start=html.indexOf('function processBmscPdfLines(lines){');
  const end=html.indexOf('\nfunction findHeaderRow',start);
  assert.ok(start>=0 && end>start);
  const block=html.slice(start,end);
  assert.match(block,/tableHeaderIndex = lines\.findIndex/);
  assert.match(block,/n\.includes\('fecha'\)/);
  assert.match(block,/n\.includes\('transaccion'\)/);
  assert.match(block,/n\.includes\('debito'\)/);
  assert.match(block,/n\.includes\('credito'\)/);
  assert.match(block,/n\.includes\('saldo'\)/);
  assert.match(block,/const tableLines=lines\.slice\(tableHeaderIndex\+1\)/);
  assert.match(block,/for\(const line0 of tableLines\)/);
  assert.match(block,/SALDO INICIAL/);
  assert.match(block,/expectedDebitos = \[\.\.\.tableLines\]/);
});

test('pending assignment allows category without subcategory and still queues',()=>{
  const start=html.indexOf("div.querySelector('[data-assign]').onclick=async()=>");
  const end=html.indexOf('\n      };',start);
  assert.ok(start>=0 && end>start);
  const handler=html.slice(start,end);
  assert.match(handler,/const sub=subSel\.value \? subSel\.value\.trim\(\) : null/);
  assert.match(handler,/t\.subcategoria=sub\|\|null/);
  assert.match(handler,/savePendingAssignment\(t,newRuleIds\)/);
  assert.match(html,/Subcategoría \(opcional\)/);
  assert.match(html,/if\(tx\.subcategoria\)\{/);
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
