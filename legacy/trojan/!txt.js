import { connect as c1 } from 'cloudflare:sockets';

let p1 = 'proxyip.example.com!txt';
let u1 = '495c7195-85b8-498a-bf20-2ea9ce9175b5';

let c_p = null;
let c_r = null;

function f1(s) {
    try { if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CLOSING) s.close(); } catch (e) {}
}

function f2(b) {
    if (!b) return { e: null };
    try {
        const s = atob(b.replace(/-/g, '+').replace(/_/g, '/'));
        const a = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
        return { d: a.buffer, e: null };
    } catch (e) { return { e }; }
}

function f3(s) {
    if (!s) return null;
    s = s.trim();
    const r = /^\[([^\]]+)\](?::(\d+))?$/;
    const m = s.match(r);
    if (m) {
        const p = parseInt(m[2], 10);
        return { h: m[1], p: (!isNaN(p) && p > 0) ? p : 443 };
    }
    const l = s.lastIndexOf(':');
    if (l > 0) {
        const h = s.substring(0, l);
        const p = parseInt(s.substring(l + 1), 10);
        if (!isNaN(p) && p > 0 && p <= 65535) return { h, p };
    }
    return { h: s, p: 443 };
}

function f4(v, a) { return (v >>> a) | (v << (32 - a)); }

async function f5(t) {
    const d = new TextEncoder().encode(t);
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    let H = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4];
    const ml = d.length, pl = Math.ceil((ml + 9) / 64) * 64;
    const p = new Uint8Array(pl);
    p.set(d); p[ml] = 0x80;
    const v = new DataView(p.buffer);
    v.setUint32(pl - 4, ml * 8, false);
    for (let c = 0; c < pl; c += 64) {
        const W = new Uint32Array(64);
        for (let i = 0; i < 16; i++) W[i] = v.getUint32(c + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = f4(W[i - 15], 7) ^ f4(W[i - 15], 18) ^ (W[i - 15] >>> 3);
            const s1 = f4(W[i - 2], 17) ^ f4(W[i - 2], 19) ^ (W[i - 2] >>> 10);
            W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
        }
        let [a, b, x, y, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const S1 = f4(e, 6) ^ f4(e, 11) ^ f4(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
            const S0 = f4(a, 2) ^ f4(a, 13) ^ f4(a, 22);
            const maj = (a & b) ^ (a & x) ^ (b & x);
            const t2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e; e = (y + t1) >>> 0; y = x; x = b; b = a; a = (t1 + t2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + x) >>> 0; H[3] = (H[3] + y) >>> 0;
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    const r = [];
    for (let i = 0; i < 7; i++) {
        r.push(((H[i] >>> 24) & 0xff).toString(16).padStart(2, '0'), ((H[i] >>> 16) & 0xff).toString(16).padStart(2, '0'), ((H[i] >>> 8) & 0xff).toString(16).padStart(2, '0'), (H[i] & 0xff).toString(16).padStart(2, '0'));
    }
    return r.join('');
}

async function f6(b, p) {
    const s = await f5(p);
    if (b.byteLength < 56 || new Uint8Array(b.slice(56, 57))[0] !== 0x0d || new Uint8Array(b.slice(57, 58))[0] !== 0x0a || new TextDecoder().decode(b.slice(0, 56)) !== s) return { e: true };
    const d = b.slice(58);
    if (d.byteLength < 6) return { e: true };
    const v = new DataView(d);
    if (v.getUint8(0) !== 1) return { e: true };
    const t = v.getUint8(1);
    let l = 0, i = 2, a = "";
    if (t === 1) { l = 4; a = new Uint8Array(d.slice(i, i + l)).join("."); }
    else if (t === 3) { l = new Uint8Array(d.slice(i, i + 1))[0]; i += 1; a = new TextDecoder().decode(d.slice(i, i + l)); }
    else if (t === 4) { l = 16; const w = new DataView(d.slice(i, i + l)), x = []; for (let j = 0; j < 8; j++) x.push(w.getUint16(j * 2).toString(16)); a = x.join(":"); }
    else return { e: true };
    if (!a) return { e: true };
    const pi = i + l;
    return { e: false, t: t, p: new DataView(d.slice(pi, pi + 2)).getUint16(0), h: a, r: d.slice(pi + 4) };
}

async function f7(d) {
    const f = async (u) => {
        try { 
            const r = await fetch(`${u}?name=${d}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } });
            if (r.ok) return (await r.json()).Answer || []; 
        } catch (e) {} 
        return null;
    };
    return (await f('https://1.1.1.1/dns-query')) || (await f('https://dns.google/dns-query')) || [];
}

async function f8(s) {
    if (!s) return null;
    s = s.trim();
    if (c_p === s && c_r) return c_r;
    
    let pc = f3(s);
    if (s.toLowerCase().endsWith('!txt')) {
        const ans = await f7(s.slice(0, -4).trim());
        const txt = ans.filter(r => r.type === 16).map(r => r.data)[0];
        if (txt) {
            const ps = txt.replace(/^"|"$/g, '').replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean);
            if (ps.length > 0) {
                let h = [...u1].reduce((a, c) => a + c.charCodeAt(0), 0);
                pc = f3(ps[h % ps.length]); 
            }
        }
    }
    c_p = s; 
    c_r = pc;
    return pc;
}

async function f9(rs, ws, h, rf) {
    let hd = h, d = false;
    await rs.readable.pipeTo(new WritableStream({
        async write(c, ctrl) {
            d = true;
            if (ws.readyState !== WebSocket.OPEN) ctrl.error();
            if (hd) { const r = new Uint8Array(hd.length + c.byteLength); r.set(hd, 0); r.set(c, hd.length); ws.send(r.buffer); hd = null; }
            else { ws.send(c); }
        }, abort() {}
    })).catch(() => { f1(ws); });
    if (!d && rf) await rf();
}

async function f10(h, p, r, ws, rW, cp) {
    async function cd(a, pt, d) {
        const s = c1({ hostname: a, port: pt }), w = s.writable.getWriter();
        await w.write(d); w.releaseLock(); return s;
    }
    
    let pc = await f8(cp) || await f8(p1) || { h: p1, p: 443 };
    
    async function c2p() {
        let ns = await cd(pc.h, pc.p, r);
        rW.s = ns; ns.closed.catch(() => {}).finally(() => f1(ws)); f9(ns, ws, null, null);
    }
    
    try { 
        const is = await cd(h, p, r); rW.s = is; f9(is, ws, null, c2p); 
    } catch (e) { 
        await c2p(); 
    }
}

async function f11(uc, ws) {
    try {
        const s = c1({ hostname: '8.8.4.4', port: 53 }), w = s.writable.getWriter();
        await w.write(uc); w.releaseLock();
        await s.readable.pipeTo(new WritableStream({ async write(c) { if (ws.readyState === WebSocket.OPEN) ws.send(c); } }));
    } catch (e) {}
}

function f12(s, ed) {
    let c = false;
    return new ReadableStream({
        start(ctrl) {
            s.addEventListener('message', (e) => { if (!c) ctrl.enqueue(e.data); });
            s.addEventListener('close', () => { if (!c) { f1(s); ctrl.close(); } });
            s.addEventListener('error', (e) => ctrl.error(e));
            const { d, e } = f2(ed);
            if (e) ctrl.error(e); else if (d) ctrl.enqueue(d);
        },
        cancel() { c = true; f1(s); }
    });
}

async function f13(rq, cp) {
    const wp = new WebSocketPair(), [c, s] = Object.values(wp);
    s.accept();
    let rw = { s: null }, dq = false, ed = rq.headers.get('sec-websocket-protocol') || '', rd = f12(s, ed);
    rd.pipeTo(new WritableStream({
        async write(k) {
            if (dq) return await f11(k, s);
            if (rw.s) { const w = rw.s.writable.getWriter(); await w.write(k); w.releaseLock(); return; }
            const tr = await f6(k, u1);
            if (!tr.e) { await f10(tr.h, tr.p, tr.r, s, rw, cp); return; }
            throw new Error();
        }
    })).catch(() => {});
    return new Response(null, { status: 101, webSocket: c });
}

export default {
    async fetch(rq) {
        try {
            const u = new URL(rq.url);
            if (rq.headers.get('Upgrade') === 'websocket') {
                let cp = u.searchParams.get('fdip') || rq.headers.get('fdip');
                if (u.pathname.startsWith('/fdip=')) {
                    try { cp = decodeURIComponent(u.pathname.substring(9)).trim(); } catch (e) {}
                }
                return await f13(rq, cp);
            }
            return new Response('Not Found', { status: 404 });
        } catch (e) {
            return new Response('Internal Error', { status: 500 });
        }
    }
};
