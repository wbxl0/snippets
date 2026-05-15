import { connect } from 'cloudflare:sockets';

const CFG = { 
    chunk: 64 * 1024, dnPack: 32 * 1024, dnTail: 512, dnMs: 0, 
    upPack: 16 * 1024, upQMax: 256 * 1024, maxED: 8 * 1024, concur: 1 
};

let v1 = 'proxyip.example.com!txt';
let v2 = '495c7195-85b8-498a-bf20-2ea9ce9175b5';
let v3 = null;
let v4 = null;

const v5 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const v6 = /^\[?([a-fA-F0-9:]+)\]?$/;
const v7 = new Uint8Array(0);
const v8 = new TextDecoder();
const v9 = 1400;
const v10 = new Uint8Array([0x21, 0x12, 0xA4, 0x42]);

const hex = c => (c > 64 ? c + 9 : c) & 0xF;
const idB = new Uint8Array(16);
for (let i = 0, p = 0, c, h; i < 16; i++) { 
    c = v2.charCodeAt(p++); c === 45 && (c = v2.charCodeAt(p++)); h = hex(c); 
    c = v2.charCodeAt(p++); c === 45 && (c = v2.charCodeAt(p++)); idB[i] = h << 4 | hex(c); 
}
const [I0, I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15] = idB;
const matchID = c => c[1] === I0 && c[2] === I1 && c[3] === I2 && c[4] === I3 && c[5] === I4 && c[6] === I5 && c[7] === I6 && c[8] === I7 && c[9] === I8 && c[10] === I9 && c[11] === I10 && c[12] === I11 && c[13] === I12 && c[14] === I13 && c[15] === I14 && c[16] === I15;

const f1 = s => new TextEncoder().encode(s);
const f2 = (...a) => { const r = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); a.reduce((o, x) => (r.set(x, o), o + x.length), 0); return r; };
const f3 = (b, o) => b[o] << 8 | b[o + 1];
const f4 = (b, o) => (b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0;
const f5 = n => crypto.getRandomValues(new Uint8Array(n));
const f6 = () => f3(f5(2), 0);
const f7 = () => f4(f5(4), 0);
const f8 = ip => new Uint8Array(ip.split('.').map(Number));
const f9 = (d, o, n) => { let s = 0; for (let i = o; i < o + n - 1; i += 2) s += f3(d, i); if (n & 1) s += d[o + n - 1] << 8; while (s >> 16) s = (s & 0xFFFF) + (s >> 16); return (~s) & 0xFFFF; };

function f11(s) {
    if (!s) return { earlyData: null, error: null };
    try {
        const b = typeof (Uint8Array).fromBase64 === 'function' && s.length <= CFG.maxED * 4 / 3 + 4 
            ? (Uint8Array).fromBase64(s, { alphabet: 'base64url' }) 
            : Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        return { earlyData: b.buffer, error: null };
    } catch (e) { return { error: e }; }
}

function f12(s) {
    try {
        if (s?.readyState === WebSocket.OPEN || s?.readyState === WebSocket.CLOSING) s.close();
        if (s?.close) s.close(); 
    } catch (e) {}
}

function f13(s) { if (!s) return null; s = s.trim(); if (s.startsWith('turn://')) { try { const u = new URL(s); return { type: 'turn', host: u.hostname, port: parseInt(u.port) || 3478, username: u.username ? decodeURIComponent(u.username) : '', password: u.password ? decodeURIComponent(u.password) : '' }; } catch (e) { return null; } } if (s.startsWith('sstp://')) { try { const u = new URL(s); return { type: 'sstp', host: u.hostname, port: parseInt(u.port) || 443, username: u.username ? decodeURIComponent(u.username) : 'vpn', password: u.password ? decodeURIComponent(u.password) : 'vpn' }; } catch (e) { return null; } } if (s.startsWith('socks://') || s.startsWith('socks5://')) { try { const u = new URL(s.replace(/^socks:\/\//, 'socks5://')); return { type: 'socks5', host: u.hostname, port: parseInt(u.port) || 1080, username: u.username ? decodeURIComponent(u.username) : '', password: u.password ? decodeURIComponent(u.password) : '' }; } catch (e) { return null; } } if (s.startsWith('http://') || s.startsWith('https://')) { try { const h = s.startsWith('https://'); const u = new URL(s); return { type: h ? 'https' : 'http', host: u.hostname, port: parseInt(u.port) || (h ? 443 : 80), username: u.username ? decodeURIComponent(u.username) : '', password: u.password ? decodeURIComponent(u.password) : '' }; } catch (e) { return null; } } const m = s.match(/^\[([^\]]+)\](?::(\d+))?$/); if (m) { const p = parseInt(m[2], 10); return { type: 'direct', host: m[1], port: (!isNaN(p) && p > 0) ? p : 443 }; } const i = s.lastIndexOf(':'); if (i > 0) { const h = s.substring(0, i); const p = parseInt(s.substring(i + 1), 10); if (!isNaN(p) && p > 0 && p <= 65535) return { type: 'direct', host: h, port: p }; } return { type: 'direct', host: s, port: 443 }; }
async function f14(d, t) { const fn = async (u) => { try { const r = await fetch(`${u}?name=${d}&type=${t}`, { headers: { 'Accept': 'application/dns-json' } }); if (r.ok) return (await r.json()).Answer || []; } catch (e) {} return null; }; return (await fn('https://1.1.1.1/dns-query')) || (await fn('https://dns.google/dns-query')) || []; }
function f15(s) { let a = s, p = 443; const m = s.match(/^(?:\[([^\]]+)\]|([^:]+))(?::(\d+))?$/); if (m) { a = m[1] || m[2]; p = m[3] ? parseInt(m[3], 10) : 443; } return [a, p]; }
async function f16(s, d = 'dash.cloudflare.com', u = '00000000-0000-4000-8000-000000000000') { const r = s.trim(); if (v3 === r && v4) return v4; const l = r.toLowerCase(); const t = l.endsWith('!txt'); const tg = t ? r.slice(0, -4).trim() : r; let arr = []; if (t) { const tr = await f14(tg, 'TXT'); const td = tr.filter(x => x.type === 16).map(x => x.data); if (td.length > 0) { let d2 = td[0].replace(/^"|"$/g, ''); const p = d2.replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean); arr = p.map(f15); } } else { let [a, p] = f15(tg); const tm = tg.match(/\.tp(\d+)/); if (tm) p = parseInt(tm[1], 10); if (!v5.test(a) && !v6.test(a)) { const [a1, a2] = await Promise.all([ f14(a, 'A'), f14(a, 'AAAA') ]); const i = [...(a1.filter(x => x.type === 1).map(x => x.data)), ...(a2.filter(x => x.type === 28).map(x => `[${x.data}]`))]; arr = i.length > 0 ? i.map(x => [x, p]) : [[a, p]]; } else { arr = [[a, p]]; } } const rt = d.includes('.') ? d.split('.').slice(-2).join('.') : d; let sd = [...(rt + u)].reduce((a, c) => a + c.charCodeAt(0), 0); v4 = [...arr.sort((a, b) => a[0].localeCompare(b[0]))].sort(() => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return (sd / 0x7fffffff) - 0.5; }).slice(0, 8); v3 = r; return v4; }

const f17=(u,p)=>{let b=v7,i=1,sk,rd,wr,h,rb=new ArrayBuffer(16384);const fn1=async n=>{if(b.length>=n){const r=b.subarray(0,n);b=b.subarray(n);return r}const sv=b.length>0?new Uint8Array(b):null,nd=n-b.length;const{value:v,done:d}=await rd.readAtLeast(nd,new Uint8Array(rb));if(d)throw 0;rb=v.buffer;if(sv){const t=f2(sv,v);b=t.subarray(n);return t.subarray(0,n)}b=v.subarray(n);return v.subarray(0,n)};const fn2=async()=>{for(;;){const x=b.indexOf(10);if(x>=0){let l=v8.decode(b.subarray(0,x));b=b.subarray(x+1);return l.replace(/\r$/,"")}const sv=b.length>0?new Uint8Array(b):null;const{value:v,done:d}=await rd.readAtLeast(1,new Uint8Array(rb));if(d)throw 0;rb=v.buffer;b=sv?f2(sv,v):v}};const fn3=async(m=1e4)=>{let t;const to=new Promise((_,r)=>{t=setTimeout(()=>r("T"),m)});try{const hd=await Promise.race([fn1(4),to]);clearTimeout(t);const l=f3(hd,2)&4095;return{ctrl:(hd[1]&1)!==0,body:l>4?await fn1(l-4):v7}}catch(e){clearTimeout(t);throw e}};const fn4=f=>{const n=6+f.length,q=new Uint8Array(n);q.set([16,0,n>>8&15|128,n&255,255,3]);q.set(f,6);return q};const fn5=(m,a=[])=>{const l=a.reduce((s,x)=>s+4+x.data.length,0),q=new Uint8Array(8+l),vw=new DataView(q.buffer);q[0]=16;q[1]=1;vw.setUint16(2,8+l|32768);vw.setUint16(4,m);vw.setUint16(6,a.length);a.reduce((o,x)=>(q[o+1]=x.id,vw.setUint16(o+2,4+x.data.length),q.set(x.data,o+4),o+4+x.data.length),8);return q};const fn6=(pt,c,id,op=[])=>{const l=op.reduce((s,x)=>s+2+x.data.length,0),f=new Uint8Array(6+l),vw=new DataView(f.buffer);vw.setUint16(0,pt);f[2]=c;f[3]=id;vw.setUint16(4,4+l);op.reduce((o,x)=>(f[o]=x.type,f[o+1]=2+x.data.length,f.set(x.data,o+2),o+2+x.data.length),6);return f};const fn7=id=>{const ub=f1(u),pb=f1(p);const ul=ub.length,pl=pb.length,tl=6+ul+pl,f=new Uint8Array(2+tl),vw=new DataView(f.buffer);vw.setUint16(0,49187);f[2]=1;f[3]=id;vw.setUint16(4,tl);f[6]=ul;f.set(ub,7);f[7+ul]=pl;f.set(pb,8+ul);return f};const fn8=d=>{let o=d.length>=2&&d[0]===255&&d[1]===3?2:0;if(d.length-o<4)return null;const pt=f3(d,o);return pt===33?{protocol:pt,ip:d.subarray(o+2)}:d.length-o>=6?{protocol:pt,code:d[o+2],id:d[o+3],payload:d.subarray(o+6),raw:d.subarray(o)}:null};const fn9=d=>{const r=[];for(let j=0;j+2<=d.length;){const t=d[j],l=d[j+1];if(l<2||j+l>d.length)break;r.push({type:t,data:d.subarray(j+2,j+l)});j+=l}return r};const fn10=async(hs,pt)=>{sk=connect({hostname:hs,port:pt},{secureTransport:"on"});await sk.opened;rd=sk.readable.getReader({mode:"byob"});wr=sk.writable.getWriter();h=hs};const fn11=async()=>{const ht=f1(`SSTP_DUPLEX_POST /sra_{BA195980-CD49-458b-9E23-C84EE0ADCD75}/ HTTP/1.1\r\nHost: ${h}\r\nContent-Length: 18446744073709551615\r\nSSTPCORRELATIONID: {${crypto.randomUUID()}}\r\n\r\n`);const pa=new Uint8Array(2);new DataView(pa.buffer).setUint16(0,1);const mu=new Uint8Array(2);new DataView(mu.buffer).setUint16(0,1500);await wr.write(f2(ht,fn5(1,[{id:1,data:pa}]),fn4(fn6(49185,1,i++,[{type:1,data:mu}]))));const st=await fn2();while(await fn2()!=="");if(!st.includes("200"))throw 0;let sa=false,ld=false,au=false,dn=false,mi=null;for(let j=0;j<25&&!dn;j++){const pk=await fn3();if(pk.ctrl){if(!sa&&pk.body.length>=2&&f3(pk.body,0)===2)sa=true;continue}const pp=fn8(pk.body);if(!pp)continue;if(pp.protocol===49185){if(pp.code===1){const a=new Uint8Array(pp.raw);a[2]=2;await wr.write(ld&&!au?f2(fn4(a),fn4(fn7(i++))):fn4(a));if(ld)au=true}else if(pp.code===2){ld=true;if(!au){await wr.write(fn4(fn7(i++)));au=true}}}else if(pp.protocol===49187&&pp.code===2)await wr.write(fn4(fn6(32801,1,i++,[{type:3,data:new Uint8Array(4)}])));else if(pp.protocol===32801){if(pp.code===1){const a=new Uint8Array(pp.raw);a[2]=2;await wr.write(fn4(a))}else if(pp.code===3){const o=fn9(pp.payload).find(x=>x.type===3);if(o){mi=[...o.data].join(".");await wr.write(fn4(fn6(32801,1,i++,[{type:3,data:o.data}])))}}else if(pp.code===2){const o=fn9(pp.payload).find(x=>x.type===3);if(o)mi=[...o.data].join(".");dn=true}}}if(!mi)throw 0;return mi};const fn12=()=>{[rd,wr,sk].forEach(x=>{try{x?.cancel?.()??x?.close?.()}catch{}})};return{connect:fn10,establish:fn11,readPkt:fn3,parsePPP:fn8,get buf(){return b},get wr(){return wr},close:fn12}};
const f18 = (s, si, di, dp) => { const sp = 10000 + (f6() % 50000), sb = f8(si), db = f8(di); let sq = f7(), ak = 0; const it = new Uint8Array(20); it.set([0x45, 0, 0, 0, 0, 0, 0x40, 0, 64, 6]); it.set(sb, 12); it.set(db, 16); const ps = new Uint8Array(1432); ps.set(sb); ps.set(db, 4); ps[9] = 6; const fn1 = (fl, d = v7) => { const pl = d.length, tl = 20 + pl, il = 20 + tl, st = 8 + il, f = new Uint8Array(st), vw = new DataView(f.buffer); f.set([0x10, 0, ((st >> 8) & 0xF) | 0x80, st & 0xFF, 0xFF, 0x03, 0, 0x21]); f.set(it, 8); vw.setUint16(10, il); vw.setUint16(12, f6()); vw.setUint16(18, f9(f, 8, 20)); vw.setUint16(28, sp); vw.setUint16(30, dp); vw.setUint32(32, sq); vw.setUint32(36, ak); f[40] = 0x50; f[41] = fl; vw.setUint16(42, 65535); if (pl) f.set(d, 48); ps[10] = tl >> 8; ps[11] = tl & 0xFF; ps.set(f.subarray(28, 28 + tl), 12); vw.setUint16(44, f9(ps, 0, 12 + tl)); return f; }; const fn2 = ip => { if (ip.length < 40 || ip[9] !== 6) return null; const hl = (ip[0] & 0xF) * 4; if (f3(ip, hl) !== dp || f3(ip, hl + 2) !== sp) return null; return { flags: ip[hl + 13], seq: f4(ip, hl + 4), off: hl + ((ip[hl + 12] >> 4) & 0xF) * 4 }; }; const fn3 = async () => { await s.wr.write(fn1(0x02)); sq++; for (let j = 0; j < 30; j++) { const pk = await s.readPkt(); if (pk.ctrl) continue; const pp = s.parsePPP(pk.body); if (!pp || pp.protocol !== 0x0021) continue; const m = fn2(pp.ip); if (!m || (m.flags & 0x12) !== 0x12) continue; ak = (m.seq + 1) >>> 0; s.wr.write(fn1(0x10)); return true; } throw 0; }; return { frame: fn1, match: fn2, handshake: fn3, get seq() { return sq; }, set seq(v) { sq = v; }, get ack() { return ak; }, set ack(v) { ak = v; } }; };
const f19 = async ({ host: h, port: p, username: u, password: pw }, ip, tp) => { const s = f17(u, pw), cl = () => s.close(); try { await s.connect(h, p); const [mi, ti] = await Promise.all([s.establish(), ip]); if (!ti) { cl(); return null; } const t = f18(s, mi, ti, tp); await t.handshake(); let cr = null; const rd = new ReadableStream({ start: c => { cr = c; }, cancel: cl }); (async () => { try { let pd = [], pl = 0; const fl = () => { if (!pl) return; cr.enqueue(pd.length === 1 ? pd[0] : f2(...pd)); pd = []; pl = 0; s.wr.write(t.frame(0x10)).catch(() => {}); }; for (;;) { const pk = await s.readPkt(60000); if (pk.ctrl) continue; const pp = s.parsePPP(pk.body); if (!pp || pp.protocol !== 0x0021) continue; const m = t.match(pp.ip); if (!m) continue; if (m.off < pp.ip.length) { const d = pp.ip.subarray(m.off); if (d.length) { t.ack = (m.seq + d.length) >>> 0; pd.push(new Uint8Array(d)); pl += d.length; } } if (m.flags & 0x01) { fl(); t.ack = (t.ack + 1) >>> 0; s.wr.write(t.frame(0x11)).catch(() => {}); cr.close(); return; } if (s.buf.length < 4 || pl >= 32768) fl(); } } catch { try { cr.close(); } catch {} } })(); const wr = new WritableStream({ async write(c) { const d = c instanceof Uint8Array ? c : new Uint8Array(c); if (d.length <= v9) { await s.wr.write(t.frame(0x18, d)); t.seq = (t.seq + d.length) >>> 0; return; } const fs = []; for (let o = 0; o < d.length; o += v9) { const sg = d.subarray(o, Math.min(o + v9, d.length)); fs.push(t.frame(0x18, sg)); t.seq = (t.seq + sg.length) >>> 0; } await s.wr.write(f2(...fs)); }, close: () => s.wr.write(t.frame(0x11)).catch(() => {}), abort: cl }); return { readable: rd, writable: wr, close: cl }; } catch { cl(); return null; } };
async function f20({ host: h, port: p, username: u, password: pw }, th, tp, id) { let sk; try { sk = connect({ hostname: h, port: p }); const wr = sk.writable.getWriter(), rd = sk.readable.getReader(); const am = (u && pw) ? new Uint8Array([0x05, 0x02, 0x00, 0x02]) : new Uint8Array([0x05, 0x01, 0x00]); await wr.write(am); const mr = await rd.read(); if (mr.done || mr.value.byteLength < 2) throw new Error('E1'); const sm = new Uint8Array(mr.value)[1]; if (sm === 0x02) { const ub = f1(u), pb = f1(pw); const ap = new Uint8Array(3 + ub.length + pb.length); ap[0] = 0x01; ap[1] = ub.length; ap.set(ub, 2); ap[2 + ub.length] = pb.length; ap.set(pb, 3 + ub.length); await wr.write(ap); const ar = await rd.read(); if (ar.done || new Uint8Array(ar.value)[1] !== 0x00) throw new Error('E2'); } else if (sm !== 0x00) throw new Error('E3'); const hb = f1(th); const cp = new Uint8Array(7 + hb.length); cp.set([0x05, 0x01, 0x00, 0x03, hb.length]); cp.set(hb, 5); new DataView(cp.buffer).setUint16(5 + hb.length, tp, false); await wr.write(cp); const cr = await rd.read(); if (cr.done || new Uint8Array(cr.value)[1] !== 0x00) throw new Error('E4'); if (id?.byteLength > 0) await wr.write(id); wr.releaseLock(); rd.releaseLock(); return sk; } catch (e) { f12(sk); throw e; } }
async function f21({ type: t, host: h, port: p, username: u, password: pw }, th, tp, id) { let sk; try { sk = connect({ hostname: h, port: p }, t === 'https' ? { secureTransport: 'on', allowHalfOpen: false } : {}); const wr = sk.writable.getWriter(), rd = sk.readable.getReader(); let rq = `CONNECT ${th}:${tp} HTTP/1.1\r\nHost: ${th}:${tp}\r\n`; if (u && pw) rq += `Proxy-Authorization: Basic ${btoa(`${u}:${pw}`)}\r\n`; rq += `User-Agent: Mozilla/5.0\r\nConnection: keep-alive\r\n\r\n`; await wr.write(f1(rq)); let rb = new Uint8Array(0), hi = -1, st = Date.now(); while (hi === -1 && rb.length < 8192) { if (Date.now() - st > 10000) throw new Error('E5'); const { done: dn, value: vl } = await rd.read(); if (dn) throw new Error('E6'); const nb = new Uint8Array(rb.length + vl.length); nb.set(rb); nb.set(vl, rb.length); rb = nb; for (let j = 0; j < rb.length - 3; j++) { if (rb[j] === 13 && rb[j+1] === 10 && rb[j+2] === 13 && rb[j+3] === 10) { hi = j + 4; break; } } } if (hi === -1) throw new Error('E7'); const sm = v8.decode(rb.slice(0, hi)).split('\r\n')[0].match(/HTTP\/\d\.\d\s+(\d+)/); if (!sm || parseInt(sm[1]) < 200 || parseInt(sm[1]) >= 300) throw new Error('E8'); if (id?.byteLength > 0) await wr.write(id); wr.releaseLock(); rd.releaseLock(); return sk; } catch (e) { f12(sk); throw e; } }
async function f22(pc, th, tp, id) { let ti = th; if (!v5.test(ti)) { const ar = await f14(th, 'A'); const il = ar.filter(x => x.type === 1).map(x => x.data); if (il.length > 0) ti = il[0]; else throw new Error('E9'); } const sk = await f19(pc, Promise.resolve(ti), tp); if (!sk) throw new Error('E10'); if (id?.byteLength > 0) { const wr = sk.writable.getWriter(); await wr.write(id); wr.releaseLock(); } return sk; }

const f29 = (t, v) => { const l = v.length, pl = -l & 3, b = new Uint8Array(4 + l + pl), d = new DataView(b.buffer); d.setUint16(0, t); d.setUint16(2, l); b.set(v, 4); return b; };
const f30 = (t, id, a) => { const bd = f2(...a), h = new Uint8Array(20), d = new DataView(h.buffer); d.setUint16(0, t); d.setUint16(2, bd.length); h.set(v10, 4); h.set(id, 8); return f2(h, bd); };
const f31 = (ip, p) => { const b = new Uint8Array(8); b[1] = 1; new DataView(b.buffer).setUint16(2, p ^ 0x2112); ip.split('.').forEach((v, i) => b[4 + i] = +v ^ v10[i]); return b; };
const f32 = d => { if (d.length < 20 || v10.some((v, i) => d[4 + i] !== v)) return null; const dv = new DataView(d.buffer, d.byteOffset, d.byteLength), ml = dv.getUint16(2), at = {}; for (let o = 20; o + 4 <= 20 + ml; ) { const t = dv.getUint16(o), l = dv.getUint16(o + 2); if (o + 4 + l > d.length) break; at[t] = d.slice(o + 4, o + 4 + l); o += 4 + l + (-l & 3); } return { type: dv.getUint16(0), attrs: at }; };
const f33 = async (m, k) => { const c = new Uint8Array(m), d = new DataView(c.buffer); d.setUint16(2, d.getUint16(2) + 24); const ky = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']); return f2(c, f29(0x0008, new Uint8Array(await crypto.subtle.sign('HMAC', ky, c)))); };
const f34 = async (rd, bf) => { let b = bf ?? v7; const pl = async () => { const { done: dn, value: vl } = await rd.read(); if (dn) throw 0; b = f2(b, new Uint8Array(vl)); }; try { while (b.length < 20) await pl(); const n = 20 + f3(b, 2); while (b.length < n) await pl(); return [f32(b.subarray(0, n)), b.length > n ? b.subarray(n) : null]; } catch { return [null, null]; } };
const f35 = async s => new Uint8Array(await crypto.subtle.digest('MD5', f1(s)));
const f36 = async (w, r, tp, pc, pl) => { const tv = new Uint8Array([tp, 0, 0, 0]); await w.write(f30(0x003, f5(12), [f29(0x019, tv)])); let [mg, ex] = await f34(r); if (!mg) return null; let ky = null, aa = []; const sn = m => ky ? f33(m, ky) : Promise.resolve(m); if (mg.type === 0x113 && pc.username && (mg.attrs[0x009]?.length >= 4 ? (mg.attrs[0x009][2] & 7) * 100 + mg.attrs[0x009][3] : 0) === 401) { const rm = v8.decode(mg.attrs[0x014] ?? v7), nc = mg.attrs[0x015] ?? v7; ky = await f35(`${pc.username}:${rm}:${pc.password}`); aa = [f29(0x006, f1(pc.username)), f29(0x014, f1(rm)), f29(0x015, nc)]; const aq = await f33(f30(0x003, f5(12), [f29(0x019, tv), ...aa]), ky); const xt = pl ? await Promise.all(pl(aa, sn)) : []; await w.write(xt.length ? f2(aq, ...xt) : aq); [mg, ex] = await f34(r, ex); if (!mg) return null; } else if (pl && mg.type === 0x103) { const xt = await Promise.all(pl(aa, sn)); if (xt.length) await w.write(f2(...xt)); } return mg.type === 0x103 ? { ky, aa, ex, sn } : null; };
const f37 = async (pc, th, tp) => { let cl = null, dt = null; const cs = () => { f12(cl); f12(dt); }; try { cl = connect({ hostname: pc.host, port: pc.port }); await cl.opened; const cw = cl.writable.getWriter(), cr = cl.readable.getReader(), pr = f29(0x012, f31(th, tp)); const ah = await f36(cw, cr, 6, pc, (aa, sn) => [sn(f30(0x008, f5(12), [pr, ...aa])), sn(f30(0x00A, f5(12), [pr, ...aa]))]); if (!ah) throw 0; const { aa, sn } = ah; let ex = ah.ex; dt = connect({ hostname: pc.host, port: pc.port }); let r; [r, ex] = await f34(cr, ex); if (r?.type !== 0x108) throw 0; [r, ex] = await f34(cr, ex); if (r?.type !== 0x10A || !r.attrs[0x02A]) throw 0; await dt.opened; const dw = dt.writable.getWriter(), dr = dt.readable.getReader(); await dw.write(await sn(f30(0x00B, f5(12), [f29(0x02A, r.attrs[0x02A]), ...aa]))); let xt; [r, xt] = await f34(dr); if (r?.type !== 0x10B) throw 0; cr.releaseLock(); cw.releaseLock(); dw.releaseLock(); const rd = new ReadableStream({ start: c => { if (xt?.length) c.enqueue(xt); }, pull: c => dr.read().then(({ done: dn, value: vl }) => dn ? c.close() : c.enqueue(new Uint8Array(vl))), cancel: () => dr.cancel() }); return { readable: rd, writable: dt.writable, close: cs }; } catch { cs(); throw new Error('E18'); } };
async function f38(pc, th, tp, id) { let ti = th; if (!v5.test(ti)) { const ar = await f14(th, 'A'); const il = ar.filter(x => x.type === 1).map(x => x.data); if (il.length > 0) ti = il[0]; else throw new Error('E9'); } const sk = await f37(pc, ti, tp); if (!sk) throw new Error('E10'); if (id?.byteLength > 0) { const wr = sk.writable.getWriter(); await wr.write(id); wr.releaseLock(); } return sk; }

function f23(b) {
    if (b.byteLength < 24 || !matchID(b)) return null;
    const vs = b[0];
    const ol = b[17];
    const cm = b[18 + ol];
    if (cm !== 1 && cm !== 2) return null;
    
    let pi = 19 + ol;
    const pt = (b[pi] << 8) | b[pi + 1];
    let at = b[pi + 2];
    let ai = pi + 3, al = 0;

    if (at === 1) al = 4;
    else if (at === 2) { al = b[ai]; ai += 1; }
    else if (at === 3) al = 16;
    else return null;

    if (ai + al > b.byteLength) return null;

    return {
        addressType: at,
        targetAddrBytes: b.subarray(ai, ai + al),
        port: pt,
        isUDP: cm === 2,
        rawIndex: ai + al,
        version: vs
    };
}

const getHostName = (at, b) => at === 1 ? `${b[0]}.${b[1]}.${b[2]}.${b[3]}` : at === 3 ? Array.from({ length: 8 }, (_, j) => ((b[j * 2] << 8) | b[j * 2 + 1]).toString(16)).join(':') : v8.decode(b);

const raceConnect = async (ad, pt) => {
    if (CFG.concur <= 1) {
        const s = connect({ hostname: ad, port: pt });
        await s.opened; return s;
    }
    const ts = Array(CFG.concur).fill().map(() => {
        const s = connect({ hostname: ad, port: pt });
        return s.opened.then(() => s);
    });
    return Promise.any(ts).then(w => {
        ts.forEach(t => t.then(s => s !== w && s.close(), () => {}));
        return w;
    });
};

const mkDn = w => {
    const cap = CFG.dnPack, tail = CFG.dnTail, low = Math.max(4096, tail << 3);
    let pb = new Uint8Array(cap), p = 0, tp = 0, mq = 0, gen = 0, qk = 0, qr = 0;
    const reap = () => { tp && clearTimeout(tp); tp = 0; mq = 0; if (!p) return; w.send(pb.subarray(0, p).slice()); pb = new Uint8Array(cap); p = 0; qr = 0; };
    const ripen = () => { if (tp || mq) return; mq = 1; qk = gen; queueMicrotask(() => { mq = 0; if (!p || tp) return; if (cap - p < tail) return reap(); tp = setTimeout(() => { tp = 0; if (!p) return; if (cap - p < tail) return reap(); if (qr < 2 && (gen !== qk || p < low)) { qr++; qk = gen; return ripen(); } reap(); }, Math.max(CFG.dnMs, 1)); }); };
    return { send(u) { let o = 0, n = u?.byteLength || 0; if (!n) return; while (o < n) { if (!p && n - o >= cap) { const m = Math.min(cap, n - o); w.send(o || m !== n ? u.subarray(o, o + m) : u); o += m; continue; } const m = Math.min(cap - p, n - o); pb.set(u.subarray(o, o + m), p); p += m; o += m; gen++; if (p === cap || cap - p < tail) reap(); else ripen(); } }, reap };
};

async function f25(rs, ws, hd, rf) {
    const tx = mkDn(ws);
    if (hd) tx.send(hd);
    try {
        let r, isByob = false;
        try { r = rs.readable.getReader({ mode: 'byob' }); isByob = true; } 
        catch { r = rs.readable.getReader(); }

        if (isByob) {
            let buf = new ArrayBuffer(CFG.chunk);
            for (;;) {
                const { done, value: v } = await r.read(new Uint8Array(buf, 0, CFG.chunk));
                if (done) break;
                if (!v?.byteLength) continue;
                if (v.byteLength >= (CFG.chunk >> 1)) { tx.reap(); ws.send(v); buf = new ArrayBuffer(CFG.chunk); }
                else { tx.send(v.slice()); buf = v.buffer; }
            }
        } else {
            for (;;) {
                const { done, value: v } = await r.read();
                if (done) break;
                if (!v?.byteLength) continue;
                if (v.byteLength >= (CFG.chunk >> 1)) { tx.reap(); ws.send(v); }
                else { tx.send(v); }
            }
        }
        tx.reap();
    } catch (e) {} finally {
        try { tx.reap(); } catch {}
        try { r?.releaseLock(); } catch {}
        if (rf) await rf();
        f12(ws);
    }
}

async function f26(at, h, p, rd, ws, rh, rw, cf) {
    const cd = async (ad, pt, dt) => {
        const rs = await raceConnect(ad, pt);
        const wr = rs.writable.getWriter();
        if (dt?.byteLength) await wr.write(dt);
        wr.releaseLock();
        return rs;
    };

    let cv = cf || v1;
    let pc = cv ? f13(cv) : null;
    let sp = false;

    if (!pc) pc = { type: 'direct', host: v1, port: 443 };
    if (pc.type === 'direct' && cv) {
        try {
            const rl = await f16(cv, h, v2);
            if (rl?.length > 0) [pc.host, pc.port] = rl[0];
        } catch (e) {}
    } else if (['socks5', 'http', 'https', 'sstp', 'turn'].includes(pc.type)) {
        sp = true;
    }

    const cp = async () => {
        let ns;
        if (pc.type === 'socks5') ns = await f20(pc, h, p, rd);
        else if (['http', 'https'].includes(pc.type)) ns = await f21(pc, h, p, rd);
        else if (pc.type === 'sstp') ns = await f22(pc, h, p, rd);
        else if (pc.type === 'turn') ns = await f38(pc, h, p, rd);
        else ns = await cd(pc.host, pc.port, rd);

        rw.socket = ns;
        rw.writer = ns.writable.getWriter();
        if (ns.closed) ns.closed.catch(() => {}).finally(() => f12(ws));
        f25(ns, ws, rh, null);
    };

    if (sp) { await cp(); } else {
        try {
            const is = await cd(h, p, rd);
            rw.socket = is;
            rw.writer = is.writable.getWriter();
            f25(is, ws, rh, cp);
        } catch (er) { await cp(); }
    }
}

async function f27(uc, ws, rh) {
    try {
        const ts = await raceConnect('8.8.4.4', 53);
        let vh = rh;
        const wr = ts.writable.getWriter();
        await wr.write(uc);
        wr.releaseLock();
        await ts.readable.pipeTo(new WritableStream({
            async write(c) {
                if (ws.readyState === WebSocket.OPEN) {
                    if (vh) {
                        const rp = new Uint8Array(vh.length + c.byteLength);
                        rp.set(vh, 0); rp.set(c, vh.length);
                        ws.send(rp.buffer); vh = null;
                    } else { ws.send(c); }
                }
            }
        }));
    } catch (e) {}
}

const mkQ = (cap, qCap = cap, itemsMax = Math.max(1, qCap >> 8)) => {
    let q = [], h = 0, qB = 0, buf = null;
    const trim = () => { h > 32 && h * 2 >= q.length && (q = q.slice(h), h = 0); };
    const take = () => { if (h >= q.length) return null; const d = q[h]; q[h++] = undefined; qB -= d.byteLength; trim(); return d; };
    return { 
        get empty() { return h >= q.length; }, clear() { q = []; h = 0; qB = 0; },
        sow(d) { const n = d?.byteLength || 0; if (!n) return 1; if (qB + n > qCap || q.length - h >= itemsMax) return 0; q.push(d); qB += n; return 1; },
        bundle(d) {
            d ||= take(); if (!d || h >= q.length || d.byteLength >= cap) return [d, 0];
            let n = d.byteLength, e = h; while (e < q.length) { const x = q[e], nn = n + x.byteLength; if (nn > cap) break; n = nn; e++; }
            if (e === h) return [d, 0]; const out = buf ||= new Uint8Array(cap); out.set(d);
            for (let o = d.byteLength; h < e;) { const x = q[h]; q[h++] = undefined; qB -= x.byteLength; out.set(x, o); o += x.byteLength; } trim(); return [out.subarray(0, n), 1]; 
        } 
    }; 
};

async function f28(rq, cf) {
    const wp = new WebSocketPair();
    const [cs, ss] = Object.values(wp);
    ss.accept({ allowHalfOpen: true });
    ss.binaryType = 'arraybuffer';
    let rw = { socket: null, writer: null };
    let dq = false;
    let closed = false, busy = false;

    const uq = mkQ(CFG.upPack, CFG.upQMax, CFG.upQMax >> 8);

    const wither = () => {
        if (closed) return;
        closed = true;
        uq.clear();
        try { rw.writer?.releaseLock(); } catch {}
        f12(rw.socket);
        f12(ss);
    };

    const toU8 = d => d instanceof Uint8Array ? d : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : new Uint8Array(d);
    const sow = d => {
        const u = toU8(d);
        if (!u.byteLength) return 1;
        if (uq.sow(u)) return 1;
        wither(); return 0;
    };

    async function thresh() {
        if (busy || closed) return;
        busy = true;
        try {
            for (;;) {
                if (closed) break;
                if (dq) {
                    const [d] = uq.bundle();
                    if (!d) break;
                    await f27(d, ss, null);
                    continue;
                }

                if (!rw.socket) {
                    const [d] = uq.bundle();
                    if (!d) break;

                    const parsed = f23(d);
                    if (!parsed) throw new Error('Invalid Packet');

                    if (parsed.isUDP) {
                        if (parsed.port === 53) dq = true;
                        else throw new Error('E17');
                        const rd = d.subarray(parsed.rawIndex);
                        if (dq) { await f27(rd, ss, new Uint8Array([parsed.version, 0])); continue; }
                    }

                    const rh = new Uint8Array([parsed.version, 0]);
                    const rd = d.subarray(parsed.rawIndex);
                    const host = getHostName(parsed.addressType, parsed.targetAddrBytes);
                    
                    await f26(parsed.addressType, host, parsed.port, rd, ss, rh, rw, cf);
                    continue;
                }

                const [d] = uq.bundle();
                if (!d) break;
                await rw.writer.write(d); 
            }
        } catch (e) {
            wither();
        } finally {
            busy = false;
            !uq.empty && !closed && queueMicrotask(thresh);
        }
    }

    const edStr = rq.headers.get('sec-websocket-protocol');
    const eh = f11(edStr);
    if (eh.error) wither();
    else if (eh.earlyData && sow(eh.earlyData)) thresh();

    ss.addEventListener('message', e => { closed || (sow(e.data) && thresh()); });
    ss.addEventListener('close', wither);
    ss.addEventListener('error', wither);

    return new Response(null, { status: 101, webSocket: cs, headers: { 'Sec-WebSocket-Extensions': '' } });
}

export default {
    async fetch(rq, ev, cx) {
        try {
            const iu = rq.headers.get('Upgrade') === 'websocket';
            
            if (!iu) {
                if (rq.url.includes('/fdip=')) {
                    const ul = new URL(rq.url);
                    if (ul.pathname.startsWith('/fdip=')) {
                        try {
                            const cf = decodeURIComponent(ul.pathname.substring(9)).trim();
                            if (cf) {
                                v1 = cf;
                                return new Response(`v1: ${v1}\n\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } });
                            }
                        } catch (e) {}
                    }
                }
                return new Response('OK', { status: 200 });
            }

            const ff = rq.headers.get('fdip') || (rq.url.includes('fdip=') ? new URL(rq.url).searchParams.get('fdip') : null);
            return await f28(rq, ff);
        } catch (e) {
            return new Response('ERR', { status: 500 });
        }
    }
};
