import { connect } from 'cloudflare:sockets';

const CFG = { 
  pw: 'password',
  chunk: 64 * 1024, dnPack: 32 * 1024, dnTail: 512, dnMs: 0, 
  upPack: 16 * 1024, upQMax: 256 * 1024, maxED: 8 * 1024, concur: 1 
};

const enc = new TextEncoder(), dec = new TextDecoder(), Z20 = new Uint8Array(20);
const cat = (...xs) => { 
  const r = new Uint8Array(xs.reduce((n, x) => n + x.length, 0)); 
  let o = 0; for (const x of xs) r.set(x, o), o += x.length; return r; 
};
const pushBuf = (b, d) => b.length ? cat(b, d) : d;
const u16be = (d, o) => (d[o] << 8) | d[o + 1];
const put16 = (d, o, v) => { d[o] = (v >> 8) & 255; d[o + 1] = v & 255; };

const evp = async (pw, kl) => { 
  const p = enc.encode(pw); let k = new Uint8Array(0), pv = new Uint8Array(0); 
  while (k.length < kl) { 
    const d = new Uint8Array(pv.length + p.length); d.set(pv); d.set(p, pv.length); 
    pv = new Uint8Array(await crypto.subtle.digest('MD5', d)); 
    const nk = new Uint8Array(k.length + pv.length); nk.set(k); nk.set(pv, k.length); k = nk; 
  } 
  return k.slice(0, kl); 
};
const hkdf = async (ikm, salt, info, len) => { 
  const k1 = await crypto.subtle.importKey('raw', salt.length ? salt : Z20, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', k1, ikm));
  const k2 = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const okm = new Uint8Array(Math.ceil(len / 20) * 20); let pv = new Uint8Array(0); 
  for (let i = 0; i < Math.ceil(len / 20); i++) { 
    pv = new Uint8Array(await crypto.subtle.sign('HMAC', k2, cat(pv, info, new Uint8Array([i + 1])))); 
    okm.set(pv, i * 20); 
  } 
  return okm.slice(0, len); 
};

let MK = null;
const getMK = async () => MK ??= await evp(CFG.pw, 16);
const SS_INFO = enc.encode('ss-subkey');

class AEAD { 
  constructor(key) { this.key = key; this.nonce = new Uint8Array(12); this.ck = null; } 
  async init() { this.ck = await crypto.subtle.importKey('raw', this.key, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); } 
  inc() { for (let i = 0; i < this.nonce.length; i++) { this.nonce[i]++; if (this.nonce[i]) break; } } 
  async enc(d) { const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: this.nonce, tagLength: 128 }, this.ck, d)); this.inc(); return c; } 
  async dec(d) { try { const p = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: this.nonce, tagLength: 128 }, this.ck, d)); this.inc(); return p; } catch { return null; } } 
}

class SS { 
  constructor() { this.dec = null; this.enc = null; this.buf = new Uint8Array(0); this.plen = -1; }
  async decData(data) { 
    this.buf = pushBuf(this.buf, data); const out = [];
    if (!this.dec) { 
      if (this.buf.length < 16) return { c: [] }; 
      const salt = this.buf.slice(0, 16); this.buf = this.buf.slice(16); 
      this.dec = new AEAD(await hkdf(await getMK(), salt, SS_INFO, 16)); await this.dec.init(); 
    }
    while (true) { 
      if (this.plen < 0) { 
        if (this.buf.length < 18) break;
        const lp = await this.dec.dec(this.buf.slice(0, 18)); if (!lp) return { c: out, e: 'len' }; 
        this.plen = u16be(lp, 0); this.buf = this.buf.slice(18); 
      } 
      const ps = this.plen + 16; 
      if (this.buf.length < ps) break; 
      const pp = await this.dec.dec(this.buf.slice(0, ps)); if (!pp) return { c: out, e: 'pay' }; 
      out.push(pp); this.buf = this.buf.slice(ps); this.plen = -1; 
    } 
    return { c: out }; 
  }
  async encData(data) { 
    let pf = new Uint8Array(0); 
    if (!this.enc) { 
      const salt = crypto.getRandomValues(new Uint8Array(16)); 
      this.enc = new AEAD(await hkdf(await getMK(), salt, SS_INFO, 16)); await this.enc.init(); pf = salt; 
    }
    if (!data || data.length === 0) return pf.length ? pf : new Uint8Array(0);
    const mx = 0x3FFF, cks = []; 
    for (let i = 0; i < data.length; i += mx) { 
      const ck = data.subarray(i, Math.min(i + mx, data.length)), lb = new Uint8Array(2); 
      put16(lb, 0, ck.length); cks.push(await this.enc.enc(lb), await this.enc.enc(ck)); 
    } 
    const tl = pf.length + cks.reduce((s, c) => s + c.length, 0), r = new Uint8Array(tl); 
    r.set(pf); let o = pf.length; for (const c of cks) { r.set(c, o); o += c.length; } 
    return r; 
  } 
}

const parseAddr = d => { 
  if (d.length < 1) return null; 
  const t = d[0]; let h, p, o; 
  if (t === 1 && d.length >= 7) { h = `${d[1]}.${d[2]}.${d[3]}.${d[4]}`; p = u16be(d, 5); o = 7; } 
  else if (t === 3 && d.length >= 4 + d[1]) { h = dec.decode(d.subarray(2, 2 + d[1])); p = u16be(d, 2 + d[1]); o = 4 + d[1]; } 
  else if (t === 4 && d.length >= 19) { h = `[${Array.from({ length: 8 }, (_, i) => ((d[1 + i * 2] << 8) | d[2 + i * 2]).toString(16)).join(':')}]`; p = u16be(d, 17); o = 19; } 
  else return null; 
  return { h, p, o }; 
};

const sprout = (h, p, s = connect({ hostname: h, port: p })) => s.opened.then(() => s);
const raceSprout = (h, p) => { 
  if (CFG.concur <= 1) return sprout(h, p).catch(() => null); 
  const ts = Array(CFG.concur).fill().map(() => sprout(h, p)); 
  return Promise.any(ts).then(w => { ts.forEach(t => t.then(s => s !== w && s.close(), () => {})); return w; }).catch(() => null); 
};

const parseFdip = s => {
  const m = s.trim().match(/^(?:\[([^\]]+)\]|([^:]+))(?::(\d+))?$/);
  return m ? { h: m[1] || m[2], p: parseInt(m[3]) || 443 } : { h: s, p: 443 };
};

const txtCache = new Map();
const getTxtNode = async (fdipStr, targetHost) => {
  if (!fdipStr.endsWith('!txt')) return parseFdip(fdipStr);
  const domain = fdipStr.slice(0, -4);
  let nodes = txtCache.get(domain);
  
  if (!nodes) {
    try {
      const r = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=TXT`, { headers: { accept: 'application/dns-json' } });
      const txt = ((await r.json()).Answer || []).filter(x => x.type === 16).map(x => x.data).join(',');
      nodes = txt.replace(/"/g, '').replace(/\\010|\n/g, ',').split(',').map(x => x.trim()).filter(Boolean).map(parseFdip);
      if (nodes.length) txtCache.set(domain, nodes);
    } catch {}
  }
  
  if (!nodes?.length) return null;
  const sd = [...targetHost].reduce((a, c) => a + c.charCodeAt(0), 0);
  return nodes[sd % nodes.length];
};

const mkQ = (cap, qCap = cap, itemsMax = Math.max(1, qCap >> 8)) => {
  let q = [], h = 0, qB = 0, buf = null;
  const trim = () => { h > 32 && h * 2 >= q.length && (q = q.slice(h), h = 0); };
  const take = () => { if (h >= q.length) return null; const d = q[h]; q[h++] = undefined; qB -= d.byteLength; trim(); return d; };
  return { 
    get bytes() { return qB; }, get size() { return q.length - h; }, get empty() { return h >= q.length; }, 
    clear() { q = []; h = 0; qB = 0; },
    sow(d) { const n = d?.byteLength || 0; if (!n) return 1; if (qB + n > qCap || q.length - h >= itemsMax) return 0; q.push(d); qB += n; return 1; },
    bundle(d) {
      d ||= take(); if (!d || h >= q.length || d.byteLength >= cap) return [d, 0];
      let n = d.byteLength, e = h; while (e < q.length) { const x = q[e], nn = n + x.byteLength; if (nn > cap) break; n = nn; e++; }
      if (e === h) return [d, 0]; const out = buf ||= new Uint8Array(cap); out.set(d);
      for (let o = d.byteLength; h < e;) { const x = q[h]; q[h++] = undefined; qB -= x.byteLength; out.set(x, o); o += x.byteLength; } trim(); return [out.subarray(0, n), 1]; 
    } 
  }; 
};

const mkDn = (w, ss) => {
  const cap = CFG.dnPack, tail = CFG.dnTail, low = Math.max(4096, tail << 3);
  let pb = new Uint8Array(cap), p = 0, tp = 0, mq = 0, gen = 0, qk = 0, qr = 0;
  let encChain = Promise.resolve();
  const reap = () => { 
    tp && clearTimeout(tp); tp = 0; mq = 0; if (!p) return; 
    const chunk = pb.subarray(0, p).slice(); pb = new Uint8Array(cap); p = 0; qr = 0; 
    encChain = encChain.then(async () => w.send(await ss.encData(chunk))).catch(()=>{});
  };
  const ripen = () => { 
    if (tp || mq) return; mq = 1; qk = gen; queueMicrotask(() => { 
      mq = 0; if (!p || tp) return; if (cap - p < tail) return reap(); 
      tp = setTimeout(() => { 
        tp = 0; if (!p) return; if (cap - p < tail) return reap(); 
        if (qr < 2 && (gen !== qk || p < low)) { qr++; qk = gen; return ripen(); } reap(); 
      }, Math.max(CFG.dnMs, 1)); 
    }); 
  };
  return { send(u) { 
    let o = 0, n = u?.byteLength || 0; if (!n) return; 
    while (o < n) { 
      if (!p && n - o >= cap) { 
        const m = Math.min(cap, n - o); 
        const chunk = o || m !== n ? u.subarray(o, o + m) : u;
        encChain = encChain.then(async () => w.send(await ss.encData(chunk))).catch(()=>{});
        o += m; continue; 
      } 
      const m = Math.min(cap - p, n - o); pb.set(u.subarray(o, o + m), p); p += m; o += m; gen++; 
      if (p === cap || cap - p < tail) reap(); else ripen(); 
    } 
  }, reap }; 
};

const mill = async (rd, w, ss) => { 
  const r = rd.getReader({ mode: 'byob' }), tx = mkDn(w, ss); let buf = new ArrayBuffer(CFG.chunk);
  try { for (;;) { 
    const { done, value: v } = await r.read(new Uint8Array(buf, 0, CFG.chunk)); if (done) break; 
    if (!v?.byteLength) continue; 
    if (v.byteLength >= (CFG.chunk >> 1)) tx.reap(), tx.send(v), buf = new ArrayBuffer(CFG.chunk); 
    else tx.send(v.slice()), buf = v.buffer; 
  } tx.reap(); } catch {} finally { try { tx.reap(); } catch {} try { r.releaseLock(); } catch {} } 
};

const ws = async req => {
  const [client, server] = Object.values(new WebSocketPair()); server.accept({ allowHalfOpen: true }); server.binaryType = 'arraybuffer';
  
  const edStr = req.headers.get('sec-websocket-protocol'); 
  const ed = edStr && edStr.length <= CFG.maxED * 4 / 3 + 4 ? Uint8Array.from(atob(edStr.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)) : null; 
  const urlParams = new URL(req.url).searchParams;
  const fdip = urlParams.get('fdip') || req.headers.get('fdip');

  let curW = null, sock = null, closed = false, busy = false;
  const uq = mkQ(CFG.upPack, CFG.upQMax, CFG.upQMax >> 8), ss = new SS();
  
  const wither = () => { if (closed) return; closed = true; uq.clear(); try { curW?.releaseLock(); } catch {} try { sock?.close(); } catch {} try { server.close(); } catch {} };
  const toU8 = d => d instanceof Uint8Array ? d : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : new Uint8Array(d);
  const sow = d => { const u = toU8(d), n = u.byteLength; if (!n) return 1; if (uq.sow(u)) return 1; wither(); return 0; };
  
  const thresh = async () => { 
    if (busy || closed) return; busy = true; 
    try { for (;;) {
      if (closed) break; 
      if (!sock) { 
        const [d] = uq.bundle(); if (!d) break; 
        const a = parseAddr(d); if (!a) throw wither(); 
        sock = await raceSprout(a.h, a.p); 
        if (!sock && fdip) {
          const fn = await getTxtNode(fdip, a.h);
          if (fn) sock = await raceSprout(fn.h, fn.p); 
        }
        if (!sock) throw wither(); 
        curW = sock.writable.getWriter(); 
        const [first] = uq.bundle(d.subarray(a.o)); first?.byteLength && await curW.write(first); 
        mill(sock.readable, server, ss).finally(() => wither()); 
        continue; 
      }
      const [d] = uq.bundle(); if (!d) break; await curW.write(d);
    } } catch { wither(); } finally { busy = false; !uq.empty && !closed && queueMicrotask(thresh); } 
  };

  if (ed) { const { c, e: err } = await ss.decData(ed); if (!err) { c.forEach(ck => sow(ck)); thresh(); } }
  
  server.addEventListener('message', async e => { 
    if (closed) return;
    try { 
      const { c, e: err } = await ss.decData(new Uint8Array(e.data)); if (err) return wither();
      let sowed = false; for (const ck of c) if (sow(ck)) sowed = true; if (sowed) thresh(); 
    } catch { wither(); }
  });
  server.addEventListener('close', () => wither()); server.addEventListener('error', () => wither());
  
  return new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Extensions': '' } }); 
};

export default { 
  fetch: req => req.headers.get('Upgrade')?.toLowerCase() === 'websocket' ? ws(req) : new Response('Hello world!', { headers: { 'Content-Type': 'text/plain' } }) 
};
