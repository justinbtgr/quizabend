import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createEngine,initialState} from './game.mjs';
import {songs,pictures,categories} from './content.mjs';
import {qrSvg} from './qr.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.m4a':'audio/mp4','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
export function startServer({port=Number(process.env.PORT||3131),dataDir=path.join(root,'data'),open=false}={}) {
 fs.mkdirSync(dataDir,{recursive:true});const stateFile=path.join(dataDir,'state.json'),keyFile=path.join(dataDir,'keys.json');
 const freshKeys=()=>({host:crypto.randomBytes(24).toString('hex'),presenter:crypto.randomBytes(18).toString('hex'),teams:[0,1,2].map(()=>crypto.randomBytes(12).toString('hex'))});
 const keys=fs.existsSync(keyFile)?JSON.parse(fs.readFileSync(keyFile)):freshKeys();if(!keys.presenter)keys.presenter=crypto.randomBytes(18).toString('hex');fs.writeFileSync(keyFile,JSON.stringify(keys));
 let saved=null;if(fs.existsSync(stateFile)){try{saved=JSON.parse(fs.readFileSync(stateFile));}catch{if(fs.existsSync(stateFile+'.bak'))saved=JSON.parse(fs.readFileSync(stateFile+'.bak'));else throw new Error('Spielstand beschädigt. Bitte data/state.json sichern und aus einer Sicherung wiederherstellen.');}}
 const engine=createEngine(saved?.state||initialState(),saved?.history||[]);
 // Unconfirmed start suggestions may be revised in the bundled manifest between runs.
 const liveState=engine.getState();
 liveState.settings.songs.forEach((entry,i)=>{
  const bundled=songs[i];
  if(i===9&&!entry.confirmed&&entry.asset==='originale/10_eine_insel_mit_zwei_bergen.m4a')Object.assign(entry,{asset:bundled.asset,placeholder:true,confirmed:false,start:bundled.suggestedStartSeconds});
  if(entry.placeholder&&bundled?.assetKind==='local'&&fs.existsSync(path.join(root,'assets','songs',bundled.asset))){Object.assign(entry,{asset:bundled.asset,placeholder:false,confirmed:false,start:bundled.suggestedStartSeconds});}
  if(!entry.confirmed&&bundled?.suggestedStartSeconds!==undefined)entry.start=bundled.suggestedStartSeconds;
 });
 engine.restore(liveState);
 if(engine.getState().finale?.phase==='running'&&!engine.getState().paused)engine.dispatch({type:'pause'});
 const streams=new Map();let actualPort=port;
 function persist(){const tmp=stateFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify({state:engine.getState(),history:engine.getHistory()}));if(fs.existsSync(stateFile))fs.copyFileSync(stateFile,stateFile+'.bak');fs.renameSync(tmp,stateFile);}
 function addresses(){return Object.entries(os.networkInterfaces()).flatMap(([name,entries])=>entries.filter(x=>x.family==='IPv4'&&!x.internal).map(x=>({name,address:x.address,url:`http://${x.address}:${actualPort}`})));}
 function actor(req,url){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('showHost='))?.slice(9);if(cookie===keys.host&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return 'host';const token=url.searchParams.get('token')||req.headers['x-team-token'];if(token===keys.presenter)return 'presenter';const t=keys.teams.indexOf(token);return t>=0?t:'public';}
 function publicView(a){const v=engine.view(a==='presenter'?'host':a);v.connected=[0,1,2].map(t=>[...streams.values()].some(x=>x.actor===t));if(a==='presenter')v.presenter=true;if(a==='host'){v.presenterConnected=[...streams.values()].some(x=>x.actor==='presenter');v.network={addresses:addresses(),links:keys.teams.map(token=>`/team?token=${token}`),presenterLink:`/presenter?token=${keys.presenter}`};}return v;}
 function broadcast(){for(const [res,client]of streams){res.write(`data: ${JSON.stringify(publicView(client.actor))}\n\n`);}}
 const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 async function body(req,limit=100_000){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>limit)throw new Error('Datei zu groß.');chunks.push(c);}return Buffer.concat(chunks);}
 function file(req,res,p){if(!fs.existsSync(p)){res.writeHead(404);return res.end('Datei fehlt');}const stat=fs.statSync(p);const headers={'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};let start=0,end=stat.size-1,status=200;const range=req.headers.range;if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match){res.writeHead(416);return res.end();}start=+match[1];end=match[2]?Math.min(+match[2],end):end;if(start>end){res.writeHead(416);return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}headers['Accept-Ranges']='bytes';headers['Content-Length']=end-start+1;res.writeHead(status,headers);fs.createReadStream(p,{start,end}).pipe(res);}
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://local'),p=url.pathname,a=actor(req,url);res.setHeader('Referrer-Policy','no-referrer');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
   if(p==='/health')return json(res,200,{app:'quizabend',ok:true});
   if(p==='/'&&url.searchParams.get('key')===keys.host&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.writeHead(302,{'Set-Cookie':`showHost=${keys.host}; HttpOnly; SameSite=Strict; Path=/`,'Location':'/'});return res.end();}
   if(req.method==='POST'){
    // Same-origin only: prevents another website or a team phone from issuing host actions.
    if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Falsche Herkunft.'});
     if(p==='/api/action'){
      if(a==='public')return json(res,403,{error:'Bitte den passenden QR-Code scannen.'});const b=JSON.parse(await body(req));
      const presenterActions=new Set(['begin','play','stopAudio','nextStage','next','tile','correct','wrong','undo','reveal','buzzer','confirm','cancel','startFinale','winner']);
      if(a==='presenter'&&!presenterActions.has(b.action?.type))return json(res,403,{error:'Diese Aktion ist nur am Show-Laptop möglich.'});
      engine.dispatch(b.action,a==='presenter'?'host':a,b.epoch);persist();broadcast();return json(res,200,{ok:true});
    }
    if(p==='/api/upload-song'){
     if(a!=='host'||engine.getState().mode!=='setup')return json(res,403,{error:'Nur vor der Show möglich.'});
     const index=Number(url.searchParams.get('index')),ext=url.searchParams.get('ext');if(!Number.isInteger(index)||index<0||index>=15||!['.mp3','.m4a','.wav','.ogg'].includes(ext))throw new Error('Ungültiges Audioformat.');
     const dir=path.join(root,'assets','songs','imports');fs.mkdirSync(dir,{recursive:true});const name=`song-${index}-${Date.now()}${ext}`;fs.writeFileSync(path.join(dir,name),await body(req,100*1024*1024));
     const s=engine.getState();Object.assign(s.settings.songs[index],{asset:`imports/${name}`,confirmed:false,start:0,placeholder:false});
     // Persist replacement without mutating or deleting the source audio.
     const replacement=createEngine(s,engine.getHistory());engine.dispatch({type:'settings',song:{index,start:0,confirmed:false}});const live=engine.getState();live.settings.songs[index]=replacement.getState().settings.songs[index];
     replaceState(live);return json(res,200,{ok:true});
    }
    if(p==='/api/upload-visual'){
     if(a!=='host'||engine.getState().mode!=='setup')return json(res,403,{error:'Nur vor der Show möglich.'});const id=url.searchParams.get('id'),ext=url.searchParams.get('ext');if(!categories.some(c=>c.items.some(i=>i.id===id))||!['.jpg','.jpeg','.png','.webp'].includes(ext))throw new Error('Ungültiges Bild.');
     const dir=path.join(root,'assets','higher');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+ext),await body(req,20*1024*1024));return json(res,200,{ok:true});
    }
    if(p==='/api/shutdown'&&a==='host'){persist();json(res,200,{ok:true});setTimeout(()=>{for(const r of streams.keys())r.end();server.close();},100);return;}
    return json(res,404,{error:'Unbekannte Aktion.'});
   }
   if(p==='/api/state')return json(res,200,publicView(a));
   if(p==='/api/setup'){
    if(a!=='host'||engine.getState().mode!=='setup')return json(res,403,{error:'Nur vor der Show zugänglich.'});
    const st=engine.getState();return json(res,200,{songs:songs.map((s,i)=>({index:i,title:s.title,artist:s.artist,...st.settings.songs[i]})),pictures:pictures.map((v,i)=>({...v,...st.settings.pictures[i]})),visuals:categories.flatMap(c=>c.items.map(i=>({id:i.id,image:i.image,name:i.name,ready:visualPath(i.id)!==null}))) });
   }
   if(p==='/api/events'){
    if(a==='public')return json(res,403,{error:'Ungültiger Team-Link.'});res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write(': verbunden\n\n');streams.set(res,{actor:a});broadcast();req.on('close',()=>{streams.delete(res);broadcast();});return;
   }
   if(p==='/qr'&&a==='host'){const base=url.searchParams.get('base');if(!addresses().some(x=>x.url===base))throw new Error('Ungültige Adresse.');const presenter=url.searchParams.get('presenter')==='1';let target;if(presenter)target=`${base}/presenter?token=${keys.presenter}`;else{const t=Number(url.searchParams.get('team'));if(![0,1,2].includes(t))throw new Error('Ungültiges Team.');target=`${base}/team?token=${keys.teams[t]}`;}res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(qrSvg(target));}
   const media=/^\/media\/(song|cover|picture)\/(\d+)$/.exec(p);
   if(media){if(a!=='host')return json(res,403,{error:'Medien werden nur am Laptop gezeigt.'});const i=+media[2],s=engine.getState();if(media[1]==='song'&&i<songs.length)return file(req,res,path.join(root,'assets','songs',s.settings.songs[i].asset));if(media[1]==='cover'&&i<songs.length){const coverDir=path.join(root,'assets','songs','covers');for(const ext of ['.jpg','.png','.webp']){const cp=path.join(coverDir,String(songs[i].id)+ext);if(fs.existsSync(cp))return file(req,res,cp);}return json(res,404,{});}if(media[1]==='picture'&&i<pictures.length)return file(req,res,path.join(root,'assets','bilderraten','originale',pictures[i].file));return json(res,404,{});}
   const vis=/^\/visual\/(card-[a-f0-9]+)$/.exec(p);if(vis){const item=categories.flatMap(c=>c.items).find(i=>i.publicId===vis[1]);if(!item)return json(res,404,{});const vp=visualPath(item.id);if(vp)return file(req,res,vp);res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="240" height="180" rx="20" fill="#e7ecee"/><text x="120" y="78" text-anchor="middle" font-family="sans-serif" font-size="38" fill="#596d76">${item.name.slice(0,2).replace(/[<>&]/g,'')}</text><text x="120" y="112" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#596d76">Bild noch ergänzen</text></svg>`);}
   if(p==='/'||p==='/team'||p==='/presenter'){if(p==='/'&&a!=='host'){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Bitte am Laptop die Startdatei öffnen oder auf dem Handy den passenden QR-Code scannen.');}if(p==='/team'&&!Number.isInteger(a)){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Ungültiger Team-Link.');}if(p==='/presenter'&&a!=='presenter'){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Ungültiger Moderatorinnen-Link.');}return file(req,res,path.join(root,'public','index.html'));}
   if(['/app.js','/style.css','/audio.js'].includes(p))return file(req,res,path.join(root,'public',p.slice(1)));
   return json(res,404,{error:'Seite nicht gefunden.'});
  }catch(e){if(!res.headersSent)json(res,400,{error:e.message});else res.end();}
 });
 function visualPath(id){for(const dir of [path.join(root,'assets','higher','revised'),path.join(root,'assets','higher')])for(const ext of ['.jpg','.jpeg','.png','.webp','.svg']){const p=path.join(dir,id+ext);if(fs.existsSync(p))return p;}return null;}
 function replaceState(s){engine.restore(s);persist();broadcast();}
 const heartbeat=setInterval(()=>{for(const r of streams.keys())r.write(': ping\n\n');},15000);heartbeat.unref();server.on('close',()=>clearInterval(heartbeat));
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',()=>{actualPort=server.address().port;const hostUrl=`http://127.0.0.1:${actualPort}/?key=${keys.host}`;persist();if(open){if(process.platform==='win32')spawn('rundll32',['url.dll,FileProtocolHandler',hostUrl],{windowsHide:true,stdio:'ignore'});else console.log(hostUrl);}resolve({server,engine,keys,port:actualPort,hostUrl,close:()=>{for(const r of streams.keys())r.end();return new Promise(r=>server.close(r));}});});});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startServer({open:process.argv.includes('--open')}).then(({port,hostUrl})=>{console.log(`Quizabend läuft auf Port ${port}. Dieses Fenster offen lassen.\n${hostUrl}\nBeenden: Strg+C`);}).catch(e=>{console.error(`Start nicht möglich: ${e.message}`);process.exitCode=1;});
