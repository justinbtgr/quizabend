import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quizabend-team-display-'));
const srv=await startServer({port:0,dataDir:dir});
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const host=await browser.newPage({viewport:{width:1600,height:900}}),team=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
host.on('pageerror',error=>errors.push(error.message));
try{
 await host.goto(srv.hostUrl);
 await team.goto(`http://127.0.0.1:${srv.port}/team?token=${srv.keys.teams[0]}`);
 await host.locator('[data-action="intro"][data-mode="pictures"]').click();
 await host.getByRole('button',{name:'Rubrik starten →'}).click();
 const board=host.locator('.game-scoreboard'),toolbar=host.locator('.toolbar');
 await board.waitFor();
 const boardBox=await board.boundingBox(),toolbarBox=await toolbar.boundingBox();
 assert.ok(boardBox.y>600,'Teamkarten müssen im unteren Bildschirmbereich stehen.');
 assert.ok(boardBox.y+boardBox.height<=toolbarBox.y+2,'Teamkarten dürfen die Steuerleiste nicht überdecken.');
 assert.equal(await host.locator('body[class*="buzz-team-"]').count(),0);
 await team.getByRole('button',{name:'BUZZ!'}).click();
 await host.locator('body.buzz-team-0').waitFor();
 await host.waitForTimeout(250);
 assert.equal(await board.locator('.score.active').count(),1);
 assert.equal((await board.locator('.score.active .name').innerText()).trim(),'Himmelblau');
 const overlay=await host.evaluate(()=>getComputedStyle(document.body,'::before').opacity);
 assert.ok(Number(overlay)>=.4,'Der Teamfarb-Layer muss deutlich sichtbar sein.');
 const layout=await host.evaluate(()=>({width:innerWidth,height:innerHeight,boardColumns:getComputedStyle(document.querySelector('.game-scoreboard')).gridTemplateColumns,pictureWidth:document.querySelector('.picture-wrap')?.getBoundingClientRect().width}));
 if(layout.boardColumns==='none')console.log(await host.evaluate(()=>[...document.styleSheets].map(sheet=>({href:sheet.href,rules:[...sheet.cssRules].map(rule=>rule.selectorText).filter(Boolean).filter(selector=>selector.includes('score'))}))));
 assert.equal(layout.width,1600);
 assert.match(layout.boardColumns,/px .*px .*px/);
 assert.ok(layout.pictureWidth<=490);
 const out=path.resolve('outputs/gameshow-app/test/team-buzz-unten.png');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 await host.screenshot({path:out,fullPage:false});
 assert.deepEqual(errors,[]);
 console.log(`Teamkarten unten und Vollbild-Buzzerfarbe OK. Screenshot: ${out}`);
}finally{
 await browser.close();
 await srv.close();
 fs.rmSync(dir,{recursive:true,force:true});
}
