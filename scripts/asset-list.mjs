import fs from 'node:fs';
import {categories} from '../content.mjs';
const pages={
 channels:['MrBeast','PewDiePie','Dude Perfect','IShowSpeed','Gronkh','Rewinside','MontanaBlack','HandOfBlood','Simplicissimus (YouTube-Kanal)','Knossi','Papaplatte','ELoTRiX','Zarbex','Arda Saatçi','Lord Lamy'],
 companies:['Amazon (company)','Walmart','Saudi Aramco','Apple Inc.','Volkswagen Group','Nvidia','Allianz','Nestlé','REWE Group','The Coca-Cola Company','Vodafone','Netflix','Lufthansa','Starbucks','PayPal'],
 animals:['Greenland shark','Bowhead whale','Galápagos tortoise','Human','African elephant','Macaw','Dromedary','Naked mole-rat','Horse','Cat','Dog','Lion','Rabbit','Bat','House mouse'],
 travel:['Germany','Italy','Spain','Austria','France','Turkey','Netherlands','Greece','Portugal','Denmark','United States','United Kingdom','Poland','Croatia','Switzerland'],
 buildings:['Burj Khalifa','Shanghai Tower','Empire State Building','Eiffel Tower','Messeturm','Sagrada Família','Cologne Cathedral','Great Pyramid of Giza',"St. Peter's Basilica",'Big Ben','Notre-Dame de Paris','Allianz Arena','Brandenburg Gate','Chinon Center Hofheim','Great Wall of China']
};
const list=categories.flatMap(c=>c.items.map((item,index)=>({id:item.id,name:item.name,category:c.id,desired:c.id==='channels'?'Kanalbild / Profilbild':c.id==='companies'?'Logo':c.id==='travel'?'Länderflagge':'Foto',file:`assets/higher/${item.id}.jpg`,alternativeExtensions:['.png','.jpeg','.webp','.svg'],suggestedWikipediaTitle:pages[c.id][index],sourceUrl:null,author:null,license:null,status:'missing'})));
const target=new URL('../asset-sources.json',import.meta.url);if(!fs.existsSync(target))fs.writeFileSync(target,JSON.stringify({note:'Benötigte lokale Motive; fehlende Bilder werden klar markiert. Quellen und Lizenz nach Beschaffung ergänzen.',assets:list},null,2));
console.log('Bildzuordnung: asset-sources.json');
