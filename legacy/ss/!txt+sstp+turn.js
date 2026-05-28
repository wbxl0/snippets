import { connect as c1 } from 'cloudflare:sockets';

const v1 = 'proxyip.example.com!txt';
const v2 = '495c7195-85b8-498a-bf20-2ea9ce9175b5';
const MSS = 1400;

let txtCacheKey = null;
let txtCacheNodes = null;

const dec = new TextDecoder(), enc = s => new TextEncoder().encode(s), E = new Uint8Array(0);
const cat = (...a) => { const r = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); a.reduce((o, x) => (r.set(x, o), o + x.length), 0); return r; };
const u16 = (b, o = 0) => b[o] << 8 | b[o + 1], u32 = (b, o) => (b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0;
const rng = n => crypto.getRandomValues(new Uint8Array(n)), rng16 = () => u16(rng(2), 0), rng32 = () => u32(rng(4), 0);
const ipB = ip => new Uint8Array(ip.split('.').map(Number)), papCred = enc(atob('dnBu'));
const cksum = (d, o, n) => { let s = 0; for (let i = o; i < o + n - 1; i += 2) s += u16(d, i); if (n & 1) s += d[o + n - 1] << 8; while (s >> 16) s = (s & 0xFFFF) + (s >> 16); return (~s) & 0xFFFF; };
const resolveIP = async h => /^\d+\.\d+\.\d+\.\d+$/.test(h) ? h : (await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(h)}&type=A`, { headers: { Accept: 'application/dns-json' } }).then(r => r.json()).catch(() => ({}))).Answer?.find(a => a.type === 1)?.data ?? null;

const MAGIC = new Uint8Array([0x21, 0x12, 0xA4, 0x42]);
const MT = { AQ: 0x003, AO: 0x103, AE: 0x113, PQ: 0x008, PO: 0x108, CQ: 0x00A, CO: 0x10A, BQ: 0x00B, BO: 0x10B, SI: 0x016, DI: 0x017 };
const AT = { USER: 0x006, MI: 0x008, ERR: 0x009, PEER: 0x012, DATA: 0x013, REALM: 0x014, NONCE: 0x015, TRANSPORT: 0x019, CONNID: 0x02A };
const pad4 = n => -n & 3;
const safeClose = (...a) => a.forEach(x => { try { x?.close?.(); } catch {} });
const tid = () => crypto.getRandomValues(new Uint8Array(12));
const stunAttr = (t, v) => { const b = new Uint8Array(4 + v.length + pad4(v.length)), d = new DataView(b.buffer); d.setUint16(0, t); d.setUint16(2, v.length); b.set(v, 4); return b; };
const stunMsg = (t, id, a) => { const bd = cat(...a), h = new Uint8Array(20), d = new DataView(h.buffer); d.setUint16(0, t); d.setUint16(2, bd.length); h.set(MAGIC, 4); h.set(id, 8); return cat(h, bd); };
const xorPeer = (ip, port) => { const b = new Uint8Array(8); b[1] = 1; new DataView(b.buffer).setUint16(2, port ^ 0x2112); ip.split('.').forEach((v, i) => b[4 + i] = +v ^ MAGIC[i]); return b; };
const parseStun = d => {
    if (d.length < 20 || MAGIC.some((v, i) => d[4 + i] !== v)) return null;
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength), ml = dv.getUint16(2), attrs = {};
    for (let o = 20; o + 4 <= 20 + ml; ) { const t = dv.getUint16(o), l = dv.getUint16(o + 2); if (o + 4 + l > d.length) break; attrs[t] = d.slice(o + 4, o + 4 + l); o += 4 + l + pad4(l); }
    return { type: dv.getUint16(0), attrs };
};
const parseErr = d => d?.length >= 4 ? (d[2] & 7) * 100 + d[3] : 0;
const md5 = async s => new Uint8Array(await crypto.subtle.digest('MD5', enc(s)));
const addIntegrity = async (m, key) => { const c = new Uint8Array(m), d = new DataView(c.buffer); d.setUint16(2, d.getUint16(2) + 24); const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']); return cat(c, stunAttr(AT.MI, new Uint8Array(await crypto.subtle.sign('HMAC', k, c)))); };
const readStun = async (rd, buf) => {
    let b = buf ?? new Uint8Array(0); const pull = async () => { const { done, value } = await rd.read(); if (done) throw 0; b = cat(b, new Uint8Array(value)); };
    try { while (b.length < 20) await pull(); const n = 20 + u16(b, 2); while (b.length < n) await pull(); return [parseStun(b.subarray(0, n)), b.length > n ? b.subarray(n) : null]; } catch { return [null, null]; }
};
const getTurn = url => { const m = decodeURIComponent(url).match(/(?:turn|turns):\/\/([^?&#\s]*)/i); if (!m) return null; const t = m[1], at = t.lastIndexOf('@'), cred = at >= 0 ? t.slice(0, at) : '', hp = t.slice(at + 1), [host, p] = hp.split(':'), ci = cred.indexOf(':'); return p ? { host, port: +p, user: ci >= 0 ? cred.slice(0, ci) : '', pass: ci >= 0 ? cred.slice(ci + 1) : '' } : null; };

const turnAuth = async (w, r, transport, { user, pass }, pipeline) => {
    const tp = new Uint8Array([transport, 0, 0, 0]);
    await w.write(stunMsg(MT.AQ, tid(), [stunAttr(AT.TRANSPORT, tp)]));
    let [msg, ex] = await readStun(r); if (!msg) return null;
    let key = null, aa = [];
    const sign = m => key ? addIntegrity(m, key) : Promise.resolve(m);
    if (msg.type === MT.AE && user && parseErr(msg.attrs[AT.ERR]) === 401) {
        const realm = dec.decode(msg.attrs[AT.REALM] ?? new Uint8Array(0)), nonce = msg.attrs[AT.NONCE] ?? new Uint8Array(0);
        key = await md5(`${user}:${realm}:${pass}`);
        aa = [stunAttr(AT.USER, enc(user)), stunAttr(AT.REALM, enc(realm)), stunAttr(AT.NONCE, nonce)];
        const aq = await addIntegrity(stunMsg(MT.AQ, tid(), [stunAttr(AT.TRANSPORT, tp), ...aa]), key);
        const extras = pipeline ? await Promise.all(pipeline(aa, sign)) : [];
        await w.write(extras.length ? cat(aq, ...extras) : aq);
        [msg, ex] = await readStun(r, ex); if (!msg) return null;
    } else if (pipeline && msg.type === MT.AO) {
        const extras = await Promise.all(pipeline(aa, sign)); if (extras.length) await w.write(cat(...extras));
    }
    return msg.type === MT.AO ? { key, aa, ex, sign } : null;
};

const turnConn = async ({ host, port, user, pass }, targetIp, targetPort) => {
    let ctrl = null, data = null;
    const close = () => safeClose(ctrl, data);
    try {
        ctrl = c1({ hostname: host, port }); await ctrl.opened;
        const cw = ctrl.writable.getWriter(), cr = ctrl.readable.getReader();
        const peer = stunAttr(AT.PEER, xorPeer(targetIp, targetPort));
        const auth = await turnAuth(cw, cr, 6, { user, pass }, (aa, sign) => [sign(stunMsg(MT.PQ, tid(), [peer, ...aa])), sign(stunMsg(MT.CQ, tid(), [peer, ...aa]))]);
        if (!auth) { close(); return null; }
        const { aa, sign } = auth; let ex = auth.ex;
        data = c1({ hostname: host, port }); await data.opened;
        let r; [r, ex] = await readStun(cr, ex); if (r?.type !== MT.PO) { close(); return null; }
        [r, ex] = await readStun(cr, ex); if (r?.type !== MT.CO || !r.attrs[AT.CONNID]) { close(); return null; }
        const dw = data.writable.getWriter(), dr = data.readable.getReader();
        await dw.write(await sign(stunMsg(MT.BQ, tid(), [stunAttr(AT.CONNID, r.attrs[AT.CONNID]), ...aa])));
        let extra; [r, extra] = await readStun(dr); if (r?.type !== MT.BO) { close(); return null; }
        cr.releaseLock(); cw.releaseLock(); dw.releaseLock();
        const readable = new ReadableStream({
            start: c => extra?.length && c.enqueue(extra),
            pull: c => dr.read().then(({ done, value }) => done ? c.close() : c.enqueue(new Uint8Array(value))),
            cancel: () => { dr.cancel(); close(); }
        });
        return { readable, writable: data.writable, close, closed: data.closed || Promise.resolve() };
    } catch { close(); return null; }
};

const getSstp = str => { if (!str || !str.startsWith('sstp://')) return null; const [h, p] = str.slice(7).split(':'); return { host: h, port: p ? +p : 443 }; };

function f1(s) { try { if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CLOSING) s.close(); } catch (e) {} }

function f2(s) {
    if (!s) return { e: null };
    try {
        const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const y = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) y[i] = b.charCodeAt(i);
        return { d: y.buffer, e: null };
    } catch (e) { return { e }; }
}

function f3(s) {
    if (!s) return null; s = s.trim();
    if (s.startsWith('[')) {
        const i = s.indexOf(']');
        if (i > 0) { const h = s.substring(1, i), r = s.substring(i + 1); if (r.startsWith(':')) { const p = parseInt(r.substring(1), 10); if (!isNaN(p) && p > 0 && p <= 65535) return { h, p }; } return { h, p: 443 }; }
    }
    const i = s.lastIndexOf(':');
    if (i > 0) { const h = s.substring(0, i), p = parseInt(s.substring(i + 1), 10); if (!isNaN(p) && p > 0 && p <= 65535) return { h, p }; }
    return { h: s, p: 443 };
}

async function resolveDnsTxt(d) {
    const f = async (u) => { try { const r = await fetch(`${u}?name=${d}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } }); if (r.ok) { const j = await r.json(); return j.Answer || []; } } catch (e) {} return null; };
    const r = await f('https://1.1.1.1/dns-query'); return r || (await f('https://dns.google/dns-query')) || [];
}

function selectNode(nodes, targetHost, uuid) {
    if (!nodes || nodes.length === 0) return null;
    const trg = targetHost.includes('.') ? targetHost.split('.').slice(-2).join('.') : targetHost;
    let sd = [...(trg + uuid)].reduce((ac, c) => ac + c.charCodeAt(0), 0);
    let shuffled = [...nodes].sort(() => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return (sd / 0x7fffffff) - 0.5; });
    return shuffled[0];
}

async function getTxtNode(proxyStr, targetHost, uuid) {
    const rs = proxyStr.trim();
    if (txtCacheKey === rs && txtCacheNodes) return selectNode(txtCacheNodes, targetHost, uuid);
    const domain = rs.slice(0, -4).trim(); const tr = await resolveDnsTxt(domain); if (!tr) return null;
    const txtRecords = tr.filter(r => r.type === 16).map(r => r.data); let nodes = [];
    if (txtRecords.length > 0) { let d = txtRecords[0].replace(/^"|"$/g, ''); const parts = d.replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean); nodes = parts.map(f3).filter(Boolean); }
    if (nodes.length === 0) return null;
    txtCacheNodes = nodes.sort((x, y) => x.h.localeCompare(y.h)); txtCacheKey = rs;
    return selectNode(txtCacheNodes, targetHost, uuid);
}

function f6(c) {
    if (c.byteLength < 7) return { e: true, m: '1' };
    try {
        const v = new Uint8Array(c); const t = v[0]; let i = 1, l = 0, x = i, h = '';
        switch (t) {
            case 1: l = 4; h = new Uint8Array(c.slice(x, x + l)).join('.'); x += l; break;
            case 3: l = v[i]; x += 1; h = new TextDecoder().decode(c.slice(x, x + l)); x += l; break;
            case 4: l = 16; const a = []; const d = new DataView(c.slice(x, x + l)); for (let j = 0; j < 8; j++) a.push(d.getUint16(j * 2).toString(16)); h = a.join(':'); x += l; break;
            default: return { e: true, m: '2' };
        }
        if (!h) return { e: true, m: '3' };
        const p = new DataView(c.slice(x, x + 2)).getUint16(0); return { e: false, t, p, h, r: x + 2 };
    } catch (e) { return { e: true, m: '4' }; }
}

async function f7(rs, ws, hd, rf) {
    let h = hd, hd2 = false;
    await rs.readable.pipeTo(new WritableStream({
        async write(c, ctrl) {
            hd2 = true; if (ws.readyState !== WebSocket.OPEN) ctrl.error('d');
            if (h) { const r = new Uint8Array(h.length + c.byteLength); r.set(h, 0); r.set(c, h.length); ws.send(r.buffer); h = null; } else ws.send(c);
        }, abort() {}
    })).catch(() => f1(ws));
    if (!hd2 && rf) await rf();
}

const createSstp = () => {
    let buf = E, pppId = 1, sock, rd, wr, host, rb = new ArrayBuffer(65536);
    const readBytes = async n => {
        if (buf.length >= n) { const r = buf.subarray(0, n); buf = buf.subarray(n); return r; }
        const saved = buf.length > 0 ? new Uint8Array(buf) : null, need = n - buf.length;
        const { value, done } = await rd.readAtLeast(need, new Uint8Array(rb, 0, 65536));
        if (done) throw 0; rb = value.buffer;
        if (saved) { const t = cat(saved, value); buf = t.subarray(n); return t.subarray(0, n); }
        buf = value.subarray(n); return value.subarray(0, n);
    };
    const readLine = async () => {
        for (;;) {
            const i = buf.indexOf(10); if (i >= 0) { let l = dec.decode(buf.subarray(0, i)); buf = buf.subarray(i + 1); return l.replace(/\r$/, ''); }
            const saved = buf.length > 0 ? new Uint8Array(buf) : null;
            const { value, done } = await rd.readAtLeast(1, new Uint8Array(rb, 0, 65536));
            if (done) throw 0; rb = value.buffer; buf = saved ? cat(saved, value) : value;
        }
    };
    const readPkt = async (ms = 10000) => {
        let t; const to = new Promise((_, r) => { t = setTimeout(() => r('T'), ms); });
        try { const h = await Promise.race([readBytes(4), to]); clearTimeout(t); const len = u16(h, 2) & 0xFFF;
        return { ctrl: (h[1] & 1) !== 0, body: len > 4 ? await readBytes(len - 4) : E }; } catch (e) { clearTimeout(t); throw e; }
    };
    const sstpData = f => { const n = 6 + f.length, p = new Uint8Array(n); p.set([0x10, 0, ((n >> 8) & 0xF) | 0x80, n & 0xFF, 0xFF, 0x03]); p.set(f, 6); return p; };
    const sstpCtrl = (mt, attrs = []) => {
        const al = attrs.reduce((s, a) => s + 4 + a.data.length, 0), p = new Uint8Array(8 + al), v = new DataView(p.buffer);
        p[0] = 0x10; p[1] = 0x01; v.setUint16(2, (8 + al) | 0x8000); v.setUint16(4, mt); v.setUint16(6, attrs.length);
        attrs.reduce((o, a) => (p[o + 1] = a.id, v.setUint16(o + 2, 4 + a.data.length), p.set(a.data, o + 4), o + 4 + a.data.length), 8); return p;
    };
    const ppp = (proto, code, id, opts = []) => {
        const ol = opts.reduce((s, o) => s + 2 + o.data.length, 0), f = new Uint8Array(6 + ol), v = new DataView(f.buffer);
        v.setUint16(0, proto); f[2] = code; f[3] = id; v.setUint16(4, 4 + ol);
        opts.reduce((o, x) => (f[o] = x.type, f[o + 1] = 2 + x.data.length, f.set(x.data, o + 2), o + 2 + x.data.length), 6); return f;
    };
    const pap = id => { const ul = papCred.length, tl = 6 + ul * 2, f = new Uint8Array(2 + tl), v = new DataView(f.buffer);
        v.setUint16(0, 0xc023); f[2] = 1; f[3] = id; v.setUint16(4, tl); f[6] = ul; f.set(papCred, 7); f[7 + ul] = ul; f.set(papCred, 8 + ul); return f; };
    const parsePPP = d => { let o = d.length >= 2 && d[0] === 0xFF && d[1] === 0x03 ? 2 : 0; if (d.length - o < 4) return null;
        const p = u16(d, o); return p === 0x0021 ? { protocol: p, ip: d.subarray(o + 2) } : d.length - o >= 6 ? { protocol: p, code: d[o + 2], id: d[o + 3], payload: d.subarray(o + 6), raw: d.subarray(o) } : null; };
    const parseOpts = d => { const r = []; for (let i = 0; i + 2 <= d.length;) { const t = d[i], l = d[i + 1]; if (l < 2 || i + l > d.length) break; r.push({ type: t, data: d.subarray(i + 2, i + l) }); i += l; } return r; };
    
    const connect_ = async (h, p) => { sock = c1({ hostname: h, port: p }, { secureTransport: 'on' }); await sock.opened; rd = sock.readable.getReader({ mode: 'byob' }); wr = sock.writable.getWriter(); host = h; };
    
    const establish = async () => {
        const http = enc(`SSTP_DUPLEX_POST /sra_{BA195980-CD49-458b-9E23-C84EE0ADCD75}/ HTTP/1.1\r\nHost: ${host}\r\nContent-Length: 18446744073709551615\r\nSSTPCORRELATIONID: {${crypto.randomUUID()}}\r\n\r\n`);
        const pa = new Uint8Array(2); new DataView(pa.buffer).setUint16(0, 1); const mru = new Uint8Array(2); new DataView(mru.buffer).setUint16(0, 1500);
        await wr.write(cat(http, sstpCtrl(0x0001, [{ id: 1, data: pa }]), sstpData(ppp(0xc021, 1, pppId++, [{ type: 1, data: mru }]))));
        const st = await readLine(); while ((await readLine()) !== ''); if (!st.includes('200')) throw 0;
        let sa = false, ld = false, auth = false, done = false, myIp = null;
        for (let r = 0; r < 25 && !done; r++) {
            const pk = await readPkt(); if (pk.ctrl) { if (!sa && pk.body.length >= 2 && u16(pk.body, 0) === 2) sa = true; continue; }
            const pp = parsePPP(pk.body); if (!pp) continue;
            if (pp.protocol === 0xc021) {
                if (pp.code === 1) { const a = new Uint8Array(pp.raw); a[2] = 2; await wr.write(ld && !auth ? cat(sstpData(a), sstpData(pap(pppId++))) : sstpData(a)); if (ld) auth = true;
                } else if (pp.code === 2) { ld = true; if (!auth) { await wr.write(sstpData(pap(pppId++))); auth = true; } }
            } else if (pp.protocol === 0xc023 && pp.code === 2) await wr.write(sstpData(ppp(0x8021, 1, pppId++, [{ type: 3, data: new Uint8Array(4) }])));
            else if (pp.protocol === 0x8021) {
                if (pp.code === 1) { const a = new Uint8Array(pp.raw); a[2] = 2; await wr.write(sstpData(a)); }
                else if (pp.code === 3) { const o = parseOpts(pp.payload).find(x => x.type === 3); if (o) { myIp = [...o.data].join('.'); await wr.write(sstpData(ppp(0x8021, 1, pppId++, [{ type: 3, data: o.data }]))); } }
                else if (pp.code === 2) { const o = parseOpts(pp.payload).find(x => x.type === 3); if (o) myIp = [...o.data].join('.'); done = true; }
            }
        }
        if (!myIp) throw 0; return myIp;
    };
    const close = () => { [rd, wr, sock].forEach(x => { try { x?.cancel?.() ?? x?.close?.(); } catch {} }); };
    return { connect: connect_, establish, readPkt, parsePPP, get buf() { return buf; }, get wr() { return wr; }, close };
};

const createTcp = (sstp, srcIp, dstIp, dstPort) => {
    const srcPort = 10000 + (rng16() % 50000), srcB = ipB(srcIp), dstB = ipB(dstIp); let seq = rng32(), ack = 0;
    const ipTpl = new Uint8Array(20); ipTpl.set([0x45, 0, 0, 0, 0, 0, 0x40, 0, 64, 6]); ipTpl.set(srcB, 12); ipTpl.set(dstB, 16);
    const pseudo = new Uint8Array(1432); pseudo.set(srcB); pseudo.set(dstB, 4); pseudo[9] = 6;
    const frame = (flags, data = E) => {
        const pl = data.length, tl = 20 + pl, il = 20 + tl, st = 8 + il, f = new Uint8Array(st), v = new DataView(f.buffer);
        f.set([0x10, 0, ((st >> 8) & 0xF) | 0x80, st & 0xFF, 0xFF, 0x03, 0, 0x21]); f.set(ipTpl, 8);
        v.setUint16(10, il); v.setUint16(12, rng16()); v.setUint16(18, cksum(f, 8, 20));
        v.setUint16(28, srcPort); v.setUint16(30, dstPort); v.setUint32(32, seq); v.setUint32(36, ack);
        f[40] = 0x50; f[41] = flags; v.setUint16(42, 65535); if (pl) f.set(data, 48);
        pseudo[10] = tl >> 8; pseudo[11] = tl & 0xFF; pseudo.set(f.subarray(28, 28 + tl), 12);
        v.setUint16(44, cksum(pseudo, 0, 12 + tl)); return f;
    };
    const match = ip => { if (ip.length < 40 || ip[9] !== 6) return null; const ihl = (ip[0] & 0xF) * 4;
        if (u16(ip, ihl) !== dstPort || u16(ip, ihl + 2) !== srcPort) return null;
        return { flags: ip[ihl + 13], seq: u32(ip, ihl + 4), off: ihl + ((ip[ihl + 12] >> 4) & 0xF) * 4 }; };
    const handshake = async () => {
        await sstp.wr.write(frame(0x02)); seq++;
        for (let i = 0; i < 30; i++) { const pk = await sstp.readPkt(); if (pk.ctrl) continue;
        const pp = sstp.parsePPP(pk.body); if (!pp || pp.protocol !== 0x0021) continue;
        const m = match(pp.ip); if (!m || (m.flags & 0x12) !== 0x12) continue; ack = (m.seq + 1) >>> 0; sstp.wr.write(frame(0x10)); return true; }
        throw 0;
    };
    return { frame, match, handshake, get seq() { return seq; }, set seq(v) { seq = v; }, get ack() { return ack; }, set ack(v) { ack = v; } };
};

const sstpConn = async ({ host, port }, ipP, targetPort) => {
    const sstp = createSstp(), close = () => sstp.close();
    try {
        await sstp.connect(host, port);
        const [myIp, targetIp] = await Promise.all([sstp.establish(), ipP]); if (!targetIp) { close(); return null; }
        const tcp = createTcp(sstp, myIp, targetIp, targetPort); await tcp.handshake();
        let ctrl = null; const readable = new ReadableStream({ start: c => { ctrl = c; }, cancel: close });
        (async () => {
            try { let pend = [], pLen = 0;
                const flush = () => { if (!pLen) return; ctrl.enqueue(pend.length === 1 ? pend[0] : cat(...pend)); pend = []; pLen = 0; sstp.wr.write(tcp.frame(0x10)).catch(() => {}); };
                for (;;) { const pk = await sstp.readPkt(60000); if (pk.ctrl) continue;
                    const pp = sstp.parsePPP(pk.body); if (!pp || pp.protocol !== 0x0021) continue;
                    const m = tcp.match(pp.ip); if (!m) continue;
                    if (m.off < pp.ip.length) { const d = pp.ip.subarray(m.off); if (d.length) { tcp.ack = (m.seq + d.length) >>> 0; pend.push(new Uint8Array(d)); pLen += d.length; } }
                    if (m.flags & 0x01) { flush(); tcp.ack = (tcp.ack + 1) >>> 0; sstp.wr.write(tcp.frame(0x11)).catch(() => {}); ctrl.close(); return; }
                    if (sstp.buf.length < 4 || pLen >= 32768) flush();
                }
            } catch { try { ctrl.close(); } catch {} }
        })();
        const writable = new WritableStream({
            async write(chunk) { const d = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                if (d.length <= MSS) { await sstp.wr.write(tcp.frame(0x18, d)); tcp.seq = (tcp.seq + d.length) >>> 0; return; }
                const frames = []; for (let o = 0; o < d.length; o += MSS) { const seg = d.subarray(o, Math.min(o + MSS, d.length)); frames.push(tcp.frame(0x18, seg)); tcp.seq = (tcp.seq + seg.length) >>> 0; }
                await sstp.wr.write(cat(...frames));
            }, close: () => sstp.wr.write(tcp.frame(0x11)).catch(() => {}), abort: close
        });
        return { readable, writable, close, closed: Promise.resolve() };
    } catch { close(); return null; }
};

async function f8(h, p, d, w, r, cw, k) {
    async function cd(a, o, c) { const s = c1({ hostname: a, port: o }); const x = s.writable.getWriter(); await x.write(c); x.releaseLock(); return s; }
    let fallbackStr = k || v1;

    if (fallbackStr && fallbackStr.startsWith('turn://')) {
        const ep = getTurn(fallbackStr);
        if (ep) {
            try {
                const targetIp = await resolveIP(h); 
                if (targetIp) {
                    const ns = await turnConn(ep, targetIp, p);
                    if (ns) {
                        cw.s = ns;
                        const x = ns.writable.getWriter();
                        await x.write(d); x.releaseLock();
                        f7(ns, w, r, null);
                        return;
                    }
                }
            } catch (e) {}
        }
        f1(w); return;
    }

    if (fallbackStr && fallbackStr.startsWith('sstp://')) {
        const ep = getSstp(fallbackStr);
        if (ep) {
            try {
                const targetIp = await resolveIP(h);
                const ns = await sstpConn(ep, targetIp, p);
                if (ns) { cw.s = ns; const x = ns.writable.getWriter(); await x.write(d); x.releaseLock(); f7(ns, w, r, null); return; }
            } catch (e) {}
        }
        f1(w); return;
    }

    async function cp() {
        let pc = f3(fallbackStr) || f3(v1) || { h: v1, p: 443 };
        if (fallbackStr && fallbackStr.toLowerCase().endsWith('!txt')) {
            try { const txtNode = await getTxtNode(fallbackStr, h, v2); if (txtNode) pc = txtNode; } catch (e) {}
        }
        let ns = await cd(pc.h, pc.p, d); cw.s = ns; ns.closed?.catch(() => {}).finally(() => f1(w)); f7(ns, w, r, null);
    }
    
    try { const is = await cd(h, p, d); cw.s = is; f7(is, w, r, cp); } catch (e) { await cp(); }
}

function f9(s, h) {
    let c = false;
    return new ReadableStream({
        start(ctrl) {
            s.addEventListener('message', e => { if (!c) ctrl.enqueue(e.data); });
            s.addEventListener('close', () => { if (!c) { f1(s); ctrl.close(); } });
            s.addEventListener('error', e => ctrl.error(e));
            const { d, e } = f2(h); if (e) ctrl.error(e); else if (d) ctrl.enqueue(d);
        }, cancel() { c = true; f1(s); }
    });
}

async function f10(u, w, r) {
    try {
        const t = c1({ hostname: '8.8.4.4', port: 53 }); let v = r; const x = t.writable.getWriter(); await x.write(u); x.releaseLock();
        await t.readable.pipeTo(new WritableStream({ async write(c) { if (w.readyState === WebSocket.OPEN) { if (v) { const s = new Uint8Array(v.length + c.byteLength); s.set(v, 0); s.set(c, v.length); w.send(s.buffer); v = null; } else w.send(c); } } }));
    } catch (e) {}
}

async function f11(r, k) {
    const p = new WebSocketPair(); const [c, s] = Object.values(p); s.accept();
    let cw = { s: null }, q = false; const ed = r.headers.get('sec-websocket-protocol') || ''; const rd = f9(s, ed);
    
    rd.pipeTo(new WritableStream({
        async write(chunk) {
            if (q) return await f10(chunk, s, null);
            if (cw.s) { const w = cw.s.writable.getWriter(); await w.write(chunk); w.releaseLock(); return; }
            const { e, t, p, h, r: i } = f6(chunk);
            if (e) throw new Error('e');
            if (t === 2) { if (p === 53) q = true; else throw new Error('g'); }
            const rdPayload = chunk.slice(i);
            if (q) return f10(rdPayload, s, null);
            await f8(h, p, rdPayload, s, null, cw, k);
        }
    })).catch(() => {});
    
    return new Response(null, { status: 101, webSocket: c });
}

export default {
    async fetch(r) {
        try {
            const u = new URL(r.url);
            if (r.headers.get('Upgrade') !== 'websocket') return new Response(null, { status: 404 });
            if (!u.pathname.toLowerCase().startsWith(`/${v2}`.toLowerCase())) return new Response(null, { status: 401 });
            const k = u.searchParams.get('fdip') || r.headers.get('fdip');
            return await f11(r, k);
        } catch (e) {
            return new Response(null, { status: 500 });
        }
    }
};
