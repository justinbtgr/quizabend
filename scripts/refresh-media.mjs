// Targeted, repeatable asset import. Old images remain available for recovery.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'asset-sources.json')));
const songs=JSON.parse(fs.readFileSync(path.join(root,'assets/songs/song-manifest.json'))).songs;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const get=async url=>{for(let attempt=0;attempt<4;attempt++){const r=await fetch(url,{headers:{'User-Agent':'PrivateQuizabend/1.0'},signal:AbortSignal.timeout(25000)});if(r.ok)return r;if(r.status!==429||attempt===3)throw new Error(`${r.status} ${url}`);await sleep(5000*(attempt+1));}throw new Error('request failed');};
const json=async u=>(await get(u)).json();
const clean=s=>s.replaceAll('&amp;','&');
async function saveImage(url,base){const r=await get(url);const type=r.headers.get('content-type')?.split(';')[0];const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/svg+xml':'.svg'}[type];if(!ext)throw new Error('Not an image: '+type);const file=base+ext;fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),Buffer.from(await r.arrayBuffer()));return file;}
const companyTitles=['Amazon_(company)','Walmart','Saudi_Aramco','Apple_Inc.','Volkswagen','Nvidia','Allianz','Nestlé','REWE','The_Coca-Cola_Company','Vodafone','Netflix','Lufthansa','Starbucks','PayPal'];
const companyFiles=['Amazon_2024.svg','Walmart_logo_(2025).svg','Saudi_Aramco_logo.svg','Apple_logo_black.svg','Volkswagen_logo_2019.svg','NVIDIA_logo.svg','Allianz.svg','Nestlé.svg','Logo_REWE.svg','Coca-Cola_logo.svg','Vodafone_2017_logo.svg','Netflix_2016_N_logo.svg','Lufthansa_Logo_2018.svg','Starbucks_Corporation_Logo_2011.svg','PayPal_2024.svg'];
const animalTitles=['Greenland_shark','Bowhead_whale','Galápagos_tortoise','Human','African_bush_elephant','Macaw','Dromedary','Naked_mole-rat','Horse','Cat','Dog','Lion','Rabbit','Bat','House_mouse'];
const buildingTitles=['Burj_Khalifa','Shanghai_Tower','Empire_State_Building','Eiffel_Tower','Messeturm','Sagrada_Família','Cologne_Cathedral','Great_Pyramid_of_Giza','St._Peter\'s_Basilica','Big_Ben','Notre-Dame_de_Paris','Allianz_Arena','Brandenburg_Gate','Chinon_Center','Great_Wall_of_China'];
async function wikiImage(title,lang='en'){const j=await json(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);if(!j.thumbnail)throw new Error('No thumbnail for '+title);return {imageUrl:j.thumbnail.source,sourceUrl:j.content_urls.desktop.page,author:'See linked file credit',license:'See linked Wikimedia file page'};}
async function importAsset(a){const index=+a.id.split('-')[1];let source;
 if(a.category==='companies'){
  const sourceUrl='https://en.wikipedia.org/wiki/'+encodeURIComponent(companyTitles[index]);const html=await(await get(sourceUrl)).text();const img=[...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)].map(m=>clean(m[1])).find(u=>decodeURIComponent(u).includes('/'+companyFiles[index]+'/'));
  if(!img)throw new Error('Exact logo not found: '+a.name);source={imageUrl:'https:'+img,sourceUrl,author:a.name,license:'Company trademark; see linked file page'};
 }else if(a.id==='channels-14'){
  const sourceUrl='https://www.twitch.tv/lamylive',html=await(await get(sourceUrl)).text();const imageUrl=html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/i)?.[1];if(!imageUrl)throw new Error('No Twitch profile image');source={imageUrl,sourceUrl,author:'LamyLive',license:'Profile image; rights belong to account owner'};
 }else source=await wikiImage((a.category==='animals'?animalTitles:buildingTitles)[index],a.id==='buildings-13'?'de':'en');
 const u=new URL(source.imageUrl);u.search='';source.imageUrl=u.href;
 const match=decodeURIComponent(u.pathname).match(/\/wikipedia\/(commons|en)\/thumb\/[^/]+\/[^/]+\/([^/]+)\//);
 if(match)source.filePage=`https://${match[1]==='commons'?'commons.wikimedia.org':'en.wikipedia.org'}/wiki/File:${encodeURIComponent(match[2])}`;
 const file=await saveImage(source.imageUrl,`assets/higher/revised/${a.id}`);
 Object.assign(a,source,{file,status:'downloaded',reviewed:false});delete a.failureReason;console.log('OK',a.id,a.name);
}
const targets=manifest.assets.filter(a=>!a.userProvided&&(['companies','animals','buildings'].includes(a.category)||a.id==='channels-14'));
for(const target of targets){await importAsset(target).catch(e=>console.log('FAIL',target.id,e.message));await sleep(1500);}
fs.writeFileSync(path.join(root,'asset-sources.json'),JSON.stringify(manifest,null,2)+'\n');
const coverFile=path.join(root,'assets/songs/covers.json');const covers=fs.existsSync(coverFile)?JSON.parse(fs.readFileSync(coverFile)):[];
for(const song of songs){try{const j=await json('https://itunes.apple.com/search?'+new URLSearchParams({term:song.artist+' '+song.title,entity:'song',limit:'12',country:'de'}));const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');const title=norm(song.title);const hit=j.results.find(r=>norm(r.trackName).includes(title)&&norm(r.artistName).includes(norm(song.artist.split(' feat.')[0])))||j.results.find(r=>norm(r.trackName).includes(title));if(!hit)throw new Error('No matching result');const imageUrl=hit.artworkUrl100.replace('100x100bb','600x600bb');const file=await saveImage(imageUrl,`assets/songs/covers/${song.id}`);const entry={id:song.id,title:song.title,matchedTitle:hit.trackName,artist:hit.artistName,album:hit.collectionName,file,imageUrl,sourceUrl:hit.trackViewUrl,license:'Album/single artwork; rights belong to publisher'};const ix=covers.findIndex(c=>c.id===song.id);if(ix<0)covers.push(entry);else covers[ix]=entry;console.log('COVER',song.id,hit.artistName,hit.trackName);}catch(e){console.log('COVER FAIL',song.id,e.message);}}
fs.writeFileSync(coverFile,JSON.stringify(covers,null,2)+'\n');
