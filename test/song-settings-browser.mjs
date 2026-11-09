import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quizabend-song-settings-'));
const srv=await startServer({port:0,dataDir:dir});
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(srv.hostUrl);
 await page.getByRole('button',{name:'⚙ Einstellungen'}).click();
 await page.getByRole('button',{name:'♫ Songstarts einstellen'}).click();
 const inputs=page.locator('[data-song-start]');
 await inputs.first().waitFor();
 assert.equal(await inputs.count(),15);
 assert.match(await inputs.nth(9).inputValue(),/^\d+\.\d{2}$/);
 await inputs.nth(9).fill('1.237');
 await page.getByRole('button',{name:'Alle Startzeiten speichern'}).click();
 assert.equal(srv.engine.getState().settings.songs[9].start,1.24);
 assert.ok(srv.engine.getState().settings.songs.every(song=>song.confirmed));
 await page.getByRole('button',{name:'Zurück zur Show ×'}).click();
 await page.locator('[data-action="intro"][data-mode="songs"]').click();
 await page.getByRole('button',{name:'Rubrik starten →'}).click();
 await page.getByText('0,1 Sekunden.',{exact:true}).waitFor();
 assert.equal(srv.engine.view('host').round.duration,.3);
 assert.ok(!(await page.locator('body').innerText()).includes('0,3 Sekunden.'));
 assert.deepEqual(errors,[]);
 console.log('Presenter-Songstartseite und verdeckte 0,3-s-Stufe: Speicherung und Anzeige OK.');
}finally{
 await browser.close();
 await srv.close();
 fs.rmSync(dir,{recursive:true,force:true});
}
