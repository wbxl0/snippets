import { connect } from 'cloudflare:sockets';

let v1 = 'proxyip.example.com!txt';
let v2 = '495c7195-85b8-498a-bf20-2ea9ce9175b5';

let v3 = null;
let v4 = null;

const r1 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const r2 = /^\[?([a-fA-F0-9:]+)\]?$/;
const hx = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

function f1(a, o = 0) {
    return `${hx[a[o]]}${hx[a[o+1]]}${hx[a[o+2]]}${hx[a[o+3]]}-${hx[a[o+4]]}${hx[a[o+5]]}-${hx[a[o+6]]}${hx[a[o+7]]}-${hx[a[o+8]]}${hx[a[o+9]]}-${hx[a[o+10]]}${hx[a[o+11]]}${hx[a[o+12]]}${hx[a[o+13]]}${hx[a[o+14]]}${hx[a[o+15]]}`;
}

function f2(s) {
    if (!s) return { e: null };
    try {
        const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        const y = Uint8Array.from(b, c => c.charCodeAt(0));
        return { d: y.buffer, e: null };
    } catch (e) {
        return { e };
    }
}

function f3(s) {
    try {
        if (s?.readyState === WebSocket.OPEN || s?.readyState === WebSocket.CLOSING) s.close();
    } catch (e) {}
}

function f4(p) {
    if (!p) return null;
    p = p.trim();

    const m = p.match(/^\[([^\]]+)\](?::(\d+))?$/);
    if (m) {
        const pt = parseInt(m[2], 10);
        return { t: 'direct', h: m[1], p: (!isNaN(pt) && pt > 0) ? pt : 443 };
    }

    const l = p.lastIndexOf(':');
    if (l > 0) {
        const h = p.substring(0, l);
        const pt = parseInt(p.substring(l + 1), 10);
        if (!isNaN(pt) && pt > 0 && pt <= 65535) return { t: 'direct', h, p: pt };
    }

    return { t: 'direct', h: p, p: 443 };
}

async function f5(d, t) {
    const f = async (u) => {
        try {
            const r = await fetch(`${u}?name=${d}&type=${t}`, { headers: { 'Accept': 'application/dns-json' } });
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

function f6(s) {
    let a = s, p = 443;
    const m = s.match(/^(?:\[([^\]]+)\]|([^:]+))(?::(\d+))?$/);
    if (m) {
        a = m[1] || m[2];
        p = m[3] ? parseInt(m[3], 10) : 443;
    }
    return [a, p];
}

async function f7(s, t = 'dash.cloudflare.com', u = '00000000-0000-4000-8000-000000000000') {
    const rs = s.trim();
    if (v3 === rs && v4) return v4;

    const ls = rs.toLowerCase();
    const i = ls.endsWith('!txt');
    const td = i ? rs.slice(0, -4).trim() : rs;
    let a = [];

    if (i) {
        const tr = await f5(td, 'TXT');
        const td2 = tr.filter(r => r.type === 16).map(r => r.data);
        if (td2.length > 0) {
            let d = td2[0].replace(/^"|"$/g, '');
            const p = d.replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean);
            a = p.map(f6);
        }
    } else {
        let [ad, pt] = f6(td);
        const tm = td.match(/\.tp(\d+)/);
        if (tm) pt = parseInt(tm[1], 10);

        if (!r1.test(ad) && !r2.test(ad)) {
            const [ar, a4r] = await Promise.all([f5(ad, 'A'), f5(ad, 'AAAA')]);
            const i4 = ar.filter(r => r.type === 1).map(r => r.data);
            const i6 = a4r.filter(r => r.type === 28).map(r => `[${r.data}]`);
            const ip = [...i4, ...i6];
            a = ip.length > 0 ? ip.map(x => [x, pt]) : [[ad, pt]];
        } else {
            a = [[ad, pt]];
        }
    }

    const sa = a.sort((x, y) => x[0].localeCompare(y[0]));
    const trg = t.includes('.') ? t.split('.').slice(-2).join('.') : t;
    
    let sd = 0;
    const str = trg + u;
    for (let j = 0; j < str.length; j++) sd += str.charCodeAt(j);

    v4 = [...sa].sort(() => {
        sd = (sd * 1103515245 + 12345) & 0x7fffffff;
        return (sd / 0x7fffffff) - 0.5;
    }).slice(0, 8);
    
    v3 = rs;
    return v4;
}

export default {
    async fetch(rq) {
        try {
            const u = new URL(rq.url);
            const is = rq.headers.get('Upgrade') === 'websocket';
            let cv = null;

            if (u.pathname.startsWith('/fdip=')) {
                try { cv = decodeURIComponent(u.pathname.substring(9)).trim(); } catch (e) {}
                if (cv && !is) {
                    v1 = cv;
                    return new Response(`set fdIP to: ${v1}\n\n`, {
                        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
                    });
                }
            }

            if (is) {
                const fv = cv || u.searchParams.get('fdip') || rq.headers.get('fdip');
                return await f8(rq, fv);
            }

            return new Response('Not Found', { status: 404 });
        } catch (err) {
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};

async function f8(rq, cv) {
    const wp = new WebSocketPair();
    const [c, s] = Object.values(wp);
    s.accept();
    let rw = { sk: null };
    let dq = false;

    const ed = rq.headers.get('sec-websocket-protocol') || '';
    const rd = f12(s, ed);

    rd.pipeTo(new WritableStream({
        async write(ck) {
            if (dq) return await f14(ck, s, null);
            if (rw.sk) {
                const wt = rw.sk.writable.getWriter();
                await wt.write(ck);
                wt.releaseLock();
                return;
            }

            const { he, m, at, p, h, ri, v, iu } = f11(ck, v2);
            if (he) throw new Error(m);

            if (iu) {
                if (p === 53) dq = true;
                else throw new Error('UDP is not supported');
            }

            const rh = new Uint8Array([v, 0]);
            const rwd = ck.subarray(ri); 
            
            if (dq) return f14(rwd, s, rh);
            await f10(at, h, p, rwd, s, rh, rw, cv);
        },
    })).catch(() => {});

    return new Response(null, { status: 101, webSocket: c });
}

async function f10(at, h, pn, rwd, ws, rh, rw, cv) {
    const cd = async (a, p, d) => {
        const rs = connect({ hostname: a, port: p });
        const wt = rs.writable.getWriter();
        await wt.write(d);
        wt.releaseLock();
        return rs;
    };

    let c1 = cv || v1;
    let pc = c1 ? f4(c1) : null;

    if (!pc) pc = { t: 'direct', h: v1, p: 443 };

    if (pc.t === 'direct' && c1) {
        try {
            const rl = await f7(c1, h, v2);
            if (rl?.length > 0) [pc.h, pc.p] = rl[0];
        } catch (e) {}
    }

    const cp = async () => {
        let ns = await cd(pc.h, pc.p, rwd);
        rw.sk = ns;
        ns.closed.catch(() => {}).finally(() => f3(ws));
        f13(ns, ws, rh, null);
    };

    try {
        const is = await cd(h, pn, rwd);
        rw.sk = is;
        f13(is, ws, rh, cp);
    } catch (e) { await cp(); }
}

function f11(ck, tk) {
    if (ck.byteLength < 24) return { he: true, m: 'invalid' };
    
    if (f1(ck, 1) !== tk) return { he: true, m: 'invalid' };
    
    const ol = ck[17];
    const c = ck[18 + ol];
    if (c !== 1 && c !== 2) return { he: true, m: 'invalid' };
    
    const pi = 19 + ol;
    const p = (ck[pi] << 8) | ck[pi + 1];
    let ai = pi + 3, al = 0, hn = '';
    const at = ck[pi + 2];

    switch (at) {
        case 1: 
            al = 4; 
            hn = `${ck[ai]}.${ck[ai+1]}.${ck[ai+2]}.${ck[ai+3]}`; 
            break;
        case 2: 
            al = ck[ai]; 
            ai += 1; 
            hn = new TextDecoder().decode(ck.subarray(ai, ai + al)); 
            break;
        case 3: 
            al = 16; 
            hn = Array.from({ length: 8 }, (_, i) => ((ck[ai + i * 2] << 8) | ck[ai + i * 2 + 1]).toString(16)).join(':'); 
            break;
        default: return { he: true, m: 'invalid' };
    }
    
    if (!hn) return { he: true, m: 'invalid' };
    return { he: false, at, p, h: hn, iu: c === 2, ri: ai + al, v: ck[0] };
}

function f12(sk, edh) {
    let c = false;
    return new ReadableStream({
        start(co) {
            sk.addEventListener('message', e => { if (!c) co.enqueue(e.data); });
            sk.addEventListener('close', () => { if (!c) { f3(sk); co.close(); } });
            sk.addEventListener('error', err => co.error(err));
            
            const { d, e } = f2(edh);
            if (e) co.error(e);
            else if (d) co.enqueue(new Uint8Array(d)); 
        },
        cancel() { c = true; f3(sk); }
    });
}

async function f13(rs, ws, hd, rf) {
    let h = hd, hd_f = false;
    await rs.readable.pipeTo(new WritableStream({
        async write(ck, co) {
            hd_f = true;
            if (ws.readyState !== WebSocket.OPEN) { co.error('closed'); return; }
            if (h) {
                const r = new Uint8Array(h.length + ck.byteLength);
                r.set(h, 0); r.set(ck, h.length);
                ws.send(r); 
                h = null;
            } else {
                ws.send(ck);
            }
        },
        abort() {},
    })).catch(() => f3(ws));
    
    if (!hd_f && rf) await rf();
}

async function f14(uc, ws, rh) {
    try {
        const ts = connect({ hostname: '8.8.4.4', port: 53 });
        let vh = rh;
        const wt = ts.writable.getWriter();
        await wt.write(uc);
        wt.releaseLock();
        
        await ts.readable.pipeTo(new WritableStream({
            async write(ck) {
                if (ws.readyState === WebSocket.OPEN) {
                    if (vh) {
                        const r = new Uint8Array(vh.length + ck.byteLength);
                        r.set(vh, 0); r.set(ck, vh.length);
                        ws.send(r);
                        vh = null;
                    } else {
                        ws.send(ck);
                    }
                }
            },
        }));
    } catch (e) {}
}
