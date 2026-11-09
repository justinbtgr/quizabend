import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {initialState} from '../game.mjs';
import {startServer} from '../server.mjs';

test('saved show replaces Royals placeholder while preserving scores and custom audio',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quizabend-royals-'));
 let server;
 try{
  const state=initialState();state.teams[1].score=17;
  state.settings.songs[3]={start:0,confirmed:true,asset:'platzhalter/04_royals_placeholder.mp3',placeholder:true};
  state.settings.songs[0]={start:7.25,confirmed:true,asset:'imports/custom-song.m4a',placeholder:false};
  fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify({state,history:[]}));
  server=await startServer({port:0,dataDir:dir});
  const current=server.engine.getState();
  assert.equal(current.teams[1].score,17);
  assert.deepEqual(current.settings.songs[0],state.settings.songs[0]);
  assert.deepEqual(current.settings.songs[3],{start:0.275,confirmed:false,asset:'originale/04_royals.m4a',placeholder:false});
  const res=await fetch(`http://127.0.0.1:${server.port}/media/song/3`,{headers:{Cookie:'showHost='+server.keys.host}});
  assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'audio/mp4');
  assert.deepEqual(Buffer.from(await res.arrayBuffer()),fs.readFileSync(new URL('../assets/songs/originale/04_royals.m4a',import.meta.url)));
 }finally{if(server)await server.close();fs.rmSync(dir,{recursive:true,force:true});}
});
