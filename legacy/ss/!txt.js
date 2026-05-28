import { connect as c1 } from 'cloudflare:sockets';

const v1 = 'proxyip.example.com!txt';
const v2 = '495c7195-85b8-498a-bf20-2ea9ce9175b5';

let txtCacheKey = null;
let txtCacheNodes = null;

function f1(s) {
    try { if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CLOSING) s.close(); } catch (e) {}
}

function f2(s) {
    if (!s) return { e: null };
    try {
        const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const y = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) y[i] = b.charCodeAt(i);
        return { d: y.buffer, e: null };
    } catch (e) { return { e }; }
}

function f3(s) {
    if (!s) return null;
    s = s.trim();
    if (s.startsWith('[')) {
        const i = s.indexOf(']');
        if (i > 0) {
            const h = s.substring(1, i), r = s.substring(i + 1);
            if (r.startsWith(':')) {
                const p = parseInt(r.substring(1), 10);
                if (!isNaN(p) && p > 0 && p <= 65535) return { h, p };
            }
            return { h, p: 443 };
        }
    }
    const i = s.lastIndexOf(':');
    if (i > 0) {
        const h = s.substring(0, i), p = parseInt(s.substring(i + 1), 10);
        if (!isNaN(p) && p > 0 && p <= 65535) return { h, p };
    }
    return { h: s, p: 443 };
}

async function resolveDnsTxt(d) {
    const f = async (u) => {
        try {
            const r = await fetch(`${u}?name=${d}&type=TXT`, { headers: { 'Accept': 'application/dns-json' } });
            if (r.ok) {
                const j = await r.json();
                return j.Answer || [];
            }
        } catch (e) {}
        return null;
    };
    const r = await f('https://1.1.1.1/dns-query');
    return r || (await f('https://dns.google/dns-query')) || [];
}

function selectNode(nodes, targetHost, uuid) {
    if (!nodes || nodes.length === 0) return null;
    const trg = targetHost.includes('.') ? targetHost.split('.').slice(-2).join('.') : targetHost;
    let sd = [...(trg + uuid)].reduce((ac, c) => ac + c.charCodeAt(0), 0);
    
    let shuffled = [...nodes].sort(() => {
        sd = (sd * 1103515245 + 12345) & 0x7fffffff;
        return (sd / 0x7fffffff) - 0.5;
    });
    return shuffled[0];
}

async function getTxtNode(proxyStr, targetHost, uuid) {
    const rs = proxyStr.trim();
    if (txtCacheKey === rs && txtCacheNodes) {
        return selectNode(txtCacheNodes, targetHost, uuid);
    }

    const domain = rs.slice(0, -4).trim();
    const tr = await resolveDnsTxt(domain);
    if (!tr) return null;
    
    const txtRecords = tr.filter(r => r.type === 16).map(r => r.data);
    
    let nodes = [];
    if (txtRecords.length > 0) {
        let d = txtRecords[0].replace(/^"|"$/g, '');
        const parts = d.replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean);
        nodes = parts.map(f3).filter(Boolean);
    }

    if (nodes.length === 0) return null;

    txtCacheNodes = nodes.sort((x, y) => x.h.localeCompare(y.h));
    txtCacheKey = rs;

    return selectNode(txtCacheNodes, targetHost, uuid);
}

function f6(c) {
    if (c.byteLength < 7) return { e: true, m: '1' };
    try {
        const v = new Uint8Array(c);
        const t = v[0];
        let i = 1, l = 0, x = i, h = '';
        switch (t) {
            case 1: l = 4; h = new Uint8Array(c.slice(x, x + l)).join('.'); x += l; break;
            case 3: l = v[i]; x += 1; h = new TextDecoder().decode(c.slice(x, x + l)); x += l; break;
            case 4: l = 16; const a = []; const d = new DataView(c.slice(x, x + l)); for (let j = 0; j < 8; j++) a.push(d.getUint16(j * 2).toString(16)); h = a.join(':'); x += l; break;
            default: return { e: true, m: '2' };
        }
        if (!h) return { e: true, m: '3' };
        const p = new DataView(c.slice(x, x + 2)).getUint16(0);
        return { e: false, t, p, h, r: x + 2 };
    } catch (e) { return { e: true, m: '4' }; }
}

async function f7(rs, ws, hd, rf) {
    let h = hd, hd2 = false;
    await rs.readable.pipeTo(new WritableStream({
        async write(c, ctrl) {
            hd2 = true;
            if (ws.readyState !== WebSocket.OPEN) ctrl.error('d');
            if (h) {
                const r = new Uint8Array(h.length + c.byteLength);
                r.set(h, 0); r.set(c, h.length);
                ws.send(r.buffer); h = null;
            } else ws.send(c);
        },
        abort() {}
    })).catch(() => f1(ws));
    if (!hd2 && rf) await rf();
}

async function f8(h, p, d, w, r, cw, k) {
    async function cd(a, o, c) {
        const s = c1({ hostname: a, port: o });
        const x = s.writable.getWriter();
        await x.write(c); x.releaseLock(); return s;
    }
    
    let pc = f3(k) || f3(v1) || { h: v1, p: 443 };
    
    let fallbackStr = k || v1;
    if (fallbackStr && fallbackStr.toLowerCase().endsWith('!txt')) {
        try {
            const txtNode = await getTxtNode(fallbackStr, h, v2);
            if (txtNode) pc = txtNode;
        } catch (e) {}
    }

    async function cp() {
        let ns = await cd(pc.h, pc.p, d);
        cw.s = ns;
        ns.closed.catch(() => {}).finally(() => f1(w));
        f7(ns, w, r, null);
    }
    try {
        const is = await cd(h, p, d);
        cw.s = is; f7(is, w, r, cp);
    } catch (e) { await cp(); }
}

function f9(s, h) {
    let c = false;
    return new ReadableStream({
        start(ctrl) {
            s.addEventListener('message', e => { if (!c) ctrl.enqueue(e.data); });
            s.addEventListener('close', () => { if (!c) { f1(s); ctrl.close(); } });
            s.addEventListener('error', e => ctrl.error(e));
            const { d, e } = f2(h);
            if (e) ctrl.error(e); else if (d) ctrl.enqueue(d);
        },
        cancel() { c = true; f1(s); }
    });
}

async function f10(u, w, r) {
    try {
        const t = c1({ hostname: '8.8.4.4', port: 53 });
        let v = r; const x = t.writable.getWriter();
        await x.write(u); x.releaseLock();
        await t.readable.pipeTo(new WritableStream({
            async write(c) {
                if (w.readyState === WebSocket.OPEN) {
                    if (v) {
                        const s = new Uint8Array(v.length + c.byteLength);
                        s.set(v, 0); s.set(c, v.length); w.send(s.buffer); v = null;
                    } else w.send(c);
                }
            }
        }));
    } catch (e) {}
}

async function f11(r, k) {
    const p = new WebSocketPair();
    const [c, s] = Object.values(p);
    s.accept();
    let cw = { s: null }, q = false;
    const ed = r.headers.get('sec-websocket-protocol') || '';
    const rd = f9(s, ed);
    
    rd.pipeTo(new WritableStream({
        async write(chunk) {
            if (q) return await f10(chunk, s, null);
            if (cw.s) {
                const w = cw.s.writable.getWriter();
                await w.write(chunk); w.releaseLock(); return;
            }
            const { e, t, p, h, r: i } = f6(chunk);
            if (e) throw new Error('e');
            if (t === 2) {
                if (p === 53) q = true; else throw new Error('g');
            }
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
