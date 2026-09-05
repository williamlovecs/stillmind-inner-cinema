// One-off migration helper, executed only in the isolated read-only CI candidate job.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const temp=process.env.RUNNER_TEMP;
if(!temp||process.env.GITHUB_HEAD_REF!=='fix/native-integrity-deps-20260906')throw Error('Disposable maintenance checkout required');
const evidence=path.join(temp,'dependency-evidence');fs.mkdirSync(evidence,{recursive:true});
const dir=path.join(temp,'expo-manifest');fs.mkdirSync(dir,{recursive:true});
const versions=JSON.parse(execFileSync('npm',['view','expo@~57.0.17','version','--json'],{encoding:'utf8'}));
const target=(Array.isArray(versions)?versions:[versions]).filter(v=>/^57\.0\.\d+$/.test(v)).sort((a,b)=>Number(a.split('.')[2])-Number(b.split('.')[2])).at(-1);
if(!target||Number(target.split('.')[2])<17)throw Error('No eligible stable SDK57 target');
const packed=JSON.parse(execFileSync('npm',['pack',`expo@${target}`,'--json','--pack-destination',dir],{encoding:'utf8'}))[0];
const bundle=JSON.parse(execFileSync('tar',['-xOf',path.join(dir,packed.filename),'package/bundledNativeModules.json'],{encoding:'utf8'}));
const previousLock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const desired=new Map();const changes=[];
for(const file of ['package.json','mobile/package.json']){
  const p=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const section of ['dependencies','devDependencies'])for(const [name,before] of Object.entries(p[section]||{})){
    const after=name==='expo'?`~${target}`:bundle[name];
    if(after&&before!==after){p[section][name]=after;changes.push({file,section,name,before,after});}
  }
  if(file==='package.json'){
    // Scope replacements to the actual callers. Avoid npm audit's suggested SDK downgrades.
    // GHSA-w5hq-g745-h8pq: patched dual-CJS uuid11.1.1; xcode uses v4.
    // GHSA-vcc3-ghjq-m6fr: decoder0.5 removes exponential malformed decoding but exports ESM.
    p.overrides={...p.overrides,xcode:{uuid:'11.1.1'},'query-string':{'decode-uri-component':'0.5.0'}};
    const bridge='node scripts/patch-query-string-cjs.mjs';
    if(p.scripts.postinstall&&p.scripts.postinstall!==bridge)throw Error('Review existing postinstall before extending it');
    p.scripts.postinstall=bridge;
  }
  desired.set(file,JSON.parse(JSON.stringify(p)));
  for(const section of ['dependencies','devDependencies'])for(const name of Object.keys(p[section]||{})){
    if(name==='expo'||bundle[name]||name.startsWith('@stillmind/'))continue;
    const local=file==='mobile/package.json'?previousLock.packages[`mobile/node_modules/${name}`]:undefined;
    const resolved=local??previousLock.packages[`node_modules/${name}`];
    if(resolved?.version)p[section][name]=resolved.version;
  }
  fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}
fs.writeFileSync(path.join(evidence,'alignment.json'),JSON.stringify({target,tarballIntegrity:packed.integrity,compatibilityManifest:bundle,changes,overrides:desired.get('package.json').overrides},null,2));
console.log(JSON.stringify({target,changes},null,2));
fs.copyFileSync('package-lock.json',path.join(evidence,'baseline-lock.json'));
fs.rmSync('node_modules',{recursive:true,force:true});fs.rmSync('mobile/node_modules',{recursive:true,force:true});fs.rmSync('package-lock.json');
execFileSync('npm',['install','--prefer-dedupe'],{stdio:'inherit'});
for(const [file,p] of desired)fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
execFileSync('npm',['install','--package-lock-only','--ignore-scripts','--prefer-dedupe'],{stdio:'inherit'});
execFileSync('npm',['dedupe'],{stdio:'inherit'});
execFileSync('npm',['ci'],{stdio:'inherit'});
const require=createRequire(import.meta.url);
const xcode=require('xcode');const project=xcode.project('synthetic.pbxproj');project.hash={project:{objects:{}}};
assert.match(project.generateUuid(),/^[A-F0-9]{24}$/);
const fromRouter=createRequire(require.resolve('expo-router/package.json'));
const query=fromRouter('query-string');const parse=query.parse??query.default?.parse;
assert.equal(typeof parse,'function');assert.equal(parse('scene=%E6%B5%8B%E8%AF%95').scene,'测试');
const malformed=parse('scene=%E0%A4%A');assert.equal(typeof malformed.scene,'string');
fs.writeFileSync(path.join(evidence,'caller-compatibility.json'),JSON.stringify({xcodeUuid:'PASS',queryStringUtf8:'PASS',queryStringMalformed:'PASS'},null,2));
