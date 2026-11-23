/* ANTIGONE bridging lab — shared helpers. Everything runs in the student's own
   browser: files they open are read here and never sent anywhere, and whatever
   they change is kept in this browser only (their individual copy). */
"use strict";
const LAB = (() => {
  const DATASETS = "https://claude.ai/artifact/C2MCv6EvPMsV7Sf9JYqmwA#disputed";
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
    return n;
  };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NF = new Intl.NumberFormat("en");

  /* ---------- CSV in and out ---------- */
  function sniff(text) {   // the delimiter of the header line: Excel in some languages saves with ";"
    let q = false; const c = { ",": 0, ";": 0, "\t": 0 };
    for (const ch of text) { if (ch === '"') q = !q; else if (!q && (ch === "\n" || ch === "\r")) break; else if (!q && ch in c) c[ch]++; }
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best[1] ? best[0] : ",";
  }
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, "");
    const d = sniff(text), rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
      if (ch === '"') q = true; else if (ch === d) { row.push(f); f = ""; }
      else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (ch !== "\r") f += ch;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    const head = (rows.shift() || []).map((h, k) => h.trim() || `column_${k + 1}`);
    const seen = new Map(); const uniq = head.map(h => { const n = (seen.get(h) || 0) + 1; seen.set(h, n); return n > 1 ? `${h}_${n}` : h; });
    return { cols: uniq, rows: rows.filter(r => r.some(x => String(x).trim() !== "")).map(r => Object.fromEntries(uniq.map((h, k) => [h, r[k] ?? ""]))) };
  }
  function toCSV(cols, rows) {
    const q = v => { const s = String(v ?? ""); return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return "﻿" + [cols.map(q).join(",")].concat(rows.map(r => cols.map(c => q(r[c])).join(","))).join("\n") + "\n";
  }
  function download(name, text, type = "text/csv") {
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })), download: name });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- the threads ---------- */
  // the columns of every thread CSV the lab hands out; "Statement" is the one students code
  const OUT_COLS = ["Type", "post_id", "item_id", "timestamp", "author", "reply_level", "replied_author", "language", "text", "text_translated",
    "verdict", "classification", "reasons", "note_status", "n_ratings", "n_helpful", "n_somewhat_helpful", "n_not_helpful", "like_count", "reply_count", "url", "Statement"];
  let DISPUTED = null;
  const loadDisputed = () => DISPUTED || (DISPUTED = fetch("data/disputed.json").then(r => { if (!r.ok) throw new Error("disputed.json " + r.status); return r.json(); }));
  async function threadRows(id, withStatements) {
    const r = await fetch(`data/posts/${id}/full_thread.csv`); if (!r.ok) throw new Error(`thread ${id}: ${r.status}`);
    return parseCSV(await r.text()).rows.map(x => { const o = {}; for (const c of OUT_COLS) o[c] = x[c] ?? ""; o.Statement = withStatements ? (x.statement_text || "") : ""; return o; });
  }
  async function websiteStatements(id) {   // [{statement, text, cluster, ...}] or null
    try { const r = await fetch(`data/posts/${id}/statements.csv`); if (!r.ok) return null; return parseCSV(await r.text()).rows; } catch (e) { return null; }
  }

  /* ---------- reading any thread CSV a student brings ---------- */
  const lc = s => String(s || "").toLowerCase().replace(/[\s_-]+/g, "");
  const findCol = (cols, names) => { for (const n of names) { const c = cols.find(x => lc(x) === lc(n)); if (c) return c; } return null; };
  const kindOf = t => { t = String(t || "").toLowerCase();
    return t.startsWith("original") || t === "post" ? "post" : t.startsWith("fact") ? "factcheck" : t.includes("note") ? "note" : t.startsWith("repl") ? "reply" : "comment"; };
  const KIND_LABEL = { post: "Original post", factcheck: "Fact-check", note: "Community note", reply: "Reply", comment: "Comment" };
  // look at a parsed file and say where everything is
  function describe(cols, rows) {
    const textCol = findCol(cols, ["text_translated", "reply_translated", "note_translated", "text", "comment", "body", "content", "tweet", "message"])
      || cols.slice().sort((a, b) => rows.reduce((s, r) => s + String(r[b] || "").length, 0) - rows.reduce((s, r) => s + String(r[a] || "").length, 0))[0];
    const origCol = findCol(cols, ["text"]);
    const typeCol = findCol(cols, ["Type", "kind", "item_type"]);
    const likeCol = findCol(cols, ["like_count", "likes", "favorite_count", "favourites"]);
    const ratingCol = findCol(cols, ["n_ratings", "ratings"]);
    const stCands = ["Statement", "Statements", "LLM_Statement", "LLM_Statements", "statement_text", "my_statements", "code", "codes"].map(n => findCol(cols, [n])).filter(Boolean);
    const contextCols = ["Context", "LLM_Context"].map(n => findCol(cols, [n])).filter(Boolean);
    const contextCol = contextCols[0] || null;
    return { textCol, origCol, typeCol, likeCol, ratingCol, stCands: [...new Set(stCands)], contextCol, contextCols };
  }
  // one cell of the Statement column -> [{key, label}]: "1 | 4", "#1; #4", "1. The video… | 2. It is…", or wording
  function splitStatements(cell) {
    const s = String(cell ?? "").trim();
    if (!s || /^(none|no|nothing|n\/?a|na|-+|–|—|0|nan|null|no statements?|\[\]|"")$/i.test(s)) return [];
    if (/\d/.test(s) && /^[\s#sS\d;,|/+&]+$/.test(s)) return [...new Set(s.match(/\d+/g))].filter(n => +n > 0).map(n => ({ key: "#" + +n, label: "" }));
    const out = new Map();
    for (let p of s.split(/\s*\|\s*|\r?\n+/)) {
      p = p.trim().replace(/^[•*\-–—]\s*/, "").replace(/^["“']|["”']$/g, "").trim();
      if (!p || /^(none|0|n\/?a)$/i.test(p)) continue;
      const m = p.match(/^#?\s*[sS]?(\d+)\s*(?:[.):\-–]\s*(.*))?$/);
      if (m) { const k = "#" + +m[1]; if (!out.has(k) || (!out.get(k).label && m[2])) out.set(k, { key: k, label: (m[2] || "").trim() }); continue; }
      const k = p.toLowerCase().replace(/\s+/g, " ").replace(/[.!?;:,]+$/, "");
      if (!out.has(k)) out.set(k, { key: k, label: p });
    }
    return [...out.values()];
  }
  const normText = s => String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/[.!?;:,]+$/, "").trim();

  /* ---------- a seeded random generator, so a sample can be redrawn ---------- */
  function rng(seed) { let a = (seed >>> 0) || 1;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- this browser's own copy of a student's work ---------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem("lab:" + k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem("lab:" + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem("lab:" + k); } catch (e) {} },
  };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const param = k => new URLSearchParams(location.search).get(k);

  /* ---------- the file drop zone ---------- */
  function dropzone(host, onFile, label = "Drop your CSV here, or") {
    const inp = el("input", { type: "file", accept: ".csv,text/csv,.tsv,.txt", hidden: true });
    const msg = el("span", { class: "msg" });
    const z = el("div", { class: "drop" }, el("span", { text: label }),
      el("button", { type: "button", class: "btn small", text: "choose a file", onclick: () => inp.click() }), msg);
    const read = f => { if (!f) return; const fr = new FileReader();
      fr.onload = () => { try { const p = parseCSV(fr.result); if (!p.rows.length) throw new Error("it has no rows under the header");
          msg.className = "msg ok"; msg.textContent = `${f.name} · ${NF.format(p.rows.length)} rows`; onFile(p, f.name); }
        catch (e) { msg.className = "msg err"; msg.textContent = `${f.name} could not be read: ${e.message}`; } };
      fr.onerror = () => { msg.className = "msg err"; msg.textContent = "The file could not be read."; };
      fr.readAsText(f); };
    inp.addEventListener("change", () => { read(inp.files[0]); inp.value = ""; });
    z.addEventListener("dragover", e => { e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave", () => z.classList.remove("over"));
    z.addEventListener("drop", e => { e.preventDefault(); z.classList.remove("over"); read(e.dataTransfer.files[0]); });
    host.append(z, inp);
    return { say: (t, cls = "msg") => { msg.className = cls; msg.textContent = t; } };
  }

  /* ---------- the little "?" that explains a choice ---------- */
  function help(text) {
    const b = el("button", { type: "button", class: "q", "aria-label": "What does this mean?", "aria-expanded": "false", text: "?" });
    const tip = el("span", { class: "qtip", role: "note", hidden: true, text });
    b.onclick = e => { e.preventDefault(); e.stopPropagation(); const open = tip.hidden; document.querySelectorAll(".qtip").forEach(t => t.hidden = true);
      document.querySelectorAll("button.q").forEach(x => x.setAttribute("aria-expanded", "false")); tip.hidden = !open; b.setAttribute("aria-expanded", String(open)); };
    return el("span", { class: "qwrap" }, b, tip);
  }
  document.addEventListener("click", e => { if (!e.target.closest(".qwrap")) document.querySelectorAll(".qtip").forEach(t => t.hidden = true); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".qtip").forEach(t => t.hidden = true); });

  /* ---------- dates and yes/no, as students' spreadsheets and chatbots write them ---------- */
  function parseTime(v) {
    const s = String(v ?? "").trim(); if (!s) return NaN;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) { const a = +m[1], b = +m[2]; let y = +m[3]; if (y < 100) y += 2000;
      const [d, mo] = a > 12 ? [a, b] : b > 12 ? [b, a] : s.includes("/") ? [b, a] : [a, b];
      return Date.UTC(y, mo - 1, d, +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); }
    const t = Date.parse(s); return isNaN(t) ? NaN : t;
  }
  const END = "(?=$|[^a-z0-9])";
  const YES_RE = new RegExp("^(y|yes|ja|oui|si|sí|true|waar|vrai|x|✓|✔|1)" + END), NO_RE = new RegExp("^(n|no|nee|non|nein|false|onwaar|0)" + END);
  function yes(v) { const s = String(v ?? "").trim().toLowerCase(); if (!s) return false;
    if (YES_RE.test(s)) return true; if (NO_RE.test(s)) return false;
    const n = parseFloat(s.replace(",", ".")); return isFinite(n) && n > 0; }
  const isYesNo = v => { const s = String(v ?? "").trim().toLowerCase(); return !s || YES_RE.test(s) || NO_RE.test(s) || /^-?\d+([.,]\d+)?$/.test(s); };

  /* ---------- a student's saved results, in this browser ---------- */
  const results = {
    list() { return store.get("results") || []; },
    load(id) { const d = store.get("result:" + id); if (!d) return null; d.settings = store.get("result:" + id + ":s") || {}; return d; },
    saveData(id, meta, data) {
      if (!store.set("result:" + id, data)) return false;
      const L = results.list().filter(r => r.id !== id); L.unshift(meta); store.set("results", L.slice(0, 40)); return true; },
    saveSettings(id, settings, patch) {
      const ok = store.set("result:" + id + ":s", settings);
      const L = results.list(), r = L.find(x => x.id === id); if (r) { Object.assign(r, patch || {}, { savedAt: new Date().toISOString() }); store.set("results", L); }
      return ok; },
    del(id) { store.del("result:" + id); store.del("result:" + id + ":s"); store.set("results", results.list().filter(r => r.id !== id)); },
  };
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- one or several files at once (chatbots return long threads in parts) ---------- */
  function filezone(host, onFiles, opts = {}) {
    const inp = el("input", { type: "file", accept: opts.accept || ".csv,text/csv,.tsv,.txt", hidden: true, multiple: !!opts.multiple });
    const msg = el("span", { class: "msg" });
    const z = el("div", { class: "drop" }, el("span", { text: opts.label || "Drop your file here, or" }),
      el("button", { type: "button", class: "btn small", text: opts.multiple ? "choose files" : "choose a file", onclick: () => inp.click() }), msg);
    const read = list => { const fs = [...list]; if (!fs.length) return;
      Promise.all(fs.map(f => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok({ name: f.name, text: String(fr.result) });
        fr.onerror = () => no(new Error(f.name + " could not be read")); fr.readAsText(f); })))
        .then(files => { msg.className = "msg"; msg.textContent = ""; onFiles(files, (t, c = "msg") => { msg.className = c; msg.textContent = t; }); })
        .catch(e => { msg.className = "msg err"; msg.textContent = e.message; }); };
    inp.addEventListener("change", () => { read(inp.files); inp.value = ""; });
    z.addEventListener("dragover", e => { e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave", () => z.classList.remove("over"));
    z.addEventListener("drop", e => { e.preventDefault(); z.classList.remove("over"); read(e.dataTransfer.files); });
    host.append(z, inp);
    return { say: (t, c = "msg") => { msg.className = c; msg.textContent = t; } };
  }

  /* ---------- the post a student is working on ---------- */
  async function postSelect(sel, opts = {}) {
    const d = await loadDisputed();
    const ps = d.posts.filter(p => !opts.onlyStatements || p.statements > 0).sort((a, b) => b.ratings - a.ratings);
    sel.replaceChildren(el("option", { value: "", text: `— choose one of ${ps.length} posts —` }),
      ...ps.map(p => el("option", { value: p.id, text: `${p.checked.slice(0, 95)}${p.checked.length > 95 ? "…" : ""} (@${p.poster}, ${p.replies} replies)` })));
    const want = param("post") || store.get("post");
    if (want && ps.some(p => p.id === want)) sel.value = want;
    return d;
  }
  const short = (s, n) => (s = String(s ?? "")).length > n ? s.slice(0, n - 1) + "…" : s;

  return { DATASETS, $, el, esc, NF, parseCSV, toCSV, download, OUT_COLS, loadDisputed, threadRows, websiteStatements,
           findCol, kindOf, KIND_LABEL, describe, splitStatements, normText, rng, shuffle, store, hash, param, dropzone, help, parseTime, yes, isYesNo, results, newId, filezone, postSelect, short };
})();
