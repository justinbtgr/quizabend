import { randomBytes } from 'node:crypto';
import {songs,pictures,categories,stages,packetMap,colorNames} from './content.mjs';
const clone = x => structuredClone(x);
const requireThat = (ok,msg='Diese Aktion ist gerade nicht möglich.') => {if(!ok) throw new Error(msg);};
const integer = (n,min,max) => Number.isInteger(n)&&n>=min&&n<=max;
const shuffled = () => Array.from({length:16},(_,i)=>i).sort(()=>Math.random()-.5);
const timeSeconds = points => Math.min(points,10)*30+Math.max(points-10,0)*15;
export function initialState() {
 return {version:1,revision:0,epoch:1,mode:'setup',pending:'songs',paused:false,pausedAt:null,buzzEnabled:true,
 teams:colorNames.map((name,id)=>({id,name,score:0})),round:null,feedback:null,event:null,
 settings:{volume:.35,muted:false,songs:songs.map(s=>({start:s.suggestedStartSeconds,confirmed:false,asset:s.asset,placeholder:s.assetKind==='placeholder'})),pictures:pictures.map(()=>({x:50,y:50,order:shuffled()}))},
 finale:null,createdAt:Date.now()};
}
export function createEngine(state=initialState(),history=[]) {
 let s=clone(state), undo=clone(history);
 function emit(type,team=null) {s.event={id:randomBytes(8).toString('hex'),type,team};}
 function nextEligible(after) {for(let i=1;i<=3;i++){const t=(after+i)%3;if(s.round.lives[t]>0)return t;}return null;}
 function resetDecision(r) {r.active=null;r.answerStartedAt=null;r.followup=false;r.offers=[];r.responses={};r.wheelCandidates=[];r.wheelWinner=null;r.wheelStartedAt=null;}
 function songStage() {
  const r=s.round;r.phase='open';resetDecision(r);
  if(r.attempts.every(x=>x===0)||r.stage>=stages.length){r.phase='revealed';r.stage=Math.min(r.stage,5);}
 }
 function advanceSegment() {
  const r=s.round;resetDecision(r);
  if(s.mode==='songs'){r.stage++;songStage();}
  else if(r.revealed.length===16||r.attempts.every(x=>x===0))r.phase='revealed';
  else r.phase='advance';
 }
 function finishPoll() {
  const r=s.round;if(r.offers.some(t=>r.responses[t]===undefined))return;
  const candidates=r.offers.filter(t=>r.responses[t]);
  if(candidates.length===0){advanceSegment();return;}
  if(candidates.length===1){r.active=candidates[0];r.phase='answer';r.followup=true;r.answerStartedAt=Date.now();r.offers=[];r.responses={};return;}
  r.phase='wheel';r.wheelCandidates=candidates;r.wheelWinner=candidates[Math.floor(Math.random()*candidates.length)];r.wheelStartedAt=Date.now();r.active=null;r.answerStartedAt=null;
 }
 function startPoll(after) {
  const r=s.round;r.phase='poll';r.active=null;r.answerStartedAt=null;r.followup=false;r.offers=[0,1,2].filter(t=>t!==after&&r.attempts[t]>0);r.responses={};r.wheelCandidates=[];r.wheelWinner=null;r.wheelStartedAt=null;
  if(r.offers.length===0)advanceSegment();
 }
 function finalizeShops() {
  const f=s.finale;if(!f.shops.every(x=>x.committed))return;
  f.phase='ready';const seconds=f.shops.map(x=>timeSeconds(x.time)),max=Math.max(...seconds);f.delays=seconds.map(x=>max-x);
 }
 function startRound(mode,index=0) {
  s.mode=mode;s.paused=false;s.buzzEnabled=true;s.feedback=null;
  if(mode==='songs'||mode==='pictures') s.round={index,phase:'open',active:null,answerStartedAt:null,attempts:[2,2,2],stage:0,followup:false,offers:[],responses:{},wheelCandidates:[],wheelWinner:null,wheelStartedAt:null,revealed:[]};
  if(mode==='higher') {const c=categories[index],referenceIndex=4+Math.floor(Math.random()*7),reference=c.items[referenceIndex].id;const poolOrder=c.items.map(i=>i.id);for(let i=poolOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[poolOrder[i],poolOrder[j]]=[poolOrder[j],poolOrder[i]];}s.round={index,phase:'placing',active:index%3,lives:[3,3,3],placed:[reference],reference,poolOrder,selected:null,gap:null,winner:null,winners:[]};}
  if(mode==='finale') {s.round=null;s.finale={phase:'shop',shops:s.teams.map(t=>({budget:t.score,balance:t.score,letters:[],time:0,committed:false})),delays:null,startedAt:null,winner:null};}
 }
 function eligible(t) {return !s.paused&&s.buzzEnabled&&s.round?.phase==='open'&&s.round.attempts?.[t]>0;}
 function dispatch(action,actor='host',epoch=s.epoch) {
  requireThat(action&&typeof action.type==='string');const type=action.type;const host=actor==='host';
  const team=Number(actor);if(!host)requireThat(integer(team,0,2),'Unbekanntes Team.');
  const teamActions=['buzz','answer','pass','buy','timeDelta','commit'];
  requireThat(host||teamActions.includes(type),'Nur die Spielleitung kann das tun.');
  if(['buzz','answer','pass','buy','commit','correct','wrong','wheelDone','nextStage','next','tile','select','place','confirm','play','startFinale','winner'].includes(type))requireThat(epoch===s.epoch,'Der Spielstand hat sich geändert. Bitte noch einmal versuchen.');
  if(s.paused)requireThat(host&&['resume','settings','correctTeam','manualBuzz','undo','reopenShop','reset'].includes(type),'Die Show ist pausiert.');
  const before=clone(s);const oldUndo=clone(undo);
  try {
   s.feedback=null;s.event=null;const r=s.round;
   switch(type) {
    case 'intermission': requireThat(['songs','pictures','higher','finale'].includes(action.mode));s.mode='intermission';s.pending=action.mode;s.round=null;s.paused=false;break;
    case 'begin':requireThat(s.mode==='setup'||s.mode==='intermission');startRound(s.pending);break;
    case 'next': {
     requireThat(r?.phase==='revealed');const mode=s.mode;const limit=mode==='songs'?songs.length:mode==='pictures'?pictures.length:categories.length;
     if(r.index+1<limit)startRound(mode,r.index+1);else {s.mode='intermission';s.pending={songs:'pictures',pictures:'higher',higher:'finale'}[mode];s.round=null;}break;
    }
    case 'buzz': case 'manualBuzz': {
     const t=host?Number(action.team):team;requireThat(integer(t,0,2));
     if(s.mode==='setup'||s.mode==='intermission'){requireThat(!s.paused&&s.buzzEnabled);emit('buzz',t);s.feedback={text:`${s.teams[t].name} · Buzzer funktioniert`,kind:'ok'};break;}
     requireThat(['songs','pictures'].includes(s.mode));
     if(type==='manualBuzz')requireThat(r.phase==='open'&&r.attempts[t]>0);else requireThat(eligible(t),'Buzzer ist gesperrt.');
     r.active=t;r.phase='answer';r.followup=false;r.answerStartedAt=Date.now();emit('buzz',t);break;
    }
    case 'answer':case 'pass': {
     requireThat(!host&&['songs','pictures'].includes(s.mode)&&r.phase==='poll'&&r.offers.includes(team)&&r.responses[team]===undefined);
     r.responses[team]=type==='answer';finishPoll();break;
    }
    case 'wheelDone': {
     requireThat(host&&['songs','pictures'].includes(s.mode)&&r.phase==='wheel'&&integer(r.wheelWinner,0,2));
     const winner=r.wheelWinner,remaining=r.wheelCandidates.filter(t=>t!==winner);
     r.active=winner;r.phase='answer';r.followup=true;r.answerStartedAt=Date.now();r.offers=remaining;r.responses={};r.wheelCandidates=[];r.wheelWinner=null;r.wheelStartedAt=null;emit('buzz',r.active);break;
    }
    case 'correct':case 'wrong': {
     requireThat(host&&['songs','pictures'].includes(s.mode)&&r.phase==='answer');const t=r.active;r.answerStartedAt=null;
     if(type==='correct'){s.teams[t].score+=s.mode==='songs'?1:2;r.phase='revealed';r.winner=t;emit('correct',t);}
     else {r.attempts[t]--;emit('wrong',t);s.feedback={text:'Leider falsch · ein Versuch weniger',kind:'bad'};
      if(r.followup&&r.offers.length){r.phase='poll';r.active=null;r.answerStartedAt=null;r.followup=false;r.responses={};}
      else if(r.followup)advanceSegment();else startPoll(t);}
     break;
    }
    case 'nextStage':requireThat(s.mode==='songs'&&['open','advance'].includes(r.phase));r.stage++;songStage();break;
    case 'play':requireThat(s.mode==='songs'&&['open','revealed'].includes(r.phase));emit('play');break;
    case 'stopAudio':requireThat(host);emit('stop');break;
    case 'reveal':requireThat(host&&r);r.phase='revealed';if(['songs','pictures'].includes(s.mode))resetDecision(r);if(s.mode==='higher'){r.selected=null;r.gap=null;}emit('stop');break;
    case 'tile': {
     requireThat(s.mode==='pictures'&&['open','advance'].includes(r.phase));const order=s.settings.pictures[r.index].order;
     const tile=action.tile??order.find(t=>!r.revealed.includes(t));requireThat(integer(tile,0,15)&&!r.revealed.includes(tile));r.revealed.push(tile);r.phase='open';resetDecision(r);break;
    }
    case 'select':{requireThat(s.mode==='higher'&&r.phase==='placing');const item=categories[r.index].items.find(i=>i.id===action.id||i.publicId===action.id);requireThat(item&&!r.placed.includes(item.id));r.selected=item.id;r.gap=null;break;}
    case 'place':requireThat(s.mode==='higher'&&r.phase==='placing'&&r.selected&&integer(action.gap,0,r.placed.length));r.gap=action.gap;break;
    case 'cancel':requireThat(s.mode==='higher'&&r.phase==='placing');r.selected=null;r.gap=null;break;
    case 'confirm': {
     requireThat(s.mode==='higher'&&r.phase==='placing'&&r.selected&&r.gap!==null);const c=categories[r.index], value=id=>c.items.find(i=>i.id===id).value;
     const v=value(r.selected),left=r.gap===0?-Infinity:value(r.placed[r.gap-1]),right=r.gap===r.placed.length?Infinity:value(r.placed[r.gap]);
     const ok=v>=left&&v<=right;emit(ok?'correct':'wrong',r.active);
     s.feedback={text:ok?'Richtig eingeordnet!':'Leider falsch · zurück in den Pool',kind:ok?'ok':'bad'};
     if(ok)r.placed.splice(r.gap,0,r.selected);else r.lives[r.active]--;
     r.selected=null;r.gap=null;
     const live=r.lives.map((l,t)=>l>0?t:null).filter(t=>t!==null);
     if(live.length===1){r.winner=live[0];s.teams[live[0]].score+=3;r.phase='revealed';}
     else if(r.placed.length===c.items.length&&live.length===3){r.winners=[0,1,2];for(const t of live)s.teams[t].score+=3;r.phase='revealed';s.feedback={text:'Alle drei Teams sind durchgekommen · jeweils +3 Punkte',kind:'ok'};emit('correct');}
     else if(r.placed.length===c.items.length){r.phase='tie';s.feedback={text:'Alle Karten liegen richtig. Zwei Teams leben noch – Spielleitung entscheidet den Rundensieg.',kind:'notice'};}
     else r.active=nextEligible(r.active);break;
    }
    case 'higherWinner':requireThat(s.mode==='higher'&&r.phase==='tie'&&integer(action.team,0,2)&&r.lives[action.team]>0);r.winner=action.team;s.teams[action.team].score+=3;r.phase='revealed';emit('correct',action.team);break;
    case 'buzzer':requireThat(host);s.buzzEnabled=!!action.enabled;break;
    case 'resetBuzz':requireThat(host);if(r&&['answer','poll','wheel','advance'].includes(r.phase)&&['songs','pictures'].includes(s.mode)){resetDecision(r);r.phase='open';}emit('stop');break;
    case 'pause':requireThat(host&&!s.paused);s.paused=true;s.pausedAt=Date.now();emit('stop');break;
    case 'resume':requireThat(host&&s.paused);{const pauseDuration=Date.now()-s.pausedAt;if(s.finale?.startedAt)s.finale.startedAt+=pauseDuration;if(s.round?.answerStartedAt)s.round.answerStartedAt+=pauseDuration;if(s.round?.wheelStartedAt)s.round.wheelStartedAt+=pauseDuration;s.paused=false;s.pausedAt=null;}break;
    case 'settings': {
     requireThat(host);if(action.names){requireThat(action.names.length===3);s.teams.forEach((t,i)=>t.name=String(action.names[i]).trim().slice(0,35)||colorNames[i]);}
     if(action.volume!==undefined){requireThat(Number.isFinite(action.volume)&&action.volume>=0&&action.volume<=1);s.settings.volume=action.volume;}
     if(action.muted!==undefined)s.settings.muted=!!action.muted;
     if(action.song){requireThat(s.mode==='setup','Inhalte sind nur vor der Show zugänglich.');const {index,start,confirmed}=action.song;requireThat(integer(index,0,14)&&Number.isFinite(start)&&start>=0&&start<7200);Object.assign(s.settings.songs[index],{start,confirmed:!!confirmed});}
     if(action.songs){requireThat(s.mode==='setup','Inhalte sind nur vor der Show zugänglich.');requireThat(Array.isArray(action.songs)&&action.songs.length===songs.length,'Bitte Startzeiten für alle Songs angeben.');action.songs.forEach((entry,index)=>{requireThat(entry&&Number.isFinite(entry.start)&&entry.start>=0&&entry.start<7200,'Ungültiger Songstart.');s.settings.songs[index].start=Math.round(entry.start*100)/100;s.settings.songs[index].confirmed=true;});}
     if(action.picture){requireThat(s.mode==='setup');const {index,x,y,order}=action.picture;requireThat(integer(index,0,7)&&[x,y].every(v=>Number.isFinite(v)&&v>=0&&v<=100)&&Array.isArray(order)&&order.length===16&&new Set(order).size===16&&order.every(v=>integer(v,0,15)));s.settings.pictures[index]={x,y,order};}
     break;
    }
    case 'correctTeam': {
     requireThat(host&&integer(action.team,0,2));if(action.score!==undefined){requireThat(integer(action.score,0,999));requireThat(s.mode!=='finale','Finalguthaben bleibt nach Shopstart unverändert.');s.teams[action.team].score=action.score;}
     if(action.lives!==undefined){requireThat(s.mode==='higher'&&r.phase==='placing'&&integer(action.lives,0,3));r.lives[action.team]=action.lives;const live=r.lives.map((l,t)=>l>0?t:null).filter(t=>t!==null);requireThat(live.length>0);if(live.length===1){r.winner=live[0];s.teams[live[0]].score+=3;r.phase='revealed';}else if(r.lives[r.active]===0)r.active=nextEligible(r.active);}
     if(action.attempts!==undefined){requireThat(['songs','pictures'].includes(s.mode)&&integer(action.attempts,0,2));r.attempts[action.team]=action.attempts;}break;
    }
    case 'buy': {
     requireThat(!host&&s.mode==='finale'&&s.finale.phase==='shop');const shop=s.finale.shops[team];requireThat(!shop.committed);
     if(action.letter){requireThat(Object.hasOwn(packetMap,action.letter));const selected=shop.letters.includes(action.letter);if(selected){shop.letters=shop.letters.filter(x=>x!==action.letter);shop.balance+=5;}else{requireThat(shop.balance>=5);shop.letters.push(action.letter);shop.balance-=5;}}
     else {requireThat(integer(action.count,1,999)&&shop.balance>=action.count);shop.time+=action.count;shop.balance-=action.count;}break;
    }
    case 'timeDelta': {
     requireThat(!host&&s.mode==='finale'&&s.finale.phase==='shop');const shop=s.finale.shops[team];requireThat(!shop.committed&&integer(action.delta,-1,1));
     if(action.delta>0)requireThat(shop.balance>=1,'Nicht genug Punkte für weiteren Zeitvorsprung.');
     requireThat(shop.time+action.delta>=0);shop.time+=action.delta;shop.balance-=action.delta;break;
    }
    case 'commit':requireThat(!host&&s.mode==='finale'&&s.finale.phase==='shop');requireThat(s.finale.shops[team].balance===0,'Bitte zuerst alle Punkte verteilen.');s.finale.shops[team].committed=true;finalizeShops();break;
    case 'reopenShop':requireThat(host&&s.mode==='finale'&&['shop','ready'].includes(s.finale.phase)&&integer(action.team,0,2));s.finale.shops[action.team].committed=false;s.finale.phase='shop';s.finale.delays=null;break;
    case 'manualShop':{
     requireThat(host&&s.mode==='finale'&&s.finale.phase==='shop'&&integer(action.team,0,2));const sh=s.finale.shops[action.team];requireThat(!sh.committed);requireThat(integer(action.time,0,sh.balance));sh.time+=action.time;sh.balance-=action.time;requireThat(sh.balance===0,'Es müssen alle Punkte verteilt werden.');sh.committed=true;finalizeShops();break;
    }
    case 'startFinale':requireThat(host&&s.mode==='finale'&&s.finale.phase==='ready');s.finale.phase='running';s.finale.startedAt=Date.now()+5000;break;
    case 'winner':requireThat(host&&s.mode==='finale'&&s.finale.phase==='running'&&integer(action.team,0,2));s.finale.winner=action.team;s.finale.phase='finished';emit('win',action.team);break;
    case 'undo':requireThat(host&&undo.length>0,'Noch nichts zum Rückgängigmachen.');s=undo.pop();s.event=null;break;
    case 'reset':requireThat(host&&action.confirm==='NEUE SHOW');{const settings=clone(s.settings),names=s.teams.map(t=>t.name);s=initialState();s.settings=settings;s.teams.forEach((t,i)=>t.name=names[i]);undo=[];}break;
    default:throw new Error('Unbekannte Aktion.');
   }
   if(!['undo','reset','play','stopAudio','pause','resume','settings','select','place','cancel','buy','timeDelta','commit'].includes(type)){undo.push(before);if(undo.length>80)undo.shift();}
   // Purchases never enter public undo: undoing host actions must not undo private shopping.
   if(s.mode==='finale'&&type==='buy')undo=[];
   s.revision=before.revision+1;
   // Shop submissions are independent for different teams. Buzz epochs change only when eligibility changes.
   const waitingForSecondVote=['answer','pass'].includes(type)&&before.round?.phase==='poll'&&s.round?.phase==='poll';
   s.epoch=before.epoch+(!waitingForSecondVote&&['buzz','manualBuzz','correct','wrong','pass','answer','wheelDone','nextStage','next','begin','intermission','buzzer','resetBuzz','pause','resume','undo','reset','reveal','confirm','higherWinner','startFinale','winner','correctTeam'].includes(type)?1:0);
   return clone(s);
  } catch(e){s=before;undo=oldUndo;throw e;}
 }
 function view(actor='public') {
  const host=actor==='host',t=Number(actor),isTeam=integer(t,0,2)&&actor!=='public';
  const v={version:s.version,revision:s.revision,epoch:s.epoch,mode:s.mode,pending:s.pending,paused:s.paused,pausedAt:s.pausedAt,buzzEnabled:s.buzzEnabled,teams:clone(s.teams),feedback:clone(s.feedback),event:clone(s.event),canUndo:host&&undo.length>0,settings:{volume:s.settings.volume,muted:s.settings.muted},serverTime:Date.now()};
  if(s.round){v.round=clone(s.round);const r=s.round;
   if(s.mode==='songs'){v.round.total=songs.length;v.round.duration=stages[r.stage];if(host)v.round.audio=`/media/song/${r.index}`;v.round.start=s.settings.songs[r.index].start;if(r.phase==='revealed'){v.round.answer=songs[r.index].title;v.round.cover=`/media/cover/${r.index}`;}}
   if(s.mode==='pictures'){v.round.total=pictures.length;v.round.crop=clone(s.settings.pictures[r.index]);delete v.round.crop.order;if(host)v.round.image=`/media/picture/${r.index}`;if(r.phase==='revealed')v.round.answer=pictures[r.index].answer;}
   if(s.mode==='higher'){const c=categories[r.index],key=id=>c.items.find(i=>i.id===id)?.publicId||null;v.round.total=categories.length;v.round.reference=key(r.reference||c.items[7].id);v.round.category={id:c.id,name:c.name,unit:c.unit,description:r.phase==='revealed'?c.description:''};v.round.items=(r.poolOrder||c.items.map(i=>i.id)).map(id=>c.items.find(i=>i.id===id)).map(i=>({id:i.publicId,name:i.name,image:i.image,...(r.phase==='revealed'||r.placed.includes(i.id)?{value:i.value,extra:i.extra}:{})}));v.round.placed=r.placed.map(key);v.round.selected=key(r.selected);delete v.round.poolOrder;if(r.phase==='revealed')v.round.placed=[...c.items].sort((a,b)=>a.value-b.value).map(i=>i.publicId);}
  }
  if(s.finale){const f=s.finale;v.finale={phase:f.phase,completed:f.shops.filter(x=>x.committed).length,committed:f.shops.map(x=>x.committed),delays:f.phase==='shop'?null:f.delays,startedAt:f.startedAt,winner:f.winner};if(f.phase!=='shop')v.finale.summary=f.shops.map((sh,i)=>({team:i,timePoints:sh.time,timeSeconds:timeSeconds(sh.time),delay:f.delays[i]}));if(isTeam){const sh=clone(f.shops[t]);sh.timeSeconds=timeSeconds(sh.time);sh.hints=f.phase==='shop'?{}:Object.fromEntries(sh.letters.map(l=>[l,packetMap[l]]));v.finale.shop=sh;}}
  if(isTeam)v.me=t;
  return v;
 }
 return {dispatch,view,getState:()=>clone(s),getHistory:()=>clone(undo),eligible,restore:(state)=>{s=clone(state);s.revision++;s.epoch++;undo=[];}};
}
