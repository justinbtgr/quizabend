// Fixed version 5, error correction L, byte mode. URLs up to 106 UTF-8 bytes.
export function qrMatrix(text) {
 const bytes=new TextEncoder().encode(text);if(bytes.length>106)throw new Error('QR-Link zu lang');
 const bits=[];const put=(n,l)=>{for(let i=l-1;i>=0;i--)bits.push((n>>>i)&1);};
 put(4,4);put(bytes.length,8);for(const b of bytes)put(b,8);put(0,Math.min(4,864-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
 let pad=0;while(data.length<108)data.push(pad++%2===0?0xec:0x11);
 const exp=new Array(512),log=new Array(256);let n=1;for(let i=0;i<255;i++){exp[i]=n;log[n]=i;n<<=1;if(n&256)n^=0x11d;}for(let i=255;i<512;i++)exp[i]=exp[i-255];
 const mul=(a,b)=>a&&b?exp[log[a]+log[b]]:0;let gen=[1];for(let i=0;i<26;i++){const g=new Array(gen.length+1).fill(0);for(let j=0;j<gen.length;j++){g[j]^=gen[j];g[j+1]^=mul(gen[j],exp[i]);}gen=g;}
 const work=[...data,...new Array(26).fill(0)];for(let i=0;i<data.length;i++){const f=work[i];for(let j=0;j<gen.length;j++)work[i+j]^=mul(gen[j],f);}const all=[...data,...work.slice(108)];
 const size=37,m=Array.from({length:size},()=>new Array(size).fill(null));const set=(x,y,v)=>{if(x>=0&&y>=0&&x<size&&y<size)m[y][x]=v?1:0;};
 function finder(x,y){for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++)set(x+dx,y+dy,dx>=0&&dx<=6&&dy>=0&&dy<=6&&(dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4)));}
 finder(0,0);finder(size-7,0);finder(0,size-7);
 for(let d=-2;d<=2;d++)for(let e=-2;e<=2;e++)set(30+e,30+d,Math.max(Math.abs(d),Math.abs(e))!==1);
 for(let i=8;i<size-8;i++){set(i,6,i%2===0);set(6,i,i%2===0);}
 const a=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
 const b=[...Array.from({length:8},(_,i)=>[size-1-i,8]),...Array.from({length:7},(_,i)=>[8,size-7+i])];
 for(const [x,y]of [...a,...b])set(x,y,0);set(8,size-8,1);
 let k=0,up=true;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let z=0;z<size;z++){const y=up?size-1-z:z;for(let j=0;j<2;j++){const x=right-j;if(m[y][x]!==null)continue;const bit=k<all.length*8?(all[k>>>3]>>>(7-(k%8)))&1:0;k++;set(x,y,bit^((x+y)%2===0?1:0));}}up=!up;}
 let format=8<<10;for(let i=14;i>=10;i--)if((format>>>i)&1)format^=0x537<<(i-10);format=((8<<10)|format)^0x5412;
 for(let i=0;i<15;i++){set(...a[i],(format>>>i)&1);set(...b[i],(format>>>i)&1);}return m;
}
export function qrSvg(text){const m=qrMatrix(text);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" shape-rendering="crispEdges"><rect width="45" height="45" fill="white"/><path fill="#142b32" d="${m.flatMap((row,y)=>row.flatMap((v,x)=>v?[`M${x+4} ${y+4}h1v1h-1z`]:[])).join('')}"/></svg>`;}
