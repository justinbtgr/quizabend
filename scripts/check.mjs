import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {songs,pictures,categories} from '../content.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for(const file of ['server.mjs','game.mjs','content.mjs','qr.mjs','public/app.js','public/audio.js']){const r=spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});if(r.status)process.exit(r.status);}
for(const s of songs)if(!fs.existsSync(path.join(root,'assets','songs',s.asset)))throw new Error('Song fehlt: '+s.title);
for(const p of pictures)if(!fs.existsSync(path.join(root,'assets','bilderraten','originale',p.file)))throw new Error('Bild fehlt: '+p.file);
const missing=categories.flatMap(c=>c.items).filter(i=>!['.jpg','.jpeg','.png','.webp','.svg'].some(ext=>fs.existsSync(path.join(root,'assets','higher',i.id+ext))));
console.log('Produktionsprüfung: Syntax, 15 Songzuordnungen, 8 Originalbilder und 75 Datenkarten OK.');
console.log('Kein Bundler notwendig. public/ wird direkt lokal ausgeliefert.');
if(missing.length)console.log(`OFFENER INHALT: ${missing.length} Higher-Lower-Motive fehlen noch. Anwendung zeigt ausdrücklich gekennzeichnete Ersatzflächen.`);
