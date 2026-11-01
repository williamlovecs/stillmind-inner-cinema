import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
const require=createRequire(import.meta.url);
const fromRouter=createRequire(require.resolve('expo-router/package.json'));
const query=fromRouter('query-string');

test('Expo query-string resolves the reviewed decoder security patch',()=>{
  const fromQuery=createRequire(fromRouter.resolve('query-string'));
  const pkg=JSON.parse(readFileSync(join(dirname(fromQuery.resolve('decode-uri-component')),'package.json'),'utf8'));
  assert.equal(pkg.version,'0.5.1');
});
test('patched xcode UUID dependency retains project-id shape',()=>{
  const p=require('xcode').project('synthetic.pbxproj');p.hash={project:{objects:{}}};
  assert.match(p.generateUuid(),/^[A-F0-9]{24}$/);
});
test('patched decoder preserves Expo query-string UTF-8 and arrays',()=>{
  assert.equal(query.parse('scene=%E6%B5%8B%E8%AF%95').scene,'测试');
  assert.deepEqual(query.parse('a=1&a=2').a,['1','2']);
});
test('patched decoder tolerates malformed sequences without an unbounded split loop',()=>{
  const before=performance.now();const value=query.parse('scene='+ '%ab'.repeat(1500)).scene;
  assert.equal(typeof value,'string');assert.ok(performance.now()-before<1000);
});
