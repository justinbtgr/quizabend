import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quizabend-presenter-'));
const srv=await startServer({port:0,dataDir:dir});
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const host=await browser.newPage({viewport:{width:1366,height:768}}),presenter=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),team=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
host.setDefaultTimeout(6000);presenter.setDefaultTimeout(6000);team.setDefaultTimeout(6000);
presenter.on('pageerror',error=>errors.push(error.message));
try{
 await host.goto(srv.hostUrl);
 await presenter.goto(`http://127.0.0.1:${srv.port}/presenter?token=${srv.keys.presenter}`);
 await presenter.getByRole('heading',{name:'Spielleitung'}).waitFor();
 await team.goto(`http://127.0.0.1:${srv.port}/team?token=${srv.keys.teams[0]}`);
 await host.locator('[data-action="intro"][data-mode="pictures"]').click();
 await presenter.getByRole('button',{name:'Rubrik starten →'}).click();
 await presenter.getByRole('button',{name:'Nächste Kachel +'}).click();
 await host.waitForFunction(()=>document.querySelectorAll('.tile.open').length===1);
 assert.equal(await host.locator('.tile.open').count(),1);
 await team.getByRole('button',{name:'BUZZ!'}).click();
 await presenter.getByText('Himmelblau',{exact:true}).waitFor();
 await presenter.getByRole('button',{name:'✓ Richtig'}).click();
 await host.getByText('DJ Ötzi',{exact:true}).waitFor();
 assert.equal(await presenter.locator('.presenter-controls').count(),1);
 assert.deepEqual(errors,[]);
 const out=path.resolve('outputs/gameshow-app/test/moderatorin-handy.png');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 await presenter.screenshot({path:out,fullPage:false});
 console.log(`Moderatorinnen-QR-Zugang und mobile Steuerung OK. Screenshot: ${out}`);
}finally{
 await browser.close();
 await srv.close();
 fs.rmSync(dir,{recursive:true,force:true});
}
