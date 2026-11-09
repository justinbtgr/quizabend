import {startServer} from '../server.mjs';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const port=Number(process.env.PORT||3131);
let existing=false;
try{const r=await fetch(`http://127.0.0.1:${port}/health`,{signal:AbortSignal.timeout(1500)});existing=(await r.json()).app==='quizabend';}catch{}
if(existing){const keys=JSON.parse(fs.readFileSync(new URL('../data/keys.json',import.meta.url)));const url=`http://127.0.0.1:${port}/?key=${keys.host}`;spawn('rundll32',['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'});console.log('Quizabend laeuft bereits. Die Spielseite wurde geoeffnet.');}
else{try{await startServer({port,open:process.env.QUIZABEND_NO_OPEN!=='1'});console.log(`Quizabend laeuft. Fenster offen lassen.\nBeenden: in der App oder Strg+C.\nPort: ${port}`);}catch(e){console.error(`Start nicht moeglich: ${e.message}\nIst der Port bereits durch ein anderes Programm belegt?`);process.exitCode=1;}}
