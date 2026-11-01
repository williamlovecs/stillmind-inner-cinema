import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

for(const batch of ['A','B','C','D']){
  test(`native method batch ${batch} binds every Chip to the paused contract`,()=>{
    const path=`mobile/src/components/stillmind/methods/Batch${batch}.tsx`;
    const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    let count=0;
    function visit(node){
      if((ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))&&node.tagName.getText(source)==='Chip'){
        count++;
        const attribute=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)==='disabled');
        assert.ok(attribute&&attribute.initializer&&ts.isJsxExpression(attribute.initializer)&&attribute.initializer.expression?.getText(source)==='paused',`${path}: every Chip must explicitly honor paused`);
      }
      ts.forEachChild(node,visit);
    }
    visit(source);assert.ok(count>0,'contract must inspect actual controls');
  });
}
