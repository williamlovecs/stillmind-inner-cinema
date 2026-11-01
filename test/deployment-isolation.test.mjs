import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('candidate branch explicitly disables Git-triggered Vercel deployments',()=>{
  const config=JSON.parse(readFileSync('vercel.json','utf8'));
  assert.deepEqual(config.git.deploymentEnabled,{'fix/v3-regression-recovery-20261101':false});
});

test('deployment isolation is not an ignored build or a production settings change',()=>{
  const config=JSON.parse(readFileSync('vercel.json','utf8'));
  assert.deepEqual(Object.keys(config).sort(),['$schema','git']);
  assert.deepEqual(Object.keys(config.git),['deploymentEnabled']);
});
