import fs from 'node:fs';
const companies=['Amazon_(company)','Allianz','Nestlé','PayPal'];
for(const name of companies){try{const t=await(await fetch('https://en.wikipedia.org/wiki/'+encodeURIComponent(name))).text();const imgs=[...t.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)].map(m=>m[1]).filter(s=>s.includes('wikimedia'));console.log(name,JSON.stringify([...new Set(imgs)].slice(0,5)));}catch(e){console.log(name,e.message)}}
