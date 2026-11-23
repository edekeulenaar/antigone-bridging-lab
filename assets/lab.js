/* ANTIGONE bridging lab — shared helpers: CSV in and out, the post index and
   threads, a seeded random generator, the post picker and the CSV drop zone.
   Everything runs in the browser; nothing a student loads is sent anywhere. */
"use strict";
const LAB = (() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
    return n;
  };
  const NF = new Intl.NumberFormat("en");
  const pct = (x, d = 0) => (isFinite(x) ? (100 * x).toFixed(d) : "–") + "%";

  /* ---------- CSV ---------- */
  // detect the delimiter on the header line (Excel in some locales saves with ";")
  function sniff(text) {
    let q = false, c = { ",": 0, ";": 0, "\t": 0 };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') q = !q;
      else if (!q && (ch === "\n" || ch === "\r")) break;
      else if (!q && ch in c) c[ch]++;
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0][1] ? Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] : ",";
  }
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, "");
    const d = sniff(text), rows = [];
    let row = [], f = "", q = false, i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; }
        f += ch; i++; continue;
      }
      if (ch === '"') { q = true; i++; continue; }
      if (ch === d) { row.push(f); f = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; i++; continue; }
      f += ch; i++;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows.filter(r => r.some(x => x !== "")).map(r => Object.fromEntries(head.map((h, k) => [h, r[k] ?? ""])));
  }
  function toCSV(cols, rows) {
    const q = v => { const s = String(v ?? ""); return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return "﻿" + [cols.map(q).join(",")].concat(rows.map(r => cols.map(c => q(r[c])).join(","))).join("\n") + "\n";
  }
  function download(name, text, type = "text/csv") {
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })), download: name });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  // "1; 4", "1,4", "S1 S4", "#1 #4", "0" or "none" -> [1, 4] / []
  const parseNums = s => [...new Set(String(s ?? "").match(/\d+/g) || [])].map(Number).filter(n => n > 0).sort((a, b) => a - b);

  /* ---------- seeded randomness (mulberry32), so a sample can be redrawn ---------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);

  /* ---------- data ---------- */
  let INDEX = null;
  const loadIndex = () => INDEX || (INDEX = fetch("data/index.json").then(r => { if (!r.ok) throw new Error("index " + r.status); return r.json(); }));
  async function loadPost(id) {
    const get = async p => { const r = await fetch(`data/posts/${id}/${p}`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return parseCSV(await r.text()); };
    const [rows, statements] = await Promise.all([get("full_thread.csv"), get("statements.csv")]);
    const idx = await loadIndex();
    return { id, rows, statements, meta: idx.posts.find(p => p.id === id) || null };
  }
  // the statement list as {n: text}: from statements.csv, else rebuilt from a file's statement columns
  function statementMap(statements, rows) {
    const m = new Map();
    for (const s of statements || []) if (s.statement) m.set(+s.statement, s.text || "");
    if (!m.size && rows) for (const r of rows) {
      const nums = parseNums(r.statements), txt = String(r.statement_text || "").split(" | ");
      nums.forEach((n, k) => { if (!m.has(n) && txt[k]) m.set(n, txt[k]); });
    }
    return m;
  }
  const textOf = r => r.text_translated || r.reply_translated || r.note_translated || r.text || "";
  const kindOf = r => { const t = String(r.Type || r.type || "").toLowerCase();
    return t.startsWith("original") ? "post" : t.startsWith("fact") ? "factcheck" : t.startsWith("community") || t.includes("note") ? "note" : t.startsWith("repl") ? "reply" : "other"; };
  const KIND_LABEL = { post: "Original post", factcheck: "Fact-check", note: "Community note", reply: "Reply", other: "Other" };

  /* ---------- handing a file from one tool to the next (this browser only) ---------- */
  const hand = {
    put(key, obj) { try { localStorage.setItem("lab:" + key, JSON.stringify(obj)); return true; } catch (e) { return false; } },
    take(key) { try { const v = localStorage.getItem("lab:" + key); localStorage.removeItem("lab:" + key); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  };
  const param = k => new URLSearchParams(location.search).get(k);
  function setParam(k, v) { const u = new URL(location.href); if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); history.replaceState(null, "", u); }

  /* ---------- the post picker ---------- */
  function picker(host, onPick, opts = {}) {
    const box = el("div", { class: "picker" });
    const search = el("input", { type: "search", placeholder: "Search the checked claim, the poster, the fact-checker, the topic…", "aria-label": "Search the posts" });
    const filt = el("div", { class: "seg", role: "group", "aria-label": "Show" });
    const FILTERS = [["all", "All 118"], ["opp", "Fact-check vs notes opposed"], ["nmr", "Notes still need ratings"]];
    let cur = "all", posts = [], sel = opts.selected || null;
    FILTERS.forEach(([k, t]) => filt.append(el("button", { type: "button", "aria-pressed": String(k === cur), text: t,
      onclick: e => { cur = k; [...filt.children].forEach(b => b.setAttribute("aria-pressed", String(b === e.currentTarget))); draw(); } })));
    const sort = el("select", { "aria-label": "Sort the posts" },
      el("option", { value: "replies", text: "Most replies first" }), el("option", { value: "notes", text: "Most notes first" }),
      el("option", { value: "ratings", text: "Most rated first" }), el("option", { value: "date", text: "Newest first" }));
    const list = el("div", { class: "plist", role: "listbox", "aria-label": "Posts" });
    const count = el("span", { class: "msg" });
    box.append(el("div", { class: "bar" }, search, filt, sort, count), list);
    const chosen = el("div", { class: "chosen", hidden: true });
    box.append(chosen);
    host.append(box);
    const show = p => {
      chosen.hidden = !p; if (!p) return;
      chosen.replaceChildren(el("div", { class: "lab", text: "Chosen post" }), el("div", { class: "t", text: p.checked || "(no checked claim)" }),
        el("p", { text: `@${p.poster} · ${p.verdict} (${p.fact_checkers.join(", ")}) · ${p.notes} notes, ${p.notes_need_more_ratings} still need ratings · ${NF.format(p.replies)} replies · ${p.statements} statements` }),
        p.agree ? el("p", {}, el("b", { text: "Agreement. " }), p.agree) : null, p.disagree ? el("p", {}, el("b", { text: "Disagreement. " }), p.disagree) : null,
        el("p", {}, el("a", { href: p.url, target: "_blank", rel: "noopener", text: "Open the post on X ↗" }), " · ",
          el("a", { href: `data/posts/${p.id}/full_thread.csv`, download: `post_${p.id}_full_thread.csv`, text: "full thread CSV" }), " · ",
          el("a", { href: `data/posts/${p.id}/statements.csv`, download: `post_${p.id}_statements.csv`, text: "statements CSV" })));
    };
    function draw() {
      const q = search.value.trim().toLowerCase();
      const k = sort.value;
      const rows = posts.filter(p => (cur === "all" || (cur === "opp" && p.opposed) || (cur === "nmr" && p.notes_need_more_ratings > 0))
        && (!q || [p.checked, p.poster, p.fact_checkers.join(" "), p.topic, p.verdict, p.id].join(" ").toLowerCase().includes(q)))
        .sort((a, b) => k === "date" ? String(b.date).localeCompare(String(a.date)) : (b[k] || 0) - (a[k] || 0));
      count.textContent = `${rows.length} shown`;
      list.replaceChildren(...rows.map(p => {
        const b = el("button", { type: "button", class: "pitem", role: "option", "aria-selected": String(p.id === sel), "data-id": p.id,
          onclick: () => { sel = p.id; [...list.children].forEach(x => x.setAttribute("aria-selected", String(x.dataset.id === sel))); show(p); onPick(p); } },
          el("span", { class: "t", text: p.checked || "(no checked claim)" }),
          el("span", { class: "tags" }, el("span", { class: "tag" + (/false|mislead/i.test(p.verdict) ? " v-false" : ""), text: p.verdict }),
            p.opposed ? el("span", { class: "tag opp", text: "opposed" }) : null,
            p.notes_need_more_ratings ? el("span", { class: "tag nmr", text: `${p.notes_need_more_ratings} need ratings` }) : null),
          el("span", { class: "m", text: `@${p.poster} · ${p.date} · ${p.topic} · ${p.notes} notes · ${NF.format(p.replies)} replies · ${p.statements} statements` }));
        return b;
      }));
      if (!rows.length) list.append(el("p", { class: "msg", style: "padding:14px", text: "No post matches." }));
    }
    search.addEventListener("input", draw); sort.addEventListener("change", draw);
    loadIndex().then(idx => {
      posts = idx.posts; draw();
      if (sel) { const p = posts.find(x => x.id === sel); if (p) { show(p); onPick(p); const n = list.querySelector(`[data-id="${sel}"]`); if (n) n.scrollIntoView({ block: "nearest" }); } }
    }).catch(err => list.replaceChildren(el("p", { class: "msg err", style: "padding:14px", text: "The list of posts could not be loaded: " + err.message })));
    return { select: id => { sel = id; draw(); const p = posts.find(x => x.id === id); show(p); } };
  }

  /* ---------- the CSV drop zone ---------- */
  function dropzone(host, onFile, label = "Drop a CSV here, or") {
    const inp = el("input", { type: "file", accept: ".csv,text/csv", hidden: true });
    const z = el("div", { class: "drop" }, el("span", { text: label }),
      el("button", { type: "button", class: "btn small", text: "choose a file", onclick: () => inp.click() }), el("span", { class: "msg" }));
    const msg = z.lastChild;
    const read = f => { if (!f) return; const fr = new FileReader();
      fr.onload = () => { try { const rows = parseCSV(fr.result); if (!rows.length) throw new Error("the file has no rows");
          msg.className = "msg ok"; msg.textContent = `${f.name}: ${NF.format(rows.length)} rows`; onFile(rows, f.name); }
        catch (e) { msg.className = "msg err"; msg.textContent = `${f.name} could not be read: ${e.message}`; } };
      fr.readAsText(f); };
    inp.addEventListener("change", () => read(inp.files[0]));
    z.addEventListener("dragover", e => { e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave", () => z.classList.remove("over"));
    z.addEventListener("drop", e => { e.preventDefault(); z.classList.remove("over"); read(e.dataTransfer.files[0]); });
    host.append(z, inp);
    return { say: (t, cls = "msg") => { msg.className = cls; msg.textContent = t; } };
  }

  return { esc, $, el, NF, pct, parseCSV, toCSV, download, parseNums, rng, shuffle, newSeed, loadIndex, loadPost,
           statementMap, textOf, kindOf, KIND_LABEL, hand, param, setParam, picker, dropzone };
})();
