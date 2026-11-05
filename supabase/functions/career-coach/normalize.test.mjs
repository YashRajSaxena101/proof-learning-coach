import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDecisionIds } from './normalize.mjs';

test('normalizes opaque overlong decision and choice ids without altering content',()=>{
  const input={title:'Fixture',decisions:[{id:'this-decision-id-is-longer-than-twenty',question:'Pick?',choices:[{id:'A_choice',label:'One',consequence:'First'},{id:'other',label:'Two',consequence:'Second'}]},{id:'fine',question:'Next?',choices:[{id:'x',label:'X'},{id:'y',label:'Y'}]}]};
  const result=normalizeDecisionIds(input);
  assert.deepEqual(result.decisions.map(x=>x.id),['d1','d2']);
  assert.deepEqual(result.decisions[0].choices.map(x=>x.id),['c1','c2']);
  assert.equal(result.decisions[0].choices[0].consequence,'First');
  assert.equal(input.decisions[0].id,'this-decision-id-is-longer-than-twenty');
});
test('does not manufacture missing or non-string ids',()=>{
 const value={decisions:[{id:null,choices:[{id:'x'}]}]};
 assert.deepEqual(normalizeDecisionIds(value),value);
});
test('preserves valid identifiers',()=>{
 const value={decisions:[{id:'one',choices:[{id:'a'},{id:'b'}]}]};
 assert.deepEqual(normalizeDecisionIds(value),value);
});
test('repairs duplicate identifiers without altering scene references',()=>{
 const scene={nodes:[{id:'input'}],edges:[{from:'input',to:'output'}]};
 const value={scene,decisions:[{id:'same',choices:[{id:'x'},{id:'x'}]},{id:'same',choices:[{id:'a'},{id:'b'}]}]};
 const normalized=normalizeDecisionIds(value);
 assert.deepEqual(normalized.decisions.map(d=>d.id),['d1','d2']);
 assert.deepEqual(normalized.decisions[0].choices.map(c=>c.id),['c1','c2']);
 assert.deepEqual(normalized.scene,scene);
});
