import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quizabend-browser-'));
const srv=await startServer({port:0,dataDir:dir});const base=`http://127.0.0.1:${srv.port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const hostCtx=await browser.newContext({viewport:{width:1366,height:768}}),host=await hostCtx.newPage(),errors=[];
host.on('pageerror',e=>errors.push(e.message));
const teamContexts=await Promise.all([0,1,2].map(()=>browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}))),teams=await Promise.all(teamContexts.map(c=>c.newPage()));
const report=[];const snapDir=path.resolve('outputs/gameshow-app/test/screenshots');fs.mkdirSync(snapDir,{recursive:true});
const wait=async()=>host.waitForTimeout(150);
async function act(action){await host.evaluate(async action=>{const s=await(await fetch('/api/state')).json();const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,epoch:s.epoch})});if(!r.ok)throw new Error(await r.text());},action);await wait();}
async function body(page){return page.locator('body').innerText();}
try{
 await host.goto(srv.hostUrl);await host.getByText('Gute Freunde.').waitFor();
 await host.getByRole('button',{name:'♪ Audio aktivieren'}).click();
 await Promise.all(teams.map((p,i)=>p.goto(`${base}/team?token=${srv.keys.teams[i]}`)));await teams[0].getByRole('button',{name:'BUZZ!'}).waitFor();
 await host.screenshot({path:path.join(snapDir,'01-willkommen-1366.png'),fullPage:true});
 report.push('Host + drei mobile Clients verbunden; Audio aktiviert.');
 await host.getByRole('button',{name:'Inhalte vorbereiten'}).click();await host.getByRole('button',{name:'5 s vorhören'}).click();await host.waitForTimeout(300);await host.getByRole('button',{name:'Stop',exact:true}).click();
 await host.getByRole('button',{name:'▦ Bildausschnitte & Kacheln'}).click();await host.getByRole('button',{name:'Reihenfolge neu setzen'}).click();for(let i=15;i>=0;i--)await host.locator(`[data-action="order"][data-tile="${i}"]`).click();await host.getByRole('button',{name:'Ausschnitt & Reihenfolge speichern'}).click();await host.getByRole('button',{name:'Fertig ×'}).click();report.push('Audio-Vorschau dekodiert; individuelle 16er-Reihenfolge gespeichert.');
 await host.locator('[data-action="intro"][data-mode="songs"]').click();await host.getByRole('button',{name:'Rubrik starten →'}).click();await teams[0].getByRole('button',{name:'BUZZ!'}).waitFor();assert.equal(await host.locator('.heart-icons').first().innerText(),'♥♥');
 assert.ok(!(await body(host)).includes('Seven Nation Army'));await host.getByRole('button',{name:'▶ Ausschnitt abspielen'}).click();
 await teams[0].getByRole('button',{name:'BUZZ!'}).click();await host.locator('[data-answer-countdown]').waitFor();await host.waitForTimeout(5200);await host.getByText('ZEIT!',{exact:true}).waitFor();await host.getByRole('button',{name:'✕ Falsch'}).click();await teams[1].getByRole('button',{name:'Wir passen'}).click();await teams[2].getByRole('button',{name:'Wir antworten'}).click();await host.locator('[data-answer-countdown]').waitFor();await host.getByRole('button',{name:'✓ Richtig'}).click();await host.getByText('Seven Nation Army',{exact:true}).waitFor();
 await host.getByRole('button',{name:'↶ Rückgängig'}).click();assert.ok(!(await body(host)).includes('Seven Nation Army'));report.push('Song: Buzz startet 5-s-Antwortzeit → Zeitablauf → falsch → Passen → neuer Countdown → richtig → Undo; Titel bleibt davor geheim.');
 await act({type:'intermission',mode:'pictures'});await act({type:'begin'});assert.deepEqual(await host.locator('.picture-wrap .tile').allTextContents(),Array.from({length:16},(_,i)=>String(i+1)));await host.getByRole('button',{name:'Nächste Kachel +'}).click();assert.equal(await host.locator('.tile.open').count(),1);
 await teams[0].getByRole('button',{name:'BUZZ!'}).click();await host.getByRole('button',{name:'✕ Falsch'}).click();await teams[0].getByRole('button',{name:'BUZZ!'}).click();await host.getByRole('button',{name:'✕ Falsch'}).click();await teams[0].reload();await teams[0].getByText('Keine Versuche mehr in dieser Runde.').waitFor();
 await host.screenshot({path:path.join(snapDir,'02-bilder-1366.png'),fullPage:true});await teams[1].screenshot({path:path.join(snapDir,'03-buzzer-390.png'),fullPage:true});report.push('Bild: eigener Sofort-Rebuzz, Eliminierung und Handy-Reload korrekt.');
 await act({type:'intermission',mode:'higher'});await act({type:'begin'});await host.getByRole('button',{name:'Arda Saatçi',exact:true}).waitFor();assert.equal(await host.locator('.heart-icons').first().innerText(),'♥♥♥');const referenceOffset=()=>host.locator('.timeline').evaluate(el=>{const timeline=el.getBoundingClientRect(),reference=el.querySelector('.card.reference').getBoundingClientRect();return Math.abs((timeline.left+timeline.right-reference.left-reference.right)/2);});assert.ok(await referenceOffset()<1.5,'Referenz muss anfangs mittig stehen');await host.getByRole('button',{name:'MrBeast',exact:true}).click();await host.locator('[data-gap="1"]').click();await host.getByRole('button',{name:'Platzierung bestätigen'}).click();assert.equal(srv.engine.getState().round.placed.length,2);assert.ok(await referenceOffset()<1.5,'Referenz muss nach rechts ergänzter Karte mittig bleiben');
 await host.getByRole('button',{name:'PewDiePie',exact:true}).dragTo(host.locator('[data-gap="1"]'));await wait();await host.getByRole('button',{name:'Platzierung bestätigen'}).click();assert.equal(srv.engine.getState().round.placed.length,3);assert.ok(await referenceOffset()<1.5,'Referenz muss nach Einfügen dazwischen mittig bleiben');
 await host.screenshot({path:path.join(snapDir,'04-higher-1366.png'),fullPage:true});report.push('Higher-Lower: Referenz bleibt mittig; Arda Saatçi und drei Herz-Leben sind sichtbar; Klick und Drag-and-Drop funktionieren.');
 await act({type:'reveal'});for(const size of [{width:1366,height:768},{width:1920,height:1080}]){await host.setViewportSize(size);await wait();const box=await host.locator('.timeline').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,cards:el.querySelectorAll('.card').length}));assert.equal(box.cards,15);assert.ok(box.scroll<=box.client+1,'Timeline darf nicht scrollen');await host.screenshot({path:path.join(snapDir,`05-aufloesung-${size.width}.png`),fullPage:true});}report.push('Alle 15 Karten in einer horizontalen Reihe bei 1366 und 1920 Pixeln.');
 for(let i=0;i<3;i++)await act({type:'correctTeam',team:i,score:20});await act({type:'intermission',mode:'finale'});await act({type:'begin'});
 for(const p of teams)p.on('dialog',d=>d.accept());await teams[0].locator('[data-letter="E"]').click();await teams[0].getByText('Päckchen 1',{exact:true}).waitFor();assert.ok(!(await body(host)).includes('Päckchen 1'));assert.ok(!(await body(teams[1])).includes('Päckchen 1'));
 for(let i=0;i<3;i++){const units=10+(i?1:0);for(let n=0;n<units;n++)await teams[i].getByRole('button',{name:'+'}).click();await teams[i].getByRole('button',{name:'Einkauf abschließen'}).click();}
 await host.getByRole('button',{name:'Startfolge beginnen · 5 s Countdown'}).waitFor();assert.deepEqual(srv.engine.getState().finale.delays,[20,0,0]);await host.getByRole('button',{name:'Startfolge beginnen · 5 s Countdown'}).click();
 await host.screenshot({path:path.join(snapDir,'06-finale-1920.png'),fullPage:true});report.push('Geheimer Shop, drei verbindliche Käufe und Startabstände 20/0/0 Sekunden korrekt.');
 assert.deepEqual(errors,[]);report.push('Keine JavaScript-Laufzeitfehler.');console.log(report.join('\n'));
}finally{await browser.close();await srv.close();fs.rmSync(dir,{recursive:true,force:true});}
