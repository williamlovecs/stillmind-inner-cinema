// Temporary, narrow CommonJS/ESM bridge for query-string@7 and decode-uri-component@0.5.
// Remove when Expo upgrades its query-string dependency. Never downgrade the security patch.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const candidates=new Set();
for(const base of [process.cwd(),path.join(process.cwd(),'mobile')]){
  try {const r=createRequire(path.join(base,'package.json'));candidates.add(r.resolve('query-string'));} catch { /* Optional in a Web-only installation. */ }
}
try {const r=createRequire(require.resolve('expo-router/package.json'));candidates.add(r.resolve('query-string'));} catch { /* No router in a Web-only installation. */ }
for(const file of candidates){
  const pkg=JSON.parse(fs.readFileSync(path.join(path.dirname(file),'package.json'),'utf8'));
  if(pkg.version!=='7.1.3')throw Error(`Review decoder bridge for query-string@${pkg.version} before installing`);
  const original="const decodeComponent = require('decode-uri-component');";
  const replacement="const decodeComponentModule = require('decode-uri-component');\nconst decodeComponent = decodeComponentModule.default ?? decodeComponentModule; // StillMind: ESM security-update bridge";
  const source=fs.readFileSync(file,'utf8');
  if(source.includes(replacement))continue;
  if(source.split(original).length!==2)throw Error('Unexpected query-string import; refusing an unreviewed patch');
  fs.writeFileSync(file,source.replace(original,replacement));
  console.log(`Applied reviewed decoder import bridge: ${path.relative(process.cwd(),file)}`);
}
