import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {qrMatrix} from '../qr.mjs';
const python=process.env.PYTHON_PATH||'python';
for(const text of ['http://192.168.178.117:3131/team?token=123456789012345678901234','http://10.0.0.1:3131/team?token=abcdef123456789012345678']){
const ref=spawnSync(python,['-c',"import json,sys; from reportlab.graphics.barcode import qrencoder as q; qr=q.QRCode(5,1); qr.addData(q.QR8bitByte(sys.argv[1])); qr.makeImpl(False,0); print(json.dumps(qr.modules))",text],{encoding:'utf8'});
if(ref.status)throw new Error(ref.stderr);
const expected=JSON.parse(ref.stdout).map(row=>row.map(Number));const actual=qrMatrix(text);let diff=0;for(let y=0;y<37;y++)for(let x=0;x<37;x++)if(actual[y][x]!==expected[y][x])diff++;
assert.equal(diff,0,'QR must exactly match independent ReportLab encoder');
}
console.log('Beide lokalen QR-Codes stimmen zellenweise mit unabhängigem ReportLab-Encoder überein.');
