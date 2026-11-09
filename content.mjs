import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// The first round is announced as 0.1 seconds in the show UI, but intentionally
// plays 0.3 seconds so the excerpt is reliably audible on TV/browser audio paths.
export const stages = [0.3, 1, 5, 10, 15, 20];
export const songs = JSON.parse(readFileSync(new URL('./assets/songs/song-manifest.json', import.meta.url))).songs;
export const pictures = [
 ['01_channels4_profile.jpg','DJ Ötzi'],['02_great_wall_of_china.jpg','Chinesische Mauer'],
 ['03_reichstagskuppel_innen.jpg','Reichstagskuppel'],['04_gebauede_tuerme.png','Großer Feldberg'],
 ['05_lego.png','LEGO'],['06_barbar.png','Clash-of-Clans-Barbar'],['07_startblock.jpg','Startblock'],['08_jinx.jpg','Jinx']
].map(([file,answer],id)=>({id,file,answer}));
const cat = (id,name,unit,description,rows) => ({id,name,unit,description,items:rows.map(([name,value,extra],i)=>{const publicId='card-'+createHash('sha256').update('Quizabend Kartenkennung '+id+' '+name).digest('hex').slice(0,16);return {id:`${id}-${i}`,publicId,name,value,extra:extra||'',image:`/visual/${publicId}`};})});
export const categories = [
 cat('channels','YouTube-Kanäle','Abonnenten','Fester Show-Datenstand aus eurer Liste.',[
 ['MrBeast',517e6],['PewDiePie',109e6],['Dude Perfect',62.7e6],['IShowSpeed',61.4e6],['Gronkh',5.04e6],['Rewinside',3.43e6],['MontanaBlack',2.98e6],['HandOfBlood',2.96e6],['Simplicissimus',2.56e6],['Knossi',1.64e6],['Papaplatte',1.34e6],['ELoTRiX',1.26e6],['Zarbex',642e3],['Arda Saatçi',1.69e6],['Lord Lamy',26500,'mindestens']]),
 cat('companies','Unternehmensumsatz','Mio. US-Dollar','Fortune Global 500, Ausgabe 2026 · Geschäftsjahre bis 31. März 2026 · Umrechnung nach Fortune.',[
 ['Amazon',716924],['Walmart',713163],['Saudi Aramco',445528.7],['Apple',416161],['Volkswagen',363090.5],['Nvidia',215938],['Allianz',133983.9],['Nestlé',107737.1],['Rewe',102755.4],['Coca-Cola',47941],['Vodafone',46906.3],['Netflix',45183],['Lufthansa',44662.1],['Starbucks',37184.4],['PayPal',33172]]),
 cat('animals','Alter von Tieren','Jahre','Ungefähre Alterswerte gemäß eurer Tabelle; kein einheitlicher Rekord- oder Durchschnittswert.',[
 ['Grönlandhai',250],['Grönlandwal',150],['Galápagos-Riesenschildkröte',100],['Mensch',73],['Afrikanischer Elefant',65],['Ara-Papagei',50],['Dromedar',40],['Nacktmull',30],['Pferd',27],['Hauskatze',15],['Hund',12],['Männlicher Löwe',10],['Kaninchen',9],['Fledermaus',6],['Hausmaus',2]]),
 cat('travel','Beliebte Reiseziele','Mio. Personenreisen','Eurostat 2024 · Private Reisen der deutschen Wohnbevölkerung ab 15 Jahren, mindestens 4 Übernachtungen, nach Hauptreiseziel. Vier Personen ab 15 = vier Reisen; Kinder unter 15 sind nicht enthalten.',[
 ['Deutschland',50.45,'de'],['Italien',13.20,'it'],['Spanien',9.88,'es'],['Österreich',8.61,'at'],['Frankreich',5.90,'fr'],['Türkei',3.81,'tr'],['Niederlande',3.70,'nl'],['Griechenland',3.60,'gr'],['Portugal',3.05,'pt'],['Dänemark',2.72,'dk'],['USA',2.38,'us'],['Vereinigtes Königreich',2.13,'gb'],['Polen',2.07,'pl'],['Kroatien',1.99,'hr'],['Schweiz',1.75,'ch']]),
 cat('buildings','Höhe von Bauwerken','Meter','Höhen gemäß eurer Tabelle. Chinon Center ca. 20 m; Chinesische Mauer im Mittel ca. 6–7 m (Sortierwert 6,5).',[
 ['Burj Khalifa',828],['Shanghai Tower',632],['Empire State Building',381],['Eiffelturm',330],['Messeturm Frankfurt',257],['Sagrada Família',172.5],['Kölner Dom',157.4],['Cheops-Pyramide',138.5],['Petersdom',136],['Big Ben / Elizabeth Tower',96.3],['Notre-Dame de Paris',96],['Allianz Arena',52],['Brandenburger Tor',26],['Chinon Center Hofheim',20,'ca.'],['Chinesische Mauer',6.5,'ca. 6–7']])
];
export const packetMap = {E:1,S:2,A:3,Y:4};
export const colorNames = ['Himmelblau','Apricot','Lavendel'];
