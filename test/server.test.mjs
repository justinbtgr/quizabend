import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../server.mjs';
import {categories} from '../content.mjs';
test('HTTP host authorization, team isolation, arbitration, SSE reconnect and persistence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'quizabend-test-'));let srv=await startServer({port:0,dataDir:dir});let base=`http://127.0.0.1:${srv.port}`;
 try{
  assert.equal((await fetch(base+'/')).status,403);const keyResponse=await fetch(srv.hostUrl,{redirect:'manual'});assert.equal(keyResponse.status,302);const cookie=keyResponse.headers.get('set-cookie').split(';')[0];
  const read=async token=>(await fetch(base+'/api/state'+(token?'?token='+token:''),{headers:token?{}:{Cookie:cookie}})).json();
  const act=async(action,token,epoch)=>fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Team-Token':token}:{Cookie:cookie})},body:JSON.stringify({action,epoch:epoch??(await read(token)).epoch})});
   assert.equal((await fetch(base+'/api/setup')).status,403);assert.equal((await fetch(base+'/media/song/0?token='+srv.keys.teams[0])).status,403);
   assert.equal((await fetch(base+`/presenter?token=${srv.keys.presenter}`)).status,200);assert.equal((await fetch(base+'/presenter?token=falsch')).status,403);
   await act({type:'intermission',mode:'pictures'});await act({type:'begin'});const presenter=await read(srv.keys.presenter);assert.equal(presenter.presenter,true);assert.equal((await act({type:'settings',muted:true},srv.keys.presenter)).status,403);assert.equal((await act({type:'tile'},srv.keys.presenter)).status,200);assert.equal((await read()).round.revealed.length,1);const epoch=(await read()).epoch;
  const result=await Promise.all(srv.keys.teams.map(t=>act({type:'buzz'},t,epoch)));assert.equal(result.filter(r=>r.ok).length,1);
  await act({type:'wrong'});const before=await read(srv.keys.teams[0]);assert.equal(before.round.attempts.reduce((a,b)=>a+b),5);
  const abort=new AbortController();const es=await fetch(base+'/api/events?token='+srv.keys.teams[0],{signal:abort.signal});const reader=es.body.getReader();let text='';while(!text.includes('data: ')){const {value}=await reader.read();text+=new TextDecoder().decode(value);}assert.ok(text.includes('"attempts"'));abort.abort();
  assert.equal((await act({type:'correct'},srv.keys.teams[0])).status,400);
  assert.equal((await fetch(base+'/api/action',{method:'POST',headers:{Cookie:cookie,Origin:'http://evil.example','Content-Type':'application/json'},body:JSON.stringify({action:{type:'reset',confirm:'NEUE SHOW'}})})).status,403);
  await srv.close();srv=await startServer({port:0,dataDir:dir});base=`http://127.0.0.1:${srv.port}`;const after=await read(srv.keys.teams[0]);assert.deepEqual(after.round.attempts,before.round.attempts);
 } finally {await srv.close();rmSync(dir,{recursive:true,force:true});}
});
test('revised local visual wins over same-id fallback',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'quizabend-visual-'));const srv=await startServer({port:0,dataDir:dir});
 try{const item=categories.find(c=>c.id==='channels').items[14];const r=await fetch(`http://127.0.0.1:${srv.port}${item.image}`);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');const bytes=Buffer.from(await r.arrayBuffer());assert.deepEqual(bytes,readFileSync(join(process.cwd(),'assets','higher','revised','channels-14.png')));}finally{await srv.close();rmSync(dir,{recursive:true,force:true});}
});
