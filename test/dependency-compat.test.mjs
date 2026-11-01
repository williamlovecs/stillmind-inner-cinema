import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
const require=createRequire(import.meta.url);
const fromRouter=createRequire(require.resolve('expo-router/package.json'));
const query=fromRouter('query-string');
const fromExpo=createRequire(require.resolve('expo/package.json'));
const cliPackage=fromExpo.resolve('@expo/cli/package.json');
const fromCli=createRequire(cliPackage);
const cliRoot=dirname(cliPackage);

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

test('Expo CLI resolves the reviewed Zod security release',()=>{
  const pkg=fromCli('zod/package.json');
  assert.equal(pkg.version,'4.6.7');
});

test('CLI Zod rejects oversized constrained arrays before walking elements',()=>{
  const {z}=fromCli('zod');
  let parsed=0;
  const schema=z.array(z.string().refine(()=>{parsed++;return true;})).max(2);
  const result=schema.safeParse(Array(2000).fill('synthetic'));
  assert.equal(result.success,false);
  assert.equal(parsed,0,'an upper size bound must reject before per-element work');
  assert.equal(result.error.issues.length,1);
  assert.equal(result.error.issues[0].code,'too_big');
});

const plugin={
  packageName:'synthetic-plugin',packageRoot:'/synthetic',
  cliExtensions:{description:'Synthetic compatibility fixture',entryPoint:'index.js',commands:[{
    name:'inspect',title:'Inspect',environments:['cli','mcp'],parameters:[
      {name:'label',type:'text'},{name:'count',type:'number'},{name:'confirm',type:'confirm'},
    ],
  }]},
};

test('real Expo plugin schema preserves parsing, readonly and error semantics',()=>{
  const {PluginSchema}=require(join(cliRoot,'build/src/start/server/DevToolsPlugin.schema.js'));
  const result=PluginSchema.safeParse({...plugin,unknown:'removed'});
  assert.equal(result.success,true);
  assert.equal('unknown' in result.data,false);
  assert.ok(Object.isFrozen(result.data.cliExtensions.commands[0].environments));
  const invalid=PluginSchema.safeParse({...plugin,packageName:''});
  assert.equal(invalid.success,false);
  assert.deepEqual(invalid.error.issues[0].path,['packageName']);
});

test('real Expo output schema accepts text/audio/image and rejects malformed results',()=>{
  const {DevToolsPluginOutputSchema:schema}=require(join(cliRoot,'build/src/start/server/DevToolsPlugin.schema.js'));
  const value=[{type:'text',text:'synthetic',level:'info'},{type:'audio',url:'https://example.invalid/a'},{type:'image',url:'https://example.invalid/i'}];
  assert.deepEqual(schema.parse(value),value);
  assert.equal(schema.safeParse([{type:'text',text:'synthetic',level:'unknown'}]).success,false);
  assert.equal(schema.safeParse([{type:'audio',url:'invalid-url'}]).success,false);
});

test('real Expo MCP schema retains strict command and typed parameter checks',()=>{
  const {createMCPDevToolsExtensionSchema:createSchema}=require(join(cliRoot,'build/src/start/server/createMCPDevToolsExtensionSchema.js'));
  const schema=createSchema(plugin);
  const input={command:'inspect',label:'synthetic',count:2,confirm:false};
  assert.deepEqual(schema.parse(input),input);
  assert.equal(schema.safeParse({command:'inspect'}).success,true);
  for(const invalid of [{command:'unknown'},{command:'inspect',extra:true},{command:'inspect',count:'2'},{command:'inspect',confirm:'yes'}]){
    assert.equal(schema.safeParse(invalid).success,false);
  }
  assert.throws(()=>createSchema({packageName:'synthetic-plugin'}),/no commands/);
});
