import React, { useEffect, useRef, useState } from "react";
import { StatsSection, useStatsSeries, STATS_CSS, LiveActivityChart, LabeledBars, BAR_COLORS } from "./StatsCharts";

/* =========================================================================
   ÇOK UYGULAMALI PANEL — appId enjeksiyonu
   Tüm admin çağrıları "X-App-Key" header'ı taşır ve ${API_URL}/... adresine
   gider. Seçili uygulamanın appId'sini bu çağrılara TEK NOKTADAN ekliyoruz —
   böylece 36 fetch'i tek tek düzenlemeye gerek kalmadan hepsi izole olur.
   Global (tüm-uygulama) yollar hariç tutulur.
========================================================================= */
/* İZOLE PANEL: backend, /admin/<appId>/panel isteğinde index.html'e
   window.__APP_ID__ ve window.__APP_KEY__ enjekte eder. Bunlar varsa panel
   O uygulamaya KİLİTLİDİR (dropdown gizli, appId değiştirilemez). Yoksa
   (süper panel) eski davranış: localStorage + dropdown. */
const PANEL_LOCKED = typeof window !== "undefined" && !!window.__APP_ID__;
// Tüm admin çağrılarının X-App-Key'i artık buradan gelir (bundle'a gömülü değil).
const APP_KEY = (typeof window !== "undefined" && window.__APP_KEY__) || "";
let PANEL_APP_ID = (typeof window !== "undefined" && window.__APP_ID__)
  || (typeof localStorage !== "undefined" && localStorage.getItem("panelAppId"))
  || "default";
// Ana sayfadan gelen kısayollar: /admin/panel#s=<bölüm>&app=<uygulama>
const PANEL_HASH = (() => {
  try {
    const h = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    const out = { s: (h.get("s") || "").replace(/[^a-z0-9_]/gi, ""), app: (h.get("app") || "").replace(/[^a-z0-9_-]/gi, "") };
    if (out.s || out.app) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return out;
  } catch (e) { return { s: "", app: "" }; }
})();
if (PANEL_HASH.app && !PANEL_LOCKED) {
  PANEL_APP_ID = PANEL_HASH.app;
  try { localStorage.setItem("panelAppId", PANEL_APP_ID); } catch (e) {}
}
function setPanelAppId(id) {
  if (PANEL_LOCKED) return; // kilitli izole panelde uygulama değiştirilemez
  PANEL_APP_ID = id || "default";
  try { localStorage.setItem("panelAppId", PANEL_APP_ID); } catch (e) {}
}
// Bu yollar tüm uygulamalar için ortaktır → appId eklenmez
const PANEL_GLOBAL_RE = /\/admin\/(api-|smart-cache|youtube|stats|media-stats|apps)|\/proxy-panel|\/cache-panel/;
if (typeof window !== "undefined" && !window.__panelFetchPatched) {
  window.__panelFetchPatched = true;
  const _origFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    try {
      const h = (init && init.headers) || {};
      const hasKey = h["X-App-Key"] || h["x-app-key"];
      if (hasKey && typeof input === "string" && !PANEL_GLOBAL_RE.test(input) && !/[?&]appId=/.test(input)) {
        input += (input.includes("?") ? "&" : "?") + "appId=" + encodeURIComponent(PANEL_APP_ID);
      }
    } catch (e) {}
    return _origFetch(input, init);
  };
}

const COUNTRY_LIST = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' }, { code: 'AQ', name: 'Antarctica' }, { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' }, { code: 'LB', name: 'Lebanon' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MX', name: 'Mexico' }, { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' }, { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'TW', name: 'Taiwan' }, { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' }
];

function CountryRulePicker({ rule, idx, configKey, config, setConfig }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const mode = rule.countryMode || (rule.countries?.length > 0 ? "include" : "all");
  const filtered = COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const updateRule = (patch) => {
    const rules = [...(config[configKey]?.rules || [])];
    rules[idx] = { ...rules[idx], ...patch };
    setConfig(prev => ({ ...prev, [configKey]: { ...prev[configKey], rules } }));
  };

  const modeLabel = mode === "all" ? "Tüm ülkeler" : mode === "exclude"
    ? `Hariç: ${(rule.countries || []).length > 0 ? (rule.countries || []).map(c => { const f = COUNTRY_LIST.find(x => x.code === c); return f ? f.code : c; }).join(", ") : "seçim yok"}`
    : `${(rule.countries || []).length > 0 ? (rule.countries || []).map(c => { const f = COUNTRY_LIST.find(x => x.code === c); return f ? f.code : c; }).join(", ") : "seçim yok"}`;

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Ülkeler:</label>
      <select value={mode} onChange={e => {
        const newMode = e.target.value;
        updateRule({ countryMode: newMode, countries: newMode === "all" ? [] : (rule.countries || []) });
      }} style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 12, width: "100%", marginBottom: 6 }}>
        <option value="all">Tüm ülkeler</option>
        <option value="include">Sadece seçtiğim ülkeler</option>
        <option value="exclude">Bu ülkeler HARİÇ</option>
      </select>
      {mode !== "all" && (
        <>
          <div onClick={() => setOpen(!open)}
            style={{ background: "#eeebe5", color: mode === "exclude" ? "#b42318" : "#16181d", border: `1px solid ${mode === "exclude" ? "#d92d20" : "#d9d5cc"}`, borderRadius: 6, padding: "6px 10px", fontSize: 13, cursor: "pointer", minHeight: 30 }}>
            {modeLabel}
          </div>
          {open && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#eeebe5", border: "1px solid #cdc8be", borderRadius: 6, maxHeight: 250, overflowY: "auto", zIndex: 999, padding: "4px 0" }}>
              <input type="text" placeholder="Ülke ara..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "calc(100% - 16px)", margin: "4px 8px", background: "#f4f2ed", color: "#16181d", border: "1px solid #cdc8be", borderRadius: 4, padding: "4px 8px", fontSize: 12 }} />
              {filtered.map(c => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", padding: "4px 10px", fontSize: 12, color: "#2b2f37", cursor: "pointer" }}>
                  <input type="checkbox" checked={(rule.countries || []).includes(c.code)}
                    onChange={e => {
                      const countries = [...(rule.countries || [])];
                      if (e.target.checked) countries.push(c.code);
                      else countries.splice(countries.indexOf(c.code), 1);
                      updateRule({ countries });
                    }} style={{ marginRight: 8 }} />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tüm ISO ülke kodları — adlar tarayıcının Intl'inden Türkçe gelir
const ISO_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");
const countryName = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames(["tr"], { type: "region" }); } catch (e) {}
  return (code) => {
    if (dn) { try { return dn.of(code) || code; } catch (e) {} }
    const f = COUNTRY_LIST.find(x => x.code === code);
    return f ? f.name : code;
  };
})();
const countryFlag = (code) => /^[A-Z]{2}$/.test(code || "")
  ? String.fromCodePoint(...[...code].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)) : "🏳️";
const ALL_COUNTRIES = ISO_CODES.map(code => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "tr"));
// Sık kullanılanlar listenin başında
const TOP_COUNTRIES = ["TR", "US", "DE", "GB", "FR", "BR", "IN", "ID", "MX", "ES", "IT", "RU", "SA", "EG"];

// Device Actions ülke seçici — tıklayınca aranabilir liste açılır
function DaCountryPicker({ mode, countries, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = search.trim().toLocaleLowerCase("tr");
  const match = c => !q || c.name.toLocaleLowerCase("tr").includes(q) || c.code.toLowerCase().includes(q);
  const top = ALL_COUNTRIES.filter(c => TOP_COUNTRIES.includes(c.code) && match(c))
    .sort((a, b) => TOP_COUNTRIES.indexOf(a.code) - TOP_COUNTRIES.indexOf(b.code));
  const rest = ALL_COUNTRIES.filter(c => !TOP_COUNTRIES.includes(c.code) && match(c));
  const toggle = code => onChange(countries.includes(code) ? countries.filter(x => x !== code) : [...countries, code]);
  const accent = mode === "exclude" ? "#b42318" : "#0b6aa2";

  const row = c => (
    <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#2b2f37", borderBottom: "1px solid #d9d5cc", background: countries.includes(c.code) ? "#e2f1fb" : "transparent" }}>
      <input type="checkbox" checked={countries.includes(c.code)} onChange={() => toggle(c.code)} />
      <span style={{ fontSize: 16 }}>{countryFlag(c.code)}</span>
      <span style={{ flex: 1 }}>{c.name}</span>
      <span style={{ color: "#5f6672", fontFamily: "monospace", fontSize: 12 }}>{c.code}</span>
    </label>
  );

  return (
    <div style={{ position: "relative", flex: 1, opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div onClick={() => setOpen(!open)}
        style={{ background: "#f4f2ed", border: `1px solid ${open ? accent : "#23262d"}`, borderRadius: 8, padding: "8px 12px", minHeight: 42, boxSizing: "border-box", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {countries.length === 0 && <span style={{ color: "#5f6672", fontSize: 14 }}>{disabled ? "Tüm ülkelere gönderilir" : "Ülke seçmek için tıkla..."}</span>}
        {countries.map(code => (
          <span key={code} onClick={e => { e.stopPropagation(); toggle(code); }} title="Kaldır"
            style={{ background: mode === "exclude" ? "#fdecea" : "#e2f1fb", color: "#16181d", border: `1px solid ${accent}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, cursor: "pointer" }}>
            {countryFlag(code)} {countryName(code)} ✕
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "#4b5260", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 8, zIndex: 50, boxShadow: "0 12px 32px rgba(22,24,29,0.12)" }}>
          <div style={{ display: "flex", gap: 8, padding: 8, borderBottom: "1px solid #d9d5cc" }}>
            <input autoFocus type="text" placeholder="Ülke ara (Türkiye, TR...)" value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "8px 10px", fontSize: 13 }} />
            {countries.length > 0 && <button type="button" onClick={() => onChange([])}
              style={{ background: "none", border: "1px solid #d9d5cc", color: "#b42318", borderRadius: 6, padding: "0 10px", cursor: "pointer", fontSize: 12 }}>Temizle</button>}
            <button type="button" onClick={() => setOpen(false)}
              style={{ background: "#0ea5e9", border: "none", color: "#fff", borderRadius: 6, padding: "0 14px", cursor: "pointer", fontSize: 12 }}>Tamam</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {top.length > 0 && <div style={{ padding: "6px 14px", fontSize: 11, color: "#5f6672", background: "#f4f2ed" }}>SIK KULLANILANLAR</div>}
            {top.map(row)}
            {rest.length > 0 && <div style={{ padding: "6px 14px", fontSize: 11, color: "#5f6672", background: "#f4f2ed" }}>TÜM ÜLKELER</div>}
            {rest.map(row)}
            {top.length + rest.length === 0 && <div style={{ padding: 14, color: "#5f6672", fontSize: 13 }}>Sonuç yok</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Canlı Kullanıcılar bölüm başlığı — belirgin, solda beyaz çizgi
function SectionHead({ title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
      <div>
        <div style={{ color: "#16181d", fontSize: 15, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ color: "#4b5260", fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Giriş bilgisi satırı — kopyala butonlu (Uygulamalar ekranı)
function CredRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {}
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ color: "#2b2f37", fontSize: 13, fontWeight: 700, minWidth: 80 }}>{label}</span>
      <code title={value} style={{ flex: 1, minWidth: 0, color: "#16181d", fontSize: 14, fontWeight: 500, background: "#eeebe5", border: "1px solid #cdc8be", padding: "9px 12px", borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</code>
      <button onClick={copy} className="cred-copy"
        style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: copied ? "1px solid #12805c" : "1px solid #cdc8be", background: copied ? "#dcf2e8" : "transparent", color: copied ? "#0d6b4d" : "#16181d", cursor: "pointer", flexShrink: 0, minWidth: 100 }}>
        {copied ? "✓ Kopyalandı" : "📋 Kopyala"}
      </button>
    </div>
  );
}

/* =========================================================================
   ALBÜMLER — ülke listelerinin canlı durumu (/admin/albums/*)
========================================================================= */
const ALBUM_STATUS = {
  ok:          { t: "Güncel",              c: "#0d6b4d", bg: "#065f4626" },
  fetching:    { t: "Çekiliyor…",          c: "#2a39b8", bg: "#1e3a8a33" },
  stale:       { t: "Süresi doldu",        c: "#8a5a00", bg: "#fdf0d5" },
  old_version: { t: "Eski sürüm (süresiz)", c: "#8a5a00", bg: "#fdf0d5" },
  file_only:   { t: "Sadece dosyada",      c: "#8a5a00", bg: "#fdf0d5" },
  missing:     { t: "Liste yok",           c: "#b42318", bg: "#7f1d1d33" },
  unsupported: { t: "Desteklenmiyor → Dünya", c: "#4b5260", bg: "#ffffff10" },
};
const ccFlag = cc => /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map(ch => 127397 + ch.charCodeAt(0))) : "🌐";
const ccName = cc => {
  if (cc === "GLOBAL") return "Dünya listesi";
  try { return new Intl.DisplayNames(["tr"], { type: "region" }).of(cc) || cc; } catch (e) { return cc; }
};
const agoTr = ms => {
  if (ms == null) return "—";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} sa önce` : `${Math.round(h / 24)} gün önce`;
};

function AlbumsSection({ apiUrl }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [testCc, setTestCc] = useState("");
  const [test, setTest] = useState(null);
  const [open, setOpen] = useState(null);
  const H = { "X-App-Key": APP_KEY };

  const load = () => {
    fetch(`${apiUrl}/admin/albums/status`, { headers: H })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error || r.status)))
      .then(d => { setData(d); setErr(""); })
      .catch(e => setErr(String(e) === "404" ? "Sunucuda albüm durum ucu yok — backend güncel değil (git pull + pm2 reload server)." : "Durum alınamadı: " + e));
  };
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);   // sayfa açıkken 15 sn'de bir
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = cc => {
    if (!window.confirm(`${ccName(cc)} albüm listesi YouTube Music'ten şimdi yeniden çekilsin mi? (5–10 dk sürer)`)) return;
    fetch(`${apiUrl}/admin/albums/refresh?cc=${cc}`, { method: "POST", headers: H })
      .then(r => r.json())
      .then(d => { if (d.error) alert(d.error); else { if (d.already) alert("Bu ülke zaten çekiliyor."); load(); } })
      .catch(() => alert("Sunucuya bağlanılamadı"));
  };
  const runTest = () => {
    const cc = testCc.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return alert("2 harfli ülke kodu yazın (ör. TR, US, AZ)");
    fetch(`${apiUrl}/admin/albums/test?cc=${cc}`, { headers: H })
      .then(r => r.json()).then(setTest).catch(() => alert("Test başarısız"));
  };

  const rows = (data && data.rows) || [];
  const count = k => rows.filter(r => r.status === k).length;
  const sum = [
    ["Güncel", count("ok"), "#0d6b4d"],
    ["Çekiliyor", count("fetching"), "#2a39b8"],
    ["Dikkat", count("stale") + count("old_version") + count("file_only"), "#8a5a00"],
    ["Liste yok", count("missing"), "#b42318"],
  ];
  const pill = (txt, c, bg) => <span style={{ color: c, background: bg, padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{txt}</span>;
  const lvlColor = { ok: "#0d6b4d", info: "#4b5260", warn: "#8a5a00", error: "#b42318" };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Popüler Albümler</h2>
      <p style={{ color: "#4b5260", fontSize: 13, marginTop: -8, marginBottom: 20 }}>
        Ülke listeleri YouTube Music'ten haftada bir çekilir; uygulama yalnızca bu kayıtları okur. Liste yoksa ya da ülke desteklenmiyorsa dünya listesi gösterilir. Sayfa 15 sn'de bir yenilenir.
      </p>
      {err && <div style={{ background: "#7f1d1d33", color: "#b42318", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 22 }}>
        {sum.map(([t, n, c]) => (
          <div key={t} style={{ background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ color: "#4b5260", fontSize: 12, fontWeight: 600 }}>{t}</div>
            <div style={{ color: c, fontSize: 24, fontWeight: 800 }}>{data ? n : "…"}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <span style={{ color: "#2b2f37", fontSize: 13, fontWeight: 600 }}>Canlı test:</span>
        <input style={{ ...styles.input, width: 90, textTransform: "uppercase" }} maxLength={2} placeholder="TR" value={testCc}
          onChange={e => setTestCc(e.target.value)} onKeyDown={e => e.key === "Enter" && runTest()} />
        <button style={styles.primaryBtn} onClick={runTest}>Bu ülkeye ne gider?</button>
        <button style={{ ...styles.primaryBtn, background: "transparent", color: "#16181d", border: "1px solid #cdc8be" }} onClick={load}>Yenile</button>
      </div>
      {test && (
        <div style={{ background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}>
            {ccFlag(test.cc)} <b>{ccName(test.cc)}</b> → {test.served ? <>{ccFlag(test.served)} <b>{ccName(test.served)}</b></> : <b style={{ color: "#b42318" }}>hiç liste yok (boş)</b>}
            {" "}· {test.albumCount} albüm · {agoTr(test.updatedAt ? Date.now() - test.updatedAt : null)}
            {test.fallback && <span style={{ color: "#8a5a00" }}> · {test.supported ? "ülke listesi henüz hazır değil, dünya listesi gidiyor" : "YouTube Music'te bu ülkenin listesi yok, dünya listesi gidiyor"}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {(test.albums || []).map(a => (
              <div key={a.id} style={{ width: 84, flexShrink: 0 }} title={`${a.artist} — ${a.title}`}>
                <img src={a.cover} alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: "cover", background: "#e3e0d9" }} />
                <div style={{ fontSize: 11, color: "#2b2f37", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Ülke</th><th style={styles.th}>Durum</th><th style={styles.thRight}>Albüm</th>
            <th style={styles.th}>Son güncelleme</th><th style={styles.th}>Önbellek</th><th style={styles.thRight}>İstek</th><th style={styles.th}></th>
          </tr></thead>
          <tbody>
            {rows.map(r => {
              const s = ALBUM_STATUS[r.status] || ALBUM_STATUS.ok;
              const full = r.albumCount && r.cachedItems === r.albumCount;
              return (
                <React.Fragment key={r.cc}>
                  <tr style={{ ...styles.tr, cursor: "pointer" }} onClick={() => setOpen(open === r.cc ? null : r.cc)}>
                    <td style={{ ...styles.td, color: "#16181d" }}>{ccFlag(r.cc)} <b>{ccName(r.cc)}</b> <span style={{ color: "#5f6672" }}>{r.cc}</span>
                      {r.wanted && <span style={{ color: "#2a39b8", fontSize: 11 }}> · sırada</span>}
                      {!r.tracked && r.supported && <span style={{ color: "#5f6672", fontSize: 11 }}> · takipte değil</span>}</td>
                    <td style={styles.td}>{pill(s.t, s.c, s.bg)}</td>
                    <td style={styles.tdRight}>{r.albumCount || "—"}</td>
                    <td style={{ ...styles.td, color: "#2b2f37" }}>{agoTr(r.updatedAt ? data.now - r.updatedAt : null)}</td>
                    <td style={{ ...styles.td, fontSize: 12, color: "#4b5260" }}>
                      <span style={{ color: r.inRedis ? "#0d6b4d" : "#b42318" }}>Redis {r.inRedis ? "✓" : "✗"}</span> ·{" "}
                      <span style={{ color: r.inFile ? "#0d6b4d" : "#b42318" }}>Dosya {r.inFile ? "✓" : "✗"}</span><br />
                      <span style={{ color: full ? "#0d6b4d" : "#8a5a00" }}>Detay {r.cachedItems}/{r.albumCount}</span> · Yedek {r.itemFiles}/{r.albumCount}
                    </td>
                    <td style={{ ...styles.tdRight, color: "#4b5260" }}>{r.requests ? r.requests.toLocaleString("tr") : "—"}</td>
                    <td style={styles.tdRight} onClick={e => e.stopPropagation()}>
                      {data.canRefresh && r.supported && r.status !== "fetching" &&
                        <button style={styles.actionBtn} onClick={() => refresh(r.cc)}>Şimdi yenile</button>}
                    </td>
                  </tr>
                  {open === r.cc && (
                    <tr><td colSpan={7} style={{ padding: "0 15px 14px", color: "#4b5260", fontSize: 12 }}>
                      {r.sample.length ? "İlk albümler: " + r.sample.join(" · ") : "Albüm yok"} · liste sürümü v{r.v}
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.unsupportedTop && data.unsupportedTop.length > 0 && (
        <p style={{ color: "#4b5260", fontSize: 12, marginTop: 14 }}>
          YouTube Music listesi olmayan, dünya listesini gören ülkeler: {data.unsupportedTop.map(u => `${ccFlag(u.cc)} ${u.cc}`).join("  ")}
        </p>
      )}

      <h3 style={{ fontSize: 15, margin: "26px 0 10px", color: "#16181d" }}>Son olaylar</h3>
      <div style={{ background: "#eeebe5", border: "1px solid #d9d5cc", borderRadius: 10, padding: 10, maxHeight: 280, overflowY: "auto", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
        {(data && data.log && data.log.length) ? data.log.map((l, i) => (
          <div key={i} style={{ color: lvlColor[l.level] || "#4b5260", padding: "2px 0" }}>
            <span style={{ color: "#5f6672" }}>{new Date(l.t).toLocaleString("tr")}</span> {l.cc}: {l.msg}
          </div>
        )) : <div style={{ color: "#5f6672" }}>Henüz kayıt yok (ilk kontrol sunucu açıldıktan 1 dk sonra çalışır).</div>}
      </div>
    </div>
  );
}

/* =========================================================================
   PANEL GÖRÜNÜMÜ — yalnızca tasarım (menü başlıkları, simgeler, CSS)
========================================================================= */
// Sol menüde ekranlar; her ekranın sekmeleri içerikte üstte
const SCREENS = [
  { key: "countrycfg", label: "Ülke Ayarları", hint: "Genel mod · ülkeye göre mod", desc: "Uygulama hangi ülkede müzik, hangi ülkede zil sesi arayüzüyle açılsın.", tabs: ["settings", "countries"] },
  { key: "infra", label: "İndirme & Altyapı", hint: "MP3 · API · Cache · YouTube", desc: "MP3 kaynakları, API'ler, önbellek ve YouTube listeleri.", tabs: ["mp3", "apiproviders", "smartcache", "youtube"] },
  { key: "ads", label: "Reklamlar", hint: "6 reklam ayarı · ASN", desc: "Her reklam yerinin varsayılan ayarı ve ülkeye özel kuralları.", tabs: ["downloadad", "bannerad", "bottombanner", "ringtonead", "adfree", "asn"] },
  { key: "content", label: "İçerik", hint: "Yasaklı kanallar · filtre", desc: "Aramada ve indirmede görünmeyecek içerikler.", tabs: ["blocked", "contentfilter"] },
  { key: "appcontrols", label: "App Controls", hint: "Zorunlu review · güncelleme", desc: "Zorunlu değerlendirme ve zorunlu güncelleme.", tabs: ["appcontrols"] },
  { key: "reach", label: "Kullanıcıya Ulaş", hint: "Popup · bildirim · oylama", desc: "Uygulamadaki kullanıcılara popup, bildirim veya oylama gönder.", tabs: ["device", "notifications", "popup"] },
  { key: "allapps", label: "Tüm Uygulamalar", hint: "Canlı · ziyaretçi · zil sesi", desc: "Bütün uygulamaların kullanıcıları bir arada. Soldaki uygulama seçiminden bağımsız.", tabs: ["allapps", "allvisitors", "allringtone"] },
  { key: "monitor", label: "İzleme", hint: "Canlı · IP · Değerlendirme · Albüm", desc: "Seçili uygulamayı şu an kimlerin kullandığı ve son girişler.", tabs: ["live", "loginips", "reviewlogs", "albums"] },
  { key: "visitorscr", label: "Ziyaretçi Özeti", hint: "24 saat · 7 gün · 30 gün", desc: "Seçili uygulamayı açan benzersiz cihaz sayısı.", tabs: ["visitors"] },
  { key: "ringtone", label: "Zil Sesi Modu", hint: "Zil sesi modundaki cihazlar", desc: "Zil sesi arayüzünde açılan cihazlar ve bunun sebebi olan kurallar.", tabs: ["ringtonemode"] },
  { key: "admin", label: "Yönetim", hint: "Kullanıcılar · uygulamalar · gizlilik", desc: "Panel kullanıcıları, uygulamalar ve gizlilik politikaları.", tabs: ["users", "apps", "privacy"] },
];
const SCREEN_GROUPS = [
  { title: "İzleme", keys: ["allapps", "monitor", "visitorscr", "ringtone"] },
  { title: "Uygulama Ayarları", keys: ["countrycfg", "infra", "ads", "content", "appcontrols"] },
  { title: "Kullanıcılar", keys: ["reach"] },
  { title: "Yönetim", keys: ["admin"] },
];
// "Tüm Uygulamalar" ekranının sekmeleri: aynı içerik, kapsam = tüm uygulamalar
const ALL_TABS = { allapps: "live", allvisitors: "visitors", allringtone: "ringtonemode" };
const MONITOR_TABS = ["live", "ringtonemode", "visitors", ...Object.keys(ALL_TABS)];
const PANEL_ICONS = {
  settings: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  countries: '<path d="M4 21V4M4 4h12l-2 4 2 4H4"/>',
  ringtonemode: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  mp3: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  appcontrols: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  device: '<path d="M21 12a8 8 0 0 1-12 7l-6 2 2-5a8 8 0 1 1 16-4z"/>',
  notifications: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8"/>',
  popup: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  reviewlogs: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  live: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  loginips: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  apiproviders: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  albums: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
  users: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  privacy: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  ads: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5M19 7a7 7 0 0 1 0 10"/>',
  content: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
  blocked: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  contentfilter: '<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
  downloadad: '<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>',
  bannerad: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bottombanner: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16h18"/>',
  ringtonead: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  adfree: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  asn: '<path d="M13 7 9 3 5 7l4 4M17 11l4 4-4 4-4-4M8 12l4 4M16 8l-4 4"/><path d="M19 21a9 9 0 0 0-2-6"/>',
  smartcache: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  countrycfg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  infra: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  reach: '<path d="M21 12a8 8 0 0 1-12 7l-6 2 2-5a8 8 0 1 1 16-4z"/>',
  monitor: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  allapps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  allvisitors: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  allringtone: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  visitors: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  visitorscr: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  ringtone: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  admin: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const AD_ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  pulse: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  warn: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
};
const adIco = (k) => <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: AD_ICONS[k] || "" }} />;
const adStat = (icon, bg, color, label, value) => (
  <div className="ad-st" key={label}><span className="ad-st-ic" style={{ background: bg, color }}>{adIco(icon)}</span><div><small>{label}</small><b>{value}</b></div></div>
);
const AD_COLORS = ["#8b5cf6", "#2E6BF6", "#db2777", "#0ea5e9", "#14b8a6", "#d97706", "#d92d20", "#12805c"];
const adColor = (name) => AD_COLORS[[...String(name)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % AD_COLORS.length];
function genPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const a = new Uint32Array(12);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return [...a].map(x => abc[x % abc.length]).join("");
}
// Ayar ekranı yapı taşları: solda başlık + açıklama, sağda satır satır ayarlar
const V2Sec = ({ title, desc, extra, children }) => (
  <div className="v2-sec"><div className="v2-sh"><h2>{title}</h2>{desc && <p>{desc}</p>}{extra}</div><div className="v2-box">{children}</div></div>
);
const V2Row = ({ title, sub, stack, children }) => (
  <div className={"v2-row" + (stack ? " stack" : "")}><div className="v2-t"><b>{title}</b>{sub && <span>{sub}</span>}</div><div className="v2-ctl">{children}</div></div>
);
const V2Foot = ({ children }) => <div className="v2-foot">{children}</div>;
const V2Seg = ({ value, options, onChange }) => (
  <div className="v2-seg">{options.map(([v, l]) => <button key={v} type="button" className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>
);
function PanelIcon({ k, fallback }) {
  const d = PANEL_ICONS[k];
  if (!d) return <span className="pn-ico-e">{fallback}</span>;
  return <svg className="pn-ico" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: d }} />;
}
const PANEL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
  .pn-root { display: flex; min-height: 100vh; background: #eeebe5; color: #16181d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .pn-root svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
  .pn-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .pn-root ::-webkit-scrollbar-thumb { background: rgba(22,24,29,0.072); border-radius: 4px; }
  .pn-side { width: 264px; min-width: 264px; background: #eeebe5; border-right: 1px solid #d9d5cc; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; box-sizing: border-box; z-index: 40; }
  .pn-side-top { padding: 18px 16px 10px; }
  .pn-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; text-decoration: none; color: #16181d; }
  .pn-brand b { font-size: 15px; font-weight: 700; }
  .pn-mark { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(135deg, #3c4fe0, #ec4899); color: #fff; box-shadow: 0 6px 18px rgba(60,79,224,0.3); }
  .pn-mark svg { width: 17px; height: 17px; }
  .pn-lbl { font-size: 10.5px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: #5f6672; margin-bottom: 6px; }
  .pn-app { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; background: #f4f2ed; border: 1px solid #d9d5cc; transition: border-color .15s; }
  .pn-app:hover { border-color: #cdc8be; }
  .pn-av { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-weight: 800; font-size: 13px; color: #16181d; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(22,24,29,0.075); }
  .pn-app-t { flex: 1; min-width: 0; }
  .pn-app-t b { display: block; font-size: 13.5px; }
  .pn-app-t small { display: block; font-size: 11px; color: #5f6672; font-family: ui-monospace, Menlo, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pn-app-sel { flex: 1; min-width: 0; appearance: none; -webkit-appearance: none; background: transparent; border: 0; outline: 0; color: #16181d; font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; padding: 6px 0; }
  .pn-app-i { color: #5f6672; width: 16px !important; height: 16px !important; pointer-events: none; }
  .pn-live { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 9px 12px; border-radius: 12px; background: rgba(18,128,92,0.08); border: 1px solid rgba(18,128,92,0.22); cursor: pointer; transition: background .15s; }
  .pn-live:hover { background: rgba(18,128,92,0.13); }
  .pn-live i { width: 8px; height: 8px; border-radius: 50%; background: #12805c; animation: pnPulse 2s infinite; }
  @keyframes pnPulse { 0% { box-shadow: 0 0 0 0 rgba(18,128,92,0.6); } 70%, 100% { box-shadow: 0 0 0 7px rgba(18,128,92,0); } }
  .pn-live b { font-size: 15px; color: #0d6b4d; font-variant-numeric: tabular-nums; }
  .pn-live span { font-size: 12px; color: #0d6b4d; }
  .pn-search { display: flex; align-items: center; gap: 8px; margin-top: 12px; height: 34px; padding: 0 10px; border-radius: 10px; background: #eeebe5; border: 1px solid #d9d5cc; color: #5f6672; }
  .pn-search:focus-within { border-color: #3c4fe0; color: #16181d; }
  .pn-search svg { width: 15px; height: 15px; }
  .pn-search input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: #16181d; font: inherit; font-size: 13px; }
  .pn-menu { flex: 1; overflow-y: auto; padding: 0 10px 12px; }
  .pn-grp { font-size: 10.5px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: #5f6672; padding: 14px 8px 6px; }
  .pn-mi { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 9px; font-size: 13.5px; font-weight: 550; color: #4b5260; cursor: pointer; user-select: none; position: relative; transition: background .12s, color .12s; }
  .pn-mi:hover { background: rgba(22,24,29,0.03); color: #16181d; }
  .pn-mi.active { background: rgba(60,79,224,0.15); color: #16181d; }
  .pn-mi.active::before { content: ""; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: #3c4fe0; }
  .pn-mi.active .pn-ico { color: #2a39b8; }
  .pn-mi.has-active { color: #16181d; }
  .pn-mi.has-active::before { content: ""; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: rgba(60,79,224,0.6); }
  .pn-sub { padding-left: 22px; font-size: 13px; }
  .pn-ico-e { width: 18px; text-align: center; font-size: 14px; flex-shrink: 0; }
  .pn-count { font-size: 10.5px; font-weight: 700; color: #5f6672; background: rgba(22,24,29,0.036); padding: 1px 7px; border-radius: 999px; }
  .pn-chev { width: 15px !important; height: 15px !important; color: #5f6672; transition: transform .2s; }
  .pn-chev.open { transform: rotate(180deg); }
  .pn-none { color: #5f6672; font-size: 12.5px; padding: 14px 10px; }
  .pn-logout { display: flex; align-items: center; gap: 8px; margin: 0; padding: 14px 20px; border-top: 1px solid #d9d5cc; color: #4b5260; font-size: 13px; font-weight: 600; text-decoration: none; transition: color .15s, background .15s; }
  .pn-logout:hover { color: #b42318; background: rgba(217,45,32,0.08); }
  .pn-logout svg { width: 16px; height: 16px; }
  .pn-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .pn-top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 12px; padding: 13px 32px; background: rgba(17,17,20,0.84); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #d9d5cc; }
  .pn-burger { display: none; background: none; border: 0; color: #16181d; cursor: pointer; padding: 4px; }
  .pn-crumb { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #5f6672; min-width: 0; }
  .pn-crumb b { color: #16181d; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pn-crumb-app { white-space: nowrap; }
  .pn-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .pn-ghost { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: #4b5260; background: #f4f2ed; border: 1px solid #d9d5cc; padding: 7px 11px; border-radius: 9px; text-decoration: none; white-space: nowrap; }
  .pn-ghost:hover { color: #16181d; border-color: #cdc8be; }
  .pn-ghost svg { width: 15px; height: 15px; }
  .pn-content { width: 100%; max-width: 1180px; margin: 0 auto; padding: 28px 32px 80px; display: flex; flex-direction: column; gap: 22px; box-sizing: border-box; }
  .pn-content h2 { letter-spacing: -0.3px; }
  .pn-content code { background: rgba(22,24,29,0.036); padding: 1px 6px; border-radius: 6px; font-size: 0.92em; }
  .pn-content button { transition: filter .15s, transform .1s, background-color .15s; }
  .pn-content button:not(:disabled):hover { filter: brightness(1.08); }
  .pn-content button:not(:disabled):active { transform: translateY(1px); }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]):focus,
  .pn-content select:focus, .pn-content textarea:focus { border-color: #3c4fe0 !important; box-shadow: 0 0 0 3px rgba(60,79,224,0.18); outline: none; }
  .pn-root input[type=checkbox] { -webkit-appearance: none; appearance: none; width: 36px; height: 21px; min-width: 36px; border-radius: 999px; background: #d9d5cc; position: relative; cursor: pointer; vertical-align: middle; border: 0; transition: background .18s; }
  .pn-root input[type=checkbox]::after { content: ""; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #16181d; box-shadow: 0 1px 3px rgba(22,24,29,0.1); transition: transform .18s; }
  .pn-root input[type=checkbox]:checked { background: #12805c; }
  .pn-root input[type=checkbox]:checked::after { transform: translateX(15px); }
  .pn-root input[type=checkbox]:disabled { opacity: 0.5; cursor: not-allowed; }
  .pn-root input[type=radio] { accent-color: #3c4fe0; }
  .pn-head { position: sticky; top: 0; z-index: 20; background: rgba(17,17,20,0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #d9d5cc; }
  .pn-head .pn-top { position: static; background: none; backdrop-filter: none; -webkit-backdrop-filter: none; border-bottom: 0; }
  .pn-appbar { display: flex; align-items: center; gap: 8px; padding: 4px 32px 12px; }
  .pn-appbar-scroll { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 3px 3px 4px; scrollbar-width: thin; scrollbar-color: #5f6672 transparent; }
  .pn-appbar-scroll::-webkit-scrollbar { height: 6px; }
  .pn-chip { --c: #2a39b8; position: relative; display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; height: 38px; padding: 0 12px 0 5px; border-radius: 11px; background: #f4f2ed; border: 1px solid #d9d5cc; color: #2b2f37; font: inherit; font-size: 13px; cursor: pointer; user-select: none; transition: border-color .15s, background .15s, color .15s; }
  .pn-chip:hover { border-color: #cdc8be; color: #16181d; }
  .pn-chip.on { background: #e8e5de; border-color: var(--c); color: #16181d; box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 22%, transparent); }
  .pn-chip b { font-weight: 650; white-space: nowrap; }
  .pn-chip .pn-av { width: 28px; height: 28px; border-radius: 8px; font-size: 12px; }
  .pn-av-all { background: #e8ebfd; color: #2a39b8; }
  .pn-av-all svg { width: 15px !important; height: 15px !important; }
  .pn-chip > svg { width: 14px !important; height: 14px !important; color: #5f6672; }
  .pn-chip em { font-style: normal; font-size: 11.5px; font-weight: 700; color: #5f6672; background: rgba(22,24,29,0.036); padding: 1px 7px; border-radius: 999px; font-variant-numeric: tabular-nums; }
  .pn-chip em.live { color: #0d6b4d; background: rgba(18,128,92,0.12); }
  .pn-chip-x { display: grid; place-items: center; width: 22px; height: 22px; margin-right: -4px; border-radius: 7px; border: 0; background: rgba(217,45,32,0.15); color: #b42318; cursor: pointer; }
  .pn-chip-x:hover { background: #d92d20; color: #fff; }
  .pn-chip-x svg { width: 13px !important; height: 13px !important; stroke-width: 2.4; }
  .pn-appbar-tools { display: inline-flex; gap: 6px; padding-left: 8px; border-left: 1px solid #d9d5cc; flex-shrink: 0; }
  .pn-tool { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border-radius: 10px; border: 1px dashed #cdc8be; background: none; color: #4b5260; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .pn-tool:hover { color: #16181d; border-color: #cdc8be; }
  .pn-tool.on { border-style: solid; border-color: #d92d20; color: #b42318; background: rgba(217,45,32,0.1); }
  .pn-tool svg { width: 15px !important; height: 15px !important; }
  .pn-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 13px; background: #eeebe5; border: 1px solid #d9d5cc; overflow-x: auto; }
  .pn-tabs button { display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; border: 0; background: none; color: #4b5260; font: inherit; font-size: 13px; font-weight: 600; padding: 8px 13px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
  .pn-tabs button:hover { color: #16181d; background: rgba(22,24,29,0.03); }
  .pn-tabs button.on { background: #e8e5de; color: #16181d; box-shadow: inset 0 0 0 1px rgba(60,79,224,0.45); }
  .pn-tabs button.on .pn-ico { color: #2a39b8; }
  .pn-tabs .pn-ico { width: 16px !important; height: 16px !important; }
  .da-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 18px; align-items: start; }
  .da-step { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 14px; padding: 14px 16px; margin-bottom: 12px; }
  .da-sh { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 650; color: #16181d; margin-bottom: 12px; }
  .da-sh b { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11.5px; background: rgba(60,79,224,0.18); color: #2a39b8; }
  .da-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .da-type { text-align: left; background: #eeebe5; border: 1px solid #d9d5cc; border-radius: 11px; padding: 10px 11px; color: #4b5260; cursor: pointer; font: inherit; }
  .da-type svg { width: 19px !important; height: 19px !important; color: #2b2f37; display: block; margin-bottom: 6px; }
  .da-type span { display: block; color: #16181d; font-size: 13px; font-weight: 650; }
  .da-type small { display: block; font-size: 11.5px; margin-top: 2px; line-height: 1.35; }
  .da-type.on { border-color: #3c4fe0; background: rgba(60,79,224,0.1); box-shadow: 0 0 0 3px rgba(60,79,224,0.15); }
  .da-type.on svg { color: #2a39b8; }
  .da-lbl { display: block; font-size: 12px; color: #4b5260; margin: 12px 0 5px; }
  .da-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .da-seg { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; border-radius: 10px; background: #eeebe5; border: 1px solid #d9d5cc; }
  .da-seg button { border: 0; background: none; color: #4b5260; font: inherit; font-size: 12.5px; font-weight: 600; padding: 6px 11px; border-radius: 7px; cursor: pointer; white-space: nowrap; }
  .da-seg button:hover { color: #16181d; }
  .da-seg button.on { background: #e8e5de; color: #16181d; box-shadow: inset 0 0 0 1px rgba(60,79,224,0.5); }
  .da-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: 13px; color: #4b5260; border-top: 1px solid #d9d5cc; flex-wrap: wrap; }
  .da-step .da-row:first-of-type { border-top: 0; }
  .da-hint { font-size: 11.5px; color: #5f6672; text-align: right; }
  .da-side { position: sticky; top: 150px; }
  .da-phone { border: 1px solid #cdc8be; border-radius: 30px; padding: 10px; background: #0b0c0e; max-width: 300px; margin: 0 auto; }
  .da-screen { position: relative; height: 340px; border-radius: 22px; background: #f4f2ed; overflow: hidden; }
  .da-app { display: flex; align-items: center; gap: 8px; padding: 14px; font-size: 12.5px; color: #4b5260; font-weight: 600; }
  .da-dlg { position: absolute; left: 14px; right: 14px; top: 105px; background: #e8e5de; border-radius: 16px; padding: 16px; font-size: 13.5px; color: #16181d; box-shadow: 0 18px 40px rgba(22,24,29,0.12); }
  .da-muted { color: #5f6672; font-style: italic; }
  .da-btns { display: flex; justify-content: flex-end; gap: 18px; margin-top: 16px; font-size: 13px; }
  .da-btns span { color: #4b5260; }
  .da-btns b { color: #2a39b8; }
  .da-direct { position: absolute; left: 18px; right: 18px; top: 110px; text-align: center; color: #4b5260; font-size: 12.5px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .da-direct svg { width: 26px !important; height: 26px !important; color: #2a39b8; }
  .da-direct code { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
  .da-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 14px 0 10px; }
  .da-chips span { font-size: 11.5px; color: #2b2f37; background: #f4f2ed; border: 1px solid #d9d5cc; padding: 3px 9px; border-radius: 999px; }
  .da-match { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; background: rgba(60,79,224,0.08); border: 1px solid rgba(60,79,224,0.3); margin-bottom: 12px; font-size: 12.5px; color: #2b2f37; }
  .da-match b { font-size: 22px; color: #16181d; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .da-match small { color: #5f6672; font-size: 11px; }
  .da-hist { border: 1px solid #d9d5cc; border-radius: 14px; overflow: hidden; }
  .da-hr { border-top: 1px solid #d9d5cc; }
  .da-hr:first-child { border-top: 0; }
  .da-hr.act { background: rgba(11,106,162,0.05); }
  .da-hr-main { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; font-size: 13px; }
  .da-hr-main:hover { background: rgba(22,24,29,0.03); }
  .da-pill { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: #e8e5de; color: #5f6672; flex-shrink: 0; }
  .da-pill.on { background: rgba(18,128,92,0.14); color: #0d6b4d; }
  .da-hr-i { width: 16px !important; height: 16px !important; color: #4b5260; }
  .da-hr-v { flex: 1; min-width: 0; color: #16181d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .da-tag { font-size: 11.5px; color: #4b5260; background: #f4f2ed; padding: 2px 8px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
  .da-cnt { font-size: 12px; color: #0d6b4d; font-weight: 600; white-space: nowrap; }
  .da-acts { display: inline-flex; gap: 6px; }
  .da-b { border: 1px solid #d9d5cc; background: #f4f2ed; color: #4b5260; font: inherit; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; cursor: pointer; }
  .da-b:hover { color: #b42318; border-color: rgba(217,45,32,0.4); }
  .da-b.warn { color: #8a5a00; }
  .da-det { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px 16px; padding: 4px 14px 14px 52px; font-size: 12.5px; color: #16181d; }
  .da-det small { display: block; color: #5f6672; font-size: 11px; margin-bottom: 2px; }
  @media (max-width: 900px) { .da-grid { grid-template-columns: minmax(0, 1fr); } .da-side { position: static; } }
  @media (max-width: 560px) { .da-types { grid-template-columns: minmax(0, 1fr); } .da-tag { display: none; } .da-det { padding-left: 14px; } }
  .pn-content { transition: opacity .15s; }
  .pn-switching { opacity: 0.5; pointer-events: none; }
  .ad svg { width: 16px; height: 16px; }
  .ad-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; flex-wrap: wrap; }
  .ad h1 { font-size: 26px; font-weight: 750; letter-spacing: -0.5px; margin: 0; }
  .ad-sub { color: #5f6672; font-size: 13.5px; margin-top: 4px; }
  .ad-tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .ad-search { display: flex; align-items: center; gap: 8px; width: 270px; height: 40px; padding: 0 12px; border-radius: 11px; background: #f4f2ed; border: 1px solid #d9d5cc; color: #5f6672; }
  .ad-search:focus-within { border-color: #3c4fe0; }
  .ad-search input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: #16181d; font: inherit; font-size: 13.5px; box-shadow: none !important; }
  .ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 40px; padding: 0 16px; border-radius: 11px; font: inherit; font-size: 13.5px; font-weight: 650; border: 0; cursor: pointer; }
  .ad-btn.pri { background: #3c4fe0; color: #fff; box-shadow: 0 8px 24px rgba(60,79,224,0.3); }
  .ad-btn.pri:disabled { opacity: .6; }
  .ad-btn.wide { width: 100%; height: 46px; font-size: 14.5px; margin-top: 16px; }
  .ad-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .ad-stats.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ad-st { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
  .ad-st-ic { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; }
  .ad-st-ic svg { width: 18px; height: 18px; }
  .ad-st small { display: block; color: #5f6672; font-size: 11px; font-weight: 650; letter-spacing: .3px; }
  .ad-st b { display: block; font-size: 22px; font-weight: 750; font-variant-numeric: tabular-nums; }
  .ad-filters { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .ad-filters button { font: inherit; font-size: 12.5px; font-weight: 600; color: #4b5260; padding: 6px 12px; border-radius: 999px; border: 1px solid #d9d5cc; background: none; cursor: pointer; }
  .ad-filters button.on { background: #16181d; color: #ffffff; border-color: #16181d; }
  .ad-empty { color: #5f6672; font-size: 13.5px; padding: 40px 0; text-align: center; }
  .ad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; align-items: start; }
  .ad-card { --c: #3c4fe0; background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 16px; padding: 16px; position: relative; }
  .ad-card.stripe::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px; border-radius: 16px 16px 0 0; background: var(--c); }
  .ad-ch { display: flex; align-items: center; gap: 12px; }
  .ad-av { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: #16181d; font-weight: 800; font-size: 17px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(22,24,29,0.075); }
  .ad-av.round { border-radius: 50%; font-size: 14px; }
  .ad-nm { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-pk { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; color: #5f6672; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-ch > div { flex: 1; }
  .ad-pk.plain { font-family: inherit; font-size: 12px; color: #5f6672; }
  .ad-live { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #0d6b4d; background: rgba(18,128,92,0.1); padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
  .ad-live i { width: 6px; height: 6px; border-radius: 50%; background: #12805c; }
  .ad-live.z { color: #5f6672; background: rgba(22,24,29,0.03); }
  .ad-live.z i { background: #c9c5bc; }
  .ad-role { font-size: 11.5px; font-weight: 700; padding: 4px 9px; border-radius: 999px; background: rgba(11,106,162,0.12); color: #0b6aa2; white-space: nowrap; }
  .ad-role.sup { background: rgba(217,119,6,0.12); color: #8a5a00; }
  .ad-spark { height: 46px; margin: 12px -4px 6px; }
  .ad-spark svg { width: 100%; height: 46px; }
  .ad-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .ad-tg { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: rgba(22,24,29,0.03); color: #4b5260; }
  .ad-tg svg { width: 13px; height: 13px; stroke-width: 2.2; }
  .ad-tg.ok { background: rgba(18,128,92,0.1); color: #0d6b4d; }
  .ad-tg.warn { background: rgba(217,119,6,0.12); color: #8a5a00; }
  .ad-tg.all { background: rgba(60,79,224,0.12); color: #2a39b8; }
  .ad-access { margin: 14px 0 12px; }
  .ad-access small { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .6px; color: #5f6672; margin-bottom: 7px; }
  .ad-apps, .ad-pick { display: flex; flex-wrap: wrap; gap: 6px; }
  .ad-mini { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 9px 0 3px; border-radius: 9px; background: #f4f2ed; border: 1px solid #d9d5cc; font: inherit; font-size: 12px; font-weight: 600; color: #2b2f37; }
  .ad-mini .ad-av { width: 22px; height: 22px; border-radius: 7px; font-size: 10.5px; }
  .ad-mini.more { padding: 0 9px; color: #5f6672; }
  .ad-mini.sel { cursor: pointer; height: 32px; }
  .ad-mini.sel.on { border-color: #3c4fe0; background: rgba(60,79,224,0.12); color: #16181d; }
  .ad-mini.sel svg { width: 13px; height: 13px; color: #2a39b8; stroke-width: 2.4; }
  .ad-acts { display: flex; gap: 8px; align-items: center; border-top: 1px solid #d9d5cc; padding-top: 12px; }
  .ad-a { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px; border-radius: 9px; font: inherit; font-size: 12.5px; font-weight: 650; color: #2b2f37; background: #f4f2ed; border: 1px solid #d9d5cc; cursor: pointer; text-decoration: none; white-space: nowrap; }
  .ad-a:hover { color: #16181d; border-color: #cdc8be; }
  .ad-a svg { width: 15px; height: 15px; }
  .ad-a.ghost { background: none; }
  .ad-a.ghost.on { color: #2a39b8; border-color: rgba(60,79,224,0.45); }
  .ad-a.more { padding: 0 8px; color: #5f6672; background: none; border-color: transparent; }
  .ad-more-wrap { margin-left: auto; position: relative; }
  .ad-menu { position: absolute; right: 0; bottom: 38px; z-index: 30; min-width: 190px; background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; padding: 5px; box-shadow: 0 18px 40px rgba(22,24,29,0.12); }
  .ad-menu button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 0; background: none; color: #2b2f37; font: inherit; font-size: 13px; cursor: pointer; text-align: left; }
  .ad-menu button:hover { background: rgba(22,24,29,0.036); }
  .ad-menu button.danger { color: #b42318; }
  .ad-menu button.danger:hover { background: rgba(217,45,32,0.12); }
  .ad-cred { background: #eeebe5; border: 1px solid #d9d5cc; border-radius: 12px; padding: 4px 10px; margin: 2px 0 12px; }
  .ad-cr { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12.5px; }
  .ad-cr + .ad-cr { border-top: 1px solid #d9d5cc; }
  .ad-cr span { color: #5f6672; width: 58px; font-weight: 600; font-size: 11.5px; flex-shrink: 0; }
  .ad-cr code { flex: 1; min-width: 0; font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #16181d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: none !important; padding: 0 !important; }
  .ad-cred.big .ad-cr { padding: 10px 0; }
  .ad-ib { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; border: 0; background: none; color: #5f6672; cursor: pointer; flex-shrink: 0; }
  .ad-ib:hover { background: rgba(22,24,29,0.036); color: #16181d; }
  .ad-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(6,6,9,0.6); }
  .ad-sheet { position: fixed; top: 0; right: 0; bottom: 0; z-index: 61; width: min(420px, 100vw); background: #f4f2ed; border-left: 1px solid #d9d5cc; box-shadow: -30px 0 60px rgba(22,24,29,0.12); padding: 26px; display: flex; flex-direction: column; box-sizing: border-box; animation: adIn .2s ease-out; }
  @keyframes adIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
  .ad-sheet h2 { font-size: 20px; font-weight: 750; margin: 0; }
  .ad-sheet-body { flex: 1; overflow-y: auto; margin: 0 -6px; padding: 0 6px; }
  .ad-x { position: absolute; top: 22px; right: 20px; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; border: 0; background: none; color: #5f6672; cursor: pointer; }
  .ad-x:hover { background: rgba(22,24,29,0.036); color: #16181d; }
  .ad-lbl { font-size: 12.5px; font-weight: 600; color: #4b5260; margin: 18px 0 7px; }
  .ad-inp { width: 100%; box-sizing: border-box; height: 42px; border-radius: 11px; background: #eeebe5; border: 1px solid #d9d5cc; padding: 0 13px; font: inherit; font-size: 14px; color: #16181d; outline: 0; }
  .ad-inp:disabled { opacity: .6; }
  .ad-hint { font-size: 11.5px; color: #5f6672; margin-top: 6px; }
  .ad-pw { display: flex; gap: 6px; align-items: center; position: relative; }
  .ad-pw .ad-a { height: 42px; }
  .ad-auto { position: absolute; right: 13px; font-size: 11.5px; color: #5f6672; pointer-events: none; }
  .ad-seg { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: #eeebe5; border: 1px solid #d9d5cc; margin-bottom: 10px; }
  .ad-seg button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; border: 0; border-radius: 8px; background: none; color: #4b5260; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
  .ad-seg button.on { background: #e8e5de; color: #16181d; box-shadow: inset 0 0 0 1px rgba(60,79,224,0.5); }
  .ad-sw { display: flex; gap: 9px; align-items: center; }
  .ad-sw button { width: 30px; height: 30px; border-radius: 9px; border: 0; cursor: pointer; padding: 0; }
  .ad-sw button.on { box-shadow: 0 0 0 2px #f4f2ed, 0 0 0 4px #16181d; }
  .ad-sw-custom { width: 30px; height: 30px; border-radius: 9px; border: 1px dashed #cdc8be; display: grid; place-items: center; color: #5f6672; cursor: pointer; position: relative; overflow: hidden; }
  .ad-sw-custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .ad-pv { margin-top: 22px; background: #eeebe5; border: 1px solid #d9d5cc; border-radius: 14px; padding: 14px; }
  .ad-pv small { display: block; font-size: 11px; font-weight: 700; letter-spacing: .6px; color: #5f6672; margin-bottom: 10px; }
  .ad-pvr { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12.5px; color: #4b5260; margin-top: 10px; }
  .ad-pvr code { font-family: ui-monospace, Menlo, monospace; color: #2a39b8; font-size: 12px; background: none !important; }
  .ad-group { font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: #5f6672; margin: 22px 0 -6px; padding-top: 16px; border-top: 1px solid #d9d5cc; }
  .ad-sheet-body .ad-group:first-child { border-top: 0; padding-top: 0; margin-top: 18px; }
  .ad-opt { color: #5f6672; font-weight: 500; margin-left: 4px; }
  .ad-inp.mono { font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
  .ad-url { display: block; font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; color: #16181d; word-break: break-all; background: none !important; padding: 0 !important; }
  .ad-note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: #5f6672; margin-top: 14px; line-height: 1.45; }
  .ad-note svg { color: #0d6b4d; flex-shrink: 0; margin-top: 1px; }
  @media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ad-stats.three { grid-template-columns: repeat(3, minmax(0, 1fr)); } .ad-search { width: 100%; } .ad-tools { width: 100%; } }
  @media (max-width: 560px) { .ad-stats.three { grid-template-columns: minmax(0, 1fr); } .ad-grid { grid-template-columns: minmax(0, 1fr); } }
  .sw-wrap { position: relative; }
  .sw-btn { display: flex; align-items: center; gap: 9px; height: 38px; padding: 0 10px 0 5px; border-radius: 11px; background: #f4f2ed; border: 1px solid #d9d5cc; color: #16181d; font: inherit; font-size: 13.5px; cursor: pointer; max-width: 320px; transition: border-color .15s, background .15s; }
  .sw-btn:hover, .sw-btn.open { border-color: rgba(60,79,224,0.55); background: #f4f2ed; }
  .sw-btn.locked { cursor: default; }
  .sw-btn b { font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw-btn .pn-av, .sw-item .pn-av { width: 28px; height: 28px; border-radius: 8px; font-size: 12px; }
  .sw-btn em, .sw-item em { display: inline-flex; align-items: center; gap: 5px; font-style: normal; font-size: 11.5px; font-weight: 700; color: #5f6672; background: rgba(22,24,29,0.036); padding: 2px 8px; border-radius: 999px; font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .sw-btn em i, .sw-item em i { width: 6px; height: 6px; border-radius: 50%; background: #c9c5bc; }
  .sw-btn em.live, .sw-item em.live { color: #0d6b4d; background: rgba(18,128,92,0.12); }
  .sw-btn em.live i, .sw-item em.live i { background: #12805c; }
  .sw-ic { width: 15px !important; height: 15px !important; color: #5f6672; }
  .sw-pop { position: absolute; top: calc(100% + 8px); left: 0; z-index: 50; width: 360px; max-width: calc(100vw - 24px); background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 14px; box-shadow: 0 24px 60px rgba(22,24,29,0.12); overflow: hidden; animation: swIn .14s ease-out; }
  @keyframes swIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .sw-search { display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 46px; border-bottom: 1px solid #d9d5cc; color: #5f6672; }
  .sw-search svg { width: 16px; height: 16px; }
  .sw-search input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: #16181d; font: inherit; font-size: 14px; box-shadow: none !important; }
  .sw-search kbd { font: inherit; font-size: 10.5px; color: #5f6672; border: 1px solid #d9d5cc; border-radius: 5px; padding: 1px 5px; }
  .sw-list { max-height: 380px; overflow-y: auto; padding: 6px; }
  .sw-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px; border: 0; border-radius: 9px; background: none; color: #2b2f37; font: inherit; text-align: left; cursor: pointer; }
  .sw-item:hover { background: rgba(22,24,29,0.03); }
  .sw-item.on { background: rgba(60,79,224,0.14); color: #16181d; }
  .sw-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .sw-t b { font-size: 13.5px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw-t small { font-size: 11px; color: #5f6672; font-family: ui-monospace, Menlo, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw-none { color: #5f6672; font-size: 13px; padding: 16px; text-align: center; }
  .sw-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px; border-top: 1px solid #d9d5cc; font-size: 11.5px; color: #5f6672; }
  .sw-foot button { border: 0; background: none; color: #2a39b8; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; padding: 0; }
  .pn-side { width: 272px; min-width: 272px; }
  .pn-side-top { padding: 18px 14px 6px; }
  .pn-brand { margin-bottom: 14px; padding: 0 4px; }
  .pn-side .sw-wrap .sw-btn { width: 100%; max-width: none; height: 52px; padding: 0 10px 0 9px; border-radius: 12px; background: #f4f2ed; }
  .pn-side .sw-wrap .sw-btn b { flex: 1; text-align: left; }
  .pn-side .sw-btn .pn-av { width: 32px; height: 32px; }
  .pn-side .sw-pop { width: 340px; }
  .pn-grp { padding: 16px 10px 6px; }
  .pn-mi { gap: 11px; padding: 7px 10px; border-radius: 10px; color: #2b2f37; margin-bottom: 2px; }
  .pn-mi.active::before, .pn-mi.has-active::before { display: none; }
  .pn-ni { width: 32px; height: 32px; border-radius: 9px; background: rgba(22,24,29,0.036); color: #4b5260; display: grid; place-items: center; flex-shrink: 0; }
  .pn-ni .pn-ico { width: 17px !important; height: 17px !important; color: inherit !important; }
  .pn-mi.active .pn-ni { background: #3c4fe0; color: #fff; }
  .pn-mt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .pn-mt b { font-size: 13px; font-weight: 600; color: #16181d; }
  .pn-mt small { font-size: 11px; font-weight: 400; color: #5f6672; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pn-mi.active .pn-mt b { color: #16181d; }
  .pn-mi.active .pn-mt small { color: #4b5260; }
  .pn-top { padding: 14px 32px; }
  .pn-title { min-width: 0; display: flex; flex-direction: column; }
  .pn-title .pn-crumb { font-size: 12.5px; }
  .pn-title h1 { margin: 2px 0 0; font-size: 21px; font-weight: 650; letter-spacing: -0.3px; color: #16181d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pn-tabs { align-self: flex-start; max-width: 100%; scrollbar-width: none; }
  .pn-tabs::-webkit-scrollbar { display: none; }
  .pn-side .sw-btn.locked { width: 100%; max-width: none; height: 52px; box-sizing: border-box; background: #f4f2ed; }
  .pn-side .sw-btn.locked b { flex: 1; }
  .pn-apps-chev { transition: transform .18s; }
  .pn-apps-chev.open { transform: rotate(180deg); }
  .pn-side .sw-wrap .pn-apps { margin-top: 6px; }
  .pn-apps { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; padding: 8px 6px 6px; }
  .pn-apps-h { display: flex; align-items: center; justify-content: space-between; padding: 0 6px 6px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: #5f6672; }
  .pn-apps-h em { font-style: normal; color: #5f6672; margin-left: 4px; }
  .pn-apps-h button { border: 0; background: none; color: #2a39b8; font: inherit; font-size: 11.5px; font-weight: 650; letter-spacing: 0; text-transform: none; cursor: pointer; padding: 0; }
  .pn-apps-q { display: flex; align-items: center; gap: 7px; height: 32px; margin: 0 2px 6px; padding: 0 9px; border-radius: 9px; background: #eeebe5; border: 1px solid #d9d5cc; color: #5f6672; }
  .pn-apps-q:focus-within { border-color: #3c4fe0; }
  .pn-apps-q svg { width: 14px !important; height: 14px !important; }
  .pn-apps-q input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: #16181d; font: inherit; font-size: 12.5px; }
  .pn-apps-list { max-height: 228px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
  .pn-apps .sw-item { padding: 6px 7px; }
  .pn-apps .sw-item .pn-av { width: 26px; height: 26px; border-radius: 7px; font-size: 11.5px; }
  .pn-apps .sw-t b { font-size: 13px; }
  .pn-apps .sw-item.on { box-shadow: inset 0 0 0 1px rgba(60,79,224,0.5); }
  .pn-root { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .pn-side { background: #f4f2ed; border-right-color: #d9d5cc; }
  .pn-head { background: rgba(17,17,20,0.92); border-bottom-color: #d9d5cc; }
  .pn-mi:hover { background: #e8e5de; }
  .pn-mi.active { background: #f4f2ed; box-shadow: 0 0 0 1px #d9d5cc; }
  .pn-mi.active .pn-mt b { color: #2a39b8; }
  .pn-ni { background: #e8e5de; }
  .pn-tabs { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; }
  .pn-tabs button { font-weight: 500; color: #4b5260; }
  .pn-tabs button.on { background: #e8e5de; color: #16181d; box-shadow: 0 0 0 1px #cdc8be; }
  .pn-tabs button.on .pn-ico { color: #2a39b8; }
  .pn-ghost { background: #f4f2ed; border-color: #d9d5cc; }
  .pn-content { gap: 20px; }
  .pn-content h2 { font-weight: 600; }
  .pn-content table { border-collapse: collapse; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]), .pn-content select, .pn-content textarea { border-color: #d9d5cc; border-radius: 10px; }
  .pn-root input[type=checkbox]:checked { background: #3c4fe0; }
  .pn-live { background: #e4f4ec; border-color: #bfe3cf; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]), .pn-content select, .pn-content textarea { box-sizing: border-box; max-width: 100%; }
  /* v2 — koyu, sade */
  .pn-root { background: #eeebe5; color: #16181d; }
  .pn-side { background: #eeebe5; border-right-color: #e3e0d9; }
  .pn-mark { background: #3c4fe0; box-shadow: none; border-radius: 8px; }
  .pn-side .sw-wrap .sw-btn { background: #f4f2ed; border-color: #d9d5cc; }
  .pn-live { background: #dcf2e8; border-color: #bfe3cf; }
  .pn-live b { color: #0d6b4d; } .pn-live span { color: #8fcfae; }
  .pn-search { background: #eeebe5; border-color: #d9d5cc; }
  .pn-grp { color: #6e747e; letter-spacing: .4px; }
  .pn-mi { color: #16181d; }
  .pn-mi:hover { background: #f4f2ed; }
  .pn-mi.active { background: #e8e5de; }
  .pn-ni { background: #f4f2ed; color: #4b5260; }
  .pn-mi.active .pn-ni { background: #3c4fe0; color: #fff; }
  .pn-mt b { color: #16181d; font-weight: 500; }
  .pn-mi.active .pn-mt b { color: #16181d; }
  .pn-mt small, .pn-mi.active .pn-mt small { color: #5f6672; }
  .pn-logout { border-top-color: #e3e0d9; color: #4b5260; }
  .pn-head { background: #eeebe5; border-bottom: 0; backdrop-filter: none; -webkit-backdrop-filter: none; }
  .pn-top { padding: 32px 48px 4px; align-items: flex-start; }
  .pn-title h1 { font-size: 24px; font-weight: 600; letter-spacing: -0.4px; color: #16181d; margin: 0; }
  .pn-title p { margin: 6px 0 0; font-size: 14px; color: #4b5260; }
  .pn-ghost { background: #f4f2ed; border-color: #d9d5cc; color: #4b5260; }
  .pn-content { margin: 0; max-width: 1100px; padding: 20px 48px 72px; gap: 28px; }
  .pn-tabs { align-self: stretch; background: none; border: 0; border-bottom: 1px solid #d9d5cc; border-radius: 0; padding: 0; gap: 24px; overflow-x: auto; }
  .pn-tabs button { padding: 0 0 12px; margin-bottom: -1px; border-radius: 0; background: none !important; border-bottom: 2px solid transparent; color: #4b5260; font-weight: 500; font-size: 14px; box-shadow: none !important; }
  .pn-tabs button:hover { color: #16181d; }
  .pn-tabs button.on { color: #16181d; border-bottom-color: #5b8cff; }
  .pn-tabs .pn-ico { display: none; }
  .pn-root input[type=checkbox] { background: #d9d5cc; }
  .pn-root input[type=checkbox]:checked { background: #3c4fe0; }
  .pn-root input[type=radio] { accent-color: #3c4fe0; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]), .pn-content select, .pn-content textarea { background-color: #eeebe5; border-color: #cdc8be; color: #16181d; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]):focus, .pn-content select:focus, .pn-content textarea:focus { border-color: #5b8cff !important; box-shadow: 0 0 0 3px rgba(60,79,224,0.18); }
  .v2-stack { display: flex; flex-direction: column; gap: 36px; }
  .v2-sec { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 32px; }
  .v2-sh h2 { margin: 0; font-size: 15px; font-weight: 600; color: #16181d; letter-spacing: 0; }
  .v2-sh p { margin: 6px 0 0; font-size: 13px; color: #4b5260; line-height: 1.5; }
  .v2-box { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; min-width: 0; }
  .v2-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 20px; border-top: 1px solid #e3e0d9; }
  .v2-box > .v2-row:first-child { border-top: 0; }
  .v2-row.stack { flex-direction: column; align-items: stretch; gap: 10px; }
  .v2-row.stack .v2-ctl { justify-content: flex-start; }
  .v2-row.stack .v2-t { flex: none; }
  .ad-top h1 { display: none; }
  .ad-sub { margin-top: 0; }
  .pn-head { position: static; }
  .v2-t { min-width: 140px; flex: 1 1 160px; }
  .v2-t b { display: block; font-size: 14px; font-weight: 500; color: #16181d; }
  .v2-t span { display: block; font-size: 13px; color: #4b5260; margin-top: 2px; }
  .v2-ctl { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .v2-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid #e3e0d9; }
  .v2-endsave { display: flex; justify-content: flex-end; }
  .v2-seg { display: inline-flex; border: 1px solid #cdc8be; border-radius: 9px; overflow: hidden; }
  .v2-seg button { border: 0; border-left: 1px solid #cdc8be; background: none; color: #4b5260; font: inherit; font-size: 13px; padding: 7px 13px; cursor: pointer; }
  .v2-seg button:first-child { border-left: 0; }
  .v2-seg button.on { background: #e8ebfd; color: #16181d; }
  .v2-info { background: #dcf2e8; color: #0d6b4d; font-size: 13px; justify-content: flex-start; }
  .v2-info.bad { background: #fdecea; color: #b42318; }
  .v2-btn { height: 34px; padding: 0 14px; border-radius: 9px; border: 1px solid #cdc8be; background: #e8e5de; color: #16181d; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .v2-chip { display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; border-radius: 7px; background: #e8e5de; border: 1px solid #cdc8be; font-size: 12.5px; color: #c9ced6; }
  .v2-muted { color: #4b5260; font-size: 13px; }
  .v2-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #d9d5cc; border-radius: 12px; background: #f4f2ed; margin-bottom: 24px; }
  .v2-st { padding: 20px 24px; border-left: 1px solid #d9d5cc; }
  .v2-st:first-child { border-left: 0; }
  .v2-st small { display: block; font-size: 12.5px; color: #4b5260; }
  .v2-st b { display: block; font-size: 32px; font-weight: 600; line-height: 1.15; color: #16181d; margin-top: 6px; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
  .v2-st span { font-size: 12.5px; color: #5f6672; }
  @media (max-width: 700px) { .v2-stats { grid-template-columns: minmax(0, 1fr); } .v2-st { border-left: 0; border-top: 1px solid #d9d5cc; } .v2-st:first-child { border-top: 0; } }
  @media (max-width: 900px) { .v2-sec { grid-template-columns: minmax(0, 1fr); gap: 12px; } .pn-top { padding: 20px 16px 4px; } .pn-content { padding: 16px 16px 60px; } }
  .pn-scrim { display: none; }
  @media (max-width: 900px) {
    .pn-appbar { padding: 4px 16px 10px; }
    .pn-side { position: fixed; left: 0; top: 0; transform: translateX(-100%); transition: transform .22s; }
    .pn-side.open { transform: none; box-shadow: 20px 0 50px rgba(22,24,29,0.12); }
    .pn-scrim { display: block; position: fixed; inset: 0; z-index: 35; background: rgba(0,0,0,0.5); }
    .pn-burger { display: grid; }
    .pn-top { padding: 11px 16px; }
    .pn-content { padding: 20px 16px 60px; }
  }
  @media (max-width: 560px) { .pn-ghost span, .pn-crumb-app, .pn-sep { display: none; } .pn-tool span { display: none; } .pn-tool { padding: 0 9px; } .pn-chip { height: 34px; } }

  /* ===== Açık Stüdyo (B) — kabuk ===== */
  .pn-root { background: #e7e5df; color: #16181d; font-family: Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-feature-settings: "tnum" 0; }
  .pn-side { background: #eceae4; border-right: 1px solid #d9d5cc; }
  .pn-mark { background: #16181d; color: #fff; border-radius: 8px; box-shadow: none; }
  .pn-brand b { font-weight: 600; }
  .pn-side .sw-wrap .sw-btn { background: #f4f2ed; border: 1px solid #d9d5cc; box-shadow: 0 1px 2px rgba(22,24,29,0.04); }
  .pn-live { background: #dcf2e8; border-color: #bfe3cf; }
  .pn-live b { color: #0d6b4d; } .pn-live span { color: #0d6b4d; }
  .pn-live i { background: #12805c; }
  .pn-search { background: #f4f2ed; border-color: #d9d5cc; }
  .pn-grp { color: #5f6672; font-weight: 500; text-transform: none; letter-spacing: 0; font-size: 11.5px; }
  .pn-mi { color: #2b2f37; }
  .pn-mi:hover { background: #e3e0d9; }
  .pn-mi.active { background: #f4f2ed; box-shadow: 0 0 0 1px #d9d5cc; }
  .pn-ni { background: transparent; color: #4b5260; }
  .pn-mi.active .pn-ni { background: #16181d; color: #fff; }
  .pn-mt b { color: #16181d; font-weight: 500; }
  .pn-mi.active .pn-mt b { color: #16181d; font-weight: 600; }
  .pn-mt small, .pn-mi.active .pn-mt small { color: #5f6672; }
  .pn-mbadge { margin-left: auto; font-size: 11px; font-weight: 600; color: #0d6b4d; background: #dcf2e8; border-radius: 999px; padding: 1px 7px; font-variant-numeric: tabular-nums; }
  .pn-logout { color: #4b5260; border-top-color: #d9d5cc; }
  .pn-head { background: #e7e5df; }
  .pn-title h1 { font-weight: 600; }
  .pn-title p { color: #5f6672; }
  .pn-ghost { background: #f4f2ed; border-color: #d9d5cc; color: #2b2f37; }
  .pn-tabs { border-bottom: 0; gap: 4px; flex-wrap: wrap; }
  .pn-tabs button { padding: 7px 12px; margin: 0; border: 0 !important; border-radius: 8px; color: #4b5260; font-size: 13px; }
  .pn-tabs button:hover { background: #e3e0d9 !important; color: #16181d; }
  .pn-tabs button.on { background: #16181d !important; color: #fff; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]), .pn-content select, .pn-content textarea { background-color: #f4f2ed; border-color: #cdc8be; color: #16181d; }
  .pn-content input:not([type=checkbox]):not([type=radio]):not([type=color]):focus, .pn-content select:focus, .pn-content textarea:focus { border-color: #3c4fe0 !important; box-shadow: 0 0 0 3px rgba(60,79,224,0.15); }
  .pn-root input[type=checkbox] { background: #cdc8be; }
  .pn-root input[type=checkbox]::after { background: #f4f2ed; box-shadow: 0 1px 2px rgba(22,24,29,0.2); }
  .pn-root input[type=checkbox]:checked { background: #16181d; }
  .v2-stats { background: #f4f2ed; border-color: #d9d5cc; }
  .v2-st b.v2-now { color: #0d6b4d; }
  @media (max-width: 900px) { .pn-side.open { box-shadow: 20px 0 50px rgba(22,24,29,0.12); } }

  /* ===== İzleme / Ziyaretçi: kartlar, kırılımlar, tablo ===== */
  .lv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin: 0 0 24px; }
  .lv-card { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .lv-card-h b { display: block; font-size: 14px; font-weight: 600; color: #16181d; }
  .lv-card-h small { display: block; font-size: 12px; color: #5f6672; margin-top: 2px; }
  .lv-split { display: flex; gap: 2px; height: 8px; border-radius: 4px; overflow: hidden; margin: 2px 0 4px; }
  .lv-split i { display: block; height: 100%; }
  .lv-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid #e8e5de; }
  .lv-row.link { cursor: pointer; border-radius: 8px; }
  .lv-row.link:hover { background: #eeebe5; }
  .lv-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .lv-av { width: 26px !important; height: 26px !important; font-size: 12px !important; border-radius: 7px !important; flex-shrink: 0; }
  .lv-row-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .lv-row-t b { font-size: 13.5px; font-weight: 600; color: #16181d; }
  .lv-row-t small { font-size: 11.5px; color: #5f6672; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lv-row-n { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
  .lv-row-n b { font-size: 14px; font-weight: 600; color: #16181d; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .lv-row-n small { font-size: 11px; color: #5f6672; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .lv-note { margin: 2px 0 0; font-size: 11.5px; color: #5f6672; line-height: 1.45; }
  .lv-empty { padding: 28px; text-align: center; color: #5f6672; font-size: 13px; border: 1px dashed #cdc8be; border-radius: 12px; background: #f4f2ed; }
  .lv-sub-h { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .lv-sub-h b { display: block; font-size: 15px; font-weight: 600; color: #16181d; }
  .lv-sub-h small { display: block; font-size: 12.5px; color: #5f6672; margin-top: 2px; }
  .lv-sub-h > span { font-size: 12px; color: #5f6672; }
  .lv-table { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; overflow: hidden; }
  .lv-table table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .lv-table th { font-size: 12px; font-weight: 600; color: #5f6672; text-align: left; padding: 11px 16px; background: #eeebe5; border-bottom: 1px solid #d9d5cc; white-space: nowrap; }
  .lv-table td { font-size: 13.5px; color: #2b2f37; padding: 10px 16px; border-bottom: 1px solid #e3e0d9; }
  .lv-table tr:last-child td { border-bottom: 0; }
  .lv-table .r { text-align: right; }
  .lv-table .n { font-weight: 600; color: #16181d; font-variant-numeric: tabular-nums; }
  .lv-table td b { font-weight: 600; color: #16181d; }
  .lv-cc { margin-left: 6px; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11.5px; color: #5f6672; }
  .lv-share { display: flex; align-items: center; gap: 10px; }
  .lv-share > div { flex: 1; height: 6px; border-radius: 3px; background: #e3e0d9; overflow: hidden; }
  .lv-share i { display: block; height: 100%; background: #3c4fe0; border-radius: 3px; }
  .lv-share span { width: 36px; text-align: right; font-size: 12px; color: #4b5260; font-variant-numeric: tabular-nums; }
  .lv-wrap { display: flex; flex-direction: column; }
  .lv-wrap > h2, .lv-wrap > div:first-child h2 { color: #16181d; }
  .lv-dev { gap: 0; }
  .lv-dev table th { background: #eeebe5; }
  .lv-more { width: 100%; padding: 11px; border: 0; border-top: 1px solid #d9d5cc; background: #eeebe5; color: #16181d; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }

  /* ===== Sol menü: sıkı liste, maddeler arası çizgi ===== */
  .pn-menu { padding: 0 12px 12px; }
  .pn-grp { padding: 16px 10px 6px; font-size: 11px; font-weight: 600; color: #5f6672; text-transform: uppercase; letter-spacing: .5px; }
  .pn-list { border: 1px solid #d9d5cc; border-radius: 10px; overflow: hidden; background: #f1efea; }
  .pn-menu .pn-mi { margin: 0; padding: 0 12px; height: 38px; gap: 10px; border-radius: 0; box-shadow: none; border-bottom: 1px solid #dedad2; }
  .pn-menu .pn-mi:last-child { border-bottom: 0; }
  .pn-menu .pn-mi:hover { background: #e8e5de; }
  .pn-menu .pn-mi.active { background: #e3e0d9; box-shadow: inset 3px 0 0 #16181d; }
  .pn-menu .pn-ni { width: 18px; height: 18px; border-radius: 0; background: none !important; color: #5f6672; }
  .pn-menu .pn-ni .pn-ico { width: 16px !important; height: 16px !important; }
  .pn-menu .pn-mi.active .pn-ni { color: #16181d; }
  .pn-menu .pn-mt small { display: none; }
  .pn-menu .pn-mt b { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pn-menu .pn-mi.active .pn-mt b { font-weight: 600; }
  .pn-menu .pn-mbadge { padding: 0 6px; font-size: 10.5px; }
  .pn-menu .pn-none { background: none; }

  /* ===== Seçenekler: tek ortak görünüm (sekme, segment, filtre) ===== */
  .pn-tabs, .pn-seg, .da-seg, .ad-seg, .v2-seg {
    display: inline-flex; flex-wrap: nowrap; gap: 2px; padding: 3px; max-width: 100%; overflow-x: auto; scrollbar-width: none;
    background: #e3e0d9 !important; border: 1px solid #d6d2c8 !important; border-radius: 11px !important; box-shadow: inset 0 1px 2px rgba(22,24,29,0.05);
  }
  .pn-tabs::-webkit-scrollbar, .pn-seg::-webkit-scrollbar { display: none; }
  .pn-tabs { align-self: flex-start; }
  .pn-tabs button, .pn-seg button, .da-seg button, .ad-seg button, .v2-seg button {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex-shrink: 0; height: auto;
    padding: 7px 13px !important; margin: 0 !important; border: 0 !important; border-radius: 8px !important;
    background: transparent !important; box-shadow: none !important; color: #4b5260 !important;
    font: inherit; font-size: 13px !important; font-weight: 500 !important; cursor: pointer; white-space: nowrap;
    transition: background .12s, color .12s, box-shadow .12s;
  }
  .pn-tabs button { padding: 8px 14px !important; font-size: 13.5px !important; }
  .pn-tabs button:hover, .pn-seg button:hover, .da-seg button:hover, .ad-seg button:hover, .v2-seg button:hover {
    background: rgba(22,24,29,0.05) !important; color: #16181d !important;
  }
  .pn-tabs button.on, .pn-seg button.on, .da-seg button.on, .ad-seg button.on, .v2-seg button.on {
    background: #f8f7f3 !important; color: #16181d !important; font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(22,24,29,0.12), 0 0 0 1px #cfcac0 !important;
  }
  .pn-tabs .pn-ico { display: inline-block !important; width: 15px !important; height: 15px !important; color: #6b7078; }
  .pn-tabs button.on .pn-ico { color: #3c4fe0; }
  .pn-seg.sm button { padding: 5px 10px !important; font-size: 12px !important; }
  .ad-seg { display: flex; }
  .ad-seg button { flex: 1; }
  .ad-filters button { background: #f4f2ed; border-color: #d6d2c8; color: #4b5260; font-weight: 500; }
  .ad-filters button:hover { background: #ebe8e1; color: #16181d; }
  .ad-filters button.on { background: #e8ebfd; color: #2a39b8; border-color: #b9c1f5; font-weight: 600; }
`;

function App() {
  const [config, setConfig] = useState(null);
  const [newCountryMode, setNewCountryMode] = useState("youtube");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [asnInput, setAsnInput] = useState("");
  const [blockedChannels, setBlockedChannels] = useState([]);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Form states for Modal
  const [currentChannels, setCurrentChannels] = useState([]);
  const [currentChannelInput, setCurrentChannelInput] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ruleType, setRuleType] = useState("channel");

  const [notifAppId, setNotifAppId] = useState("");
  const [notifRestKey, setNotifRestKey] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifImageUrl, setNotifImageUrl] = useState("");
  const [notifActionUrl, setNotifActionUrl] = useState("");
  const [notifScheduleType, setNotifScheduleType] = useState("now");
  const [notifTargetCountry, setNotifTargetCountry] = useState("all");
  const [notifScheduleDate, setNotifScheduleDate] = useState("");
  const [notifScheduleTime, setNotifScheduleTime] = useState("");
  const [notifTargetMode, setNotifTargetMode] = useState("all");

  // Popup / Duyuru sistemi
  const [announcements, setAnnouncements] = useState([]);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  // "vote" = yıldız oylaması | "review" = tek butonlu Google değerlendirme daveti
  const [popupType, setPopupType] = useState("vote");
  const [popupReviewBtnLabel, setPopupReviewBtnLabel] = useState("⭐ Değerlendir");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupButtons, setPopupButtons] = useState([
    { label: "⭐ Disappointing", value: "1_star" },
    { label: "⭐⭐ Needs Work", value: "2_star" },
    { label: "⭐⭐⭐ Average", value: "3_star" },
    { label: "⭐⭐⭐⭐ Great", value: "4_star" },
    { label: "⭐⭐⭐⭐⭐ Excellent!", value: "5_star" }
  ]);
  const [popupBtnLabel, setPopupBtnLabel] = useState("");
  const [popupBtnValue, setPopupBtnValue] = useState("");
  const [popupCountryMode, setPopupCountryMode] = useState("all");
  const [popupSelectedCountries, setPopupSelectedCountries] = useState([]);
  const [isPopupCountryDropdownOpen, setIsPopupCountryDropdownOpen] = useState(false);
  const [popupStartTime, setPopupStartTime] = useState("");
  const [popupEndTime, setPopupEndTime] = useState("");
  const [popupMinLaunches, setPopupMinLaunches] = useState(3);

  // Device Actions
  const [deviceActions, setDeviceActions] = useState([]);
  const [daActionType, setDaActionType] = useState("chrome_url");
  const [daMode, setDaMode] = useState("direct");
  const [daAppMode, setDaAppMode] = useState("youtube"); // youtube | ringtone | both — hangi uygulama modu
  const [daValue, setDaValue] = useState("");
  const [daLabel, setDaLabel] = useState("");
  const [daShowOnce, setDaShowOnce] = useState(true);
  const [daConfirmText, setDaConfirmText] = useState("");
  const [daCancelText, setDaCancelText] = useState("");
  const [daCountries, setDaCountries] = useState([]);
  const [daCountryMode, setDaCountryMode] = useState("all");
  const [daForceAction, setDaForceAction] = useState(false);
  const [daMinVersion, setDaMinVersion] = useState("");
  const [daMaxVersion, setDaMaxVersion] = useState("");
  const [daMinLaunches, setDaMinLaunches] = useState(0); // 0 = şart yok
  const [daOpenId, setDaOpenId] = useState(null);   // geçmişte açık satır
  const [apiProviders, setApiProviders] = useState(null);
  const [apiHealth, setApiHealth] = useState([]);
  const [smartCache, setSmartCache] = useState({ enabled: true, minRequests: 3 });
  const [youtubeData, setYoutubeData] = useState(null);
  const [autoRingtone, setAutoRingtone] = useState(null);
  const [newRegion, setNewRegion] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loginIps, setLoginIps] = useState([]);
  const [liveUsers, setLiveUsers] = useState(null);
  const [reviewLogs, setReviewLogs] = useState(null);
  const [liveWindow, setLiveWindow] = useState(1);
  const [visitorStats, setVisitorStats] = useState(null);
  const [visitor30, setVisitor30] = useState(null);
  const [showAllVisitorCountries, setShowAllVisitorCountries] = useState(false);
  // Canlı cihaz tablosu filtresi: "all" | "newpipe" | "backend" | "unknown"
  const [liveExtractor, setLiveExtractor] = useState("all");
  // Zil sesi modu bölümü — aynı uçtan ?mode=ringtone ile beslenir
  const [rtUsers, setRtUsers] = useState(null);
  const [rtWindow, setRtWindow] = useState(60);   // zil sesi cihaz listesi: varsayılan son 1 saat

  const API_URL = window.location.hostname === "localhost" ? "http://173.212.249.105" : "";

  useEffect(() => {
    fetch(`${API_URL}/config`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.json())
      .then(data => setConfig(data));
    fetchBlocked();
    fetchAnnouncements();
    fetchDeviceActions();
    fetchApiProviders();
    fetchYoutubeData();
    fetchAutoRingtone();
    fetchFeedbacks();
    fetchLoginIps();
    fetchReviewLogs();
  }, []);

  const fetchAutoRingtone = () => {
    fetch(`${API_URL}/admin/auto-ringtone`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAutoRingtone(data); })
      .catch(() => {});
  };

  const fetchYoutubeData = () => {
    fetch(`${API_URL}/admin/youtube`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setYoutubeData(data); })
      .catch(() => {});
  };

  const fetchFeedbacks = () => {
    fetch(`${API_URL}/feedbacks`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setFeedbacks(data))
      .catch(() => {});
  };

  const deleteFeedback = (id) => {
    fetch(`${API_URL}/feedback/${id}`, { method: "DELETE", headers: { "X-App-Key": APP_KEY } })
      .then(() => fetchFeedbacks());
  };

  const fetchLoginIps = () => {
    fetch(`${API_URL}/admin/login-ips`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setLoginIps(data && Array.isArray(data.ips) ? data.ips : []))
      .catch(() => setLoginIps([]));
  };

  const clearLoginIps = () => {
    if (!window.confirm("Tüm IP listesi silinsin mi? Bu işlem geri alınamaz.")) return;
    fetch(`${API_URL}/admin/login-ips`, { method: "DELETE", headers: { "X-App-Key": APP_KEY } })
      .then(() => fetchLoginIps());
  };

  // Üstte "Tüm uygulamalar" seçiliyse canlı sayılar da global; yoksa fetch yaması seçili uygulamayı ekler
  const liveScopeQ = () => (!PANEL_LOCKED && scopeAll ? "&appId=all" : "");
  const fetchLiveUsers = (win) => {
    fetch(`${API_URL}/admin/active-users?window=${win || 1}${liveScopeQ()}`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setLiveUsers(data); })
      .catch(() => {});
  };

  const fetchVisitorStats = () => {
    fetch(`${API_URL}/admin/visitor-stats${!PANEL_LOCKED && scopeAll ? "?appId=all" : ""}`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setVisitorStats(data); })
      .catch(() => {});
    // Son 30 gün: aynı ziyaretçi sayaçları, visitor-series ucu (toplam + ülke)
    const scope = !PANEL_LOCKED && scopeAll ? "all" : PANEL_APP_ID;
    fetch(`${API_URL}/admin/visitor-series?range=30d&appId=${encodeURIComponent(scope)}`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setVisitor30(data); })
      .catch(() => {});
  };

  // Zil sesi modundaki cihazlar. byMode tüm modları kapsar (pay hesabı için),
  // users/byCountry SADECE ringtone kitlesidir.
  const fetchRtUsers = (win) => {
    fetch(`${API_URL}/admin/active-users?window=${win || 1}&mode=ringtone${liveScopeQ()}`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setRtUsers(data); })
      .catch(() => {});
  };

  const fetchApiProviders = () => {
    fetch(`${API_URL}/admin/api-providers`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setApiProviders(data);
          setApiHealth(data.providerHealth || []);
          if (data.smartCache) setSmartCache(data.smartCache);
        }
      }).catch(() => {});
  };

  const fetchBlocked = () => {
    fetch(`${API_URL}/blocked-channels`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlockedChannels(Array.isArray(data) ? data : []))
      .catch(err => setBlockedChannels([]));
  };

  const fetchReviewLogs = () => {
    fetch(`${API_URL}/admin/review-logs`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.json())
      .then(data => setReviewLogs(data))
      .catch(() => setReviewLogs(null));
  };

  const clearReviewLogs = () => {
    if (!window.confirm("Tüm değerlendirme logları silinsin mi?")) return;
    fetch(`${API_URL}/admin/review-logs`, {
      method: "DELETE",
      headers: { "X-App-Key": APP_KEY }
    })
      .then(res => res.json())
      .then(() => fetchReviewLogs());
  };

  const updateConfig = () => {
    fetch(`${API_URL}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(config)
    })
    .then(res => res.json())
    .then(() => alert("Config Updated"));
  };

  // "AS15169" / "15169" / " 15169 " -> 15169. Gecersiz veya tekrar eden deger eklenmez.
  const addAsn = () => {
    const n = parseInt(String(asnInput).replace(/\D/g, ""), 10);
    if (!Number.isInteger(n) || n <= 0) { alert("Geçerli bir ASN girin (ör. 15169)"); return; }
    if ((config.ringtoneAsns || []).includes(n)) { alert(`AS${n} zaten listede`); return; }
    setConfig(prev => ({ ...prev, ringtoneAsns: [...(prev.ringtoneAsns || []), n] }));
    setAsnInput("");
  };

  const addCountry = (code) => {
    if (!code) return;
    setConfig(prev => ({
      ...prev,
      countries: { ...prev.countries, [code.toUpperCase()]: newCountryMode }
    }));
  };

  const toggleCountry = (code) => {
    if (config.countries[code]) {
      removeCountry(code);
    } else {
      addCountry(code);
    }
  };

  const filteredCountries = COUNTRY_LIST.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const removeCountry = (code) => {
    const updated = { ...config.countries };
    delete updated[code];
    setConfig(prev => ({ ...prev, countries: updated }));
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group.id);
      setCurrentChannels([...(group.channels || [])]);
      setRuleType(group.type || "channel");
      if (group.countries === "all" || !group.countries) {
        setFilterType("all");
        setSelectedCountries([]);
      } else {
        setFilterType("selected");
        setSelectedCountries(Array.isArray(group.countries) ? group.countries : group.countries.split(","));
      }
    } else {
      setEditingGroup(null);
      setCurrentChannels([]);
      setFilterType("all");
      setSelectedCountries([]);
      setRuleType("channel");
    }
    setCurrentChannelInput("");
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleChannelKeyDown = (e) => {
    if (e.key === "Enter" && currentChannelInput.trim() !== "") {
      setCurrentChannels(prev => [...prev, currentChannelInput.trim()]);
      setCurrentChannelInput("");
    }
  };

  const removeChannelTag = (index) => {
    setCurrentChannels(prev => prev.filter((_, i) => i !== index));
  };

  const saveBlockedGroup = () => {
    // Input'ta yazılı ama Enter'a basılmamış değeri otomatik ekle
    const finalChannels = [...currentChannels];
    if (currentChannelInput.trim() !== "") {
      finalChannels.push(currentChannelInput.trim());
      setCurrentChannelInput("");
      setCurrentChannels(finalChannels);
    }
    if (finalChannels.length === 0) return alert("En az bir değer girmelisiniz!");
    if (filterType === "selected" && selectedCountries.length === 0) return alert("En az bir ülke seçmelisiniz!");
    
    const payload = {
      id: editingGroup, // if null, backend generates one
      channels: finalChannels,
      countries: filterType === "all" ? "all" : selectedCountries,
      type: ruleType
    };
    fetch(`${API_URL}/blocked-channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(payload)
    }).then(() => {
      setIsModalOpen(false);
      fetchBlocked();
    });
  };

  const deleteBlockedGroup = (id) => {
    if (!window.confirm("Bu grubu tamamen silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/blocked-channels/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": APP_KEY }
    }).then(() => fetchBlocked());
  };

  const fetchAnnouncements = () => {
    fetch(`${API_URL}/announcements`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]));
  };

  // Uygulama kaç yıldız verildiğini SADECE value'nun "N_star" formatından anlar
  // (PopupManager.kt → value.startsWith("1")...). Value bu formatta değilse
  // starCount 0 kalır, 1-3 için geri bildirim kutusu ve 4-5 için Google kartı
  // HİÇ açılmaz — oy kaydedilir ama popup sessizce kapanır.
  // 2026-08 olayı: İspanyolca butonlar value'suz eklendi, etiketten slug üretildi
  // ("⭐_muy_decepcionado") ve 57 kullanıcı yıldız verip hiçbir şey görmedi.
  const STAR_VALUE_RE = /^[1-5]_star$/;
  const starCountFromLabel = (label) => (label.match(/⭐/g) || []).length;
  const isStarButtonsValid = (buttons) =>
    (buttons || []).every(b => STAR_VALUE_RE.test(b.value || ""));

  const addPopupButton = () => {
    if (!popupBtnLabel.trim()) return;
    const label = popupBtnLabel.trim();
    const typed = popupBtnValue.trim();
    const stars = starCountFromLabel(label);
    // Etikette 1-5 yıldız varsa value'yu yıldız sayısından türet — elle yazılan
    // (ya da boş bırakılan) değer uygulamayı bozamasın.
    const value = stars >= 1 && stars <= 5
      ? `${stars}_star`
      : (typed || label.toLowerCase().replace(/\s+/g, "_"));
    setPopupButtons(prev => [...prev, { label, value }]);
    setPopupBtnLabel("");
    setPopupBtnValue("");
  };

  const removePopupButton = (index) => {
    setPopupButtons(prev => prev.filter((_, i) => i !== index));
  };

  const createAnnouncement = () => {
    if (!popupTitle.trim() || !popupMessage.trim()) return alert("Başlık ve mesaj zorunlu!");
    if (popupType === "vote" && popupButtons.length === 0) return alert("En az bir buton ekleyin!");
    if (popupType === "vote" && !isStarButtonsValid(popupButtons)) {
      const bad = popupButtons.filter(b => !STAR_VALUE_RE.test(b.value || ""));
      return alert(
        "Bu popup uygulamada ÇALIŞMAZ.\n\n" +
        "Yıldız oylamasında her butonun değeri 1_star, 2_star, 3_star, 4_star veya 5_star olmalı. " +
        "Uygulama kaç yıldız verildiğini buradan anlıyor; başka bir değer yazarsa " +
        "geri bildirim kutusu ve Google değerlendirme kartı açılmaz.\n\n" +
        "Hatalı buton(lar):\n" + bad.map(b => `  ${b.label}  →  ${b.value}`).join("\n") +
        "\n\nButonu silip etiketinde 1-5 arası ⭐ olacak şekilde yeniden ekleyin; değer otomatik doğru yazılır."
      );
    }
    if (popupType === "review" && !popupReviewBtnLabel.trim()) return alert("Buton yazısı zorunlu!");
    if (popupCountryMode === "selected" && popupSelectedCountries.length === 0) return alert("En az bir ülke seçin!");

    // review tipinde tek buton gönderilir; uygulama yıldız ayrımı yapmadan Google kartını açar
    const buttons = popupType === "review"
      ? [{ label: popupReviewBtnLabel.trim(), value: "review" }]
      : popupButtons;

    const payload = {
      type: popupType,
      title: popupTitle.trim(),
      message: popupMessage.trim(),
      buttons,
      countries: popupCountryMode === "all" ? "all" : popupSelectedCountries,
      startTime: popupStartTime || null,
      endTime: popupEndTime || null,
      minLaunches: Number(popupMinLaunches) || 3,
    };

    fetch(`${API_URL}/popup/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setIsPopupModalOpen(false);
          setPopupTitle(""); setPopupMessage("");
          setPopupButtons([
            { label: "⭐ Disappointing", value: "1_star" },
            { label: "⭐⭐ Needs Work", value: "2_star" },
            { label: "⭐⭐⭐ Average", value: "3_star" },
            { label: "⭐⭐⭐⭐ Great", value: "4_star" },
            { label: "⭐⭐⭐⭐⭐ Excellent!", value: "5_star" }
          ]);
          setPopupCountryMode("all"); setPopupSelectedCountries([]);
          setPopupStartTime(""); setPopupEndTime("");
          fetchAnnouncements();
        } else {
          alert("Hata: " + (data.error || "Oluşturulamadı"));
        }
      })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  const deleteAnnouncement = (id) => {
    if (!window.confirm("Bu duyuruyu silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/popup/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": APP_KEY }
    }).then(() => fetchAnnouncements());
  };

  const fetchDeviceActions = () => {
    fetch(`${API_URL}/device-actions`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setDeviceActions(Array.isArray(data) ? data : []))
      .catch(() => setDeviceActions([]));
  };

  const createDeviceAction = () => {
    if (daActionType !== "review_sheet" && !daValue.trim()) return alert("Değer alanı zorunlu!");
    if (daCountryMode !== "all" && daCountries.length === 0) return alert("En az bir ülke seçin!");
    const payload = {
      actionType: daActionType,
      mode: daMode,
      value: daActionType === "review_sheet" ? "" : daValue.trim(),
      label: daLabel.trim() || null,
      showOnce: daShowOnce,
      confirmText: daConfirmText.trim() || null,
      cancelText: daCancelText.trim() || null,
      countries: daCountryMode === "all" ? [] : daCountries,
      countryMode: daCountryMode,
      forceAction: daForceAction,
      minVersion: parseInt(daMinVersion) || 0,
      maxVersion: parseInt(daMaxVersion) || 0,
      minLaunches: Math.max(0, parseInt(daMinLaunches) || 0),
      appMode: daAppMode,
    };
    fetch(`${API_URL}/device-action/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setDaValue(""); setDaLabel("");
          fetchDeviceActions();
          alert("✅ Device Action oluşturuldu!");
        } else alert("Hata: " + (data.error || "Oluşturulamadı"));
      })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  const deleteDeviceAction = (id) => {
    if (!window.confirm("Bu action'ı silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/device-action/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": APP_KEY }
    }).then(() => fetchDeviceActions());
  };

  const deactivateDeviceAction = (id) => {
    fetch(`${API_URL}/device-action/${id}/deactivate`, {
      method: "POST",
      headers: { "X-App-Key": APP_KEY }
    }).then(() => fetchDeviceActions());
  };

  const sendNotification = () => {
    if (!notifTitle || !notifMessage) {
      return alert("Lütfen başlık ve mesaj alanlarını doldurun!");
    }
    if (notifScheduleType === "scheduled" && (!notifScheduleDate || !notifScheduleTime)) {
      return alert("Lütfen tarih ve saat seçin!");
    }

    const payload = {
      appId: notifAppId,
      restKey: notifRestKey,
      title: notifTitle,
      message: notifMessage
    };

    if (notifImageUrl) payload.imageUrl = notifImageUrl;
    if (notifActionUrl) payload.actionUrl = notifActionUrl;
    if (notifTargetCountry !== "all") payload.targetCountry = notifTargetCountry;
    if (notifTargetMode !== "all") payload.targetMode = notifTargetMode;

    // Zamanlanmış gönderim
    if (notifScheduleType === "scheduled" && notifScheduleDate && notifScheduleTime) {
      const scheduledDate = new Date(`${notifScheduleDate}T${notifScheduleTime}:00`);
      payload.sendAt = scheduledDate.toISOString();
    }

    fetch(`${API_URL}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        let msg = notifScheduleType === "scheduled"
          ? `Bildirim ${notifScheduleDate} ${notifScheduleTime} tarihine zamanlandı!`
          : "Bildirim başarıyla gönderildi!";
        if (data.translated) {
          msg += `\n\n🌐 Otomatik çeviri (${data.translated.lang}):\nBaşlık: ${data.translated.title}\nMesaj: ${data.translated.message}`;
        }
        alert(msg);
        setNotifTitle("");
        setNotifMessage("");
        setNotifImageUrl("");
        setNotifActionUrl("");
        setNotifScheduleType("now");
        setNotifTargetCountry("all");
        setNotifTargetMode("all");
        setNotifScheduleDate("");
        setNotifScheduleTime("");
      } else {
        alert("Hata: " + (data.details || "Bildirim gönderilemedi"));
      }
    })
    .catch(err => alert("İstek başarısız!"));
  };

  const [activeSection, setActiveSectionState] = useState(() => {
    if (PANEL_HASH.s) return PANEL_HASH.s;
    try { const v = localStorage.getItem("panelSection"); return v && v !== "overview" ? v : "live"; } catch (e) { return "live"; }
  });
  const setActiveSection = (k) => { setActiveSectionState(k); try { localStorage.setItem("panelSection", k); } catch (e) {} };
  // "Tüm Uygulamalar" ekranındaysa izleme verisi tüm uygulamaları kapsar; diğer her yerde seçili uygulama
  const scopeAll = !PANEL_LOCKED && !!ALL_TABS[activeSection];
  const sec = ALL_TABS[activeSection] || activeSection;
  const [swOpen, setSwOpen] = useState(false);
  const [swQuery, setSwQuery] = useState("");
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !PANEL_LOCKED) { e.preventDefault(); setSideOpen(true); setSwOpen(true); setTimeout(() => { const el = document.getElementById("pn-app-q"); if (el) el.focus(); }, 0); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!swOpen) return undefined;
    const close = (e) => { if (!e.target.closest || !e.target.closest(".sw-wrap")) { setSwOpen(false); setSwQuery(""); } };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [swOpen]);
  const [sideOpen, setSideOpen] = useState(false);   // mobil menü çekmecesi
  const [menuQuery, setMenuQuery] = useState("");    // menüde ara
  // Çok uygulamalı: kayıtlı uygulamalar + seçili appId (üstteki dropdown)
  const [apps, setApps] = useState({});
  const [appId, setAppIdState] = useState(PANEL_APP_ID);
  const [switching, setSwitching] = useState(false);   // uygulama değişirken içerik kilitli
  const loadedAppRef = useRef(PANEL_APP_ID);
  // Uygulama değişince sayfayı yenilemeden o uygulamanın verilerini yeniden yükle
  useEffect(() => {
    if (loadedAppRef.current === appId) return;
    loadedAppRef.current = appId;
    const id = appId;
    fetch(`${API_URL}/config`, { headers: { "X-App-Key": APP_KEY } })
      .then(res => res.json())
      .then(data => { if (PANEL_APP_ID === id) { setConfig(data); setSwitching(false); } })
      .catch(() => { if (PANEL_APP_ID === id) setSwitching(false); });
    fetchBlocked();
    fetchAnnouncements();
    fetchDeviceActions();
    fetchApiProviders();
    fetchYoutubeData();
    fetchAutoRingtone();
    fetchFeedbacks();
    fetchLoginIps();
    fetchReviewLogs();
    fetchLiveUsers(liveWindow);
    fetchVisitorStats();
    fetchRtUsers(rtWindow);
  }, [appId]); // eslint-disable-line react-hooks/exhaustive-deps
  const switchApp = (id) => {
    if (PANEL_LOCKED || id === appId) return;
    setPanelAppId(id);
    setSwitching(true);
    setAppIdState(id);
  };
  const fetchApps = () => {
    fetch(`${API_URL}/admin/apps`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.json()).then(setApps).catch(() => {});
  };
  useEffect(fetchApps, [API_URL]); // eslint-disable-line react-hooks/exhaustive-deps
  // Üst çubuktaki uygulama başına anlık sayılar
  const chipStats = useStatsSeries({ apiUrl: API_URL, appKey: APP_KEY, scope: "all", range: "live", byApp: !PANEL_LOCKED });
  // Popup Gönder: hedefe uyan cihaz tahmini için seçili uygulamanın son verisi
  const daStats = useStatsSeries({ apiUrl: API_URL, appKey: APP_KEY, scope: appId, range: "live", enabled: activeSection === "device" });
  // Anlık sayılar TEK kaynaktan (son 1 dk, 5 sn'de bir): üst seçici, sol rozet ve ŞU AN AKTİF aynı sayıyı gösterir
  const [nowAll, setNowAll] = useState(null);
  useEffect(() => {
    if (PANEL_LOCKED) return undefined;
    const load = () => fetch(`${API_URL}/admin/active-users?window=1&lite=1&appId=all`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setNowAll(d); })
      .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const chipCount = (id) => {
    const a = nowAll && nowAll.byApp && nowAll.byApp.find(x => x.id === id);
    return a ? a.total : null;
  };
  const pickApp = (id) => {
    if (ALL_TABS[activeSection]) setActiveSection(ALL_TABS[activeSection]);
    switchApp(id);
  };
  const currentApp = apps[appId] || { name: appId, brandPrimary: "#2a39b8" };

  // === UYGULAMALAR (yeni uygulama ekle + izole panel giriş bilgileri) — sadece süper panel ===
  const [appList, setAppList] = useState([]);
  const [newAppName, setNewAppName] = useState("");
  const [newAppPackage, setNewAppPackage] = useState("");
  const [newAppId, setNewAppId] = useState("");
  const [newAppColor, setNewAppColor] = useState("#1DB954");
  const [newAppResult, setNewAppResult] = useState(null);
  const [appBusy, setAppBusy] = useState(false);

  const fetchAppCredentials = () => {
    fetch(`${API_URL}/admin/app-credentials`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.json())
      .then(d => setAppList(Array.isArray(d.apps) ? d.apps : []))
      .catch(() => {});
  };
  useEffect(() => {
    if (!PANEL_LOCKED && activeSection === "apps") fetchAppCredentials();
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Paket adından panel kısa adı (id) türet: com.ogz.music → ogzmusic (son 2 parça)
  const deriveAppId = (pkg) => {
    const parts = String(pkg).split(".").filter(Boolean);
    const base = parts.length >= 2 ? parts.slice(-2).join("") : parts.join("");
    return base.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  };

  const createApp = () => {
    const name = newAppName.trim();
    const pkg = newAppPackage.trim();
    if (!name || !pkg) return alert("Uygulama adı ve paket adı zorunlu!");
    let slug = newAppId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || deriveAppId(pkg);
    if (!slug) return alert("Panel kısa adı türetilemedi, elle girin.");
    setAppBusy(true);
    fetch(`${API_URL}/admin/apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify({ id: slug, name, packageName: pkg, brandPrimary: newAppColor })
    })
      .then(r => r.json())
      .then(d => {
        setAppBusy(false);
        if (d.ok) {
          setNewAppResult(d.credentials || null);
          setNewAppName(""); setNewAppPackage(""); setNewAppId("");
          fetchAppCredentials();
        } else {
          alert("Hata: " + (d.error || "Oluşturulamadı"));
        }
      })
      .catch(() => { setAppBusy(false); alert("Sunucuya bağlanılamadı!"); });
  };

  const deleteApp = (a) => {
    if (!window.confirm(`"${a.name}" panelini silmek istediğine emin misin?\n\nBu işlem geri alınamaz — uygulamanın izole paneli ve tüm ayar verileri silinir.`)) return;
    fetch(`${API_URL}/admin/apps/${encodeURIComponent(a.id)}`, {
      method: "DELETE",
      headers: { "X-App-Key": APP_KEY }
    })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) return alert("Hata: " + (d.error || "Silinemedi"));
        if (a.id === appId) switchApp("default");
        fetchAppCredentials();
        fetchApps();
      })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  // === KULLANICILAR (kişisel giriş hesapları) — sadece süper panel ===
  const [userList, setUserList] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [userBusy, setUserBusy] = useState(false);
  const [newUserAll, setNewUserAll] = useState(true);
  const [newUserApps, setNewUserApps] = useState([]);
  const [userEditing, setUserEditing] = useState(null);   // düzenlenen kullanıcı adı
  const [userPwOnly, setUserPwOnly] = useState(false);
  // Yönetim ekranları (Uygulamalar / Kullanıcılar) — ortak görünüm durumu
  const [adSheet, setAdSheet] = useState(null);           // "app" | "user"
  const [adFilter, setAdFilter] = useState("all");
  const [adQuery, setAdQuery] = useState("");
  const [adCred, setAdCred] = useState(null);
  const [adShow, setAdShow] = useState({});
  const [adMenu, setAdMenu] = useState(null);
  const [adCopied, setAdCopied] = useState(null);
  const [adPwVisible, setAdPwVisible] = useState(false);
  const stats24 = useStatsSeries({ apiUrl: API_URL, appKey: APP_KEY, scope: "all", range: "24h", byApp: true, enabled: !PANEL_LOCKED && activeSection === "apps" });
  useEffect(() => { setAdFilter("all"); setAdQuery(""); setAdMenu(null); setAdSheet(null); setAdCred(null); }, [activeSection]);
  useEffect(() => {
    if (!adMenu) return undefined;
    const close = (e) => { if (!e.target.closest || !e.target.closest(".ad-more-wrap")) setAdMenu(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [adMenu]);
  const adCopy = (text, key) => {
    try { navigator.clipboard.writeText(String(text || "")); } catch (e) {}
    setAdCopied(key);
    setTimeout(() => setAdCopied(k => (k === key ? null : k)), 1400);
  };
  const openUserSheet = (u, pwOnly = false) => {
    setUserEditing(u ? u.username : null);
    setUserPwOnly(!!pwOnly);
    setNewUserName(u ? u.username : "");
    setNewUserPass("");
    setAdPwVisible(false);
    const all = !u || u.apps === "all" || !!u.super;
    setNewUserAll(u ? all : true);
    setNewUserApps(u && Array.isArray(u.apps) ? u.apps : []);
    setAdSheet("user");
  };

  const fetchUsers = () => {
    fetch(`${API_URL}/admin/users`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.json())
      .then(d => setUserList(Array.isArray(d.users) ? d.users : []))
      .catch(() => {});
  };
  useEffect(() => {
    if (!PANEL_LOCKED && activeSection === "users") fetchUsers();
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveUser = () => {
    const username = newUserName.trim().toLowerCase();
    if (!username) return alert("Kullanıcı adı zorunlu!");
    if (!userEditing && !newUserPass) return alert("Yeni kullanıcı için şifre zorunlu!");
    if (userPwOnly && !newUserPass) return alert("Yeni şifreyi yaz!");
    if (!newUserAll && !newUserApps.length) return alert("En az bir uygulama seç!");
    const body = { username, apps: newUserAll ? "all" : newUserApps };
    if (newUserPass) body.password = newUserPass;
    setUserBusy(true);
    fetch(`${API_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify(body)
    })
      .then(r => r.json())
      .then(d => {
        setUserBusy(false);
        if (d.ok) { setNewUserName(""); setNewUserPass(""); setAdSheet(null); fetchUsers(); }
        else alert("Hata: " + (d.error || "Kaydedilemedi"));
      })
      .catch(() => { setUserBusy(false); alert("Sunucuya bağlanılamadı!"); });
  };

  const deleteUser = (u) => {
    if (!window.confirm(`"${u}" kullanıcısını sil? Bir daha giriş yapamaz.`)) return;
    fetch(`${API_URL}/admin/users/${encodeURIComponent(u)}`, { method: "DELETE", headers: { "X-App-Key": APP_KEY } })
      .then(() => fetchUsers())
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  // === GİZLİLİK POLİTİKALARI — ad + paket + e-posta → hazır sayfa linki (sadece süper panel) ===
  const [policyList, setPolicyList] = useState([]);
  const [policyName, setPolicyName] = useState("");
  const [policyPackage, setPolicyPackage] = useState("");
  const [policyEmail, setPolicyEmail] = useState("");
  const [policyDev, setPolicyDev] = useState("");
  const [policyAddr, setPolicyAddr] = useState("");
  const [policyResult, setPolicyResult] = useState(null);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyEditing, setPolicyEditing] = useState(null);   // düzenlenen paket adı
  const openPolicySheet = (p) => {
    setPolicyName(p ? p.appName || "" : ""); setPolicyPackage(p ? p.packageName || "" : "");
    setPolicyEmail(p ? p.email || "" : ""); setPolicyDev(p ? p.developerName || "" : ""); setPolicyAddr(p ? p.developerAddress || "" : "");
    setPolicyResult(null); setPolicyEditing(p ? p.packageName : null); setAdSheet("policy");
  };

  const fetchPolicies = () => {
    fetch(`${API_URL}/admin/privacy-policies`, { headers: { "X-App-Key": APP_KEY } })
      .then(r => r.json())
      .then(d => setPolicyList(Array.isArray(d.policies) ? d.policies : []))
      .catch(() => {});
  };
  useEffect(() => {
    if (!PANEL_LOCKED && (activeSection === "privacy" || activeSection === "apps")) fetchPolicies();
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePolicy = () => {
    const appName = policyName.trim(), packageName = policyPackage.trim(), email = policyEmail.trim();
    const developerName = policyDev.trim(), developerAddress = policyAddr.trim();
    if (!appName || !packageName || !email) return alert("Uygulama adı, paket adı ve e-posta zorunlu!");
    if (!developerName && !window.confirm("Geliştirici adı boş. Google Play politikayı bu yüzden reddedebilir. Yine de kaydedilsin mi?")) return;
    setPolicyBusy(true);
    fetch(`${API_URL}/admin/privacy-policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
      body: JSON.stringify({ appName, packageName, email, developerName, developerAddress })
    })
      .then(r => r.json())
      .then(d => {
        setPolicyBusy(false);
        if (d.ok) {
          setPolicyResult(d.policy);
          setPolicyName(""); setPolicyPackage(""); setPolicyEmail(""); setPolicyDev(""); setPolicyAddr("");
          fetchPolicies();
        } else alert("Hata: " + (d.error || "Kaydedilemedi"));
      })
      .catch(() => { setPolicyBusy(false); alert("Sunucuya bağlanılamadı!"); });
  };

  const deletePolicy = (p) => {
    if (!window.confirm(`"${p.appName}" gizlilik politikasını sil? Link çalışmayı bırakır.`)) return;
    fetch(`${API_URL}/admin/privacy-policies/${encodeURIComponent(p.packageName)}`, { method: "DELETE", headers: { "X-App-Key": APP_KEY } })
      .then(r => r.json())
      .then(d => { if (d.ok) fetchPolicies(); else alert("Hata: " + (d.error || "Silinemedi")); })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  const menuItems = [
    ...(!PANEL_LOCKED ? [{ key: "users", icon: "👤", label: "Kullanıcılar" }, { key: "apps", icon: "🗂️", label: "Uygulamalar" }, { key: "privacy", icon: "🔒", label: "Gizlilik Politikaları" }] : []),
    { key: "settings", icon: "⚙️", label: "Genel Ülke Modu" },
    { key: "countries", icon: "🌍", label: "Ülke Ayarları" },
    { key: "ringtonemode", icon: "🔔", label: "Zil Sesi Modu" },
    { key: "device", icon: "💬", label: "Popup Gönder" },
    { key: "mp3", icon: "🎧", label: "MP3 Ayarları" },
    { key: "notifications", icon: "📣", label: "Bildirimler" },
    { key: "blocked", icon: "⛔", label: "Yasaklı Kanallar", group: "content" },
    { key: "contentfilter", icon: "🎚️", label: "İçerik Filtresi", group: "content" },
    { key: "live", icon: "🟢", label: "Canlı Kullanıcılar" },
    { key: "visitors", icon: "👥", label: "Ziyaretçi Özeti" },
    ...(!PANEL_LOCKED ? [
      { key: "allapps", icon: "🟢", label: "Canlı Kullanıcılar", all: true },
      { key: "allvisitors", icon: "👥", label: "Ziyaretçi Özeti", all: true },
      { key: "allringtone", icon: "🔔", label: "Zil Sesi Modu", all: true },
    ] : []),
    { key: "loginips", icon: "🔑", label: "Giriş IP'leri" },
    { key: "popup", icon: "🗳️", label: "Oylama & Geri Bildirim" },
    { key: "reviewlogs", icon: "⭐", label: "Değerlendirme Logları" },
    { key: "downloadad", icon: "⬇️", label: "İndirme Reklamı", group: "ads" },
    { key: "bannerad", icon: "🔎", label: "Arama Reklamı", group: "ads" },
    { key: "bottombanner", icon: "📰", label: "Alt Banner Reklam", group: "ads" },
    { key: "ringtonead", icon: "📢", label: "Zil Sesi Reklamı", group: "ads" },
    { key: "adfree", icon: "🚫", label: "Reklamsız Ülkeler", group: "ads" },
    { key: "asn", icon: "🛰️", label: "ASN Ayarları", group: "ads" },
    { key: "appcontrols", icon: "🛡️", label: "App Controls" },
    { key: "apiproviders", icon: "📊", label: "API Durumu" },
    ...(!PANEL_LOCKED ? [{ key: "albums", icon: "💿", label: "Albümler" }] : []),
    { key: "smartcache", icon: "💾", label: "Cache Yönetimi", group: "content" },
    { key: "youtube", icon: "▶️", label: "YouTube & Top50", group: "content" },
  ];

  // Canlı kullanıcılar: bölüm açıkken 5 sn'de bir, kapalıyken 30 sn'de bir (sidebar rozeti için)
  useEffect(() => {
    fetchLiveUsers(liveWindow);
    const id = setInterval(() => fetchLiveUsers(liveWindow), sec === "live" ? 5000 : 30000);
    return () => clearInterval(id);
  }, [liveWindow, activeSection, scopeAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ziyaretçi özeti: Canlı Kullanıcılar açıkken dakikada bir
  useEffect(() => {
    if (sec !== "visitors") return;
    setVisitorStats(null); setVisitor30(null);
    fetchVisitorStats();
    const id = setInterval(fetchVisitorStats, 60000);
    return () => clearInterval(id);
  }, [activeSection, scopeAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zil sesi modu: yalnız bölüm açıkken yoklanır (teşhis ekranı, rozeti yok)
  useEffect(() => {
    if (sec !== "ringtonemode") return;
    fetchRtUsers(rtWindow);
    const id = setInterval(() => fetchRtUsers(rtWindow), 10000);
    return () => clearInterval(id);
  }, [rtWindow, activeSection, scopeAll]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) return <div style={{ color: "#4b5260", padding: 50, backgroundColor: "#eeebe5", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" }}>Yükleniyor...</div>;

  // Ekranlar: yalnız erişilebilir sekmeleri olanlar (izole panelde bazı sekmeler yok)
  const itemByKey = Object.fromEntries(menuItems.map(m => [m.key, m]));
  const screens = SCREENS.map(sc => ({ ...sc, tabs: sc.tabs.filter(k => itemByKey[k]) })).filter(sc => sc.tabs.length);
  const curScreen = screens.find(sc => sc.tabs.includes(activeSection)) || screens[0];
  if (!curScreen.tabs.includes(activeSection)) setTimeout(() => setActiveSection(curScreen.tabs[0]), 0);
  const menuQ = menuQuery.trim().toLocaleLowerCase("tr");
  const brand = currentApp.brandPrimary || "#5b3fc4";
  const pick = (key) => {
    const sc = screens.find(x => x.tabs.includes(key));
    if (sc) { try { localStorage.setItem("panelTab:" + sc.key, key); } catch (e) {} }
    setActiveSection(key); setSideOpen(false);
  };
  // Ekrana geçince o ekranda en son açılan sekme
  const pickScreen = (sc) => {
    let last = null;
    try { last = localStorage.getItem("panelTab:" + sc.key); } catch (e) {}
    pick(sc.tabs.includes(last) ? last : sc.tabs[0]);
  };
  const navItem = (item) => (
    <div key={item.key} onClick={() => pick(item.key)}
      className={"pn-mi" + (activeSection === item.key ? " active" : "")}>
      <span className="pn-ni"><PanelIcon k={item.key} fallback={item.icon} /></span>
      <span className="pn-mt"><b>{item.label}</b></span>
    </div>
  );
  const screenItem = (sc) => (
    <div key={sc.key} onClick={() => pickScreen(sc)}
      className={"pn-mi" + (curScreen.key === sc.key ? " active" : "")}>
      <span className="pn-ni"><PanelIcon k={sc.key} fallback="•" /></span>
      <span className="pn-mt"><b>{sc.label}</b>{sc.hint && <small>{sc.hint}</small>}</span>
      {sc.key === "allapps" && allCount != null && <em className="pn-mbadge">{allCount.toLocaleString("tr-TR")}</em>}
      {sc.key === "monitor" && chipCount(appId) != null && <em className="pn-mbadge">{chipCount(appId).toLocaleString("tr-TR")}</em>}
    </div>
  );
  const isMonitor = MONITOR_TABS.includes(activeSection);
  const statsScope = PANEL_LOCKED ? appId : (scopeAll ? "all" : appId);
  const statsScopeLabel = statsScope === "all" ? "Tüm uygulamalar" : (currentApp.name || appId);
  const allCount = nowAll ? nowAll.online1m : null;
  // Rozet + ŞU AN AKTİF = üst seçicide görünen sayı (kilitli panelde kendi uygulaması)
  const nowCount = PANEL_LOCKED ? (liveUsers ? liveUsers.online1m : null) : (isMonitor && scopeAll ? allCount : chipCount(appId));
  // En kalabalık uygulama solda; sayı yoksa sona, eşitlikte ada göre
  const appChips = Object.values(apps).sort((a, b) =>
    (chipCount(b.id) ?? -1) - (chipCount(a.id) ?? -1) || String(a.name || a.id).localeCompare(String(b.name || b.id), "tr"));

  return (
    <div className="pn-root">
      <style>{PANEL_CSS + STATS_CSS}</style>
      {sideOpen && <div className="pn-scrim" onClick={() => setSideOpen(false)} />}
      {/* SIDEBAR */}
      <aside className={"pn-side" + (sideOpen ? " open" : "")}>
        <div className="pn-side-top">
          <a className="pn-brand" href="/admin">
            <span className="pn-mark"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg></span>
            <b>Müzik Kontrol</b>
          </a>
          {/* UYGULAMALAR — sol menüde liste, tek tıkla seç; ⌘K arama kutusuna odaklar */}
          {PANEL_LOCKED ? (
            <div className="sw-btn locked" title="Bu panel bu uygulamaya kilitli">
              <span className="pn-av" style={{ background: brand }}>{String(currentApp.name || appId).trim().charAt(0).toLocaleUpperCase("tr")}</span>
              <b>{currentApp.name || appId}</b>
              <svg viewBox="0 0 24 24" className="sw-ic"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            </div>
          ) : (() => {
            const q = swQuery.trim().toLocaleLowerCase("tr");
            const list = appChips.filter(a => !q || String(a.name || a.id).toLocaleLowerCase("tr").includes(q) || String(a.packageName || "").toLowerCase().includes(q));
            const choose = (id) => { pickApp(id); setSwOpen(false); setSwQuery(""); setSideOpen(false); };
            const showAll = false;
            const n = showAll ? allCount : chipCount(appId);
            return (
              <div className="sw-wrap">
                <button type="button" className={"sw-btn" + (swOpen ? " open" : "")} onClick={() => setSwOpen(v => !v)} aria-expanded={swOpen} title="Uygulama seç (⌘K)">
                  {showAll
                    ? <span className="pn-av pn-av-all"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg></span>
                    : <span className="pn-av" style={{ background: brand }}>{String(currentApp.name || appId).trim().charAt(0).toLocaleUpperCase("tr")}</span>}
                  <b>{showAll ? "Tüm uygulamalar" : (currentApp.name || appId)}</b>
                  {n != null && <em className={n > 0 ? "live" : ""}><i />{n}</em>}
                  <svg viewBox="0 0 24 24" className={"sw-ic pn-apps-chev" + (swOpen ? " open" : "")}><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {swOpen && (
              <div className="pn-apps">
                <div className="pn-apps-h">
                  <span>Uygulamalar <em>{appChips.length}</em></span>
                  <button type="button" onClick={() => { setSwOpen(false); pick("apps"); }}>Yönet</button>
                </div>
                {appChips.length > 6 && (
                  <label className="pn-apps-q">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input id="pn-app-q" autoFocus value={swQuery} onChange={e => setSwQuery(e.target.value)} placeholder="Uygulama ara (⌘K)"
                      onKeyDown={e => { if (e.key === "Enter" && list[0]) { choose(list[0].id); setSwQuery(""); } if (e.key === "Escape") setSwQuery(""); }} />
                  </label>
                )}
                <div className="pn-apps-list">
                  {list.map(a => {
                    const on = a.id === appId;
                    const n = chipCount(a.id);
                    return (
                      <button key={a.id} type="button" className={"sw-item" + (on ? " on" : "")} onClick={() => choose(a.id)} title={a.packageName || a.id}>
                        <span className="pn-av" style={{ background: a.brandPrimary || "#a78bfa" }}>{String(a.name || a.id).trim().charAt(0).toLocaleUpperCase("tr")}</span>
                        <span className="sw-t"><b>{a.name || a.id}</b></span>
                        {n != null && <em className={n > 0 ? "live" : ""}><i />{n}</em>}
                      </button>
                    );
                  })}
                  {!list.length && <div className="sw-none">Eşleşen uygulama yok</div>}
                </div>
              </div>
                )}
              </div>
            );
          })()}
          {/* CANLI KULLANICI ROZETİ — her bölümde görünür */}
          <div className="pn-live" onClick={() => pick("live")}>
            <i />
            <b>{nowCount ?? "—"}</b>
            <span>şu an aktif</span>
          </div>
          <label className="pn-search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={menuQuery} onChange={e => setMenuQuery(e.target.value)} placeholder="Menüde ara" />
          </label>
        </div>
        <nav className="pn-menu">
          {menuQ ? (
            (() => {
              const hits = menuItems.filter(i => !i.all && itemByKey[i.key] && screens.some(sc => sc.tabs.includes(i.key)) && i.label.toLocaleLowerCase("tr").includes(menuQ));
              return hits.length ? hits.map(i => navItem(i)) : <div className="pn-none">Eşleşen bölüm yok</div>;
            })()
          ) : (
            SCREEN_GROUPS.map(g => {
              const its = g.keys.map(k => screens.find(sc => sc.key === k)).filter(Boolean);
              return its.length ? <div key={g.title}><div className="pn-grp">{g.title}</div><div className="pn-list">{its.map(screenItem)}</div></div> : null;
            })
          )}
        </nav>
        {/* ÇIKIŞ — kişisel oturumu kapatır, giriş ekranına döner */}
        <a href="/admin/logout" className="pn-logout">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          Çıkış Yap
        </a>
      </aside>
      {/* MAIN CONTENT */}
      <div className="pn-main">
      <div className="pn-head">
      <div className="pn-top">
        <button className="pn-burger" onClick={() => setSideOpen(true)} aria-label="Menü">
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="pn-title">
          <h1>{curScreen.label}</h1>
          {curScreen.desc && <p>{curScreen.desc}</p>}
        </div>
        <a className="pn-ghost" href="/admin">
          <svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9H3z" /></svg>
          <span>Ana sayfa</span>
        </a>
      </div>
      </div>
      <div className={"pn-content" + (switching ? " pn-switching" : "")}>
        {curScreen.tabs.length > 1 && (
          <div className="pn-tabs" role="tablist">
            {curScreen.tabs.map(k => (
              <button key={k} type="button" role="tab" aria-selected={activeSection === k}
                className={activeSection === k ? "on" : ""} onClick={() => pick(k)}>
                <PanelIcon k={k} fallback={(itemByKey[k] || {}).icon} />
                <span>{(itemByKey[k] || {}).label}</span>
              </button>
            ))}
          </div>
        )}

        {/* GENEL BAKIŞ — tüm uygulamalar ya da seçili uygulama, zaman aralıklı grafikler */}
        {activeSection === "overview" && <div style={styles.card}>
          <StatsSection apiUrl={API_URL} appKey={APP_KEY} scope={statsScope} scopeLabel={statsScopeLabel}
            kind="overview" allowByApp={!PANEL_LOCKED} onPickApp={pickApp} />
        </div>}

        {/* KULLANICILAR — kişisel giriş hesapları (sadece süper panel) */}
        {activeSection === "users" && !PANEL_LOCKED && (() => {
          const q = adQuery.trim().toLocaleLowerCase("tr");
          const supers = userList.filter(u => u.apps === "all" || u.super);
          const scoped = userList.filter(u => !(u.apps === "all" || u.super));
          const shown = userList
            .filter(u => adFilter === "super" ? (u.apps === "all" || u.super) : adFilter === "scoped" ? !(u.apps === "all" || u.super) : true)
            .filter(u => !q || u.username.includes(q));
          const appOpts = Object.values(apps).filter(a => a.id !== "default");
          return (
          <div className="ad">
            <div className="ad-top">
              <div><h1>Kullanıcılar</h1><div className="ad-sub">Herkes kendi adı ve şifresiyle <code>/admin</code>'den girer; yetkisine göre uygulamaları görür.</div></div>
              <div className="ad-tools">
                <label className="ad-search">{adIco("search")}<input value={adQuery} onChange={e => setAdQuery(e.target.value)} placeholder="Kullanıcı ara" /></label>
                <button type="button" className="ad-btn pri" onClick={() => openUserSheet(null)}>{adIco("plus")}Yeni kullanıcı</button>
              </div>
            </div>
            <div className="ad-stats three">
              {adStat("users", "rgba(60,79,224,0.14)", "#2a39b8", "KULLANICI", userList.length)}
              {adStat("star", "rgba(217,119,6,0.12)", "#8a5a00", "SÜPER ADMİN", supers.length)}
              {adStat("lock", "rgba(11,106,162,0.12)", "#0b6aa2", "UYGULAMA YÖNETİCİSİ", scoped.length)}
            </div>
            <div className="ad-filters">
              {[["all", `Tümü ${userList.length}`], ["super", `Süper admin ${supers.length}`], ["scoped", `Uygulama yöneticisi ${scoped.length}`]].map(([k, l]) => (
                <button key={k} type="button" className={adFilter === k ? "on" : ""} onClick={() => setAdFilter(k)}>{l}</button>
              ))}
            </div>
            {shown.length === 0 ? <div className="ad-empty">{userList.length ? "Eşleşen kullanıcı yok." : "Henüz kullanıcı yok."}</div> : (
              <div className="ad-grid">
                {shown.map(u => {
                  const isSup = u.apps === "all" || u.super;
                  const ids = Array.isArray(u.apps) ? u.apps : [];
                  const col = adColor(u.username);
                  return (
                    <div key={u.username} className="ad-card" style={{ "--c": col }}>
                      <div className="ad-ch">
                        <span className="ad-av round" style={{ background: col }}>{u.username.slice(0, 2).toLocaleUpperCase("tr")}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ad-nm">{u.username}</div>
                          <div className="ad-pk plain">{isSup ? "Tüm uygulamalara erişir" : `${ids.length} uygulamaya erişir`}</div>
                        </div>
                        <span className={"ad-role" + (isSup ? " sup" : "")}>{isSup ? "Süper admin" : "Yönetici"}</span>
                      </div>
                      <div className="ad-access">
                        <small>ERİŞİM</small>
                        {isSup ? <span className="ad-tg all">{adIco("grid")}Tüm uygulamalar</span> : (
                          <div className="ad-apps">
                            {ids.slice(0, 6).map(id => {
                              const a = apps[id] || { name: id };
                              return <span key={id} className="ad-mini"><span className="ad-av" style={{ background: a.brandPrimary || "#a78bfa" }}>{String(a.name || id).trim().charAt(0).toLocaleUpperCase("tr")}</span>{a.name || id}</span>;
                            })}
                            {ids.length > 6 && <span className="ad-mini more">+{ids.length - 6}</span>}
                            {!ids.length && <span className="ad-tg warn">{adIco("warn")}Uygulama atanmamış</span>}
                          </div>
                        )}
                      </div>
                      <div className="ad-acts">
                        <button type="button" className="ad-a" onClick={() => openUserSheet(u)}>{adIco("edit")}Düzenle</button>
                        <button type="button" className="ad-a ghost" onClick={() => openUserSheet(u, true)}>{adIco("key")}Şifre değiştir</button>
                        <span className="ad-more-wrap">
                          <button type="button" className="ad-a more" aria-label="Diğer" onClick={() => setAdMenu(adMenu === "u:" + u.username ? null : "u:" + u.username)}>{adIco("more")}</button>
                          {adMenu === "u:" + u.username && (
                            <div className="ad-menu"><button type="button" className="danger" onClick={() => { setAdMenu(null); deleteUser(u.username); }}>{adIco("trash")}Kullanıcıyı sil</button></div>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {adSheet === "user" && (
              <>
                <div className="ad-scrim" onClick={() => setAdSheet(null)} />
                <div className="ad-sheet">
                  <button type="button" className="ad-x" aria-label="Kapat" onClick={() => setAdSheet(null)}>{adIco("x")}</button>
                  <h2>{userEditing ? (userPwOnly ? "Şifre değiştir" : "Kullanıcıyı düzenle") : "Yeni kullanıcı"}</h2>
                  <div className="ad-sub">{userEditing ? `${userEditing} hesabı` : "Giriş adı, şifre ve hangi uygulamaları göreceği."}</div>
                  <div className="ad-sheet-body">
                    <div className="ad-lbl">Kullanıcı adı</div>
                    <input className="ad-inp" value={newUserName} disabled={!!userEditing} placeholder="örn. oguz"
                      onChange={e => setNewUserName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} />
                    <div className="ad-hint">Sadece küçük harf, rakam ve alt çizgi.</div>
                    <div className="ad-lbl">Şifre{userEditing ? " (boş bırakırsan değişmez)" : ""}</div>
                    <div className="ad-pw">
                      <input className="ad-inp" type={adPwVisible ? "text" : "password"} value={newUserPass} placeholder={userEditing ? "Yeni şifre" : "Şifre"}
                        onChange={e => setNewUserPass(e.target.value)} />
                      <button type="button" className="ad-ib" aria-label="Göster" onClick={() => setAdPwVisible(v => !v)}>{adIco("eye")}</button>
                      <button type="button" className="ad-a" onClick={() => { setNewUserPass(genPassword()); setAdPwVisible(true); }}>{adIco("spark")}Üret</button>
                    </div>
                    {!userPwOnly && (
                      <>
                        <div className="ad-lbl">Yetki</div>
                        <div className="ad-seg">
                          <button type="button" className={newUserAll ? "on" : ""} onClick={() => setNewUserAll(true)}>{adIco("star")}Tüm uygulamalar</button>
                          <button type="button" className={!newUserAll ? "on" : ""} onClick={() => setNewUserAll(false)}>{adIco("lock")}Seçili uygulamalar</button>
                        </div>
                        {newUserAll ? (
                          <div className="ad-hint">Süper admin: tüm uygulamaları, kullanıcıları ve ayarları yönetir.</div>
                        ) : (
                          <div className="ad-pick">
                            {appOpts.map(a => {
                              const on = newUserApps.includes(a.id);
                              return (
                                <button key={a.id} type="button" className={"ad-mini sel" + (on ? " on" : "")}
                                  onClick={() => setNewUserApps(on ? newUserApps.filter(x => x !== a.id) : [...newUserApps, a.id])}>
                                  <span className="ad-av" style={{ background: a.brandPrimary || "#a78bfa" }}>{String(a.name || a.id).trim().charAt(0).toLocaleUpperCase("tr")}</span>
                                  {a.name || a.id}{on && adIco("check")}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                    <div className="ad-pv">
                      <small>ÖZET</small>
                      <div className="ad-pvr"><span>Giriş adresi</span><code>{window.location.host}/admin</code></div>
                      <div className="ad-pvr"><span>Kullanıcı</span><code>{newUserName || "—"}</code></div>
                      <div className="ad-pvr"><span>Görecekleri</span><code>{newUserAll ? "Tüm uygulamalar" : `${newUserApps.length} uygulama`}</code></div>
                    </div>
                  </div>
                  <button type="button" className="ad-btn pri wide" disabled={userBusy} onClick={saveUser}>{userBusy ? "Kaydediliyor…" : "Kaydet"}</button>
                </div>
              </>
            )}
          </div>
          );
        })()}

        {/* UYGULAMALAR — kartlar + izole panel giriş bilgileri (sadece süper panel) */}
        {activeSection === "apps" && !PANEL_LOCKED && (() => {
          const q = adQuery.trim().toLocaleLowerCase("tr");
          const polSet = new Set(policyList.map(p => p.packageName));
          const def = apps.default;
          const cards = [
            ...(def ? [{ id: "default", name: def.name || "Musica", packageName: def.packageName || "", main: true }] : []),
            ...appList,
          ].map(a => ({ ...a, brand: (apps[a.id] && apps[a.id].brandPrimary) || "#2a39b8", live: chipCount(a.id), pol: !!a.packageName && polSet.has(a.packageName) }));
          const nopol = cards.filter(c => !c.pol).length;
          const liveN = cards.filter(c => (c.live || 0) > 0).length;
          const shown = cards
            .filter(c => adFilter === "live" ? (c.live || 0) > 0 : adFilter === "idle" ? !(c.live > 0) : adFilter === "nopolicy" ? !c.pol : true)
            .filter(c => !q || (c.name || "").toLocaleLowerCase("tr").includes(q) || (c.packageName || "").toLowerCase().includes(q));
          const sparkOf = (id) => {
            const s = stats24.data && stats24.data.byApp && stats24.data.byApp.find(x => x.id === id);
            const v = s ? s.series.map(p => (p ? p.t : 0)) : [];
            if (v.length < 2) return null;
            const w = 300, h = 46, mx = Math.max(1, ...v);
            const d = v.map((y, i) => `${i ? "L" : "M"}${(i * w / (v.length - 1)).toFixed(1)} ${(h - 4 - (y / mx) * (h - 10)).toFixed(1)}`).join(" ");
            return (
              <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="var(--c)" opacity=".12" stroke="none" />
                <path d={d} stroke="var(--c)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
            );
          };
          const allPtsNow = chipStats.data ? chipStats.data.points.filter(p => !p.missing) : [];
          const lastAll = allPtsNow[allPtsNow.length - 1];
          const slug = newAppId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || deriveAppId(newAppPackage);
          return (
          <div className="ad">
            <div className="ad-top">
              <div><h1>Uygulamalar</h1><div className="ad-sub">Her uygulamanın kendi paneli ve girişi var. Kartı aç, linki ve şifreyi kopyala.</div></div>
              <div className="ad-tools">
                <label className="ad-search">{adIco("search")}<input value={adQuery} onChange={e => setAdQuery(e.target.value)} placeholder="Uygulama veya paket ara" /></label>
                <button type="button" className="ad-btn pri" onClick={() => { setNewAppResult(null); setAdSheet("app"); }}>{adIco("plus")}Yeni uygulama</button>
              </div>
            </div>
            <div className="ad-stats">
              {adStat("grid", "rgba(60,79,224,0.14)", "#2a39b8", "UYGULAMA", cards.length)}
              {adStat("pulse", "rgba(18,128,92,0.12)", "#0d6b4d", "ŞU AN AKTİF", allCount == null ? "—" : allCount)}
              {adStat("bell", "rgba(11,106,162,0.12)", "#0b6aa2", "ZİL SESİ MODUNDA", lastAll ? lastAll.r : "—")}
              {adStat("warn", "rgba(217,119,6,0.12)", "#8a5a00", "POLİTİKASI EKSİK", nopol)}
            </div>
            <div className="ad-filters">
              {[["all", `Tümü ${cards.length}`], ["live", `Aktif olanlar ${liveN}`], ["nopolicy", `Politikası eksik ${nopol}`], ["idle", `Boşta ${cards.length - liveN}`]].map(([k, l]) => (
                <button key={k} type="button" className={adFilter === k ? "on" : ""} onClick={() => setAdFilter(k)}>{l}</button>
              ))}
            </div>
            {shown.length === 0 ? <div className="ad-empty">Eşleşen uygulama yok.</div> : (
              <div className="ad-grid">
                {shown.map(a => {
                  const open = adCred === a.id;
                  const link = a.panelPath ? window.location.origin + a.panelPath : "";
                  const pwKey = "pw:" + a.id;
                  return (
                    <div key={a.id} className="ad-card stripe" style={{ "--c": a.brand }}>
                      <div className="ad-ch">
                        <span className="ad-av" style={{ background: a.brand }}>{String(a.name || a.id).trim().charAt(0).toLocaleUpperCase("tr")}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ad-nm">{a.name}</div>
                          <div className="ad-pk" title={a.packageName}>{a.packageName}</div>
                        </div>
                        <span className={"ad-live" + (a.live > 0 ? "" : " z")}><i />{a.live == null ? "—" : a.live} aktif</span>
                      </div>
                      <div className="ad-spark">{sparkOf(a.id)}</div>
                      {open && !a.main ? (
                        <div className="ad-cred">
                          {[["Link", link, link], ["Kullanıcı", a.user, a.user], ["Şifre", adShow[pwKey] ? a.pass : "••••••••••••••", a.pass]].map(([k, v, raw]) => (
                            <div key={k} className="ad-cr">
                              <span>{k}</span><code title={k === "Şifre" ? "" : v}>{v}</code>
                              {k === "Şifre" && <button type="button" className="ad-ib" aria-label="Göster" onClick={() => setAdShow(s => ({ ...s, [pwKey]: !s[pwKey] }))}>{adIco("eye")}</button>}
                              <button type="button" className="ad-ib" aria-label="Kopyala" onClick={() => adCopy(raw, a.id + k)}>{adIco(adCopied === a.id + k ? "check" : "copy")}</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ad-meta">
                          {a.main ? <span className="ad-tg">{adIco("star")}Ana uygulama</span>
                            : <span className={"ad-tg " + (a.pol ? "ok" : "warn")}>{adIco(a.pol ? "check" : "warn")}{a.pol ? "Gizlilik politikası" : "Politika eksik"}</span>}
                          <span className="ad-tg">Son 24 saat</span>
                        </div>
                      )}
                      <div className="ad-acts">
                        {a.main ? (
                          <button type="button" className="ad-a" onClick={() => pickApp("default")}>{adIco("ext")}Ayarlarına git</button>
                        ) : (
                          <>
                            <a className="ad-a" href={link} target="_blank" rel="noreferrer">{adIco("ext")}Paneli aç</a>
                            <button type="button" className={"ad-a ghost" + (open ? " on" : "")} onClick={() => setAdCred(open ? null : a.id)}>{adIco("key")}Giriş bilgileri</button>
                            <span className="ad-more-wrap">
                              <button type="button" className="ad-a more" aria-label="Diğer" onClick={() => setAdMenu(adMenu === "a:" + a.id ? null : "a:" + a.id)}>{adIco("more")}</button>
                              {adMenu === "a:" + a.id && (
                                <div className="ad-menu">
                                  <button type="button" onClick={() => { setAdMenu(null); pickApp(a.id); }}>{adIco("edit")}Ayarlarına git</button>
                                  <button type="button" className="danger" onClick={() => { setAdMenu(null); deleteApp(a); }}>{adIco("trash")}Uygulamayı sil</button>
                                </div>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {adSheet === "app" && (
              <>
                <div className="ad-scrim" onClick={() => setAdSheet(null)} />
                <div className="ad-sheet">
                  <button type="button" className="ad-x" aria-label="Kapat" onClick={() => setAdSheet(null)}>{adIco("x")}</button>
                  {newAppResult ? (
                    <>
                      <h2>Panel hazır</h2>
                      <div className="ad-sub">Bu bilgileri kaydet. Şifre ana anahtardan üretilir; kartta hep görebilirsin.</div>
                      <div className="ad-sheet-body">
                        <div className="ad-cred big">
                          {[["Link", window.location.origin + newAppResult.panelPath], ["Kullanıcı", newAppResult.user], ["Şifre", newAppResult.pass]].map(([k, v]) => (
                            <div key={k} className="ad-cr"><span>{k}</span><code>{v}</code>
                              <button type="button" className="ad-ib" aria-label="Kopyala" onClick={() => adCopy(v, "new" + k)}>{adIco(adCopied === "new" + k ? "check" : "copy")}</button></div>
                          ))}
                        </div>
                        <div className="ad-note">{adIco("check")}Sırada: Android'de <code>app_config.json</code> paket adını <b>{newAppResult.id}</b> paneliyle eşleşen pakete ayarlayıp build al.</div>
                      </div>
                      <button type="button" className="ad-btn pri wide" onClick={() => { setNewAppResult(null); setAdSheet(null); }}>Tamam</button>
                    </>
                  ) : (
                    <>
                      <h2>Yeni uygulama</h2>
                      <div className="ad-sub">Paket adını gir, panel ve şifre otomatik hazırlanır.</div>
                      <div className="ad-sheet-body">
                        <div className="ad-lbl">Uygulama adı</div>
                        <input className="ad-inp" placeholder="örn. OGZ Music" value={newAppName} onChange={e => setNewAppName(e.target.value)} />
                        <div className="ad-lbl">Paket adı (applicationId)</div>
                        <input className="ad-inp" placeholder="örn. com.ogz.music" value={newAppPackage} onChange={e => setNewAppPackage(e.target.value)} />
                        <div className="ad-hint">Android'deki app_config.json ile birebir aynı olmalı.</div>
                        <div className="ad-lbl">Panel kısa adı</div>
                        <div className="ad-pw">
                          <input className="ad-inp" placeholder={newAppPackage.trim() ? deriveAppId(newAppPackage) : "boş bırak → otomatik"} value={newAppId} onChange={e => setNewAppId(e.target.value)} />
                          {!newAppId.trim() && <span className="ad-auto">otomatik</span>}
                        </div>
                        <div className="ad-lbl">Marka rengi</div>
                        <div className="ad-sw">
                          {["#2E6BF6", "#1DB954", "#5b3fc4", "#be185d", "#8a5a00", "#b42318", "#0f766e"].map(c => (
                            <button key={c} type="button" aria-label={c} className={newAppColor.toLowerCase() === c.toLowerCase() ? "on" : ""} style={{ background: c }} onClick={() => setNewAppColor(c)} />
                          ))}
                          <label className="ad-sw-custom" title="Özel renk"><input type="color" value={newAppColor} onChange={e => setNewAppColor(e.target.value)} />{adIco("plus")}</label>
                        </div>
                        <div className="ad-pv">
                          <small>ÖNİZLEME</small>
                          <span className="pn-chip" style={{ "--c": newAppColor, display: "inline-flex" }}>
                            <span className="pn-av" style={{ background: newAppColor }}>{(newAppName.trim() || "?").charAt(0).toLocaleUpperCase("tr")}</span>
                            <b>{newAppName.trim() || "Uygulama adı"}</b><em>0</em>
                          </span>
                          <div className="ad-pvr"><span>Panel adresi</span><code>/admin/{slug || "…"}/panel</code></div>
                          <div className="ad-pvr"><span>Giriş kullanıcısı</span><code>{slug || "…"}</code></div>
                        </div>
                        <div className="ad-note">{adIco("check")}Şifre ana anahtardan üretilir, kaybolmaz; kartta istediğin zaman görebilirsin.</div>
                      </div>
                      <button type="button" className="ad-btn pri wide" disabled={appBusy} onClick={createApp}>{appBusy ? "Oluşturuluyor…" : "Uygulamayı oluştur"}</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          );
        })()}

        {/* GİZLİLİK POLİTİKALARI — paket + e-posta gir, link al (sadece süper panel) */}
        {activeSection === "privacy" && !PANEL_LOCKED && <>
          {adSheet === "policy" && (
            <>
              <div className="ad-scrim" onClick={() => setAdSheet(null)} />
              <div className="ad-sheet">
                <button type="button" className="ad-x" aria-label="Kapat" onClick={() => setAdSheet(null)}>{adIco("x")}</button>
                {policyResult ? (
                  <>
                    <h2>Politika hazır</h2>
                    <div className="ad-sub">{policyResult.appName} için sayfa yayında. Linki Play Console'a yapıştır.</div>
                    <div className="ad-sheet-body">
                      <div className="ad-cred big">
                        <div className="ad-cr"><span>Link</span><code title={policyResult.url}>{policyResult.url}</code>
                          <a className="ad-ib" href={policyResult.url} target="_blank" rel="noreferrer" aria-label="Aç">{adIco("ext")}</a>
                          <button type="button" className="ad-ib" aria-label="Kopyala" onClick={() => adCopy(policyResult.url, "pol")}>{adIco(adCopied === "pol" ? "check" : "copy")}</button>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="ad-btn pri wide" onClick={() => { setPolicyResult(null); setAdSheet(null); }}>Tamam</button>
                  </>
                ) : (
                  <>
                    <h2>{policyEditing ? "Politikayı düzenle" : "Politika oluştur"}</h2>
                    <div className="ad-sub">{policyEditing ? "Kaydedince sayfa güncellenir, link aynı kalır." : "Bilgileri gir, hazır politika sayfasının linkini al."}</div>
                    <div className="ad-sheet-body">
                      <div className="ad-group">Uygulama</div>
                      <div className="ad-lbl">Uygulama adı</div>
                      <input className="ad-inp" placeholder="örn. VupVup Music Player - MP3 Player" value={policyName} onChange={e => setPolicyName(e.target.value)} />
                      <div className="ad-lbl">Paket adı</div>
                      <input className="ad-inp mono" placeholder="örn. app.vupvup.descargamusica" value={policyPackage} disabled={!!policyEditing} onChange={e => setPolicyPackage(e.target.value.trim())} />
                      {policyEditing && <div className="ad-hint">Paket adı linkin parçası olduğu için değiştirilemez.</div>}

                      <div className="ad-group">İletişim ve geliştirici</div>
                      <div className="ad-lbl">İletişim e-postası</div>
                      <input className="ad-inp" type="email" placeholder="örn. destek@gmail.com" value={policyEmail} onChange={e => setPolicyEmail(e.target.value)} />
                      <div className="ad-lbl">Geliştirici adı</div>
                      <input className="ad-inp" placeholder="örn. VupVup Apps" value={policyDev} onChange={e => setPolicyDev(e.target.value)} />
                      <div className="ad-hint">Play Console'daki geliştirici adıyla birebir aynı olmalı.</div>
                      <div className="ad-lbl">Geliştirici adresi <span className="ad-opt">isteğe bağlı</span></div>
                      <input className="ad-inp" placeholder="örn. Örnek Mah. 1. Sok. No:1, İstanbul, Türkiye" value={policyAddr} onChange={e => setPolicyAddr(e.target.value)} />
                      <div className="ad-hint">Kurumsal hesapta önerilir.</div>

                      <div className="ad-pv">
                        <small>SAYFA ADRESİ</small>
                        <code className="ad-url">{window.location.host}/privacy/{policyPackage.trim() || "paket.adi"}</code>
                      </div>
                    </div>
                    <button type="button" className="ad-btn pri wide" disabled={policyBusy} onClick={savePolicy}>{policyBusy ? "Kaydediliyor…" : policyEditing ? "Kaydet" : "Kaydet ve link oluştur"}</button>
                  </>
                )}
              </div>
            </>
          )}
        <div style={styles.card} className="ad">
          <div className="ad-top" style={{ marginBottom: 22 }}>
            <div><h1>Gizlilik Politikaları</h1><div className="ad-sub">Her uygulama için hazır politika sayfası. Linki kopyala, Play Console'a yapıştır.</div></div>
            <button type="button" className="ad-btn pri" onClick={() => openPolicySheet(null)}>{adIco("plus")}Politika oluştur</button>
          </div>


          <h3 style={{ color: "#16181d", fontSize: 15, margin: "0 0 12px 0" }}>Mevcut Politikalar</h3>
          {policyList.length === 0 ? (
            <p style={{ color: "#5f6672", fontSize: 13 }}>Henüz politika yok.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {policyList.map(p => (
                <div key={p.packageName} style={{ background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                    <div style={{ color: "#16181d", fontWeight: 700 }}>{p.appName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ color: "#5f6672", fontSize: 12 }}>{p.email}</div>
                      <button onClick={() => openPolicySheet(p)} title="Düzenle"
                        style={{ background: "transparent", border: "1px solid #d9d5cc", color: "#2a39b8", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✏️</button>
                      <button onClick={() => deletePolicy(p)} title="Politikayı sil"
                        style={{ background: "transparent", border: "1px solid #3a2230", color: "#b42318", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>🗑️</button>
                    </div>
                  </div>
                  <CredRow label="Paket" value={p.packageName} />
                  {p.developerName ? <CredRow label="Geliştirici" value={p.developerName} /> : <div style={{ color: "#8a5a00", fontSize: 12, margin: "4px 0" }}>Geliştirici adı yok — Play reddedebilir</div>}
                  <CredRow label="Link" value={p.url} />
                </div>
              ))}
            </div>
          )}
        </div></>}

        {/* GLOBAL & COUNTRY CONFIG (Styled for Dark Theme) */}
        {activeSection === "settings" && <div className="v2-stack">
          <V2Sec title="Genel mod" desc="Kuralı olmayan tüm ülkeler bu modda açılır.">
            <V2Row title="Genel modu uygula" sub="Kapalıysa genel mod devreye girmez">
              <input type="checkbox" aria-label="Genel modu uygula" checked={config.global.enabled}
                onChange={e => setConfig({ ...config, global: { ...config.global, enabled: e.target.checked } })} />
            </V2Row>
            <V2Row title="Açılacak arayüz">
              <V2Seg value={config.global.mode} onChange={v => setConfig({ ...config, global: { ...config.global, mode: v } })}
                options={[["youtube", "YouTube"], ["ringtone", "Ringtone"]]} />
            </V2Row>
            <V2Foot><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></V2Foot>
          </V2Sec>
          <V2Sec title="Otomatik zil sesi" desc="Değişiklik anında kaydedilir.">
            <V2Row title="İndirilen MP3'ü zil sesi yap" sub="Telefon dili ile cihaz ülkesi farklıysa">
              {autoRingtone ? (
                <input type="checkbox" aria-label="Otomatik zil sesi" checked={!!autoRingtone.enabled} onChange={() => {
                  fetch(`${API_URL}/admin/auto-ringtone`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                    body: JSON.stringify({ enabled: !autoRingtone.enabled })
                  }).then(r => r.json()).then(d => {
                    if (d.success) fetchAutoRingtone();
                  }).catch(() => alert("Hata!"));
                }} />
              ) : <span className="v2-muted">Yükleniyor...</span>}
            </V2Row>
          </V2Sec>
        </div>}

        {/* MP3 İNDİRME PROVIDER KONTROL */}
        {activeSection === "mp3" && <div className="v2-stack">
          <V2Sec title="MP3 kaynakları" desc="İkisi açıksa Bazocam önce denenir, olmazsa Backend devreye girer.">
            <V2Row title="Bazocam" sub="MP3 formatı · birincil">
              <input type="checkbox" aria-label="Bazocam" checked={config.mp3Provider?.bazocam !== false}
                onChange={e => setConfig({ ...config, mp3Provider: { ...(config.mp3Provider || {}), bazocam: e.target.checked } })} />
            </V2Row>
            <V2Row title="Backend" sub="M4A formatı · yedek">
              <input type="checkbox" aria-label="Backend" checked={config.mp3Provider?.backend !== false}
                onChange={e => setConfig({ ...config, mp3Provider: { ...(config.mp3Provider || {}), backend: e.target.checked } })} />
            </V2Row>
            <div className={"v2-row v2-info" + ((config.mp3Provider?.bazocam === false) && (config.mp3Provider?.backend === false) ? " bad" : "")}>
              {(config.mp3Provider?.bazocam !== false) && (config.mp3Provider?.backend !== false) && "Bazocam öncelikli — başarısız olursa Backend devreye girer"}
              {(config.mp3Provider?.bazocam !== false) && (config.mp3Provider?.backend === false) && "Sadece Bazocam — başarısız olursa indirme çalışmaz"}
              {(config.mp3Provider?.bazocam === false) && (config.mp3Provider?.backend !== false) && "Sadece Backend — M4A formatında indirilir"}
              {(config.mp3Provider?.bazocam === false) && (config.mp3Provider?.backend === false) && "MP3 indirme tamamen kapalı!"}
            </div>
            <V2Foot><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></V2Foot>
          </V2Sec>
        </div>}

        {/* İÇERİK FİLTRESİ — canlı yayın engeli + süre limiti */}
        {activeSection === "contentfilter" && <div className="v2-stack">
          <V2Sec title="İçerik filtresi" desc="Canlı yayınları ve çok uzun videoları aramadan eler. Android 13+ cihazlar aramayı telefonda NewPipe ile yaptığı için etkilenmez.">
            <V2Row title="Filtre">
              <input type="checkbox" aria-label="Filtre" checked={config.contentFilter?.enabled !== false}
                onChange={e => setConfig({ ...config, contentFilter: { ...(config.contentFilter || {}), enabled: e.target.checked } })} />
            </V2Row>
            <V2Row title="Canlı yayınları engelle">
              <input type="checkbox" aria-label="Canlı yayınları engelle" checked={config.contentFilter?.blockLive !== false}
                onChange={e => setConfig({ ...config, contentFilter: { ...(config.contentFilter || {}), blockLive: e.target.checked } })} />
            </V2Row>
            <V2Row title="En uzun süre" sub={`${config.contentFilter?.maxDurationMinutes ?? 35} dk ve üzeri videolar aramada çıkmaz`}>
              <input type="number" min={1} max={600} step={1} aria-label="Dakika"
                value={config.contentFilter?.maxDurationMinutes ?? 35}
                onChange={e => setConfig({ ...config, contentFilter: { ...(config.contentFilter || {}), maxDurationMinutes: parseInt(e.target.value, 10) || 0 } })}
                style={{ ...styles.input, width: 80, textAlign: "center" }} />
              <span className="v2-muted">dakika</span>
            </V2Row>
            <V2Foot><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></V2Foot>
          </V2Sec>
        </div>}

        {activeSection === "countries" && <div style={styles.card}>
          <h2 style={styles.title}>Ülke Bazlı Ayarlar</h2>

          {/* MOD SEÇİMİ */}
          <div style={{ display: "flex", gap: 10, marginBottom: 15, alignItems: "center" }}>
            <span style={{ color: "#4b5260", fontSize: 13 }}>Eklenecek mod:</span>
            <select style={{...styles.select, flex: "unset", width: 150}} value={newCountryMode} onChange={e => setNewCountryMode(e.target.value)}>
              <option value="youtube">YouTube</option>
              <option value="ringtone">Ringtone</option>
            </select>
          </div>

          {/* ÜLKE SEÇİCİ DROPDOWN */}
          <div style={{ position: "relative", marginBottom: 15 }}>
            <div
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              style={{
                background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 8,
                padding: "12px 16px", cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center", color: "#16181d"
              }}>
              <span style={{ color: "#4b5260" }}>
                {Object.keys(config.countries).length > 0
                  ? `${Object.keys(config.countries).length} ülke seçili`
                  : "Ülke seç..."}
              </span>
              <span style={{ fontSize: 12, color: "#4b5260" }}>{isCountryDropdownOpen ? "▲" : "▼"}</span>
            </div>

            {isCountryDropdownOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
                background: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 8,
                maxHeight: 300, overflowY: "auto", marginTop: 4
              }}>
                {/* ARAMA */}
                <div style={{ padding: 8, borderBottom: "1px solid #d9d5cc", position: "sticky", top: 0, background: "#f4f2ed" }}>
                  <input
                    style={{...styles.input, margin: 0, background: "#eeebe5", fontSize: 13}}
                    placeholder="Ülke ara..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {filteredCountries.map(c => {
                  const isSelected = !!config.countries[c.code];
                  const currentMode = config.countries[c.code];
                  return (
                    <div
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      style={{
                        padding: "10px 14px", cursor: "pointer", display: "flex",
                        alignItems: "center", gap: 10, borderBottom: "1px solid #d9d5cc",
                        background: isSelected ? "#e8ebfd" : "transparent"
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: isSelected ? "none" : "2px solid #cdc8be",
                        background: isSelected ? "#3b82f6" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#16181d"
                      }}>
                        {isSelected && "✓"}
                      </div>
                      <span style={{ color: "#16181d", fontSize: 14 }}>{c.code} - {c.name}</span>
                      {isSelected && (
                        <span style={{
                          marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 4,
                          background: currentMode === "ringtone" ? "#fdecea" : "#dcf2e8",
                          color: currentMode === "ringtone" ? "#b42318" : "#6ee7b7"
                        }}>
                          {currentMode === "ringtone" ? "🎵 Ringtone" : "🎬 YouTube"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇİLİ ÜLKELER LİSTESİ */}
          <div style={styles.list}>
            {Object.entries(config.countries).map(([code, mode]) => {
              const country = COUNTRY_LIST.find(c => c.code === code);
              return (
                <div key={code} style={{...styles.listItem, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                  <span style={{ color: "#16181d" }}>
                    <strong>{code}</strong> - {country?.name || code}
                    {" → "}
                    <strong style={{color: mode === "ringtone" ? "#b42318" : "#10b981"}}>
                      {mode === "ringtone" ? "🎵 Ringtone" : "🎬 YouTube"}
                    </strong>
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      style={{...styles.select, flex: "unset", width: 120, fontSize: 12, padding: "4px 8px"}}
                      value={mode}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        countries: { ...prev.countries, [code]: e.target.value }
                      }))}>
                      <option value="youtube">YouTube</option>
                      <option value="ringtone">Ringtone</option>
                    </select>
                    <button style={{...styles.textBtn, color: "#b42318"}} onClick={() => removeCountry(code)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button style={styles.primaryBtn} onClick={updateConfig}>Ülke Ayarlarını Kaydet</button>
        </div>}

        {/* ONESIGNAL BİLDİRİM GÖNDERME */}
        {activeSection === "notifications" && <div style={styles.card}>
          <h2 style={styles.title}>Push Bildirim Gönder (OneSignal)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", gap: 15 }}>
              <input style={{...styles.input, flex: 1}} placeholder="OneSignal App ID" value={notifAppId} onChange={e => setNotifAppId(e.target.value)} />
              <input style={{...styles.input, flex: 1}} placeholder="OneSignal REST API Key" value={notifRestKey} onChange={e => setNotifRestKey(e.target.value)} />
            </div>
            <input style={styles.input} placeholder="Bildirim Başlığı" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
            <textarea style={{...styles.input, minHeight: 80, fontFamily: "sans-serif"}} placeholder="Bildirim Mesajı" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
            <input style={styles.input} placeholder="Görsel URL (isteğe bağlı)" value={notifImageUrl} onChange={e => setNotifImageUrl(e.target.value)} />
            <input style={styles.input} placeholder="Açılacak URL (isteğe bağlı)" value={notifActionUrl} onChange={e => setNotifActionUrl(e.target.value)} />

            {/* HEDEF ÜLKE */}
            <div style={{ background: "#f4f2ed", borderRadius: 10, padding: 15 }}>
              <p style={{ color: "#4b5260", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Hedef Ülke</p>
              <select style={{...styles.input, cursor: "pointer"}} value={notifTargetCountry} onChange={e => setNotifTargetCountry(e.target.value)}>
                <option value="all">Tüm Ülkeler</option>
                <option value="TR">🇹🇷 Türkiye</option>
                <option value="US">🇺🇸 ABD</option>
                <option value="GB">🇬🇧 İngiltere</option>
                <option value="DE">🇩🇪 Almanya</option>
                <option value="FR">🇫🇷 Fransa</option>
                <option value="IT">🇮🇹 İtalya</option>
                <option value="ES">🇪🇸 İspanya</option>
                <option value="NL">🇳🇱 Hollanda</option>
                <option value="BR">🇧🇷 Brezilya</option>
                <option value="RU">🇷🇺 Rusya</option>
                <option value="JP">🇯🇵 Japonya</option>
                <option value="KR">🇰🇷 Güney Kore</option>
                <option value="IN">🇮🇳 Hindistan</option>
                <option value="SA">🇸🇦 Suudi Arabistan</option>
                <option value="AE">🇦🇪 BAE</option>
                <option value="AU">🇦🇺 Avustralya</option>
                <option value="CA">🇨🇦 Kanada</option>
                <option value="MX">🇲🇽 Meksika</option>
                <option value="AR">🇦🇷 Arjantin</option>
                <option value="PL">🇵🇱 Polonya</option>
                <option value="SE">🇸🇪 İsveç</option>
                <option value="AZ">🇦🇿 Azerbaycan</option>
              </select>
            </div>

            {/* HEDEF MOD */}
            <div style={{ background: "#f4f2ed", borderRadius: 10, padding: 15 }}>
              <p style={{ color: "#4b5260", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Hedef Uygulama Modu</p>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "all", label: "🌍 Tüm Kullanıcılar" },
                  { value: "youtube", label: "🎬 YouTube Modu" },
                  { value: "ringtone", label: "🎵 Zil Sesi Modu" }
                ].map(opt => (
                  <button key={opt.value} onClick={() => setNotifTargetMode(opt.value)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 8,
                      border: notifTargetMode === opt.value ? "2px solid #3c4fe0" : "1px solid #d9d5cc",
                      background: notifTargetMode === opt.value ? "#efe9fd" : "#eeebe5",
                      color: notifTargetMode === opt.value ? "#2a39b8" : "#4b5260",
                      cursor: "pointer", fontSize: 13, fontWeight: notifTargetMode === opt.value ? 600 : 400
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ color: "#5f6672", fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                OneSignal "app_mode" etiketine göre filtre uygulanır. Çalışması için Android uygulamasının OneSignal tag göndermesi gerekir.
              </p>
            </div>

            {/* ZAMANLAMA */}
            <div style={{ background: "#f4f2ed", borderRadius: 10, padding: 15 }}>
              <p style={{ color: "#4b5260", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Zamanlama</p>
              <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#16181d", cursor: "pointer" }}>
                  <input type="radio" name="scheduleType" checked={notifScheduleType === "now"} onChange={() => setNotifScheduleType("now")} />
                  Hemen Gönder
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#16181d", cursor: "pointer" }}>
                  <input type="radio" name="scheduleType" checked={notifScheduleType === "scheduled"} onChange={() => setNotifScheduleType("scheduled")} />
                  Belirli Zamanda
                </label>
              </div>
              {notifScheduleType === "scheduled" && (
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <input type="date" style={{...styles.input, flex: 1}} value={notifScheduleDate} onChange={e => setNotifScheduleDate(e.target.value)} />
                  <input type="time" style={{...styles.input, flex: 1}} value={notifScheduleTime} onChange={e => setNotifScheduleTime(e.target.value)} />
                </div>
              )}
            </div>

            {/* ÖN İZLEME */}
            {(notifTitle || notifMessage) && (
              <div style={{ background: "#f4f2ed", borderRadius: 10, padding: 15 }}>
                <p style={{ color: "#4b5260", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Ön İzleme</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#e8e5de", borderRadius: 8, padding: 12 }}>
                  <span style={{ fontSize: 28 }}>🔔</span>
                  <div>
                    <p style={{ color: "#16181d", fontWeight: 700, margin: 0, fontSize: 15 }}>{notifTitle || "Bildirim Başlığı"}</p>
                    <p style={{ color: "#4b5260", margin: "4px 0 0 0", fontSize: 13 }}>{notifMessage || "Bildirim mesajı burada görünecek."}</p>
                  </div>
                </div>
                {notifImageUrl && <img src={notifImageUrl} alt="preview" style={{ marginTop: 10, maxWidth: "100%", borderRadius: 8, maxHeight: 150, objectFit: "cover" }} />}
              </div>
            )}

            <button style={{...styles.primaryBtn, fontSize: 16, padding: "14px 0"}} onClick={sendNotification}>
              {notifScheduleType === "scheduled" ? `Zamanla (${notifScheduleDate} ${notifScheduleTime})` : "Hemen Gönder"}
            </button>
          </div>
        </div>}

        {/* BLOCKED CHANNELS UI (Based on Screenshot) */}
        {activeSection === "blocked" && <div style={styles.card}>
          <div style={styles.headerRow}>
            <h2 style={styles.title}>Yasaklı Kanallar</h2>
            <button style={styles.primaryBtn} onClick={() => openModal(null)}>Kanal Ekle +</button>
          </div>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Engellenen Değerler</th>
                <th style={styles.th}>Yasaklı Ülkeler</th>
                <th style={styles.thRight}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {blockedChannels.map(group => (
                <tr key={group.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ marginBottom: 5 }}>
                      <span style={{
                        fontSize: 11,
                        backgroundColor: group.type === "keyword" ? "#ec4899" : group.type === "channelId" ? "#d97706" : group.type === "videoId" ? "#d92d20" : "#0ea5e9",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: "bold"
                      }}>
                        {group.type === "keyword" ? "Kelime" : group.type === "channelId" ? "Kanal ID" : group.type === "videoId" ? "Video ID" : "Kanal"}
                      </span>
                    </div>
                    <div style={styles.chipContainer}>
                      {group.channels?.slice(0, 5).map((ch, i) => (
                        <span key={i} style={styles.chip}>{ch}</span>
                      ))}
                      {group.channels?.length > 5 && (
                        <span style={styles.chip}>+{group.channels.length - 5} daha</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {group.countries === "all" ? "Tümü" : (Array.isArray(group.countries) ? group.countries.join(", ") : group.countries)}
                  </td>
                  <td style={styles.tdRight}>
                    <button style={styles.actionBtn} onClick={() => openModal(group)}>Düzenle</button>
                    <span style={{color: "#6b7078", margin: "0 8px"}}>|</span>
                    <button style={styles.actionBtn} onClick={() => deleteBlockedGroup(group.id)}>Kaldır</button>
                  </td>
                </tr>
              ))}
              {blockedChannels.length === 0 && (
                <tr><td colSpan="3" style={{...styles.td, textAlign: "center", color: "#4b5260", padding: "40px"}}>Henüz yasaklı kanal yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>}

        {/* GLOBAL POPUP / DUYURU SİSTEMİ */}
        {activeSection === "popup" && <div style={styles.card}>
          <div style={styles.headerRow}>
            <div>
              <h2 style={styles.title}>Global Popup / Duyuru Sistemi</h2>
              <p style={{ color: "#4b5260", fontSize: 13, margin: "-15px 0 0 0" }}>
                Uygulaması açık olan kullanıcılara anlık popup göster, oy topla.
              </p>
            </div>
            <button style={{ ...styles.primaryBtn, background: "#3c4fe0" }} onClick={() => setIsPopupModalOpen(true)}>
              Duyuru Oluştur +
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4b5260", padding: "40px 0" }}>Henüz duyuru yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
              {announcements.map(ann => {
                const now = new Date();
                const start = ann.startTime ? new Date(ann.startTime) : null;
                const end = ann.endTime ? new Date(ann.endTime) : null;
                const isActive = (!start || now >= start) && (!end || now <= end);
                const totalVotes = Object.values(ann.votes || {}).reduce((a, b) => a + b, 0);

                return (
                  <div key={ann.id} style={{
                    background: "#f4f2ed", border: `1px solid ${isActive ? "#3c4fe0" : "#cdc8be"}`,
                    borderRadius: 10, padding: 20
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                            background: isActive ? "#efe9fd" : "#e8e5de", color: isActive ? "#2a39b8" : "#5f6672"
                          }}>
                            {isActive ? "● AKTİF" : "● PASİF"}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                            background: ann.type === "review" ? "#e2f1fb" : "#fdf0d5",
                            color: ann.type === "review" ? "#0b6aa2" : "#8a5a00",
                            border: `1px solid ${ann.type === "review" ? "#b9dcf1" : "#f0d9a6"}`
                          }}>
                            {ann.type === "review" ? "🙋 Değerlendirme Daveti" : "⭐ Yıldız Oylaması"}
                          </span>
                          {ann.type !== "review" && !isStarButtonsValid(ann.buttons) && (
                            <span
                              title={
                                "Buton değerleri 1_star…5_star formatında değil. Uygulama kaç yıldız verildiğini anlayamıyor: " +
                                "oy kaydediliyor ama 1-3 için geri bildirim kutusu, 4-5 için Google kartı açılmıyor. " +
                                "Bu popup'ı silip butonları yeniden ekleyin."
                              }
                              style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                background: "#fdecea", color: "#b42318", border: "1px solid #f3c2bd", cursor: "help"
                              }}
                            >
                              BOZUK — yıldız algılanmıyor
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: "#5f6672" }}>
                            {ann.countries === "all" ? "Tüm ülkeler" : (Array.isArray(ann.countries) ? ann.countries.join(", ") : ann.countries)}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#16181d", fontSize: 16 }}>{ann.title}</p>
                        <p style={{ margin: 0, color: "#4b5260", fontSize: 13 }}>{ann.message}</p>
                      </div>
                      <button style={{ ...styles.textBtn, color: "#b42318", marginLeft: 20 }} onClick={() => deleteAnnouncement(ann.id)}>Sil</button>
                    </div>

                    {/* Butonlar & Oy Sonuçları */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                      {(ann.buttons || []).map((btn, i) => {
                        const count = (ann.votes || {})[btn.value] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        return (
                          <div key={i} style={{ background: "#eeebe5", border: "1px solid #d9d5cc", borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
                            <div style={{ color: "#2a39b8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{btn.label}</div>
                            <div style={{ background: "#f4f2ed", borderRadius: 4, height: 6, marginBottom: 4 }}>
                              <div style={{ background: "#3c4fe0", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                            <div style={{ color: "#4b5260", fontSize: 11 }}>{count} oy · %{pct}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 20, fontSize: 12, color: "#5f6672" }}>
                      <span>Toplam oy: <strong style={{ color: "#2a39b8" }}>{totalVotes}</strong></span>
                      {ann.minLaunches > 0 && <span>Min. kullanım: <strong style={{ color: "#8a5a00" }}>{ann.minLaunches}</strong></span>}
                      {ann.startTime && <span>Başlangıç: {new Date(ann.startTime).toLocaleString("tr-TR")}</span>}
                      {ann.endTime && <span>Bitiş: {new Date(ann.endTime).toLocaleString("tr-TR")}</span>}
                      <span>Oluşturulma: {new Date(ann.createdAt).toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Geri Bildirimler */}
          <div style={{ marginTop: 30, borderTop: "1px solid #cdc8be", paddingTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#16181d" }}>Kullanıcı Geri Bildirimleri</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#4b5260", fontSize: 13 }}>Toplam: <b style={{ color: "#16181d" }}>{feedbacks.length}</b></span>
                <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={fetchFeedbacks}>🔄</button>
              </div>
            </div>
            <p style={{ color: "#4b5260", fontSize: 12, margin: "-8px 0 16px 0" }}>1-3 yıldız veren kullanıcılardan toplanan geri bildirimler</p>
            {feedbacks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Henüz geri bildirim yok</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{ background: "#eeebe5", border: "1px solid #cdc8be", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{"⭐".repeat(fb.rating)}</span>
                        <span style={{ color: fb.rating <= 2 ? "#b42318" : "#8a5a00", fontWeight: 600, fontSize: 13 }}>{fb.rating}/5</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {fb.country && <span style={{ color: "#5f6672", fontSize: 11 }}>{fb.country}</span>}
                        <span style={{ color: "#6b7078", fontSize: 11 }}>{new Date(fb.createdAt).toLocaleString("tr-TR")}</span>
                        <button onClick={() => { if (window.confirm("Silmek istediğine emin misin?")) deleteFeedback(fb.id); }}
                          style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                      </div>
                    </div>
                    {fb.text && <p style={{ margin: 0, color: "#2b2f37", fontSize: 13, lineHeight: 1.5, padding: "6px 0 0 0" }}>{fb.text}</p>}
                    {fb.deviceId && <div style={{ color: "#6b7078", fontSize: 11, marginTop: 4 }}>Device: {fb.deviceId}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>}

        {/* CANLI KULLANICILAR */}
        {activeSection === "reviewlogs" && <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ ...styles.title, margin: 0 }}>Değerlendirme Logları</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={fetchReviewLogs}>Yenile</button>
              <button style={{ ...styles.primaryBtn, backgroundColor: "#fdecea", color: "#16181d", fontSize: 12, padding: "6px 14px" }} onClick={clearReviewLogs}>Temizle</button>
            </div>
          </div>
          <p style={{ color: "#8a5a00", fontSize: 12, margin: "0 0 20px 0", lineHeight: 1.6 }}>
            Google, kullanıcının <b>kaç yıldız verdiğini bildirmez</b>. Buradaki loglar Google'ın isteği
            kabul edip etmediğini ve kartın ekranda kalıp kalmadığını gösterir. Gerçek puan ortalaman
            yalnızca Play Console'da görünür.
          </p>

          {!reviewLogs ? (
            <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Yükleniyor...</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                  { label: "POPUP GÖSTERİLDİ", val: reviewLogs.counts?.popup_shown || 0, color: "#4b5260", bg: "#f4f2ed", br: "#d9d5cc" },
                  { label: "BUTONA BASILDI", val: reviewLogs.counts?.button_tap || 0, color: "#2a39b8", bg: "#efe9fd", br: "#d9cdfa" },
                  { label: "✅ GOOGLE KABUL ETTİ", val: reviewLogs.counts?.request_ok || 0, color: "#0d6b4d", bg: "#e4f4ec", br: "#bfe3cf" },
                  { label: "❌ GOOGLE REDDETTİ", val: reviewLogs.counts?.request_fail || 0, color: "#b42318", bg: "#fdecea", br: "#f3c2bd" },
                ].map(c => (
                  <div key={c.label} style={{ flex: "1 1 170px", padding: "16px 18px", borderRadius: 12, backgroundColor: c.bg, border: `1px solid ${c.br}` }}>
                    <div style={{ color: "#4b5260", fontSize: 11 }}>{c.label}</div>
                    <div style={{ color: c.color, fontSize: 32, fontWeight: 800, marginTop: 6 }}>{c.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 240px", padding: "16px 18px", borderRadius: 12, backgroundColor: "#e2f1fb", border: "1px solid #b9dcf1" }}>
                  <div style={{ color: "#4b5260", fontSize: 11 }}>KART EKRANDA GÖRÜLDÜ (tahmin)</div>
                  <div style={{ color: "#0b6aa2", fontSize: 32, fontWeight: 800, marginTop: 6 }}>{reviewLogs.cardShown || 0}</div>
                  <div style={{ color: "#5f6672", fontSize: 10, marginTop: 4 }}>akış 500 ms'den uzun sürdü</div>
                </div>
                <div style={{ flex: "1 1 240px", padding: "16px 18px", borderRadius: 12, backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc" }}>
                  <div style={{ color: "#4b5260", fontSize: 11 }}>KART AÇILMADI (tahmin)</div>
                  <div style={{ color: "#4b5260", fontSize: 32, fontWeight: 800, marginTop: 6 }}>{reviewLogs.cardNotShown || 0}</div>
                  <div style={{ color: "#5f6672", fontSize: 10, marginTop: 4 }}>akış anında bitti — genelde kota dolu</div>
                </div>
              </div>

              {reviewLogs.errorCodes && Object.keys(reviewLogs.errorCodes).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 10 }}>GOOGLE HATA KODLARI</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.entries(reviewLogs.errorCodes).map(([code, n]) => (
                      <span key={code} style={{ padding: "6px 12px", borderRadius: 20, backgroundColor: "#fdecea", border: "1px solid #f3c2bd", fontSize: 12, color: "#b42318" }}>
                        {code} <b>{n}</b>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 10 }}>
                SON KAYITLAR ({reviewLogs.total} toplam)
              </div>
              {(!reviewLogs.logs || reviewLogs.logs.length === 0) ? (
                <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Henüz log yok</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cdc8be", color: "#4b5260", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px" }}>Olay</th>
                        <th style={{ padding: "8px 10px" }}>Detay</th>
                        <th style={{ padding: "8px 10px" }}>Süre</th>
                        <th style={{ padding: "8px 10px" }}>Ülke</th>
                        <th style={{ padding: "8px 10px" }}>Cihaz</th>
                        <th style={{ padding: "8px 10px" }}>Zaman</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewLogs.logs.map(l => {
                        const map = {
                          popup_shown: { t: "Popup gösterildi", c: "#4b5260" },
                          button_tap: { t: "Butona basıldı", c: "#2a39b8" },
                          request_ok: { t: "✅ Google kabul", c: "#0d6b4d" },
                          request_fail: { t: "❌ Google ret", c: "#b42318" },
                          flow_done: { t: l.cardLikelyShown ? "Kart görüldü" : "Kart açılmadı", c: l.cardLikelyShown ? "#0b6aa2" : "#5f6672" },
                        };
                        const s = map[l.event] || { t: l.event, c: "#2b2f37" };
                        return (
                          <tr key={l.id} style={{ borderBottom: "1px solid #cdc8be" }}>
                            <td style={{ padding: "8px 10px", color: s.c, fontWeight: 600 }}>{s.t}</td>
                            <td style={{ padding: "8px 10px", color: "#4b5260", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {l.errorCode ? `${l.errorCode} — ` : ""}{l.detail}
                            </td>
                            <td style={{ padding: "8px 10px", color: "#4b5260" }}>{l.durationMs ? `${l.durationMs} ms` : "—"}</td>
                            <td style={{ padding: "8px 10px", color: "#2b2f37" }}>{l.country}</td>
                            <td style={{ padding: "8px 10px", color: "#5f6672", fontFamily: "monospace", fontSize: 11 }}>
                              {(l.deviceId || "—").slice(0, 10)}{l.sdk ? ` · SDK ${l.sdk}` : ""}
                            </td>
                            <td style={{ padding: "8px 10px", color: "#5f6672", fontSize: 11 }}>
                              {new Date(l.createdAt).toLocaleString("tr-TR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>}

        {sec === "live" && <div className="lv-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ ...styles.title, margin: 0 }}>Canlı Kullanıcılar</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#0d6b4d", fontSize: 11 }}>● canlı — 5 sn'de bir yenilenir</span>
              <select style={{ ...styles.selectDark, width: "auto", padding: "6px 10px", fontSize: 12 }}
                value={liveWindow} onChange={e => setLiveWindow(Number(e.target.value))}>
                <option value={1}>Şu an (son 1 dk)</option>
                <option value={5}>Son 5 dakika</option>
                <option value={15}>Son 15 dakika</option>
                <option value={30}>Son 30 dakika</option>
                <option value={60}>Son 1 saat</option>
              </select>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={() => fetchLiveUsers(liveWindow)}>Yenile</button>
            </div>
          </div>
          <p style={{ color: "#4b5260", fontSize: 12, margin: "0 0 20px 0" }}>
            Uygulamada "aktif" = seçilen süre içinde backend'e istek atmış benzersiz cihaz. Cihaz kimliği: X-Device-Id → token → IP.
          </p>


          {!liveUsers ? (
            <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Yükleniyor...</div>
          ) : (
            <>
              {/* SAYAÇLAR */}
              <div className="v2-stats">
                <div className="v2-st"><small>Şu an aktif</small><b className="v2-now">{nowCount ?? liveUsers.online1m}</b><span>son 1 dakika</span></div>
                <div className="v2-st"><small>Son 15 dakika</small><b>{liveUsers.online15m}</b><span>benzersiz cihaz</span></div>
                <div className="v2-st"><small>Son 1 saat</small><b>{liveUsers.online1h}</b><span>benzersiz cihaz</span></div>
              </div>

              {/* ÇUBUK GRAFİK — sütun üstünde kişi sayısı */}
              <LiveActivityChart apiUrl={API_URL} appKey={APP_KEY} scope={statsScope} scopeLabel={statsScopeLabel} />

              {/* KIRILIMLAR — kişi sayısıyla (yüzde yok) */}
              {(() => {
                const splitCard = (title, sub, rows, note) => {
                  const shown = rows.filter(r => !r.opt || (r.n || 0) > 0 || (r.n1h || 0) > 0);
                  const total = shown.reduce((x, r) => x + (r.n || 0), 0);
                  return (
                    <div className="lv-card" key={title}>
                      <div className="lv-card-h"><b>{title}</b><small>{sub}</small></div>
                      <div className="lv-split">
                        {total > 0 ? shown.filter(r => r.n > 0).map(r => <i key={r.k} style={{ flex: r.n, background: r.color }} />) : <i style={{ flex: 1, background: "#e3e0d9" }} />}
                      </div>
                      {shown.map(r => (
                        <div key={r.k} className={"lv-row" + (r.onClick ? " link" : "")} onClick={r.onClick}>
                          {r.av || <i className="lv-dot" style={{ background: r.color }} />}
                          <span className="lv-row-t"><b>{r.label}</b>{r.sub && <small>{r.sub}</small>}</span>
                          <span className="lv-row-n"><b>{(r.n || 0).toLocaleString("tr-TR")} kişi</b>{r.n15 != null && <small>15 dk: {r.n15} · 1 sa: {r.n1h}</small>}</span>
                        </div>
                      ))}
                      {note && <p className="lv-note">{note}</p>}
                    </div>
                  );
                };
                const m = liveUsers.byMode || {}, ex = liveUsers.byExtractor || {};
                const row = (k, label, sub, d, color, opt) => ({ k, label, sub, color, opt, n: (d || {}).online1m || 0, n15: (d || {}).online15m || 0, n1h: (d || {}).online1h || 0 });
                const cards = [];
                if (scopeAll) {
                  cards.push(splitCard("Uygulamaya göre", "Şu an aktif — tıkla: o uygulamanın izleme ekranı",
                    appChips.map((a, i) => ({
                      k: a.id, label: a.name || a.id, sub: a.packageName, n: chipCount(a.id) || 0,
                      color: ["#3c4fe0", "#7c5cd6", "#1f8a6e", "#d6416b", "#e0a030", "#0b6aa2"][i % 6],
                      av: <span className="pn-av lv-av" style={{ background: a.brandPrimary || "#a78bfa" }}>{String(a.name || a.id).trim().charAt(0).toLocaleUpperCase("tr")}</span>,
                      onClick: () => pickApp(a.id),
                    }))));
                }
                if (liveUsers.byMode) cards.push(splitCard("Uygulama moduna göre", "Şu an aktif — son 1 dakika", [
                  row("yt", "Müzik", "Normal arayüz", m.youtube, BAR_COLORS.music),
                  row("rt", "Zil sesi", "ASN / ülke kuralı ile", m.ringtone, BAR_COLORS.ring),
                  row("un", "Bilinmiyor", "Eski APK — mod bildirmiyor", m.unknown, BAR_COLORS.unknown, true),
                ], "Zil sesi modundakiler de bu toplamın içindedir — detay için soldaki Zil Sesi Modu."));
                if (liveUsers.byExtractor) cards.push(splitCard("İçerik kaynağına göre", "Şu an aktif — son 1 dakika", [
                  row("np", "NewPipe", "Android 13+ — cihazda çözülüyor", ex.newpipe, "#3c4fe0"),
                  row("be", "Backend", "Android 12- — sunucu API'leri", ex.backend, "#e0a030"),
                  row("xu", "Bilinmiyor", "Eski APK — bilgi göndermiyor", ex.unknown, BAR_COLORS.unknown, true),
                ], (ex.unknown || {}).online1h > 0 ? "\"Bilinmiyor\" = güncellemeden önceki APK sürümleri. Kullanıcılar güncelledikçe bu sayı düşer." : null));
                return <div className="lv-grid">{cards}</div>;
              })()}

              {/* CANLI IP LİSTESİ */}
              <div className="lv-card lv-dev">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                <SectionHead title="Şu An Aktif Cihazlar" sub={`Son ${liveUsers.window} dakika`} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* KAYNAK FİLTRESİ */}
                  <div className="pn-seg sm">
                    {[
                      { key: "all", label: "Tümü", count: liveUsers.windowCount },
                      { key: "newpipe", label: "NewPipe", count: (liveUsers.windowByExtractor || {}).newpipe },
                      { key: "backend", label: "Backend", count: (liveUsers.windowByExtractor || {}).backend },
                      { key: "unknown", label: "Bilinmiyor", count: (liveUsers.windowByExtractor || {}).unknown },
                    ].filter(f => f.key !== "unknown" || f.count > 0).map(f => (
                      <button key={f.key} type="button" onClick={() => setLiveExtractor(f.key)} className={liveExtractor === f.key ? "on" : ""}>
                        {f.label} {f.count != null ? `(${f.count})` : ""}
                      </button>
                    ))}
                  </div>
                  <span style={{ color: "#5f6672", fontSize: 11 }}>
                    {liveUsers.windowCount} cihaz{liveUsers.listed < liveUsers.windowCount ? ` — ilk ${liveUsers.listed} tanesi gösteriliyor` : ""}
                  </span>
                </div>
              </div>
              {(liveExtractor === "all" ? liveUsers.users : liveUsers.users.filter(u => (u.extractor || "unknown") === liveExtractor)).length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Şu an aktif kullanıcı yok</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cdc8be", color: "#4b5260", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px" }}>IP</th>
                        <th style={{ padding: "8px 10px" }}>Ülke</th>
                        <th style={{ padding: "8px 10px" }}>Kaynak</th>
                        <th style={{ padding: "8px 10px" }}>Son Aktivite</th>
                        <th style={{ padding: "8px 10px" }}>İstek</th>
                        <th style={{ padding: "8px 10px" }}>Endpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(liveExtractor === "all" ? liveUsers.users : liveUsers.users.filter(u => (u.extractor || "unknown") === liveExtractor)).map(u => (
                        <tr key={u.uid} style={{ borderBottom: "1px solid #cdc8be" }}>
                          <td style={{ padding: "8px 10px", color: "#16181d", fontFamily: "monospace" }}>
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginRight: 8,
                              backgroundColor: u.secondsAgo < 120 ? "#12805c" : "#eab308" }} />
                            {u.ip}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#2b2f37" }}>{u.country}</td>
                          <td style={{ padding: "8px 10px" }}>
                            {(() => {
                              const map = {
                                newpipe: { label: "NewPipe", color: "#0b6aa2", bg: "#e2f1fb", border: "#b9dcf1" },
                                backend: { label: "Backend", color: "#8a5a00", bg: "#fdf0d5", border: "#f0d9a6" },
                                unknown: { label: "Bilinmiyor", color: "#4b5260", bg: "#f4f2ed", border: "#d9d5cc" },
                              };
                              const s = map[u.extractor] || map.unknown;
                              return (
                                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                  color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
                                  {s.label}{u.sdk ? ` · SDK ${u.sdk}` : ""}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#4b5260" }}>
                            {u.secondsAgo < 60 ? `${u.secondsAgo} sn önce` : `${Math.round(u.secondsAgo / 60)} dk önce`}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#2a39b8", fontWeight: 600 }}>{u.hits}</td>
                          <td style={{ padding: "8px 10px", color: "#5f6672", fontSize: 11 }}>{u.endpoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ color: "#6b7078", fontSize: 11, marginTop: 14 }}>
                Son güncelleme: {new Date(liveUsers.updatedAt).toLocaleTimeString("tr-TR")}
              </div>
              </div>
            </>
          )}
        </div>}

        {/* ZİYARETÇİ ÖZETİ — son 24 saat / 7 gün / 30 gün, ülke kırılımlı */}
        {sec === "visitors" && <div className="lv-wrap">
          <div className="lv-sub-h">
            <div><b>{statsScopeLabel}</b><small>Uygulamayı açan benzersiz cihaz sayısı</small></div>
            <span>dakikada bir güncellenir</span>
          </div>
          {!visitorStats ? (
            <div className="lv-empty">Yükleniyor…</div>
          ) : (() => {
            const vs = visitorStats;
            const c30 = {};
            ((visitor30 && visitor30.countries) || []).forEach(c => { c30[c.country] = c.value; });
            const seen = new Set(vs.byCountry.map(c => c.country));
            const all = [...vs.byCountry.map(c => ({ ...c, last30d: c30[c.country] || c.last7d })),
              ...Object.keys(c30).filter(cc => !seen.has(cc)).map(cc => ({ country: cc, last24h: 0, last7d: 0, last30d: c30[cc] }))]
              .sort((x, y) => y.last7d - x.last7d || y.last30d - x.last30d || y.last24h - x.last24h);
            const rows = showAllVisitorCountries ? all : all.slice(0, 15);
            const dayLabel = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: "UTC" });
            const fmtN = (v) => (v == null ? "—" : Number(v).toLocaleString("tr-TR"));
            return (
              <>
                <div className="v2-stats">
                  <div className="v2-st"><small>Son 24 saat</small><b>{fmtN(vs.last24h)}</b><span>Kayan pencere, saatlik</span></div>
                  <div className="v2-st"><small>Son 7 gün</small><b>{fmtN(vs.last7d)}</b><span>Bugün dahil son 7 gün (UTC)</span></div>
                  <div className="v2-st"><small>Son 30 gün</small><b>{visitor30 ? fmtN(visitor30.total) : "—"}</b><span>Bugün dahil son 30 gün (UTC)</span></div>
                </div>

                <div className="lb-card">
                  <div className="lb-head"><div><h3>Günlük benzersiz cihaz</h3><p>Son 7 gün · sütun üstünde kişi sayısı</p></div></div>
                  <LabeledBars height={200} bars={(vs.daily || []).map(d => ({
                    key: d.date, label: dayLabel(d.date), total: d.count, title: `${dayLabel(d.date)} — ${fmtN(d.count)} kişi`,
                    segs: [{ v: d.count, color: BAR_COLORS.single }],
                  }))} />
                </div>

                {all.length === 0 ? (
                  <div className="lv-empty">Henüz veri yok — sayım bu sürüm yayına alındıktan sonra birikmeye başlar.</div>
                ) : (
                  <div className="lv-table">
                    <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Ülke</th>
                            <th className="r">Son 24 saat</th>
                            <th className="r">Son 7 gün</th>
                            <th className="r">Son 30 gün</th>
                            <th style={{ width: "26%" }}>Pay (7 gün)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(c => {
                            const share = vs.last7d > 0 ? Math.round((c.last7d / vs.last7d) * 100) : 0;
                            return (
                              <tr key={c.country}>
                                <td>
                                  {c.country === "XX" ? "🏳️ Bilinmiyor" : <>{countryFlag(c.country)} <b>{countryName(c.country)}</b></>}
                                  <span className="lv-cc">{c.country !== "XX" ? c.country : ""}</span>
                                </td>
                                <td className="r n">{fmtN(c.last24h)}</td>
                                <td className="r n">{fmtN(c.last7d)}</td>
                                <td className="r n">{visitor30 ? fmtN(c.last30d) : "—"}</td>
                                <td>
                                  <div className="lv-share"><div><i style={{ width: `${share}%` }} /></div><span>%{share}</span></div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {all.length > 15 && (
                      <button type="button" className="lv-more" onClick={() => setShowAllVisitorCountries(v => !v)}>
                        {showAllVisitorCountries ? "Daha az göster" : `Tüm ülkeleri göster (${all.length})`}
                      </button>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>}

        {/* ZİL SESİ MODU — kim, nereden, hangi kural yüzünden */}
        {sec === "ringtonemode" && <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ ...styles.title, margin: 0 }}>Zil Sesi Modu</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#0b6aa2", fontSize: 11 }}>● 10 sn'de bir yenilenir</span>
              <select style={{ ...styles.selectDark, width: "auto", padding: "6px 10px", fontSize: 12 }}
                value={rtWindow} onChange={e => setRtWindow(Number(e.target.value))}>
                <option value={1}>Şu an (son 1 dk)</option>
                <option value={5}>Son 5 dakika</option>
                <option value={15}>Son 15 dakika</option>
                <option value={30}>Son 30 dakika</option>
                <option value={60}>Son 1 saat</option>
              </select>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }}
                onClick={() => fetchRtUsers(rtWindow)}>Yenile</button>
            </div>
          </div>
          <p style={{ color: "#4b5260", fontSize: 12, margin: "0 0 20px 0" }}>
            Zil sesi arayüzünde olan cihazlar. Modu cihaz kendisi seçer (ASN &gt; ülke &gt; global)
            ve her yoklamada sunucuya bildirir. Bu moddayken arama/çalma trafiği olmadığı için
            bu cihazlar "Canlı Kullanıcılar" toplamının içindedir ama orada ayırt edilemez.
          </p>

          {!rtUsers ? (
            <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Yükleniyor...</div>
          ) : (() => {
            const bm = rtUsers.byMode || {};
            const rt = bm.ringtone || {}, yt = bm.youtube || {}, un = bm.unknown || {};
            const tot5 = (rt.online1m || 0) + (yt.online1m || 0) + (un.online1m || 0);
            const share = tot5 > 0 ? Math.round(((rt.online1m || 0) / tot5) * 100) : 0;
            const seg = (n) => tot5 > 0 ? (n / tot5) * 100 : 0;
            const ruleCountries = Object.entries(config.countries || {}).filter(([, m]) => m === "ringtone");
            const ruleAsns = config.ringtoneAsns || [];
            return (
            <>
              {/* CİHAZ LİSTESİ */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                <span style={{ color: "#4b5260", fontSize: 12 }}>ZİL SESİNDEKİ CİHAZLAR (son {rtUsers.window} dk)</span>
                <span style={{ color: "#5f6672", fontSize: 11 }}>
                  {rtUsers.windowCount} cihaz{rtUsers.listed < rtUsers.windowCount ? ` — ilk ${rtUsers.listed} tanesi gösteriliyor` : ""}
                </span>
              </div>
              {(!rtUsers.users || rtUsers.users.length === 0) ? (
                <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Son {rtUsers.window} dakikada zil sesi moduna giren cihaz yok</div>
              ) : (
                <div style={{ overflowX: "auto", marginBottom: 24 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cdc8be", color: "#4b5260", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px" }}>IP</th>
                        <th style={{ padding: "8px 10px" }}>Ülke</th>
                        <th style={{ padding: "8px 10px" }}>Uygulama</th>
                        <th style={{ padding: "8px 10px" }}>Paket adı</th>
                        <th style={{ padding: "8px 10px" }}>Kaynak</th>
                        <th style={{ padding: "8px 10px" }}>Son Aktivite</th>
                        <th style={{ padding: "8px 10px" }}>İstek</th>
                        <th style={{ padding: "8px 10px" }}>Endpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rtUsers.users.map(u => (
                        <tr key={u.uid} style={{ borderBottom: "1px solid #cdc8be" }}>
                          <td style={{ padding: "8px 10px", color: "#16181d", fontFamily: "monospace" }}>
                            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginRight: 8,
                              backgroundColor: u.secondsAgo < 120 ? "#0ea5e9" : "#eab308" }} />
                            {u.ip}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#2b2f37", whiteSpace: "nowrap" }}>
                            {/^[A-Z]{2}$/.test(u.country || "") ? `${countryFlag(u.country)} ${countryName(u.country)}` : "🌍 Bilinmiyor"}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#16181d", fontWeight: 600 }}>
                            {u.appName || u.appId || "—"}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#4b5260", fontFamily: "monospace", fontSize: 12 }}>
                            {u.pkg || (apps[u.appId] || {}).packageName || "bilinmiyor"}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#4b5260", fontSize: 11 }}>
                            {u.extractor === "newpipe" ? "NewPipe" : u.extractor === "backend" ? "Backend" : "Bilinmiyor"}
                            {u.sdk ? ` · SDK ${u.sdk}` : ""}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#4b5260" }}>
                            {u.secondsAgo < 60 ? `${u.secondsAgo} sn önce` : `${Math.round(u.secondsAgo / 60)} dk önce`}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#0b6aa2", fontWeight: 600 }}>{u.hits}</td>
                          <td style={{ padding: "8px 10px", color: "#5f6672", fontSize: 11 }}>{u.endpoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* SAYAÇLAR */}
              <div className="v2-stats">
                <div className="v2-st"><small>Zil sesinde · şu an</small><b style={{ color: "#f5c26b" }}>{rt.online1m || 0}</b><span>tüm aktiflerin %{share}'i</span></div>
                <div className="v2-st"><small>Son 15 dakika</small><b>{rt.online15m || 0}</b></div>
                <div className="v2-st"><small>Son 1 saat</small><b>{rt.online1h || 0}</b></div>
              </div>

              {/* DAĞILIM ÇUBUĞU */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 8 }}>DAĞILIM (son 1 dk — toplam {tot5})</div>
                <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", backgroundColor: "#eeebe5", border: "1px solid #d9d5cc" }}>
                  <div title={`Müzik: ${yt.online1m || 0}`} style={{ width: `${seg(yt.online1m || 0)}%`, backgroundColor: "#12805c" }} />
                  <div title={`Zil sesi: ${rt.online1m || 0}`} style={{ width: `${seg(rt.online1m || 0)}%`, backgroundColor: "#0ea5e9" }} />
                  <div title={`Bilinmiyor: ${un.online1m || 0}`} style={{ width: `${seg(un.online1m || 0)}%`, backgroundColor: "#c9c5bc" }} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#4b5260", flexWrap: "wrap" }}>
                  <span><b style={{ color: "#0d6b4d" }}>●</b> Müzik {yt.online1m || 0}</span>
                  <span><b style={{ color: "#0b6aa2" }}>●</b> Zil sesi {rt.online1m || 0}</span>
                  <span><b style={{ color: "#5f6672" }}>●</b> Bilinmiyor {un.online1m || 0}</span>
                </div>
                {(un.online1h || 0) > 0 && (
                  <p style={{ color: "#5f6672", fontSize: 11, margin: "10px 0 0 0" }}>
                    "Bilinmiyor" = modunu bildirmeyen eski APK sürümleri. Bu cihazların bir kısmı zil sesi
                    modunda olabilir; kullanıcılar güncelledikçe sayı düşer.
                  </p>
                )}
              </div>

              {/* PAKETE GÖRE — hangi uygulamadan kaç kişi zil sesinde */}
              {rtUsers.byApp && rtUsers.byApp.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 10 }}>PAKETE GÖRE (şu an aktif — son 1 dk)</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #cdc8be", color: "#4b5260", textAlign: "left" }}>
                          <th style={{ padding: "8px 10px" }}>Uygulama</th>
                          <th style={{ padding: "8px 10px" }}>Paket adı</th>
                          <th style={{ padding: "8px 10px" }}>Zil sesi</th>
                          <th style={{ padding: "8px 10px" }}>Müzik</th>
                          <th style={{ padding: "8px 10px" }}>Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rtUsers.byApp.map(a => (
                          <tr key={a.id} style={{ borderBottom: "1px solid #cdc8be" }}>
                            <td style={{ padding: "8px 10px", color: "#16181d" }}>{a.name}</td>
                            <td style={{ padding: "8px 10px", color: "#5f6672", fontFamily: "monospace", fontSize: 11 }}>{a.packageName || "—"}</td>
                            <td style={{ padding: "8px 10px", color: a.ringtone > 0 ? "#0b6aa2" : "#5f6672", fontWeight: 600 }}>{a.ringtone}</td>
                            <td style={{ padding: "8px 10px", color: "#0d6b4d" }}>{a.youtube}</td>
                            <td style={{ padding: "8px 10px", color: "#2b2f37" }}>{a.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ color: "#5f6672", fontSize: 11, margin: "10px 0 0 0" }}>
                    Paket ayrımı cihazın gönderdiği uygulama paketine göre yapılır. "Uygulamalar"
                    bölümünde kayıtlı olmayan bir paket tanınmaz ve ilk satıra (default) düşer —
                    orada beklediğinden fazla cihaz varsa eksik kayıt olabilir.
                  </p>
                </div>
              )}

              {/* ÜLKELER — asıl soru: hangi ülkeler zil sesine düşüyor */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 10 }}>
                  ÜLKELERE GÖRE (zil sesindekiler — son {rtUsers.window} dk)
                </div>
                {(!rtUsers.byCountry || rtUsers.byCountry.length === 0) ? (
                  <div style={{ color: "#5f6672", fontSize: 12 }}>Bu pencerede zil sesi modunda cihaz yok.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {rtUsers.byCountry.map(c => (
                      <span key={c.country} style={{ padding: "6px 12px", borderRadius: 20, backgroundColor: "#e2f1fb",
                        border: "1px solid #b9dcf1", fontSize: 12, color: "#2b2f37" }}>
                        {c.country} <b style={{ color: "#0b6aa2" }}>{c.count}</b>
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ color: "#5f6672", fontSize: 11, margin: "10px 0 0 0" }}>
                  Buradaki ülke IP'den gelir. Mod kararı ise SIM → şebeke → IP sırasıyla verilir;
                  VPN/roaming'deki cihazda ikisi farklı çıkabilir.
                </p>
              </div>

              {/* KURAL ↔ GERÇEK */}
              <div style={{ marginBottom: 26, padding: "14px 16px", borderRadius: 10, backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc" }}>
                <div style={{ color: "#4b5260", fontSize: 12, marginBottom: 10 }}>YÜRÜRLÜKTEKİ KURALLAR</div>
                <div style={{ fontSize: 12, color: "#2b2f37", marginBottom: 8 }}>
                  Ülke kuralı:{" "}
                  {ruleCountries.length === 0
                    ? <span style={{ color: "#5f6672" }}>yok — hiçbir ülke zil sesine ayarlı değil</span>
                    : ruleCountries.map(([code]) => (
                        <span key={code} style={{ padding: "3px 9px", borderRadius: 20, backgroundColor: "#e2f1fb",
                          border: "1px solid #b9dcf1", fontSize: 11, color: "#0b6aa2", marginRight: 6 }}>{code}</span>
                      ))}
                </div>
                <div style={{ fontSize: 12, color: "#2b2f37" }}>
                  ASN kuralı:{" "}
                  {ruleAsns.length === 0
                    ? <span style={{ color: "#5f6672" }}>yok</span>
                    : ruleAsns.map(a => (
                        <span key={a} style={{ padding: "3px 9px", borderRadius: 20, backgroundColor: "#fdf0d5",
                          border: "1px solid #f0d9a6", fontSize: 11, color: "#8a5a00", marginRight: 6 }}>AS{a}</span>
                      ))}
                </div>
                <p style={{ color: "#5f6672", fontSize: 11, margin: "10px 0 0 0" }}>
                  Ülke kuralı boşken zil sesine yalnızca ASN listesindeki ağlar (Google altyapısı /
                  inceleme sunucuları) düşer — o yüzden sayının düşük olması normaldir.
                </p>
              </div>

              <div style={{ color: "#6b7078", fontSize: 11, marginTop: 14 }}>
                Son güncelleme: {new Date(rtUsers.updatedAt).toLocaleTimeString("tr-TR")}
              </div>
            </>
            );
          })()}
        </div>}

        {/* GİRİŞ YAPAN IP'LER */}
        {activeSection === "loginips" && <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ ...styles.title, margin: 0 }}>Giriş Yapan IP'ler</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#4b5260", fontSize: 13 }}>Toplam: <b style={{ color: "#16181d" }}>{loginIps.length}</b></span>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={fetchLoginIps}>Yenile</button>
              <button style={{ ...styles.primaryBtn, backgroundColor: "#d92d20", color: "#fff", fontSize: 12, padding: "6px 14px" }} onClick={clearLoginIps}>Listeyi Temizle</button>
            </div>
          </div>
          <p style={{ color: "#4b5260", fontSize: 12, margin: "-8px 0 16px 0" }}>Uygulamaya giriş yapan (config/token çeken) cihazların IP kayıtları — IP başına tek satır, tekrar girişte sayaç artar</p>
          {loginIps.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#5f6672" }}>Henüz kayıt yok</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cdc8be", color: "#4b5260", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>IP</th>
                    <th style={{ padding: "8px 10px" }}>Ülke</th>
                    <th style={{ padding: "8px 10px" }}>Giriş</th>
                    <th style={{ padding: "8px 10px" }}>İlk Görülme</th>
                    <th style={{ padding: "8px 10px" }}>Son Görülme</th>
                    <th style={{ padding: "8px 10px" }}>Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {loginIps.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: "1px solid #cdc8be" }}>
                      <td style={{ padding: "8px 10px", color: "#16181d", fontFamily: "monospace" }}>{entry.ip}</td>
                      <td style={{ padding: "8px 10px", color: "#2b2f37" }}>{entry.country || "?"}</td>
                      <td style={{ padding: "8px 10px", color: "#2a39b8", fontWeight: 600 }}>{entry.count}</td>
                      <td style={{ padding: "8px 10px", color: "#4b5260" }}>{entry.firstSeen ? new Date(entry.firstSeen).toLocaleString("tr-TR") : "-"}</td>
                      <td style={{ padding: "8px 10px", color: "#4b5260" }}>{entry.lastSeen ? new Date(entry.lastSeen).toLocaleString("tr-TR") : "-"}</td>
                      <td style={{ padding: "8px 10px", color: "#5f6672", fontSize: 11 }}>{entry.endpoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingGroup ? "Kanal Düzenle" : "Kanal Yasakla"}</h3>
              <div>
                <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>İptal</button>
                <button style={styles.saveBtn} onClick={saveBlockedGroup}>{editingGroup ? "Kaydet" : "Yasakla"}</button>
              </div>
            </div>
            
            <div style={styles.modalBody}>
              {editingGroup && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Id</label>
                  <input style={styles.inputDisabled} value={editingGroup} disabled />
                </div>
              )}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Yasak Tipi</label>
                <select style={styles.selectDark} value={ruleType} onChange={e => setRuleType(e.target.value)}>
                  <option value="channel">Kanal Adı</option>
                  <option value="channelId">YouTube Kanal ID (UCxxxxxxx)</option>
                  <option value="videoId">YouTube Video ID (şarkı engelle)</option>
                  <option value="keyword">Kelime Bazlı (Başlıkta geçen)</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{ruleType === "channelId" ? "YouTube Kanal ID'leri" : ruleType === "videoId" ? "YouTube Video ID'leri" : ruleType === "keyword" ? "Kelimeler" : "Kanal İsimleri"} (Yazıp Enter'a basın)</label>
                <div style={styles.chipsInputBox}>
                  {currentChannels.map((ch, i) => (
                    <div key={i} style={styles.chipEditable}>
                      {ch} <span style={styles.chipClose} onClick={() => removeChannelTag(i)}>✕</span>
                    </div>
                  ))}
                  <input 
                    style={styles.chipInput} 
                    placeholder={ruleType === "channelId" ? "UCxxxxxxx..." : ruleType === "videoId" ? "dQw4w9WgXcQ..." : ruleType === "keyword" ? "Kelime ekle..." : "Kanal adı ekle..."} 
                    value={currentChannelInput}
                    onChange={e => setCurrentChannelInput(e.target.value)}
                    onKeyDown={handleChannelKeyDown}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Filtre</label>
                <div style={styles.filterBox}>
                  <label style={styles.label}>Ülkeler</label>
                  <select style={styles.selectDark} value={filterType} onChange={e => {
                    setFilterType(e.target.value);
                    if (e.target.value === "all") setIsDropdownOpen(false);
                  }}>
                    <option value="all">Tüm ülkelerde yasakla</option>
                    <option value="selected">Sadece seçtiğim ülkelerde yasakla</option>
                  </select>

                  {filterType === "selected" && (
                    <div style={{ marginTop: 15 }}>
                      <label style={styles.label}>Yasaklanacak Ülkeler</label>
                      <div style={{ position: "relative" }}>
                        <div 
                          style={styles.multiSelectHeader} 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          {selectedCountries.length > 0 ? `${selectedCountries.length} ülke seçildi` : "Yasaklanacak ülkeleri seç"}
                          <span style={{float: "right"}}>{isDropdownOpen ? "▲" : "▼"}</span>
                        </div>
                        
                        {isDropdownOpen && (
                          <div style={styles.multiSelectList}>
                            {COUNTRY_LIST.map(c => (
                              <label key={c.code} style={styles.multiSelectItem}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedCountries.includes(c.code)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCountries([...selectedCountries, c.code]);
                                    } else {
                                      setSelectedCountries(selectedCountries.filter(sc => sc !== c.code));
                                    }
                                  }}
                                  style={{ marginRight: 10 }}
                                />
                                {c.code} - {c.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* POPUP OLUŞTURMA MODAL */}
      {activeSection === "popup" && isPopupModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Duyuru Oluştur</h3>
              <div>
                <button style={styles.cancelBtn} onClick={() => setIsPopupModalOpen(false)}>İptal</button>
                <button style={{ ...styles.saveBtn, background: "#3c4fe0" }} onClick={createAnnouncement}>Yayınla</button>
              </div>
            </div>

            <div style={styles.modalBody}>
              {/* POPUP TİPİ */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Popup Tipi</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { key: "vote", title: "⭐ Yıldız Oylaması", desc: "Kullanıcı 1-5 yıldız seçer. 4-5 verenlere Google kartı açılır, 1-3 verenlerin yorumu panele düşer." },
                    { key: "review", title: "🙋 Değerlendirme Daveti", desc: "Tek buton. Yıldız ayrımı yapılmadan Google kartı herkese açılır. Play politikasına uygun olan yöntem." },
                  ].map(t => (
                    <div key={t.key} onClick={() => setPopupType(t.key)}
                      style={{ flex: "1 1 260px", padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                        backgroundColor: popupType === t.key ? "#efe9fd" : "#f4f2ed",
                        border: `1px solid ${popupType === t.key ? "#3c4fe0" : "#d9d5cc"}` }}>
                      <div style={{ color: popupType === t.key ? "#2a39b8" : "#2b2f37", fontSize: 14, fontWeight: 600 }}>{t.title}</div>
                      <div style={{ color: "#4b5260", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                {popupType === "vote" && (
                  <p style={{ color: "#8a5a00", fontSize: 11, margin: "10px 0 0 0", lineHeight: 1.5 }}>
                    Google, yorum isteğini kullanıcının puanına göre filtrelemeyi (review gating) yasaklıyor.
                    Bu tip politika ihlali sayılabilir. Güvenli olan "Değerlendirme Daveti".
                  </p>
                )}
              </div>

              {/* Başlık & Mesaj */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Başlık</label>
                <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                  placeholder="Duyuru başlığı..." value={popupTitle} onChange={e => setPopupTitle(e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mesaj</label>
                <textarea style={{ ...styles.input, width: "100%", boxSizing: "border-box", minHeight: 80, fontFamily: "sans-serif" }}
                  placeholder="Kullanıcılara gösterilecek mesaj..." value={popupMessage} onChange={e => setPopupMessage(e.target.value)} />
              </div>

              {/* Buton — review tipinde tek alan */}
              {popupType === "review" ? (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Buton Yazısı</label>
                  <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                    placeholder="⭐ Değerlendir" value={popupReviewBtnLabel}
                    onChange={e => setPopupReviewBtnLabel(e.target.value)} />
                  <p style={{ color: "#4b5260", fontSize: 11, margin: "8px 0 0 0", lineHeight: 1.5 }}>
                    Kullanıcı bu butona basınca Google'ın değerlendirme kartı uygulamanın içinde açılır.
                    Puanı Google'ın kartında verir — bu popup puan toplamaz.
                  </p>
                </div>
              ) : (
              <div style={styles.formGroup}>
                <label style={styles.label}>Butonlar (oy seçenekleri)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {popupButtons.map((btn, i) => (
                    <div key={i} style={{ background: "#efe9fd", border: "1px solid #3c4fe0", borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#2a39b8", fontSize: 13 }}>{btn.label}</span>
                      <span style={{ color: "#5f6672", fontSize: 11 }}>({btn.value})</span>
                      <span style={{ cursor: "pointer", color: "#4b5260" }} onClick={() => removePopupButton(i)}>✕</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...styles.input, flex: 2 }} placeholder="Buton etiketi (örn: ⭐⭐⭐ Regular)" value={popupBtnLabel} onChange={e => setPopupBtnLabel(e.target.value)} />
                  <input style={{ ...styles.input, flex: 1 }} placeholder="Değer (⭐ varsa otomatik)" value={popupBtnValue} onChange={e => setPopupBtnValue(e.target.value)} />
                  <button style={{ ...styles.primaryBtn, whiteSpace: "nowrap" }} onClick={addPopupButton}>Ekle +</button>
                </div>
                <p style={{ color: "#4b5260", fontSize: 12, margin: "8px 0 0 0", lineHeight: 1.5 }}>
                  Etiketi istediğiniz dilde yazın, yeter ki <b style={{ color: "#2a39b8" }}>1-5 arası ⭐</b> içersin —
                  değer otomatik <code style={{ color: "#2a39b8" }}>1_star…5_star</code> olarak yazılır.
                  Uygulama kaç yıldız verildiğini buradan anlıyor; yanlışsa
                  1-3'te geri bildirim kutusu, 4-5'te Google değerlendirme kartı açılmaz.
                </p>
              </div>
              )}

              {/* Hedef Ülkeler */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Hedef Ülkeler</label>
                <select style={styles.selectDark} value={popupCountryMode} onChange={e => { setPopupCountryMode(e.target.value); setIsPopupCountryDropdownOpen(false); }}>
                  <option value="all">Tüm ülkeler</option>
                  <option value="selected">Belirli ülkeler</option>
                </select>

                {popupCountryMode === "selected" && (
                  <div style={{ marginTop: 12, position: "relative" }}>
                    <div style={styles.multiSelectHeader} onClick={() => setIsPopupCountryDropdownOpen(!isPopupCountryDropdownOpen)}>
                      {popupSelectedCountries.length > 0 ? `${popupSelectedCountries.length} ülke seçildi` : "Ülke seçin..."}
                      <span style={{ float: "right" }}>{isPopupCountryDropdownOpen ? "▲" : "▼"}</span>
                    </div>
                    {isPopupCountryDropdownOpen && (
                      <div style={styles.multiSelectList}>
                        {COUNTRY_LIST.map(c => (
                          <label key={c.code} style={styles.multiSelectItem}>
                            <input type="checkbox" checked={popupSelectedCountries.includes(c.code)}
                              onChange={e => {
                                if (e.target.checked) setPopupSelectedCountries(prev => [...prev, c.code]);
                                else setPopupSelectedCountries(prev => prev.filter(x => x !== c.code));
                              }}
                              style={{ marginRight: 10 }} />
                            {c.code} - {c.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Minimum Kullanım */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Minimum Kullanım Sayısı</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="number" min="0" max="100"
                    style={{ ...styles.input, width: 80, textAlign: "center" }}
                    value={popupMinLaunches} onChange={e => setPopupMinLaunches(e.target.value)} />
                  <span style={{ color: "#4b5260", fontSize: 12 }}>Uygulamayı en az bu kadar kez açmış kullanıcılara gösterilir</span>
                </div>
              </div>

              {/* Zaman Aralığı */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Zaman Aralığı (isteğe bağlı)</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, fontSize: 11 }}>Başlangıç</label>
                    <input type="datetime-local" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={popupStartTime} onChange={e => setPopupStartTime(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, fontSize: 11 }}>Bitiş</label>
                    <input type="datetime-local" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={popupEndTime} onChange={e => setPopupEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Önizleme */}
              {(popupTitle || popupMessage) && (
                <div style={{ background: "#eeebe5", border: "1px solid #d9d5cc", borderRadius: 12, padding: 20 }}>
                  <p style={{ color: "#5f6672", fontSize: 11, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: 1 }}>Önizleme</p>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 700, color: "#16181d", fontSize: 18 }}>{popupTitle || "Başlık"}</p>
                  <p style={{ margin: "0 0 16px 0", color: "#4b5260", fontSize: 14 }}>{popupMessage || "Mesaj..."}</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {popupButtons.map((btn, i) => (
                      <button key={i} style={{ background: "#3c4fe0", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* İNDİRME REKLAMI */}
        {activeSection === "downloadad" && <div style={styles.card}>
          <h2 style={styles.title}>İndirme Reklamı / URL Açma</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 20 }}>
            Ülke bazlı reklam kuralları. Kullanıcının ülkesine göre URL açma veya AdMob reklamı gösterilir.
          </p>

          {/* Varsayılan (Global) Ayarlar */}
          <div style={{ padding: "16px", background: "#f4f2ed", borderRadius: 8, border: "1px solid #d9d5cc", marginBottom: 20 }}>
            <h3 style={{ color: "#16181d", margin: "0 0 12px 0", fontSize: 15 }}>Varsayılan Ayar (Kural tanımlı olmayan ülkeler)</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#2b2f37" }}>Aktif:</label>
              <input type="checkbox" checked={config.downloadAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.downloadAd?.enabled ? "#0d6b4d" : "#b42318", fontSize: 12, fontWeight: 600 }}>
                {config.downloadAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                <select value={config.downloadAd?.type || "url"}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, type: e.target.value } }))}
                  style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                  <option value="url">URL Aç</option>
                  <option value="admob">AdMob</option>
                  <option value="both">URL + AdMob</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Frekans:</label>
                <select value={config.downloadAd?.showEveryNth || 1}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, showEveryNth: parseInt(e.target.value) } }))}
                  style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                  <option value={1}>Her indirmede</option>
                  <option value={2}>Her 2</option>
                  <option value={3}>Her 3</option>
                  <option value={5}>Her 5</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>URL:</label>
              <input type="text" placeholder="https://..."
                value={config.downloadAd?.url || ""}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, url: e.target.value } }))}
                style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob Unit ID:</label>
              <input type="text" placeholder="ca-app-pub-xxx/yyy"
                value={config.downloadAd?.admobUnitId || ""}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, admobUnitId: e.target.value } }))}
                style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
            </div>

            {/* İlk indirmede mutlaka reklam */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: config.downloadAd?.forceFirstDownload ? "#0d6b4d" : "#4b5260", fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={config.downloadAd?.forceFirstDownload || false}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, forceFirstDownload: e.target.checked } }))} />
              İlk indirmede mutlaka reklam (yeni kullanıcının ilk indirmesinde, frekanstan bağımsız — cihaz başına 1 kez)
            </label>

            {/* Özel oran: N indirmede X reklam */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Özel oran (0 = kapalı, üstteki Frekans kullanılır):</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#4b5260", fontSize: 13 }}>Her</span>
                <input type="number" min={0} placeholder="10" value={config.downloadAd?.cycleSize || ""}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, cycleSize: parseInt(e.target.value) || 0 } }))}
                  style={{ width: 70, background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                <span style={{ color: "#4b5260", fontSize: 13 }}>indirmede</span>
                <input type="number" min={0} placeholder="2" value={config.downloadAd?.adsPerCycle || ""}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, adsPerCycle: parseInt(e.target.value) || 0 } }))}
                  style={{ width: 70, background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                <span style={{ color: "#4b5260", fontSize: 13 }}>reklam</span>
              </div>
              <span style={{ color: "#5f6672", fontSize: 11 }}>Doluysa üstteki "Frekans" yerine bu geçerli (örn. 10 indirmede 2 → ilk kullanıcıdan sonra 10'arlı bloklarda 2 reklam)</span>
            </div>
          </div>

          {/* Ülke Kuralları */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: "#16181d", margin: 0, fontSize: 15 }}>Ülke Bazlı Kurallar</h3>
              <button onClick={() => {
                const rules = [...(config.downloadAd?.rules || [])];
                rules.unshift({ countries: [], enabled: true, type: "url", url: "", admobUnitId: "", showEveryNth: 1, delaySeconds: 0 });
                setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
              }} style={{ background: "transparent", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.downloadAd?.rules || []).length === 0 && (
              <p style={{ color: "#5f6672", fontSize: 13, textAlign: "center", padding: 20 }}>
                Ülke kuralı yok — tüm ülkelere varsayılan ayar uygulanır.
              </p>
            )}

            {(config.downloadAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#f4f2ed", borderRadius: 8, border: `1px solid ${rule.enabled ? "#d97706" : "#d9d5cc"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2b2f37" }}>Kural #{idx + 1}</span>
                    <div onClick={() => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: !rules[idx].enabled };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                        background: rule.enabled ? "#dcf2e8" : "#fdecea",
                        border: `1px solid ${rule.enabled ? "#12805c" : "#d92d20"}`,
                        borderRadius: 20, padding: "3px 10px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: rule.enabled ? "#12805c" : "#d92d20" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: rule.enabled ? "#0d6b4d" : "#b42318" }}>
                        {rule.enabled ? "AKTİF" : "PASİF"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.downloadAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="downloadAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "url"}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="url">URL Aç</option>
                      <option value="admob">AdMob</option>
                      <option value="both">URL + AdMob</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>URL:</label>
                    <input type="text" placeholder="https://..."
                      value={rule.url || ""}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], url: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy"
                      value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Frekans:</label>
                    <select value={rule.showEveryNth || 1}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], showEveryNth: parseInt(e.target.value) };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value={1}>Her indirmede</option>
                      <option value={2}>Her 2</option>
                      <option value={3}>Her 3</option>
                      <option value={5}>Her 5</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Gecikme:</label>
                    <select value={rule.delaySeconds || 0}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], delaySeconds: parseInt(e.target.value) };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value={0}>Anında</option>
                      <option value={1}>1 sn</option>
                      <option value={2}>2 sn</option>
                      <option value={3}>3 sn</option>
                      <option value={5}>5 sn</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={updateConfig}
            style={{ background: "#3c4fe0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* BANNER AD / ARAMA REKLAMI */}
        {activeSection === "bannerad" && <div style={styles.card}>
          <h2 style={styles.title}>Arama Sonuçları Banner Reklamı</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 20 }}>
            Arama sonuçlarında her N. şarkıdan sonra banner reklam gösterilir. Ülke bazlı Google AdMob veya kendi görseliniz.
          </p>

          {/* Global Ayar */}
          <div style={{ padding: "16px", background: "#f4f2ed", borderRadius: 8, border: "1px solid #d9d5cc", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 14, color: "#2b2f37" }}>Banner Reklam Aktif:</label>
              <input type="checkbox" checked={config.bannerAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.bannerAd?.enabled ? "#0d6b4d" : "#b42318", fontSize: 12, fontWeight: 600 }}>
                {config.bannerAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Her kaç şarkıda bir banner göster:</label>
              <select value={config.bannerAd?.showEveryNth || 3}
                onChange={e => setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, showEveryNth: parseInt(e.target.value) } }))}
                style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                <option value={2}>Her 2 şarkıda bir</option>
                <option value={3}>Her 3 şarkıda bir</option>
                <option value={4}>Her 4 şarkıda bir</option>
                <option value={5}>Her 5 şarkıda bir</option>
              </select>
            </div>
          </div>

          {/* Belirli pozisyonlar */}
          <div style={{ marginBottom: 20, padding: "14px 16px", background: "#f4f2ed", borderRadius: 8, border: "1px solid #d9d5cc" }}>
            <label style={{ fontSize: 13, color: "#2b2f37", display: "block", marginBottom: 6 }}>
              Belirli pozisyonlar (virgülle ayır, örn: <b>2, 10</b>)
            </label>
            <input type="text"
              key={JSON.stringify(config.bannerAd?.positions || [])}
              defaultValue={(config.bannerAd?.positions || []).join(", ")}
              onChange={e => {
                const arr = e.target.value.split(",")
                  .map(s => parseInt(s.trim()))
                  .filter(n => !isNaN(n) && n > 0);
                setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, positions: arr } }));
              }}
              placeholder="2, 10"
              style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "8px 12px", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
            <p style={{ fontSize: 11, color: "#5f6672", marginTop: 6, marginBottom: 0 }}>
              Bu alan doluysa banner <b>tam bu şarkılardan sonra</b> çıkar (örn. 2. ve 10. şarkıdan sonra). Boş bırakırsan yukarıdaki "her kaç şarkıda bir" ayarı kullanılır.
            </p>
          </div>

          {/* Ülke Kuralları */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: "#16181d", margin: 0, fontSize: 15 }}>Ülke Bazlı Kurallar</h3>
              <button onClick={() => {
                const rules = [...(config.bannerAd?.rules || [])];
                rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
                setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
              }} style={{ background: "transparent", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.bannerAd?.rules || []).length === 0 && (
              <p style={{ color: "#5f6672", fontSize: 13, textAlign: "center", padding: 20 }}>
                Kural yok — banner reklam gösterilmez.
              </p>
            )}

            {(config.bannerAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#f4f2ed", borderRadius: 8, border: `1px solid ${rule.enabled ? "#d97706" : "#d9d5cc"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={rule.enabled}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: e.target.checked };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#8a5a00" : "#5f6672" }}>
                      Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                    </span>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.bannerAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="bannerAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "admob"}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="admob">Google AdMob</option>
                      <option value="custom">Kendi Görselim (Resim + Link)</option>
                    </select>
                  </div>
                </div>

                {rule.type === "admob" && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy"
                      value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                )}

                {rule.type === "custom" && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                      <input type="text" placeholder="https://example.com/banner.jpg"
                        value={rule.imageUrl || ""}
                        onChange={e => {
                          const rules = [...(config.bannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                          setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                      <input type="text" placeholder="https://example.com/landing"
                        value={rule.clickUrl || ""}
                        onChange={e => {
                          const rules = [...(config.bannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                          setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button onClick={updateConfig}
            style={{ background: "#3c4fe0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* ALT BANNER REKLAM */}
        {activeSection === "bottombanner" && <div style={styles.card}>
          <h2 style={styles.title}>Alt Banner Reklam</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 20 }}>
            Ekranın en altında sabit duran banner reklam. Ülke bazlı Google AdMob veya kendi görseliniz.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: "#2b2f37" }}>Alt Banner Aktif:</label>
            <input type="checkbox" checked={config.bottomBannerAd?.enabled || false}
              onChange={e => setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, enabled: e.target.checked } }))}
              style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ color: config.bottomBannerAd?.enabled ? "#0d6b4d" : "#b42318", fontSize: 12, fontWeight: 600 }}>
              {config.bottomBannerAd?.enabled ? "AKTİF" : "KAPALI"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ color: "#16181d", margin: 0, fontSize: 15 }}>Ülke Bazlı Kurallar</h3>
            <button onClick={() => {
              const rules = [...(config.bottomBannerAd?.rules || [])];
              rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
              setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
            }} style={{ background: "transparent", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Kural Ekle
            </button>
          </div>

          {(config.bottomBannerAd?.rules || []).length === 0 && (
            <p style={{ color: "#5f6672", fontSize: 13, textAlign: "center", padding: 20 }}>
              Kural yok — alt banner gösterilmez.
            </p>
          )}

          {(config.bottomBannerAd?.rules || []).map((rule, idx) => (
            <div key={idx} style={{ padding: "14px", background: "#f4f2ed", borderRadius: 8, border: `1px solid ${rule.enabled ? "#d97706" : "#d9d5cc"}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={rule.enabled}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], enabled: e.target.checked };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }} style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#8a5a00" : "#5f6672" }}>
                    Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                  </span>
                </div>
                <button onClick={() => {
                  const rules = [...(config.bottomBannerAd?.rules || [])];
                  rules.splice(idx, 1);
                  setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                }} style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 13 }}>Sil</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                <CountryRulePicker rule={rule} idx={idx} configKey="bottomBannerAd" config={config} setConfig={setConfig} />
                <div>
                  <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                  <select value={rule.type || "admob"}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], type: e.target.value };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }}
                    style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                    <option value="admob">Google AdMob</option>
                    <option value="custom">Kendi Görselim (Resim + Link)</option>
                  </select>
                </div>
              </div>

              {rule.type === "admob" && (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                  <input type="text" placeholder="ca-app-pub-xxx/yyy"
                    value={rule.admobUnitId || ""}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }}
                    style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                </div>
              )}

              {rule.type === "custom" && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                    <input type="text" placeholder="https://example.com/banner.jpg"
                      value={rule.imageUrl || ""}
                      onChange={e => {
                        const rules = [...(config.bottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                        setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                    <input type="text" placeholder="https://example.com/landing"
                      value={rule.clickUrl || ""}
                      onChange={e => {
                        const rules = [...(config.bottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                        setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                </>
              )}
            </div>
          ))}

          <button onClick={updateConfig}
            style={{ background: "#3c4fe0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* ZİL SESİ REKLAMI — YouTube reklamlarından tamamen bağımsız (ringtoneBannerAd / ringtoneBottomBannerAd) */}
        {activeSection === "ringtonead" && <div style={styles.card}>
          <h2 style={styles.title}>Zil Sesi Modu Reklamı</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 20 }}>
            Yalnızca <b>Zil Sesi Modu</b> için reklam. YouTube modundaki reklamlardan tamamen bağımsızdır.
            Liste içinde belirli aralıklarla banner + ekranın en altında sabit banner.
          </p>

          {/* ===== LİSTE-İÇİ BANNER (ringtoneBannerAd) ===== */}
          <div style={{ padding: "16px", background: "#eef3fd", borderRadius: 8, border: "1px solid #cfdcf7", marginBottom: 24 }}>
            <h3 style={{ color: "#16181d", margin: "0 0 14px 0", fontSize: 15 }}>Liste-içi Banner (zil sesleri arasında)</h3>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 14, color: "#2b2f37" }}>Liste-içi Banner Aktif:</label>
              <input type="checkbox" checked={config.ringtoneBannerAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.ringtoneBannerAd?.enabled ? "#0d6b4d" : "#b42318", fontSize: 12, fontWeight: 600 }}>
                {config.ringtoneBannerAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Her kaç zil sesinde bir banner göster:</label>
              <select value={config.ringtoneBannerAd?.showEveryNth || 3}
                onChange={e => setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, showEveryNth: parseInt(e.target.value) } }))}
                style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                <option value={2}>Her 2 zilde bir</option>
                <option value={3}>Her 3 zilde bir</option>
                <option value={4}>Her 4 zilde bir</option>
                <option value={5}>Her 5 zilde bir</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#2b2f37", display: "block", marginBottom: 6 }}>
                Belirli pozisyonlar (virgülle ayır, örn: <b>2, 6</b>)
              </label>
              <input type="text"
                key={JSON.stringify(config.ringtoneBannerAd?.positions || [])}
                defaultValue={(config.ringtoneBannerAd?.positions || []).join(", ")}
                onChange={e => {
                  const arr = e.target.value.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                  setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, positions: arr } }));
                }}
                placeholder="2, 6"
                style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "8px 12px", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
              <p style={{ fontSize: 11, color: "#5f6672", marginTop: 6, marginBottom: 0 }}>
                Doluysa banner tam bu zillerden sonra çıkar. Boşsa yukarıdaki "her kaç zilde bir" kullanılır.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ color: "#16181d", margin: 0, fontSize: 14 }}>Ülke Bazlı Kurallar</h4>
              <button onClick={() => {
                const rules = [...(config.ringtoneBannerAd?.rules || [])];
                rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
                setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
              }} style={{ background: "transparent", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.ringtoneBannerAd?.rules || []).length === 0 && (
              <p style={{ color: "#5f6672", fontSize: 13, textAlign: "center", padding: 16 }}>Kural yok — banner gösterilmez.</p>
            )}

            {(config.ringtoneBannerAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#f4f2ed", borderRadius: 8, border: `1px solid ${rule.enabled ? "#0b6aa2" : "#d9d5cc"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={rule.enabled}
                      onChange={e => {
                        const rules = [...(config.ringtoneBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: e.target.checked };
                        setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                      }} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#0b6aa2" : "#5f6672" }}>
                      Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                    </span>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.ringtoneBannerAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="ringtoneBannerAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "admob"}
                      onChange={e => {
                        const rules = [...(config.ringtoneBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="admob">Google AdMob</option>
                      <option value="custom">Kendi Görselim (Resim + Link)</option>
                    </select>
                  </div>
                </div>

                {rule.type === "admob" && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy" value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.ringtoneBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                )}

                {rule.type === "custom" && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                      <input type="text" placeholder="https://example.com/banner.jpg" value={rule.imageUrl || ""}
                        onChange={e => {
                          const rules = [...(config.ringtoneBannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                          setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                      <input type="text" placeholder="https://example.com/landing" value={rule.clickUrl || ""}
                        onChange={e => {
                          const rules = [...(config.ringtoneBannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                          setConfig(prev => ({ ...prev, ringtoneBannerAd: { ...prev.ringtoneBannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ===== SABİT ALT BANNER (ringtoneBottomBannerAd) ===== */}
          <div style={{ padding: "16px", background: "#eef3fd", borderRadius: 8, border: "1px solid #cfdcf7", marginBottom: 24 }}>
            <h3 style={{ color: "#16181d", margin: "0 0 14px 0", fontSize: 15 }}>Sabit Alt Banner</h3>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 14, color: "#2b2f37" }}>Alt Banner Aktif:</label>
              <input type="checkbox" checked={config.ringtoneBottomBannerAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.ringtoneBottomBannerAd?.enabled ? "#0d6b4d" : "#b42318", fontSize: 12, fontWeight: 600 }}>
                {config.ringtoneBottomBannerAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ color: "#16181d", margin: 0, fontSize: 14 }}>Ülke Bazlı Kurallar</h4>
              <button onClick={() => {
                const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
                setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
              }} style={{ background: "transparent", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.ringtoneBottomBannerAd?.rules || []).length === 0 && (
              <p style={{ color: "#5f6672", fontSize: 13, textAlign: "center", padding: 16 }}>Kural yok — alt banner gösterilmez.</p>
            )}

            {(config.ringtoneBottomBannerAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#f4f2ed", borderRadius: 8, border: `1px solid ${rule.enabled ? "#0b6aa2" : "#d9d5cc"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={rule.enabled}
                      onChange={e => {
                        const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: e.target.checked };
                        setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                      }} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#0b6aa2" : "#5f6672" }}>
                      Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                    </span>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="ringtoneBottomBannerAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "admob"}
                      onChange={e => {
                        const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                      }}
                      style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="admob">Google AdMob</option>
                      <option value="custom">Kendi Görselim (Resim + Link)</option>
                    </select>
                  </div>
                </div>

                {rule.type === "admob" && (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy" value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                )}

                {rule.type === "custom" && (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                      <input type="text" placeholder="https://example.com/banner.jpg" value={rule.imageUrl || ""}
                        onChange={e => {
                          const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                          setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: "#4b5260", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                      <input type="text" placeholder="https://example.com/landing" value={rule.clickUrl || ""}
                        onChange={e => {
                          const rules = [...(config.ringtoneBottomBannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                          setConfig(prev => ({ ...prev, ringtoneBottomBannerAd: { ...prev.ringtoneBottomBannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button onClick={updateConfig}
            style={{ background: "#3c4fe0", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Zil Sesi Reklam Ayarlarını Kaydet
          </button>
        </div>}

        {/* REKLAMSIZ ÜLKELER */}
        {activeSection === "adfree" && <div className="v2-stack">
          <V2Sec title="Reklamsız ülkeler" desc="Bu ülkelerde hiçbir reklam gösterilmez (indirme reklamı ve bannerlar dahil).">
          <div className="v2-row stack">

          <div style={{ position: "relative", marginBottom: 16 }}>
            <div
              onClick={() => document.getElementById("adFreeDropdown").style.display = document.getElementById("adFreeDropdown").style.display === "block" ? "none" : "block"}
              style={{ background: "#eeebe5", color: "#16181d", border: "1px solid #d9d5cc", borderRadius: 6, padding: "8px 12px", fontSize: 13, cursor: "pointer", minHeight: 36 }}>
              {(config.adFreeCountries || []).length > 0
                ? (config.adFreeCountries || []).map(c => { const found = COUNTRY_LIST.find(x => x.code === c); return found ? `${found.code} ${found.name}` : c; }).join(", ")
                : "Ülke seçin..."}
            </div>
            <div id="adFreeDropdown" style={{ display: "none", position: "absolute", top: "100%", left: 0, right: 0, background: "#eeebe5", border: "1px solid #cdc8be", borderRadius: 6, maxHeight: 250, overflowY: "auto", zIndex: 999 }}>
              {COUNTRY_LIST.map(c => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", padding: "6px 12px", fontSize: 13, color: "#2b2f37", cursor: "pointer" }}>
                  <input type="checkbox" checked={(config.adFreeCountries || []).includes(c.code)}
                    onChange={e => {
                      const countries = [...(config.adFreeCountries || [])];
                      if (e.target.checked) countries.push(c.code);
                      else countries.splice(countries.indexOf(c.code), 1);
                      setConfig(prev => ({ ...prev, adFreeCountries: countries }));
                    }} style={{ marginRight: 10 }} />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          </div>

          {(config.adFreeCountries || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {(config.adFreeCountries || []).map(c => {
                const found = COUNTRY_LIST.find(x => x.code === c);
                return (
                  <span key={c} className="v2-chip">
                    {found ? `${found.code} ${found.name}` : c}
                    <span style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => {
                      setConfig(prev => ({ ...prev, adFreeCountries: (prev.adFreeCountries || []).filter(x => x !== c) }));
                    }}>×</span>
                  </span>
                );
              })}
            </div>
          )}

          </div>
          <V2Foot><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></V2Foot>
          </V2Sec>
        </div>}

        {/* ASN AYARLARI */}
        {activeSection === "asn" && <div className="v2-stack">
          <V2Sec title="Zorunlu zil sesi (ASN)" desc="Bu ağlardan gelen cihazlar ülke ayarına ve genel moda bakılmadan zil sesinde açılır. ASN cihazın IP'sinden bulunur; değişiklik bir sonraki açılışta geçerli olur.">
          <div className="v2-row stack">

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              value={asnInput}
              onChange={e => setAsnInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAsn(); } }}
              placeholder="ASN girin (ör. 15169 veya AS15169)"
              style={{ ...styles.input, flex: 1 }}
            />
            <button onClick={addAsn} style={{ ...styles.primaryBtn }}>
              Ekle
            </button>
          </div>

          {(config.ringtoneAsns || []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {(config.ringtoneAsns || []).map(a => (
                <span key={a} className="v2-chip">
                  AS{a}
                  <span style={{ cursor: "pointer", fontWeight: 700 }}
                    onClick={() => setConfig(prev => ({ ...prev, ringtoneAsns: (prev.ringtoneAsns || []).filter(x => x !== a) }))}>×</span>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: "#5f6672", fontSize: 13, marginBottom: 20 }}>
              Henüz ASN eklenmedi — mod kararı tamamen ülke/global ayarına göre veriliyor.
            </p>
          )}

          </div>
          <V2Foot><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></V2Foot>
          </V2Sec>
        </div>}

        {/* DEVICE ACTIONS */}
        {activeSection === "device" && (() => {
          const typeOpts = [
            { key: "chrome_url", icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', t: "Link aç", d: "Chrome'da URL açar" },
            { key: "package_name", icon: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/>', t: "Uygulama aç", d: "Paket adıyla açar / Store'a gider" },
            { key: "review_sheet", icon: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', t: "Puan iste", d: "Play değerlendirme penceresi" },
          ];
          const ico = (d, cls) => <svg className={cls} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: d }} />;
          const seg = (opts, val, set) => (
            <div className="da-seg">
              {opts.map(([v, l]) => <button key={String(v)} type="button" className={val === v ? "on" : ""} onClick={() => set(v)}>{l}</button>)}
            </div>
          );
          const amLabel = (am) => am === "ringtone" ? "Zil sesi" : am === "both" ? "İkisi" : "Müzik";
          const ccSummary = daCountryMode === "all" || !daCountries.length ? "Tüm ülkeler"
            : (daCountryMode === "exclude" ? "Hariç: " : "Sadece: ") + daCountries.slice(0, 4).join(", ") + (daCountries.length > 4 ? ` +${daCountries.length - 4}` : "");
          const verSummary = !daMinVersion && !daMaxVersion ? "Tüm sürümler" : `Sürüm ${daMinVersion || "—"} → ${daMaxVersion || "—"}`;
          // Hedefe uyan cihaz tahmini: seçili uygulamanın son 5 dk verisi (sürüm/kullanım şartı hesaba katılmaz)
          const pts = daStats.data ? daStats.data.points.filter(p => !p.missing) : [];
          const lp = pts[pts.length - 1];
          let match = null;
          if (lp) {
            const cc = lp.c || {};
            const ccSum = (list) => list.reduce((a, k) => a + (cc[k] || 0), 0);
            const base = daCountryMode === "include" && daCountries.length ? ccSum(daCountries)
              : daCountryMode === "exclude" && daCountries.length ? Math.max(0, lp.t - ccSum(daCountries)) : lp.t;
            const share = lp.t > 0 ? (daAppMode === "ringtone" ? lp.r / lp.t : daAppMode === "youtube" ? lp.y / lp.t : 1) : 0;
            match = Math.round(base * share);
          }
          const directText = daActionType === "chrome_url" ? "Kullanıcı hiçbir şey görmeden link açılır"
            : daActionType === "package_name" ? "Kullanıcı hiçbir şey görmeden uygulama / Store açılır" : "Play değerlendirme penceresi açılır";
          return (
          <div style={styles.card}>
            <h2 style={styles.title}>Popup Gönder</h2>
            <p style={{ color: "#4b5260", fontSize: 13, margin: "-6px 0 18px" }}>
              Android cihazlara uzaktan komut gönderin. Aktif action cihaz tarafından otomatik algılanır.
            </p>
            <div className="da-grid">
              <div>
                <div className="da-step">
                  <div className="da-sh"><b>1</b>Ne yapsın</div>
                  <div className="da-types">
                    {typeOpts.map(t => (
                      <button key={t.key} type="button" className={"da-type" + (daActionType === t.key ? " on" : "")} onClick={() => setDaActionType(t.key)}>
                        {ico(t.icon)}<span>{t.t}</span><small>{t.d}</small>
                      </button>
                    ))}
                  </div>
                  {daActionType !== "review_sheet" && (
                    <>
                      <label className="da-lbl">{daActionType === "chrome_url" ? "Adres (https://…)" : "Paket adı"}</label>
                      <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                        placeholder={daActionType === "chrome_url" ? "https://example.com" : "com.whatsapp"}
                        value={daValue} onChange={e => setDaValue(e.target.value)} />
                    </>
                  )}
                </div>

                <div className="da-step">
                  <div className="da-sh"><b>2</b>Nasıl gösterilsin</div>
                  {seg([["direct", "Sessiz (direkt)"], ["popup", "Onaylı popup"]], daMode, setDaMode)}
                  {daMode === "popup" && (
                    <>
                      <label className="da-lbl">Mesaj (opsiyonel)</label>
                      <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                        placeholder="Kullanıcıya gösterilecek mesaj..." value={daLabel} onChange={e => setDaLabel(e.target.value)} />
                      <div className="da-two">
                        <div>
                          <label className="da-lbl">Onay butonu</label>
                          <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }} placeholder="Aç / Güncelle / Tamam…"
                            value={daConfirmText} onChange={e => setDaConfirmText(e.target.value)} />
                        </div>
                        <div>
                          <label className="da-lbl">İptal butonu</label>
                          <input style={{ ...styles.input, width: "100%", boxSizing: "border-box", opacity: daForceAction ? 0.4 : 1 }} placeholder="İptal / Sonra…"
                            disabled={daForceAction} value={daCancelText} onChange={e => setDaCancelText(e.target.value)} />
                        </div>
                      </div>
                      <label className="da-row" style={{ cursor: "pointer", color: daForceAction ? "#b42318" : undefined }}>
                        <span>Zorunlu — kullanıcı kapatamaz, onaya basmak zorunda</span>
                        <input type="checkbox" checked={daForceAction} onChange={e => setDaForceAction(e.target.checked)} />
                      </label>
                    </>
                  )}
                </div>

                <div className="da-step">
                  <div className="da-sh"><b>3</b>Kime</div>
                  <div className="da-row"><span>Uygulama modu</span>{seg([["youtube", "Müzik"], ["ringtone", "Zil sesi"], ["both", "İkisi"]], daAppMode, setDaAppMode)}</div>
                  <div className="da-row"><span>Sıklık</span>{seg([[true, "Bir kez"], [false, "Her açılışta"]], daShowOnce, setDaShowOnce)}</div>
                  <div className="da-row">
                    <span>En az kullanım</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {seg([[0, "Yok"], [3, "3+"], [5, "5+"], [10, "10+"]], Number(daMinLaunches), setDaMinLaunches)}
                      <input type="number" min="0" max="1000" style={{ ...styles.input, width: 72, padding: "6px 8px" }} placeholder="Özel"
                        value={daMinLaunches || ""} onChange={e => setDaMinLaunches(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                  </div>
                  <div className="da-row" style={{ alignItems: "flex-start" }}>
                    <span style={{ paddingTop: 8 }}>Ülkeler</span>
                    <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0, justifyContent: "flex-end", maxWidth: 420 }}>
                      <select style={{ ...styles.input, width: 130, alignSelf: "flex-start" }} value={daCountryMode} onChange={e => setDaCountryMode(e.target.value)}>
                        <option value="all">Tüm ülkeler</option>
                        <option value="include">Sadece şunlar</option>
                        <option value="exclude">Şunlar hariç</option>
                      </select>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <DaCountryPicker mode={daCountryMode} countries={daCountries} onChange={setDaCountries} disabled={daCountryMode === "all"} />
                      </div>
                    </div>
                  </div>
                  <div className="da-row">
                    <span>Sürüm (versionCode)</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" style={{ ...styles.input, width: 80, padding: "6px 8px" }} placeholder="min" value={daMinVersion} onChange={e => setDaMinVersion(e.target.value)} />
                      <span style={{ color: "#5f6672" }}>—</span>
                      <input type="number" style={{ ...styles.input, width: 80, padding: "6px 8px" }} placeholder="max" value={daMaxVersion} onChange={e => setDaMaxVersion(e.target.value)} />
                    </div>
                  </div>
                  <div className="da-hint">0 / boş = sınırsız · eski sürüme göstermek için max=99</div>
                </div>
              </div>

              {/* Önizleme + özet + gönder */}
              <div className="da-side">
                <div className="da-phone">
                  <div className="da-screen">
                    <div className="da-app"><span className="pn-av" style={{ background: brand, width: 22, height: 22, fontSize: 11, borderRadius: 6 }}>{String(currentApp.name || appId).trim().charAt(0).toLocaleUpperCase("tr")}</span>{currentApp.name || appId}</div>
                    {daMode === "popup" ? (
                      <div className="da-dlg">
                        <div className={daLabel ? "" : "da-muted"}>{daLabel || "Varsayılan mesaj"}</div>
                        <div className="da-btns">
                          {!daForceAction && <span>{daCancelText || "İptal"}</span>}
                          <b>{daConfirmText || "Tamam"}</b>
                        </div>
                      </div>
                    ) : (
                      <div className="da-direct">
                        {ico(daActionType === "review_sheet" ? typeOpts[2].icon : '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')}
                        <span>{directText}</span>
                        {daActionType !== "review_sheet" && daValue && <code>{daValue}</code>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="da-chips">
                  {[amLabel(daAppMode), ccSummary, daShowOnce ? "Bir kez" : "Her açılışta", Number(daMinLaunches) > 0 ? `${daMinLaunches}+ kullanım` : "Kullanım şartı yok", verSummary].map(x => <span key={x}>{x}</span>)}
                </div>
                <div className="da-match">
                  <b>{match == null ? "—" : `≈ ${match}`}</b>
                  <span>cihaz şu an hedefe uyuyor<br /><small>son 5 dk · sürüm ve kullanım şartı hesaba katılmaz</small></span>
                </div>
                <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={createDeviceAction}>Gönder</button>
              </div>
            </div>

            {/* Geçmiş — tek satır; tıklayınca ayrıntı */}
            {deviceActions.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <h3 style={{ color: "#16181d", fontSize: 14, margin: "0 0 10px" }}>Geçmiş</h3>
                <div className="da-hist">
                  {deviceActions.map(action => {
                    const am = action.appMode || "youtube";
                    const cList = Array.isArray(action.countries) ? action.countries : [];
                    const cMode = action.countryMode || "all";
                    const countryText = cMode === "all" || cList.length === 0
                      ? "🌍 Tüm ülkeler"
                      : (cMode === "exclude" ? "🚫 Hariç: " : "✅ Sadece: ") + cList.map(c => `${countryFlag(c)} ${countryName(c)}`).join(", ");
                    const ccShort = cMode === "all" || cList.length === 0 ? "Tüm ülkeler"
                      : (cMode === "exclude" ? "Hariç " : "") + cList.slice(0, 3).join(", ") + (cList.length > 3 ? ` +${cList.length - 3}` : "");
                    const verText = !action.minVersion && !action.maxVersion
                      ? "Tüm sürümler"
                      : `${action.minVersion || "—"} → ${action.maxVersion || "—"}`;
                    const created = action.createdAt
                      ? new Date(action.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—";
                    const typeText = action.actionType === "chrome_url" ? "🌐 Chrome URL"
                      : action.actionType === "package_name" ? "📦 Package Name" : "⭐ Review Sheet";
                    const details = [
                      ["Komut", typeText],
                      ["Gönderim", action.mode === "direct" ? "⚡ Direct (Sessiz)" : "💬 Popup (Onaylı)"],
                      ["Uygulama modu", am === "ringtone" ? "🔔 Zil Sesi Modu" : am === "both" ? "🌐 Her İkisi" : "▶️ YouTube Modu"],
                      ["Sıklık", action.showOnce === false ? "🔁 Her açılışta" : "1️⃣ Tek seferlik"],
                      ["Kullanım şartı", action.minLaunches > 0 ? `🔢 En az ${action.minLaunches} kullanım` : "Şart yok"],
                      ["Sürüm (versionCode)", verText],
                      ["Ülkeler", countryText],
                    ];
                    if (action.mode === "popup") {
                      details.push(["Popup mesajı", action.label || "Varsayılan"]);
                      details.push(["Butonlar", `✅ ${action.confirmText || "Varsayılan"}${action.forceAction ? "" : ` · ✖️ ${action.cancelText || "Varsayılan"}`}`]);
                      details.push(["Zorunlu", action.forceAction ? "🔒 Evet, kapatılamaz" : "Hayır"]);
                    }
                    const open = daOpenId === action.id;
                    const t = typeOpts.find(x => x.key === action.actionType) || typeOpts[2];
                    return (
                      <div key={action.id} className={"da-hr" + (action.active ? " act" : "")}>
                        <div className="da-hr-main" onClick={() => setDaOpenId(open ? null : action.id)}>
                          <span className={"da-pill" + (action.active ? " on" : "")}>{action.active ? "Aktif" : "Pasif"}</span>
                          {ico(t.icon, "da-hr-i")}
                          <span className="da-hr-v">{action.actionType === "review_sheet" ? "Puan iste" : action.value}</span>
                          <span className="da-tag">{amLabel(am)}</span>
                          <span className="da-tag">{ccShort}</span>
                          <span className="da-cnt">{action.executedCount || 0} kez</span>
                          <span className="da-acts" onClick={e => e.stopPropagation()}>
                            {action.active && <button type="button" onClick={() => deactivateDeviceAction(action.id)} className="da-b warn">Durdur</button>}
                            <button type="button" onClick={() => deleteDeviceAction(action.id)} className="da-b">Sil</button>
                          </span>
                          <svg className={"pn-chev" + (open ? " open" : "")} viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                        {open && (
                          <div className="da-det">
                            {details.map(([k, v]) => (
                              <div key={k} style={{ gridColumn: k === "Ülkeler" ? "1 / -1" : undefined }}>
                                <small>{k}</small><div>{v}</div>
                              </div>
                            ))}
                            <div style={{ gridColumn: "1 / -1", color: "#5f6672", fontFamily: "monospace", fontSize: 11 }}>{created} · ID: {action.id}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* APP CONTROLS */}
        {activeSection === "appcontrols" && <div className="v2-stack">
          <V2Sec title="Zorunlu review" desc="Kullanıcı uygulamayı belirtilen sayıda açınca Google Play değerlendirme penceresi çıkar.">
            <V2Row title="Aktif">
              <input type="checkbox" aria-label="Review aktif" checked={config.appControls?.reviewEnabled || false}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), reviewEnabled: e.target.checked } })} />
            </V2Row>
            <V2Row title="Kaçıncı açılışta">
              <input type="number" min="1" max="100" aria-label="Kaçıncı açılışta"
                style={{ ...styles.input, width: 80, textAlign: "center" }}
                value={config.appControls?.reviewAtLaunch || 2}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), reviewAtLaunch: parseInt(e.target.value) || 2 } })} />
            </V2Row>
            <V2Row title="Şimdi gönder" sub="Tüm aktif kullanıcılara anında gönderilir">
              <button className="v2-btn" onClick={() => {
                fetch(`${API_URL}/device-action/create`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                  body: JSON.stringify({ actionType: "review_sheet", mode: "popup", value: "", label: "Rate us on Play Store! ⭐" })
                }).then(r => r.json()).then(d => {
                  if (d.ok) alert("✅ Review tetiklendi! Tüm kullanıcılara gönderildi.");
                  else alert("Hata: " + (d.error || "Gönderilemedi"));
                }).catch(() => alert("Sunucuya bağlanılamadı!"));
              }}>Anlık review gönder</button>
            </V2Row>
          </V2Sec>

          <V2Sec title="Zorunlu güncelleme" desc="Sürüm kodu minimumun altındaysa tam ekran güncelleme ekranı çıkar; kullanıcı yalnızca güncelleyebilir.">
            <V2Row title="Aktif">
              <input type="checkbox" aria-label="Zorunlu güncelleme aktif" checked={config.appControls?.forceUpdateEnabled || false}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), forceUpdateEnabled: e.target.checked } })} />
            </V2Row>
            <V2Row title="Minimum sürüm kodu" sub="versionCode (sayı)">
              <input type="number" min="1" aria-label="Minimum sürüm kodu"
                style={{ ...styles.input, width: 110 }}
                placeholder="2"
                value={config.appControls?.minVersionCode || ""}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), minVersionCode: parseInt(e.target.value) || 1 } })} />
            </V2Row>
            <V2Row title="Minimum sürüm adı">
              <input type="text" aria-label="Minimum sürüm adı"
                style={{ ...styles.input, width: 130 }}
                placeholder="1.1.0"
                value={config.appControls?.minVersionName || ""}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), minVersionName: e.target.value } })} />
            </V2Row>
            <V2Row title="Play Store paket adı" stack>
              <input type="text" aria-label="Play Store paket adı"
                style={{ ...styles.input, width: "100%" }}
                placeholder="com.example.ringtonemasterv2"
                value={config.appControls?.packageName || "com.example.ringtonemasterv2"}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), packageName: e.target.value } })} />
            </V2Row>
            <V2Row title="Güncelleme mesajı" stack>
              <input type="text" aria-label="Güncelleme mesajı"
                style={{ ...styles.input, width: "100%" }}
                placeholder="Yeni versiyon mevcut! Devam etmek için güncelleyin."
                value={config.appControls?.updateMessage || ""}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), updateMessage: e.target.value } })} />
            </V2Row>
            <V2Row title="Şimdi gönder" sub="Tüm aktif kullanıcılara anında gönderilir">
              <button className="v2-btn" onClick={() => {
                const pkg = config.appControls?.packageName || "com.example.ringtonemasterv2";
                fetch(`${API_URL}/device-action/create`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                  body: JSON.stringify({ actionType: "package_name", mode: "popup", value: pkg, label: "A new version is available! Please update. 🔄" })
                }).then(r => r.json()).then(d => {
                  if (d.ok) alert("✅ Güncelleme tetiklendi! Tüm kullanıcılara gönderildi.");
                  else alert("Hata: " + (d.error || "Gönderilemedi"));
                }).catch(() => alert("Sunucuya bağlanılamadı!"));
              }}>Anlık güncelleme gönder</button>
            </V2Row>
          </V2Sec>
          <div className="v2-endsave"><button style={styles.primaryBtn} onClick={updateConfig}>Kaydet</button></div>
        </div>}

        {/* API PROVIDERS */}
        {activeSection === "albums" && !PANEL_LOCKED && <AlbumsSection apiUrl={API_URL} />}

        {activeSection === "apiproviders" && <div style={styles.card}>
          <h2 style={styles.title}>API Durumu</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 24 }}>
            İndirme için kullanılan üçüncü parti servislerin canlı durumu
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ color: "#4b5260", fontSize: 13 }}>{apiHealth.filter(p => p.status === "online").length}/{apiHealth.length || (apiProviders?.providers?.length || 0)} API erişilebilir</span>
            <button style={{ ...styles.primaryBtn }} onClick={() => {
              fetch(`${API_URL}/admin/api-health`, { headers: { "X-App-Key": APP_KEY } })
                .then(r => r.json())
                .then(d => setApiHealth(d.providers || []))
                .catch(() => alert("Sağlık kontrolü başarısız"));
            }}>Yenile</button>
          </div>

          {/* Sağlık durumu özeti (salt-okunur) */}
          {apiHealth.length > 0 && apiHealth.map((p, i) => (
            <div key={"h" + (p.id || i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 8, padding: "10px 16px", marginBottom: 8 }}>
              <span style={{ color: "#2b2f37", fontSize: 13 }}>{p.name || p.id} <span style={{ color: "#5f6672" }}>· öncelik {p.priority}</span></span>
              <span style={{
                backgroundColor: p.status === "online" ? "#065f4620" : "#7f1d1d20",
                color: p.status === "online" ? "#0d6b4d" : "#b42318",
                padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600
              }}>
                {p.status === "online" ? `✅ Çalışıyor (HTTP ${p.httpStatus})` : "❌ Erişilemiyor"}{p.enabled === false ? " · pasif" : ""}
              </span>
            </div>
          ))}

          {/* PROVIDER YÖNETİMİ — ekle / düzenle / sil */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: 0 }}>API Kaynakları</h3>
            <button style={{ ...styles.primaryBtn, fontSize: 13, padding: "6px 14px", backgroundColor: "#3c4fe0", color: "#fff" }}
              onClick={() => {
                const list = [...(apiProviders?.providers || [])];
                const nextPriority = list.length ? Math.max(...list.map(x => x.priority || 0)) + 1 : 1;
                list.push({
                  id: "api_" + Date.now(),
                  name: "Yeni API",
                  enabled: true,
                  priority: nextPriority,
                  baseUrl: "https://",
                  apiKey: "",
                  endpoints: {
                    mp3: "/mp3download.php?id={id}&key={key}&b={bitrate}",
                    mp4: "/mp4download.php?id={id}&key={key}&q={quality}",
                    search: "/searchapi.php?search={query}&key={key}",
                    autocomplete: "/ototamamlamaapi.php?search={query}&key={key}"
                  }
                });
                setApiProviders({ ...apiProviders, providers: list });
              }}>+ Yeni API Ekle</button>
          </div>

          <p style={{ color: "#5f6672", fontSize: 12, marginBottom: 16 }}>
            Düşük öncelik = önce denenir. Bir kaynak çökerse sıradakine geçilir. Şablon değişkenleri: <code style={{ color: "#2a39b8" }}>{"{id} {key} {bitrate} {quality} {query}"}</code> — uygulama hiç güncellenmez.
          </p>

          {(apiProviders?.providers || []).map((p, i) => {
            const updateField = (field, value) => {
              const list = [...apiProviders.providers];
              list[i] = { ...list[i], [field]: value };
              setApiProviders({ ...apiProviders, providers: list });
            };
            const updateEndpoint = (key, value) => {
              const list = [...apiProviders.providers];
              list[i] = { ...list[i], endpoints: { ...(list[i].endpoints || {}), [key]: value } };
              setApiProviders({ ...apiProviders, providers: list });
            };
            const ep = p.endpoints || {};
            return (
              <div key={p.id || i} style={{ background: "#f4f2ed", border: `1px solid ${p.enabled !== false ? "#2a3a2a" : "#3a2a2a"}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <input type="text" placeholder="İsim" style={{ ...styles.input, flex: 1 }}
                    value={p.name || ""} onChange={e => updateField("name", e.target.value)} />
                  <input type="number" placeholder="Öncelik" title="Öncelik (küçük = önce)" style={{ ...styles.input, width: 80 }}
                    value={p.priority ?? ""} onChange={e => updateField("priority", parseInt(e.target.value) || 0)} />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: p.enabled !== false ? "#0d6b4d" : "#b42318", fontSize: 13, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={p.enabled !== false} onChange={e => updateField("enabled", e.target.checked)} />
                    {p.enabled !== false ? "Aktif" : "Pasif"}
                  </label>
                  <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 12px", backgroundColor: "#3c4fe0", color: "#fff" }}
                    onClick={(e) => {
                      const btn = e.target;
                      const original = btn.textContent;
                      btn.textContent = "⏳ Test...";
                      btn.disabled = true;
                      fetch(`${API_URL}/admin/test-provider`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                        body: JSON.stringify({ name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey, endpoints: p.endpoints })
                      }).then(r => r.json()).then(d => {
                        const r2 = d.results || {};
                        const line = (k, lbl) => `${r2[k]?.ok ? "✅" : "❌"} ${lbl}${r2[k]?.ok ? ` (${r2[k].ms}ms)` : ` — ${r2[k]?.error || "hata"}`}`;
                        alert(
                          `🧪 ${d.provider} — ${d.okCount}/4 özellik çalışıyor\n(test video: ${d.videoId})\n\n` +
                          [line("mp3", "MP3 dinle/indir"), line("mp4", "MP4 izle/indir"), line("search", "Arama"), line("autocomplete", "Otomatik tamamlama")].join("\n")
                        );
                      }).catch(() => alert("❌ Test isteği başarısız — sunucuya bağlanılamadı"))
                        .finally(() => { btn.textContent = original; btn.disabled = false; });
                    }}>Test Et</button>
                  <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 12px", backgroundColor: "#dc2626", color: "#fff" }}
                    onClick={() => {
                      if (!window.confirm(`"${p.name || p.id}" silinsin mi?`)) return;
                      const list = apiProviders.providers.filter((_, idx) => idx !== i);
                      setApiProviders({ ...apiProviders, providers: list });
                    }}>Sil</button>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}>
                    <label style={styles.label}>Base URL</label>
                    <input type="text" placeholder="https://site.com" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={p.baseUrl || ""} onChange={e => updateField("baseUrl", e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>API Key</label>
                    <input type="text" placeholder="anahtar (opsiyonel)" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={p.apiKey || ""} onChange={e => updateField("apiKey", e.target.value)} />
                  </div>
                </div>
                <details>
                  <summary style={{ color: "#4b5260", fontSize: 12, cursor: "pointer", marginBottom: 8 }}>Endpoint şablonları (gelişmiş)</summary>
                  {[["mp3", "MP3 indirme"], ["mp4", "MP4 indirme"], ["search", "Arama"], ["autocomplete", "Otomatik tamamlama"]].map(([k, lbl]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <label style={{ ...styles.label, fontSize: 11 }}>{lbl}</label>
                      <input type="text" style={{ ...styles.input, width: "100%", boxSizing: "border-box", fontSize: 12, fontFamily: "monospace" }}
                        value={ep[k] || ""} onChange={e => updateEndpoint(k, e.target.value)} />
                    </div>
                  ))}
                </details>
              </div>
            );
          })}

          <button style={{ ...styles.primaryBtn, marginTop: 8 }} onClick={() => {
            fetch(`${API_URL}/admin/api-providers`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
              body: JSON.stringify({ providers: apiProviders?.providers, smartCache: apiProviders?.smartCache })
            }).then(r => r.json()).then(d => {
              if (d.success) { alert("✅ API kaynakları kaydedildi!"); fetchApiProviders(); }
              else alert("Hata: " + (d.error || "Kaydedilemedi"));
            }).catch(() => alert("Sunucuya bağlanılamadı!"));
          }}>Tüm API Kaynaklarını Kaydet</button>

          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: "0 0 16px 0" }}>API Haritası — Kim Neyi Kullanıyor?</h3>
            <p style={{ color: "#4b5260", fontSize: 12, marginBottom: 16 }}>Uygulamanın her özelliği hangi API kaynağını kullandığını gösterir</p>
            {[
              { feature: "🎵 MP3 Dinleme", source: "Bazocam API", detail: "gamma → cnv sırasıyla", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "🎬 Video İzleme", source: "Bazocam API", detail: "mp4download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "📥 MP3 İndirme", source: "Bazocam API", detail: "mp3download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "📥 MP4 İndirme", source: "Bazocam API", detail: "mp4download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "🔍 Arama", source: "Bazocam API", detail: "searchapi.php", fallback: "YouTube Data API", where: "Backend" },
              { feature: "🔮 Otomatik Tamamlama", source: config?.autocompleteSource === "bazocam" ? "Bazocam API" : "Google Suggest", detail: config?.autocompleteSource === "bazocam" ? "ototamamlamaapi.php" : "suggestqueries.google.com", fallback: "—", where: config?.autocompleteSource === "bazocam" ? "Backend" : "Cihaz (direkt)" },
              { feature: "🏆 Top 50", source: "YouTube Data API v3", detail: "mostPopular chart", fallback: "Piped API", where: "Backend" },
            ].map((api, i) => (
              <div key={i} style={{ background: "#eeebe5", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#16181d", fontSize: 13, fontWeight: 600, minWidth: 160 }}>{api.feature}</span>
                  <span style={{ color: "#0d6b4d", fontSize: 12, fontWeight: 600 }}>{api.source}</span>
                  <span style={{ color: "#5f6672", fontSize: 11, fontFamily: "monospace" }}>{api.detail}</span>
                  <span style={{ color: "#8a5a00", fontSize: 11 }}>Yedek: {api.fallback}</span>
                  <span style={{ backgroundColor: api.where === "Cihaz (direkt)" ? "#7c3aed20" : "#0ea5e920", color: api.where === "Cihaz (direkt)" ? "#2a39b8" : "#0b6aa2", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{api.where}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Autocomplete Kaynak Seçimi */}
          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: "0 0 12px 0" }}>Otomatik Tamamlama Kaynağı</h3>
            <p style={{ color: "#4b5260", fontSize: 12, marginBottom: 16 }}>Arama yazarken önerilerin nereden geleceğini seçin</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { value: "google", label: "Google Suggest", desc: "Ücretsiz, limitsiz, cihazdan direkt", icon: "🌐" },
                { value: "bazocam", label: "Bazocam API", desc: "Patronun API'si, backend üzerinden", icon: "🔌" },
              ].map(opt => (
                <div key={opt.value} onClick={() => setConfig({ ...config, autocompleteSource: opt.value })}
                  style={{
                    flex: 1, background: config?.autocompleteSource === opt.value ? "#065f4630" : "#eeebe5",
                    border: `2px solid ${config?.autocompleteSource === opt.value ? "#12805c" : "#cdc8be"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.2s"
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ color: "#16181d", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ color: "#4b5260", fontSize: 11 }}>{opt.desc}</div>
                  {config?.autocompleteSource === opt.value && <div style={{ color: "#0d6b4d", fontSize: 11, marginTop: 8, fontWeight: 600 }}>Aktif</div>}
                </div>
              ))}
            </div>
            <button style={{ ...styles.primaryBtn, marginTop: 16 }} onClick={() => {
              fetch(`${API_URL}/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                body: JSON.stringify(config)
              }).then(r => r.json()).then(() => alert("✅ Otomatik tamamlama kaynağı güncellendi!"))
                .catch(() => alert("Hata!"));
            }}>Kaydet</button>
          </div>

          {/* Eski endpoint listesi */}
          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: "0 0 12px 0" }}>Bazocam API Endpoint'leri</h3>
            <p style={{ color: "#4b5260", fontSize: 12, marginBottom: 12 }}>Patronun sunucusundaki kullanılabilir endpoint'ler</p>
            {[
              { label: "🎵 MP3 İndir", method: "GET", path: `/mp3download.php?id=VIDEO_ID&key=API_KEY&b=320` },
              { label: "🎬 MP4 İndir", method: "GET", path: `/mp4download.php?id=VIDEO_ID&key=API_KEY&q=720` },
              { label: "🔍 Arama", method: "GET", path: `/searchapi.php?search=SORGU&key=API_KEY` },
              { label: "🔮 Otomatik Tamamlama", method: "GET", path: `/ototamamlamaapi.php?search=SORGU&key=API_KEY` },
            ].map((ep, i) => (
              <div key={i} style={{ background: "#eeebe5", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#16181d", fontSize: 13 }}>{ep.label}</span>
                  <span style={{ backgroundColor: "#065f4620", color: "#0d6b4d", padding: "2px 8px", borderRadius: 4, fontSize: 11, marginLeft: 8 }}>{ep.method}</span>
                  <div style={{ color: "#5f6672", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{ep.path}</div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* SMART CACHE */}
        {activeSection === "smartcache" && <div className="v2-stack">
          <V2Sec title="Akıllı önbellek" desc="Sadece popüler şarkılar önbelleğe alınır. Düşük değer daha çok disk kullanır.">
            <V2Row title="Akıllı önbellek">
              <input type="checkbox" aria-label="Akıllı önbellek" checked={smartCache.enabled}
                onChange={e => setSmartCache({ ...smartCache, enabled: e.target.checked })} />
            </V2Row>
            <V2Row title="Minimum istek sayısı" sub="Bu kadar istek gelmeden önbelleğe alınmaz">
              <input type="number" min="1" max="100" aria-label="Minimum istek sayısı"
                style={{ ...styles.input, width: 80, textAlign: "center" }}
                value={smartCache.minRequests}
                onChange={e => setSmartCache({ ...smartCache, minRequests: parseInt(e.target.value) || 3 })} />
            </V2Row>
            <V2Row title="İstatistikler" sub="Disk ve R2 kullanımı sunucudan alınır">
              <button className="v2-btn" onClick={() => {
                fetch(`${API_URL}/admin/smart-cache`, { headers: { "X-App-Key": APP_KEY } })
                  .then(r => r.json())
                  .then(d => {
                    if (d.smartCache) setSmartCache(d.smartCache);
                    alert(`Disk: ${d.diskUsage || "N/A"}\nR2: ${d.r2Usage || "N/A"}\nMin İstek: ${d.smartCache?.minRequests || 3}`);
                  }).catch(() => alert("İstatistik alınamadı"));
              }}>Getir</button>
            </V2Row>
            <V2Foot><button style={styles.primaryBtn} onClick={() => {
              fetch(`${API_URL}/admin/smart-cache`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                body: JSON.stringify(smartCache)
              }).then(r => r.json()).then(d => {
                if (d.success) alert("✅ Cache ayarları kaydedildi!");
                else alert("Hata: " + (d.error || "Kaydedilemedi"));
              }).catch(() => alert("Sunucuya bağlanılamadı!"));
            }}>Kaydet</button></V2Foot>
          </V2Sec>
        </div>}

        {/* YOUTUBE & TOP50 */}
        {activeSection === "youtube" && <div style={styles.card}>
          <h2 style={styles.title}>YouTube & Top50</h2>
          <p style={{ color: "#4b5260", fontSize: 13, marginBottom: 24 }}>
            YouTube Data API durumu, Top50 ısıtma ve ülke yönetimi
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ color: "#4b5260", fontSize: 13 }}>
              API Durumu: <span style={{ color: youtubeData?.status === "ok" ? "#0d6b4d" : "#b42318", fontWeight: 600 }}>
                {youtubeData?.status === "ok" ? "✅ Aktif" : "❌ Quota Aşıldı"}
              </span>
            </span>
            <button style={{ ...styles.primaryBtn }} onClick={fetchYoutubeData}>Yenile</button>
          </div>

          {/* API Key & Quota */}
          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: "0 0 16px 0" }}>YouTube API</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#eeebe5", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#5f6672", fontSize: 11, marginBottom: 4 }}>API Key</div>
                <div style={{ color: "#16181d", fontSize: 14, fontFamily: "monospace" }}>{youtubeData?.youtubeApiKey || "—"}</div>
              </div>
              <div style={{ background: "#eeebe5", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#5f6672", fontSize: 11, marginBottom: 4 }}>API Çağrısı (restart'tan beri)</div>
                <div style={{ color: "#16181d", fontSize: 14 }}>{youtubeData?.apiCallCount || 0}</div>
              </div>
              <div style={{ background: "#eeebe5", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#5f6672", fontSize: 11, marginBottom: 4 }}>Quota Aşım Sayısı</div>
                <div style={{ color: youtubeData?.quotaExceeded > 0 ? "#b42318" : "#0d6b4d", fontSize: 14 }}>{youtubeData?.quotaExceeded || 0}</div>
              </div>
              <div style={{ background: "#eeebe5", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#5f6672", fontSize: 11, marginBottom: 4 }}>Cache Süresi</div>
                <div style={{ color: "#16181d", fontSize: 14 }}>{youtubeData?.cacheDurationMin || 60} dk</div>
              </div>
            </div>
          </div>

          {/* Warmup Ayarları */}
          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#16181d", fontSize: 16, margin: "0 0 16px 0" }}>Warmup Ayarları</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ color: "#4b5260", fontSize: 13 }}>Güncelleme aralığı:</span>
              <input type="number" min="10" max="1440"
                style={{ ...styles.input, width: 80, textAlign: "center" }}
                defaultValue={youtubeData?.warmupIntervalMin || 50}
                id="warmupInterval" />
              <span style={{ color: "#5f6672", fontSize: 12 }}>dakika</span>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={() => {
                const val = parseInt(document.getElementById("warmupInterval").value);
                if (val < 10 || val > 1440) return alert("10-1440 dakika arası olmalı");
                fetch(`${API_URL}/admin/youtube`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                  body: JSON.stringify({ warmupInterval: val })
                }).then(r => r.json()).then(d => {
                  if (d.success) { alert(`✅ Warmup aralığı ${val} dakika olarak ayarlandı`); fetchYoutubeData(); }
                }).catch(() => alert("Hata!"));
              }}>Uygula</button>
            </div>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#3c4fe0", color: "#fff" }} onClick={() => {
              fetch(`${API_URL}/admin/youtube`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                body: JSON.stringify({ forceWarmup: true })
              }).then(r => r.json()).then(d => {
                if (d.success) alert("✅ Top50 manuel ısıtma başlatıldı!");
              }).catch(() => alert("Hata!"));
            }}>Şimdi Isıt (Manuel)</button>
          </div>

          {/* Aktif Ülkeler */}
          <div style={{ background: "#f4f2ed", border: "1px solid #cdc8be", borderRadius: 10, padding: 20 }}>
            <h3 style={{ color: "#0b6aa2", fontSize: 16, margin: "0 0 16px 0" }}>Aktif Ülkeler ({youtubeData?.activeRegions?.length || 0})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {(youtubeData?.activeRegions || []).map((r, i) => (
                <div key={i} style={{ background: "#eeebe5", border: "1px solid #cdc8be", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{String.fromCodePoint(...r.region.split("").map(c => 127397 + c.charCodeAt(0)))}</span>
                  <span style={{ color: "#16181d", fontSize: 13, fontWeight: 500 }}>{r.region}</span>
                  <span style={{ color: r.cached ? "#0d6b4d" : "#b42318", fontSize: 11 }}>
                    {r.cached ? `${r.trackCount} şarkı` : "cache yok"}
                  </span>
                  <button style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                    onClick={() => {
                      if (!window.confirm(`${r.region} ülkesini kaldırmak istediğine emin misin?`)) return;
                      fetch(`${API_URL}/admin/youtube`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                        body: JSON.stringify({ removeRegion: r.region })
                      }).then(res => res.json()).then(d => { if (d.success) fetchYoutubeData(); }).catch(() => {});
                    }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder="Ülke kodu (ör: DE, FR)" maxLength={2}
                style={{ ...styles.input, width: 160, textTransform: "uppercase" }}
                value={newRegion} onChange={e => setNewRegion(e.target.value.toUpperCase())} />
              <button style={{ ...styles.primaryBtn, backgroundColor: "#3c4fe0", color: "#fff" }} onClick={() => {
                if (newRegion.length !== 2) return alert("2 harfli ülke kodu girin (ör: DE, FR, GB)");
                fetch(`${API_URL}/admin/youtube`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
                  body: JSON.stringify({ addRegion: newRegion })
                }).then(r => r.json()).then(d => {
                  if (d.success) { setNewRegion(""); fetchYoutubeData(); }
                }).catch(() => alert("Hata!"));
              }}>Ülke Ekle</button>
            </div>
            <p style={{ color: "#5f6672", fontSize: 11, marginTop: 12 }}>
              Kullanıcılar bir ülkeden istek attığında o ülke otomatik eklenir. Burada manuel ekleme/kaldırma yapabilirsin.
            </p>
          </div>
        </div>}



    </div>
    </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: "#eeebe5", minHeight: "100vh", color: "#16181d", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding: "40px 20px" },
  content: { maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 30 },
  card: { backgroundColor: "#f4f2ed", padding: "20px 22px", borderRadius: 14, border: "1px solid #d9d5cc" },
  title: { margin: "0 0 18px 0", fontSize: 16, fontWeight: "600", letterSpacing: -0.2, color: "#16181d" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  inputGroup: { display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap", marginBottom: 25 },
  labelCheckbox: { fontSize: 14, color: "#16181d", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  label: { fontSize: 12, color: "#4b5260", display: "block", marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#eeebe5", border: "1px solid #d9d5cc", color: "#16181d", padding: "10px 12px", borderRadius: 10, outline: "none", fontSize: 14 },
  inputDisabled: { backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc", color: "#5f6672", padding: "12px 14px", borderRadius: 10, width: "100%", fontSize: 14, boxSizing: "border-box" },
  select: { backgroundColor: "#eeebe5", border: "1px solid #d9d5cc", color: "#16181d", padding: "10px 12px", borderRadius: 10, outline: "none", fontSize: 14, cursor: "pointer" },
  selectDark: { backgroundColor: "#eeebe5", border: "1px solid #d9d5cc", color: "#16181d", padding: "10px 12px", borderRadius: 10, outline: "none", width: "100%", fontSize: 14, cursor: "pointer", boxSizing: "border-box" },
  primaryBtn: { backgroundColor: "#16181d", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontSize: 13.5, fontWeight: "600" },
  textBtn: { backgroundColor: "transparent", color: "#b42318", border: "none", cursor: "pointer", fontWeight: "500" },
  list: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "10px 14px", color: "#5f6672", fontWeight: "600", fontSize: 12, background: "#f4f2ed", borderBottom: "1px solid #d9d5cc" },
  thRight: { textAlign: "right", padding: "10px 14px", color: "#5f6672", fontWeight: "600", fontSize: 12, background: "#f4f2ed", borderBottom: "1px solid #d9d5cc" },
  tr: { borderBottom: "1px solid #e3e0d9", transition: "background 0.2s" },
  td: { padding: "12px 14px", verticalAlign: "top" },
  tdRight: { padding: "12px 14px", textAlign: "right", verticalAlign: "top" },
  actionBtn: { background: "none", border: "none", color: "#2a39b8", cursor: "pointer", fontSize: 13, fontWeight: "600", padding: 0 },
  
  chipContainer: { display: "flex", flexWrap: "wrap", gap: 10 },
  chip: { backgroundColor: "#f4f2ed", padding: "4px 10px", borderRadius: 8, fontSize: 12.5, color: "#16181d", border: "1px solid #d9d5cc" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "#f4f2ed", width: "100%", maxWidth: 650, borderRadius: 16, border: "1px solid #d9d5cc", boxShadow: "0 25px 60px rgba(22,24,29,0.12)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #d9d5cc" },
  modalTitle: { margin: 0, fontSize: 16, color: "#16181d", fontWeight: "600" },
  cancelBtn: { backgroundColor: "transparent", color: "#16181d", border: "1px solid #d9d5cc", padding: "10px 16px", borderRadius: 10, cursor: "pointer", marginRight: 10, fontSize: 13.5, fontWeight: "600" },
  saveBtn: { backgroundColor: "#16181d", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, fontWeight: "600" },
  modalBody: { padding: "22px 24px" },
  formGroup: { marginBottom: 25 },
  
  chipsInputBox: { backgroundColor: "#eeebe5", border: "1px solid #d9d5cc", borderRadius: 10, padding: "12px", display: "flex", flexWrap: "wrap", gap: 8, minHeight: 110 },
  chipEditable: { backgroundColor: "#e8e5de", padding: "5px 10px", borderRadius: 8, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, color: "#16181d" },
  chipClose: { cursor: "pointer", color: "#4b5260", fontSize: 14 },
  chipInput: { background: "transparent", border: "none", color: "#16181d", outline: "none", flex: 1, minWidth: 200, fontSize: 14 },
  
  filterBox: { backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 12, padding: "18px" },
  multiSelectHeader: { backgroundColor: "#eeebe5", border: "1px solid #d9d5cc", color: "#16181d", padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 14, userSelect: "none" },
  multiSelectList: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#f4f2ed", border: "1px solid #d9d5cc", borderRadius: 10, maxHeight: 250, overflowY: "auto", zIndex: 10, marginTop: 4 },
  multiSelectItem: { display: "flex", alignItems: "center", padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #e3e0d9", fontSize: 14, color: "#16181d" }
};

export default App;

