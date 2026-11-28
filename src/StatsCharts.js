import React, { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "@rsuite/charts";

/* Panel grafikleri — veri: GET /admin/stats-series (backend stats_series.js) */

export const RANGES = [
  { key: "live", label: "Anlık", hint: "Son 15 dakika, dakika dakika", refresh: 15000 },
  { key: "1h", label: "Saatlik", hint: "Son 1 saat, dakika dakika", refresh: 30000 },
  { key: "24h", label: "24 saat", hint: "Son 24 saat, saat saat", refresh: 120000 },
  { key: "7d", label: "1 hafta", hint: "Son 7 gün, saat saat", refresh: 300000 },
  { key: "30d", label: "30 gün", hint: "Son 30 gün, gün gün", refresh: 300000 },
];
const TZ = "Europe/Istanbul";
const COLORS = ["#2a39b8", "#0b6aa2", "#0d6b4d", "#8a5a00", "#be185d", "#0f766e", "#be123c", "#3c4fe0"];
const MODE_SERIES = [
  { key: "r", name: "Zil sesi", color: "#0b6aa2" },
  { key: "y", name: "Müzik", color: "#0d6b4d" },
  { key: "u", name: "Bilinmiyor", color: "#5f6672" },
];
const EXTRACTOR_SERIES = [
  { key: "n", name: "NewPipe (Android 13+)", color: "#0b6aa2" },
  { key: "b", name: "Backend (Android 12-)", color: "#8a5a00" },
  { key: "xu", name: "Bilinmiyor", color: "#5f6672" },
];
const OTHER = "Diğer";

const SHORT = { US: "ABD", GB: "İngiltere", AE: "BAE", DO: "Dominik C.", CD: "Kongo DC" };
const regionNames = (() => { try { return new Intl.DisplayNames(["tr"], { type: "region" }); } catch (e) { return null; } })();
export const countryName = (cc) => {
  if (!cc || cc === "XX") return "Bilinmiyor";
  if (SHORT[cc]) return SHORT[cc];
  try { return (regionNames && regionNames.of(cc)) || cc; } catch (e) { return cc; }
};
export const flag = (cc) => (/^[A-Z]{2}$/.test(cc || "") && cc !== "XX"
  ? String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0))) : "🌐");

const fmt = (opts) => new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, ...opts });
const F = {
  hm: fmt({ hour: "2-digit", minute: "2-digit" }),
  dayShort: fmt({ day: "numeric", month: "short" }),
  wdHour: fmt({ weekday: "short", hour: "2-digit" }),
  full: fmt({ day: "numeric", month: "long", weekday: "long" }),
};
function axisLabel(ts, unit, range) {
  const d = new Date(ts);
  if (unit === "minute") return F.hm.format(d);
  if (unit === "hour") return range === "7d" ? F.wdHour.format(d) : F.hm.format(d);
  return F.dayShort.format(d);
}
function tooltipTitle(ts, unit) {
  const d = new Date(ts);
  if (unit === "minute") return `${F.full.format(d)} · ${F.hm.format(d)}`;
  if (unit === "hour") return `${F.full.format(d)} · ${F.hm.format(d)}–${F.hm.format(new Date(ts + 3600000))}`;
  return F.full.format(d);
}
const num = (v) => (v == null ? "—" : Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 1 }));

export function useRange() {
  const [range, setRangeState] = useState(() => {
    try { const r = localStorage.getItem("panelRange"); if (RANGES.some(x => x.key === r)) return r; } catch (e) {}
    return "24h";
  });
  const setRange = (r) => { setRangeState(r); try { localStorage.setItem("panelRange", r); } catch (e) {} };
  return [range, setRange];
}

export function useStatsSeries({ apiUrl, appKey, scope, range, byApp, enabled = true }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () => {
      const url = `${apiUrl}/admin/stats-series?range=${range}&appId=${encodeURIComponent(scope)}${byApp ? "&byApp=1" : ""}`;
      fetch(url, { headers: { "X-App-Key": appKey } })
        .then(r => r.json().then(d => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
        .then(d => alive && setState({ data: d, loading: false, error: null }))
        .catch(e => alive && setState(s => ({ ...s, loading: false, error: e.message || "Bağlantı hatası" })));
    };
    setState(s => ({ ...s, loading: true }));
    load();
    const def = RANGES.find(r => r.key === range) || RANGES[2];
    const id = setInterval(load, def.refresh);
    return () => { alive = false; clearInterval(id); };
  }, [apiUrl, appKey, scope, range, byApp, enabled]);
  return state;
}

export function useVisitorSeries({ apiUrl, appKey, scope, range, enabled = true }) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () => fetch(`${apiUrl}/admin/visitor-series?range=${range}&appId=${encodeURIComponent(scope)}`, { headers: { "X-App-Key": appKey } })
      .then(r => r.json().then(d => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
      .then(d => alive && setState({ data: d, error: null }))
      .catch(e => alive && setState(s => ({ ...s, error: e.message || "Bağlantı hatası" })));
    setState({ data: null, error: null });
    load();
    const id = setInterval(load, 120000);
    return () => { alive = false; clearInterval(id); };
  }, [apiUrl, appKey, scope, range, enabled]);
  return state;
}

/* Kaç farklı kişi girdi — saat ya da gün başına, ülkelere göre yığılmış sütun */
export function VisitorCountryChart({ data, error, height = 320 }) {
  const top = useMemo(() => (data ? data.countries.slice(0, 6).map(c => c.country) : []), [data]);
  const rows = useMemo(() => (data ? data.points.map(p => {
    const row = { ts: p.ts, label: data.unit === "hour" ? F.hm.format(new Date(p.ts)) : F.dayShort.format(new Date(p.ts)), _total: p.total };
    let sumTop = 0;
    const rest = [];
    Object.entries(p.c || {}).forEach(([cc, v]) => { if (top.includes(cc)) { row[cc] = v; sumTop += v; } else rest.push([cc, v]); });
    top.forEach(cc => { if (row[cc] == null) row[cc] = 0; });
    row[OTHER] = Math.max(0, p.total - sumTop);
    row._other = rest.sort((a, b) => b[1] - a[1]);
    return row;
  }) : []), [data, top]);
  const series = [...top, OTHER];
  const isHour = data && data.unit === "hour";
  const Tip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    const d = new Date(row.ts);
    const title = isHour ? `${F.full.format(d)} · ${F.hm.format(d)}–${F.hm.format(new Date(row.ts + 3600000))}` : F.full.format(d);
    const items = payload.filter(p => p.value > 0).slice().reverse();
    return (
      <div className="st-tip">
        <div className="st-tip-h">{title}</div>
        <div className="st-tip-r st-tip-big"><span>Giren farklı kişi</span><b>{num(row._total)}</b></div>
        {items.map(p => (
          <React.Fragment key={p.dataKey}>
            <div className="st-tip-r"><i style={{ background: p.color || p.fill }} /><span>{p.name}</span><b>{num(p.value)}</b></div>
            {p.dataKey === OTHER && row._other.length > 0 && (
              <div className="st-tip-sub">
                {row._other.slice(0, 12).map(([cc, v]) => <span key={cc}>{flag(cc)} {countryName(cc)} <b>{num(v)}</b></span>)}
                {row._other.length > 12 && <span>+{row._other.length - 12} ülke daha</span>}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  const rangeLabel = !data ? "" : data.range === "24h" ? "Son 24 saatte" : data.range === "7d" ? "Son 7 günde" : "Son 30 günde";
  return (
    <ChartFrame title={isHour ? "Saat başı kaç kişi girdi" : "Gün başı kaç kişi girdi"}
      sub={`Uygulamayı açan farklı cihaz sayısı, ülkelere göre${data && !isHour ? " · günler UTC" : ""}`}
      right={data ? <div className="st-total"><b>{num(data.total)}</b><small>{rangeLabel.toLocaleLowerCase("tr")} farklı kişi</small></div> : null}>
      {!data || !data.points.some(p => p.total > 0) ? <Empty loading={!data && !error} error={error} /> : (
        <LineChart height={height} data={rows} theme="dark" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e3e0d9" vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={12} />
          <YAxis {...axisProps} allowDecimals={false} width={58} tickFormatter={v => num(v)} />
          <Tooltip content={<Tip />} cursor={{ stroke: "#c9c5bc" }} />
          {series.map((cc, i) => {
            const col = cc === OTHER ? "#5f6672" : COLORS[i % COLORS.length];
            return (
              <Line key={cc} type="monotone" dataKey={cc} name={cc === OTHER ? "Diğer ülkeler" : `${flag(cc)} ${countryName(cc)}`}
                stroke={col} strokeWidth={2} strokeDasharray={cc === OTHER ? "5 4" : undefined}
                dot={{ r: isHour ? 2.5 : 3.5, fill: col, stroke: "#ffffff", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: col, stroke: "#16181d", strokeWidth: 2 }} isAnimationActive={false} />
            );
          })}
        </LineChart>
      )}
      {data && data.countries.length > 0 && (
        <div className="st-dots">
          <small>{rangeLabel} giren farklı kişi · ülkelere göre</small>
          {data.countries.slice(0, 24).map(c => {
            const i = top.indexOf(c.country);
            return (
              <span key={c.country} className="st-dot">
                <i style={{ background: i >= 0 ? COLORS[i % COLORS.length] : "#c9c5bc" }} />
                {flag(c.country)} {countryName(c.country)} <b>{num(c.value)}</b>
              </span>
            );
          })}
          {data.countries.length > 24 && <span className="st-dot more">+{data.countries.length - 24} ülke</span>}
        </div>
      )}
    </ChartFrame>
  );
}

export function RangePicker({ range, onChange, ranges = RANGES }) {
  return (
    <div className="st-range" role="tablist">
      {ranges.map(r => (
        <button key={r.key} type="button" title={r.hint} role="tab" aria-selected={range === r.key}
          className={range === r.key ? "on" : ""} onClick={() => onChange(r.key)}>{r.label}</button>
      ))}
    </div>
  );
}

// Fareyle üzerine gelince: zaman + her seri; saat/gün biriminde ortalama ve tepe
function makeTooltip(unit, maxOf, titleOf) {
  return function StatsTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    if (row._missing) return null;
    const items = payload.filter(p => p.value != null).slice().reverse();
    const total = items.reduce((a, p) => a + (Number(p.value) || 0), 0);
    return (
      <div className="st-tip">
        <div className="st-tip-h">{titleOf ? titleOf(row) : tooltipTitle(row.ts, unit)}</div>
        {items.map(p => (
          <div key={p.dataKey} className="st-tip-r">
            <i style={{ background: p.color || p.stroke || p.fill }} />
            <span>{p.name}</span>
            <b>{num(p.value)}</b>
            {unit !== "minute" && maxOf && maxOf(row, p.dataKey) != null && <small>tepe {num(maxOf(row, p.dataKey))}</small>}
          </div>
        )).flatMap((el, i) => (items[i].dataKey === OTHER && row._other && row._other.length ? [el, (
          <div key="other-list" className="st-tip-sub">
            {row._other.slice(0, 12).map(([cc, v]) => <span key={cc}>{flag(cc)} {countryName(cc)} <b>{num(v)}</b></span>)}
            {row._other.length > 12 && <span>+{row._other.length - 12} ülke daha</span>}
          </div>
        )] : [el]))}
        {items.length > 1 && <div className="st-tip-r st-tip-t"><span>Toplam</span><b>{num(total)}</b></div>}
        {unit !== "minute" && <div className="st-tip-n">Değerler dönem ortalaması (aktif cihaz)</div>}
      </div>
    );
  };
}

const axisProps = { tick: { fill: "#5f6672", fontSize: 11 }, stroke: "#d9d5cc" };

function ChartFrame({ title, sub, right, children }) {
  return (
    <div className="st-card">
      <div className="st-card-h">
        <div><b>{title}</b>{sub && <small>{sub}</small>}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Empty({ loading, error }) {
  return (
    <div className="st-empty">
      {loading ? "Yükleniyor…" : error ? `Grafik yüklenemedi: ${error}` : "Bu aralıkta henüz veri yok. Kayıt dakikada bir birikir."}
    </div>
  );
}

const hasData = (points) => points.some(p => !p.missing);

/* Müzik / zil sesi / bilinmiyor — yığılmış alan */
export function ModeChart({ data, range, title = "Aktif kullanıcılar", sub, height = 260, series = MODE_SERIES }) {
  const rows = useMemo(() => (data ? data.points.map(p => {
    const row = { ts: p.ts, label: axisLabel(p.ts, data.unit, range) };
    if (p.missing) return { ...row, _missing: true };
    series.forEach(s => { row[s.key] = p[s.key] == null ? null : p[s.key]; });
    return { ...row, _p: p };
  }) : []), [data, range, series]);
  const maxOf = (row, key) => row._p && (key === "u" || key === "xu" ? null : row._p[key + "Max"]);
  const filled = data ? data.points.filter(p => !p.missing && series.some(s => p[s.key] != null)) : [];
  return (
    <ChartFrame title={title} sub={sub}>
      {!data || !filled.length ? <Empty loading={!data} /> : (
        <AreaChart height={height} data={rows} theme="dark" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e3e0d9" vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={18} />
          <YAxis {...axisProps} allowDecimals={false} width={40} />
          <Tooltip content={makeTooltip(data.unit, maxOf)} cursor={{ stroke: "#c9c5bc" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#4b5260" }} />
          {series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stackId="m"
              stroke={s.color} fill={s.color} fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
          ))}
        </AreaChart>
      )}
    </ChartFrame>
  );
}

/* Ülkeler — üstteki 6 ülke + Diğer, yığılmış alan */
export function CountryTrendChart({ data, range, height = 260 }) {
  const top = useMemo(() => (data ? data.countries.slice(0, 6).map(c => c.country) : []), [data]);
  const rows = useMemo(() => {
    if (!data) return [];
    return data.points.map(p => {
      const row = { ts: p.ts, label: axisLabel(p.ts, data.unit, range) };
      if (p.missing) return { ...row, _missing: true };
      let other = 0;
      const rest = [];
      Object.entries(p.c || {}).forEach(([cc, v]) => { if (top.includes(cc)) row[cc] = v; else if (v > 0) { other += v; rest.push([cc, v]); } });
      top.forEach(cc => { if (row[cc] == null) row[cc] = 0; });
      row[OTHER] = Math.round(other * 10) / 10;
      row._other = rest.sort((a, b) => b[1] - a[1]);
      row._p = p;
      return row;
    });
  }, [data, range, top]);
  const maxOf = (row, key) => row._p && row._p.cMax && row._p.cMax[key];
  const series = [...top, OTHER];
  return (
    <ChartFrame title="Ülkelere göre zaman içinde" sub="Renkli 6 ülke grafikte ayrı çizilir; gri olanlar 'Diğer ülkeler'de toplanır">
      {!data || !hasData(data.points) ? <Empty loading={!data} /> : (
        <AreaChart height={height} data={rows} theme="dark" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e3e0d9" vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={18} />
          <YAxis {...axisProps} allowDecimals={false} width={40} />
          <Tooltip content={makeTooltip(data.unit, maxOf)} cursor={{ stroke: "#c9c5bc" }} />
          {series.map((cc, i) => (
            <Area key={cc} type="monotone" dataKey={cc} stackId="c"
              name={cc === OTHER ? "Diğer ülkeler" : `${flag(cc)} ${countryName(cc)}`}
              stroke={cc === OTHER ? "#5f6672" : COLORS[i % COLORS.length]}
              fill={cc === OTHER ? "#5f6672" : COLORS[i % COLORS.length]}
              fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
          ))}
        </AreaChart>
      )}
      {data && data.countries.length > 0 && (
        <div className="st-dots">
          <small>{data.unit === "minute" ? "Şu an aktif · son 5 dk" : `${(RANGES.find(r => r.key === range) || {}).label} ortalaması`}</small>
          {data.countries.slice(0, 24).map(c => {
            const i = top.indexOf(c.country);
            return (
              <span key={c.country} className="st-dot">
                <i style={{ background: i >= 0 ? COLORS[i % COLORS.length] : "#c9c5bc" }} />
                {flag(c.country)} {countryName(c.country)} <b>{num(c.value)}</b>
              </span>
            );
          })}
          {data.countries.length > 24 && <span className="st-dot more">+{data.countries.length - 24} ülke</span>}
        </div>
      )}
    </ChartFrame>
  );
}

/* Ülke sıralaması — yatay çubuk */
export function CountryBarChart({ data, range }) {
  const rows = useMemo(() => (data ? data.countries.slice(0, 15).map(c => ({
    name: `${flag(c.country)} ${countryName(c.country)}`, value: c.value,
  })) : []), [data]);
  const isMinute = data && data.unit === "minute";
  const sub = isMinute ? "Şu an aktif (son 5 dk)" : `${(RANGES.find(r => r.key === range) || {}).label} ortalaması`;
  return (
    <ChartFrame title="Ülke sıralaması" sub={sub}>
      {!rows.length ? <Empty loading={!data} /> : (
        <BarChart horizontal height={Math.max(120, rows.length * 22 + 8)} data={rows} theme="dark"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barCategoryGap={5}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#4b5260", fontSize: 11 }} axisLine={false} tickLine={false} width={112} interval={0} />
          <Tooltip cursor={{ fill: "#5f6672" }}
            content={({ active, payload }) => active && payload && payload.length ? (
              <div className="st-tip"><div className="st-tip-h">{payload[0].payload.name}</div>
                <div className="st-tip-r"><span>Aktif cihaz</span><b>{num(payload[0].value)}</b></div></div>) : null} />
          <Bar dataKey="value" name="Aktif cihaz" fill="#2a39b8" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" fill="#2b2f37" fontSize={11} formatter={num} />
          </Bar>
        </BarChart>
      )}
    </ChartFrame>
  );
}

/* Uygulamalar — her uygulama bir çizgi; metrik seçilebilir */
const APP_METRICS = [
  { key: "r", label: "Zil sesi" },
  { key: "y", label: "Müzik" },
  { key: "t", label: "Toplam" },
];
export function AppTrendChart({ data, range, metric: metricProp, height = 280 }) {
  const [metric, setMetric] = useState(metricProp || "r");
  const { rows, series } = useMemo(() => {
    if (!data || !data.byApp) return { rows: [], series: [] };
    const sums = data.byApp.map(a => ({ a, s: a.series.reduce((x, p) => x + (p ? p[metric] : 0), 0) }))
      .filter(x => x.s > 0).sort((x, y) => y.s - x.s);
    const top = sums.slice(0, 7).map(x => x.a);
    const rest = sums.slice(7).map(x => x.a);
    const rows = data.points.map((p, i) => {
      const row = { ts: p.ts, label: axisLabel(p.ts, data.unit, range), _p: {} };
      if (p.missing) return { ...row, _missing: true };
      top.forEach(a => { const v = a.series[i]; row[a.id] = v ? v[metric] : null; row._p[a.id] = v ? v[metric + "Max"] : null; });
      if (rest.length) row[OTHER] = Math.round(rest.reduce((x, a) => x + (a.series[i] ? a.series[i][metric] : 0), 0) * 10) / 10;
      return row;
    });
    const series = top.map((a, i) => ({ key: a.id, name: a.name, color: COLORS[i % COLORS.length] }));
    if (rest.length) series.push({ key: OTHER, name: `${OTHER} (${rest.length})`, color: "#5f6672" });
    return { rows, series };
  }, [data, range, metric]);
  const maxOf = (row, key) => row._p && row._p[key];
  return (
    <ChartFrame title="Uygulamalara göre" sub="Her çizgi bir uygulama · en kalabalık 7 uygulama"
      right={<div className="st-seg">{APP_METRICS.map(m => (
        <button key={m.key} type="button" className={metric === m.key ? "on" : ""} onClick={() => setMetric(m.key)}>{m.label}</button>
      ))}</div>}>
      {!series.length ? <Empty loading={!data} /> : (
        <LineChart height={height} data={rows} theme="dark" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e3e0d9" vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={18} />
          <YAxis {...axisProps} allowDecimals={false} width={40} />
          <Tooltip content={makeTooltip(data.unit, maxOf)} cursor={{ stroke: "#c9c5bc" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#4b5260" }} />
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color}
              strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          ))}
        </LineChart>
      )}
    </ChartFrame>
  );
}

/* Uygulama karşılaştırma — son değer (anlık) ya da dönem ortalaması, zil sesi/müzik yığılmış */
export function AppCompareBar({ data, range, onPickApp }) {
  const rows = useMemo(() => {
    if (!data || !data.byApp) return [];
    const isMinute = data.unit === "minute";
    return data.byApp.map(a => {
      const pts = a.series.filter(Boolean);
      if (!pts.length) return null;
      const pick = (k) => (isMinute ? pts[pts.length - 1][k]
        : Math.round((pts.reduce((x, p) => x + p[k], 0) / pts.length) * 10) / 10);
      const r = pick("r"), y = pick("y"), t = pick("t");
      return { id: a.id, name: a.name, "Zil sesi": r, "Müzik": y, "Bilinmiyor": Math.max(0, Math.round((t - r - y) * 10) / 10), t };
    }).filter(x => x && x.t > 0).sort((a, b) => b.t - a.t);
  }, [data]);
  const sub = data && data.unit === "minute" ? "Şu an aktif (son 5 dk)" : `${(RANGES.find(r => r.key === range) || {}).label} ortalaması`;
  return (
    <ChartFrame title="Uygulama karşılaştırması" sub={onPickApp ? `${sub} · çubuğa tıkla → o uygulama` : sub}>
      {!rows.length ? <Empty loading={!data} /> : (
        <BarChart horizontal height={Math.max(160, rows.length * 30 + 40)} data={rows} theme="dark"
          margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis type="category" dataKey="name" {...axisProps} width={150} />
          <Tooltip content={makeTooltip("minute", null, row => row.name)} cursor={{ fill: "#5f6672" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#4b5260" }} />
          {MODE_SERIES.map((s, i) => (
            <Bar key={s.key} dataKey={s.name} name={s.name} stackId="a" fill={s.color} isAnimationActive={false}
              cursor={onPickApp ? "pointer" : undefined}
              onClick={onPickApp ? (d) => { const id = (d && d.payload && d.payload.id) || (d && d.id); if (id) onPickApp(id); } : undefined}
              radius={i === MODE_SERIES.length - 1 ? [0, 5, 5, 0] : 0} />
          ))}
        </BarChart>
      )}
    </ChartFrame>
  );
}

/* Üst özet kutuları — son nokta + dönem tepe */
export function StatTiles({ data }) {
  if (!data) return null;
  const pts = data.points.filter(p => !p.missing);
  const last = pts[pts.length - 1];
  const peak = pts.reduce((m, p) => Math.max(m, p.tMax || p.t || 0), 0);
  const avg = pts.length ? pts.reduce((x, p) => x + p.t, 0) / pts.length : 0;
  const tiles = [
    { k: data.unit === "minute" ? "Şu an" : data.unit === "hour" ? "Bu saat (ort.)" : "Bugün (ort.)", v: last ? last.t : null, c: "#16181d" },
    { k: "Zil sesi", v: last ? last.r : null, c: "#0b6aa2" },
    { k: "Müzik", v: last ? last.y : null, c: "#0d6b4d" },
    { k: "Aralık ortalaması", v: pts.length ? avg : null, c: "#2a39b8" },
    { k: "Aralık tepesi", v: pts.length ? peak : null, c: "#8a5a00" },
  ];
  return (
    <div className="st-tiles">
      {tiles.map(t => (
        <div key={t.k} className="st-tile"><small>{t.k}</small><b style={{ color: t.c }}>{num(t.v)}</b></div>
      ))}
    </div>
  );
}

export const STATS_CSS = `
  .st-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .st-head h3 { margin: 0; font-size: 15px; color: #16181d; }
  .st-head p { margin: 2px 0 0; font-size: 12px; color: #5f6672; }
  .st-range, .st-seg { display: inline-flex; max-width: 100%; overflow-x: auto; scrollbar-width: none; padding: 3px; gap: 2px; border-radius: 10px; background: #eeebe5; border: 1px solid #d9d5cc; }
  .st-range button, .st-seg button { border: 0; background: none; color: #4b5260; font: inherit; font-size: 12.5px; font-weight: 600; padding: 6px 11px; border-radius: 7px; cursor: pointer; white-space: nowrap; }
  .st-seg button { font-size: 11.5px; padding: 4px 9px; }
  .st-range button:hover, .st-seg button:hover { color: #16181d; }
  .st-range button.on, .st-seg button.on { background: #3c4fe0; color: #fff; }
  .st-grid { display: grid; gap: 14px; margin-bottom: 26px; }
  .st-grid.two { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
  .st-grid.main-side { grid-template-columns: minmax(0, 3fr) minmax(210px, 1fr); align-items: start; }
  @media (max-width: 900px) { .st-grid.two, .st-grid.main-side { grid-template-columns: minmax(0, 1fr); } }
  .st-card { background: #eeebe5; border: 1px solid #d9d5cc; border-radius: 14px; padding: 14px 14px 8px; min-width: 0; }
  .st-card-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .st-card-h b { display: block; font-size: 13.5px; color: #16181d; }
  .st-card-h small { display: block; font-size: 11.5px; color: #5f6672; margin-top: 2px; }
  .st-empty { height: 180px; display: grid; place-items: center; color: #5f6672; font-size: 13px; text-align: center; padding: 0 20px; }
  .st-tip { background: #f4f2ed; border: 1px solid #cdc8be; border-radius: 10px; padding: 10px 12px; box-shadow: 0 12px 30px rgba(22,24,29,0.113); min-width: 180px; font-size: 12.5px; color: #16181d; }
  .st-tip-h { font-weight: 700; margin-bottom: 7px; color: #16181d; }
  .st-tip-r { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
  .st-tip-r i { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
  .st-tip-r span { flex: 1; color: #4b5260; }
  .st-tip-r b { font-variant-numeric: tabular-nums; }
  .st-tip-r small { color: #5f6672; font-size: 11px; margin-left: 4px; }
  .st-dots { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; padding: 12px 4px 6px; margin-top: 6px; border-top: 1px solid #d9d5cc; }
  .st-dots small { width: 100%; font-size: 11px; font-weight: 600; color: #5f6672; letter-spacing: .3px; margin-bottom: 2px; }
  .st-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #2b2f37; white-space: nowrap; }
  .st-dot i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .st-dot b { color: #16181d; font-weight: 650; font-variant-numeric: tabular-nums; }
  .st-dot.more { color: #5f6672; }
  .st-head-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .st-total { text-align: right; }
  .st-total b { display: block; font-size: 22px; font-weight: 750; color: #16181d; font-variant-numeric: tabular-nums; line-height: 1.1; }
  .st-total small { font-size: 11px; color: #5f6672; }
  .st-tip-big b { font-size: 15px; }
  .st-tip-sub { display: flex; flex-wrap: wrap; gap: 3px 10px; padding: 3px 0 6px 17px; font-size: 11.5px; color: #4b5260; max-width: 300px; }
  .st-tip-sub b { color: #16181d; font-weight: 600; }
  .st-tip-t { border-top: 1px solid #d9d5cc; margin-top: 5px; padding-top: 6px; }
  .st-tip-n { color: #5f6672; font-size: 10.5px; margin-top: 6px; }
  .st-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .st-tile { background: #eeebe5; border: 1px solid #d9d5cc; border-radius: 12px; padding: 12px 14px; }
  .st-tile small { display: block; font-size: 11px; color: #5f6672; text-transform: uppercase; letter-spacing: .5px; }
  .st-tile b { display: block; font-size: 24px; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .st-cl { display: flex; flex-direction: column; gap: 2px; padding-bottom: 6px; }
  .st-cl-r { display: grid; grid-template-columns: 26px minmax(120px, 1.2fr) minmax(60px, 2fr) 60px 42px; align-items: center; gap: 10px; padding: 6px 4px; border-radius: 8px; font-size: 13px; }
  .st-cl-r:hover { background: rgba(22,24,29,0.03); }
  .st-cl-n { color: #5f6672; font-size: 11.5px; text-align: right; font-variant-numeric: tabular-nums; }
  .st-cl-c { color: #16181d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .st-cl-bar { height: 6px; background: rgba(22,24,29,0.042); border-radius: 3px; overflow: hidden; }
  .st-cl-bar i { display: block; height: 100%; background: #3c4fe0; border-radius: 3px; }
  .st-cl-r b { color: #16181d; text-align: right; font-variant-numeric: tabular-nums; }
  .st-cl-r small { color: #5f6672; font-size: 11px; text-align: right; }
  .st-vb { display: flex; gap: 4px; align-items: flex-end; height: 120px; padding: 4px 2px 0; }
  .st-vb-c { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
  .st-vb-c span { font-size: 10.5px; font-weight: 700; color: #16181d; margin-bottom: 3px; }
  .st-vb-c i { display: block; width: 100%; background: #3c4fe0; border-radius: 4px 4px 0 0; }
  .st-vb-c:last-child i { background: #16181d; }
  .st-vb-l { height: auto; padding: 6px 2px 8px; }
  .st-vb-l small { flex: 1; min-width: 0; text-align: center; font-size: 10px; color: #5f6672; white-space: nowrap; overflow: visible; }
  .st-cl-more { margin-top: 6px; padding: 8px; border: 0; border-radius: 8px; background: #f4f2ed; color: #2b2f37; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
  .recharts-legend-item-text { color: #4b5260 !important; }
  @media (max-width: 560px) { .st-range button { padding: 6px 8px; font-size: 12px; } .st-tile b { font-size: 20px; } }
  .st-range, .st-seg { gap: 2px; padding: 3px; background: #e3e0d9; border: 1px solid #d6d2c8; border-radius: 11px; box-shadow: inset 0 1px 2px rgba(22,24,29,0.05); }
  .st-range button, .st-seg button { color: #4b5260; font-weight: 500; font-size: 12.5px; padding: 6px 12px; border-radius: 8px; transition: background .12s, color .12s; }
  .st-range button:hover, .st-seg button:hover { background: rgba(22,24,29,0.05); color: #16181d; }
  .st-range button.on, .st-seg button.on { background: #f8f7f3; color: #16181d; font-weight: 600; box-shadow: 0 1px 2px rgba(22,24,29,0.12), 0 0 0 1px #cfcac0; }
  .lb-card { background: #f4f2ed; border: 1px solid #d9d5cc; border-radius: 12px; padding: 18px 20px 14px; margin-bottom: 24px; min-width: 0; }
  .lb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .lb-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: #16181d; }
  .lb-head p { margin: 3px 0 0; font-size: 12.5px; color: #5f6672; }
  .lb-ctrl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .lb-plot { display: flex; align-items: flex-end; border-bottom: 1px solid #d9d5cc; }
  .lb-c { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; height: 100%; }
  .lb-v { text-align: center; font-weight: 600; color: #5f6672; margin-bottom: 4px; white-space: nowrap; font-variant-numeric: tabular-nums; line-height: 1.2; }
  .lb-c.now .lb-v { color: #16181d; }
  .lb-stack { display: flex; flex-direction: column; gap: 1px; border-radius: 4px 4px 0 0; overflow: hidden; }
  .lb-stack i { display: block; min-height: 1px; }
  .lb-x { display: flex; padding-top: 7px; }
  .lb-x small { flex: 1; min-width: 0; text-align: center; font-size: 11px; color: #5f6672; white-space: nowrap; overflow: visible; font-variant-numeric: tabular-nums; }
  .lb-legend { display: flex; gap: 16px; margin-top: 10px; font-size: 12.5px; color: #4b5260; }
  .lb-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .lb-legend i { width: 10px; height: 10px; border-radius: 3px; }
  @media (max-width: 560px) { .lb-v { font-size: 8px !important; letter-spacing: -0.3px; } .lb-plot, .lb-x { gap: 2px !important; } .lb-x small { font-size: 9.5px; white-space: normal; line-height: 1.2; overflow: hidden; } }
`;

/* Bölüm başına grafik bloğu: aralık seçici + türüne göre grafikler
   kind: "overview" | "ringtone" | "countries" */
// Ziyaretçi Özeti aralıkları: Anlık (son 1 dk) + kaç kişi girdi (24s/7g/30g)
const VISITOR_RANGES = RANGES.filter(r => r.key !== "1h")
  .map(r => r.key === "live" ? { ...r, hint: "Şu an uygulamada olanlar (son 1 dakika)" } : r);

export function CountryList({ rows, total, title, sub, loading, error }) {
  const [all, setAll] = useState(false);
  const max = Math.max(1, ...rows.map(r => r.value));
  const shown = all ? rows : rows.slice(0, 20);
  return (
    <ChartFrame title={title} sub={sub}
      right={<div className="st-total"><b>{num(total)}</b><small>kişi</small></div>}>
      {!rows.length ? <Empty loading={loading} error={error} /> : (
        <div className="st-cl">
          {shown.map((c, i) => (
            <div key={c.country} className="st-cl-r">
              <span className="st-cl-n">{i + 1}</span>
              <span className="st-cl-c">{flag(c.country)} {countryName(c.country)}</span>
              <span className="st-cl-bar"><i style={{ width: `${(c.value / max) * 100}%` }} /></span>
              <b>{num(c.value)}</b>
              <small>%{total > 0 ? Math.round((c.value / total) * 100) : 0}</small>
            </div>
          ))}
          {rows.length > 20 && (
            <button type="button" className="st-cl-more" onClick={() => setAll(v => !v)}>
              {all ? "Daha az göster" : `Tüm ülkeleri göster (${rows.length})`}
            </button>
          )}
        </div>
      )}
    </ChartFrame>
  );
}

function useVisitorRange(apiUrl, appKey, scope, range) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    const load = () => fetch(`${apiUrl}/admin/visitor-series?range=${range}&appId=${encodeURIComponent(scope)}`, { headers: { "X-App-Key": appKey } })
      .then(r => r.json().then(d => (r.ok ? d : Promise.reject(new Error(d.error || r.status)))))
      .then(d => alive && setState({ data: d, error: null }))
      .catch(e => alive && setState(s => ({ ...s, error: e.message || "Bağlantı hatası" })));
    setState({ data: null, error: null });
    load();
    const id = setInterval(load, range === "live" ? 10000 : 60000);
    return () => { alive = false; clearInterval(id); };
  }, [apiUrl, appKey, scope, range]);
  return state;
}

export function VisitorSummary({ apiUrl, appKey, scope, scopeLabel }) {
  const [range, setRangeState] = useState(() => {
    try { const r = localStorage.getItem("panelVisRange"); if (VISITOR_RANGES.some(x => x.key === r)) return r; } catch (e) {}
    return "24h";
  });
  const setRange = (r) => { setRangeState(r); try { localStorage.setItem("panelVisRange", r); } catch (e) {} };
  const [showAll, setShowAll] = useState(false);
  const now = useVisitorRange(apiUrl, appKey, scope, "live");
  const d24 = useVisitorRange(apiUrl, appKey, scope, "24h");
  const d7 = useVisitorRange(apiUrl, appKey, scope, "7d");
  const d30 = useVisitorRange(apiUrl, appKey, scope, "30d");
  const byRange = { live: now, "24h": d24, "7d": d7, "30d": d30 };
  const sel = byRange[range] || d24;
  const isNow = range === "live";
  // Sütunlar: Anlık'ta son 7 gün; diğerlerinde seçili aralık
  const barSrc = (isNow ? d7 : sel).data;
  const pts = (barSrc && barSrc.points) || [];
  const maxP = Math.max(1, ...pts.map(p => p.total));
  const ptLabel = (ts) => barSrc.unit === "hour"
    ? new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(ts))
    : new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "numeric", month: "short", ...(pts.length <= 7 ? { weekday: "short" } : {}) }).format(new Date(ts));
  const rows = (sel.data && sel.data.countries) || [];
  const total = (sel.data && sel.data.total) || 0;
  const shown = showAll ? rows : rows.slice(0, 15);
  const colLabel = isNow ? "Şu an" : range === "24h" ? "Son 24 saat" : range === "7d" ? "Son 7 gün" : "Son 30 gün";
  const hint = (VISITOR_RANGES.find(r => r.key === range) || {}).hint;
  const tot = (st) => (st.data ? (st.data.total || 0).toLocaleString("tr-TR") : "—");
  const big = (key, label, st, sub) => (
    <div key={key} onClick={() => setRange(key)} style={{ flex: "1 1 170px", padding: "18px 20px", borderRadius: 12, cursor: "pointer", backgroundColor: "#f4f2ed",
      border: `1px solid ${range === key ? "#3c4fe0" : "#cdc8be"}` }}>
      <div style={{ color: "#4b5260", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#16181d", fontSize: 36, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>{tot(st)}</div>
      <div style={{ color: "#5f6672", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
  return (
    <div style={{ marginBottom: 28, paddingTop: 20, borderTop: "1px solid #d9d5cc" }}>
      <div className="st-head">
        <div><h3>Ziyaretçi Özeti</h3><p>{scopeLabel} · {hint}</p></div>
        <div className="st-head-r"><RangePicker range={range} onChange={setRange} ranges={VISITOR_RANGES} /></div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        {big("live", "ŞU AN", now, "Son 1 dakikada uygulamada")}
        {big("24h", "SON 24 SAAT", d24, "Kayan pencere, saatlik")}
        {big("7d", "SON 7 GÜN", d7, "Bugün dahil son 7 gün (UTC)")}
        {big("30d", "SON 30 GÜN", d30, "Bugün dahil son 30 gün (UTC)")}
      </div>

      {/* sütunlar */}
      {pts.length > 0 && (
        <>
          <div style={{ display: "flex", gap: pts.length > 14 ? 3 : 8, alignItems: "flex-end", height: 120, padding: "12px 12px 0", background: "#eeebe5", border: "1px solid #d9d5cc", borderRadius: 10, marginBottom: 6 }}>
            {pts.map((p, i) => (
              <div key={p.ts} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                {pts.length <= 31 && <span style={{ color: "#16181d", fontSize: pts.length > 14 ? 9 : 11, fontWeight: 700, marginBottom: 4 }}>{p.total}</span>}
                <div title={`${ptLabel(p.ts)} — ${p.total} cihaz`} style={{ width: "100%", height: `${Math.max(3, (p.total / maxP) * 75)}%`, background: i === pts.length - 1 ? "#16181d" : "rgba(22,24,29,0.27)", borderRadius: "4px 4px 0 0" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: pts.length > 14 ? 3 : 8, padding: "0 12px", marginBottom: 20 }}>
            {pts.map((p, i) => (
              <span key={p.ts} style={{ flex: 1, minWidth: 0, textAlign: "center", color: "#4b5260", fontSize: 10, whiteSpace: "nowrap", overflow: "visible" }}>
                {(pts.length <= 8 || i % Math.ceil(pts.length / 8) === 0) ? ptLabel(p.ts) : ""}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ülke tablosu */}
      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "#4b5260", fontSize: 13, border: "1px dashed #cdc8be", borderRadius: 10 }}>
          {!sel.data && !sel.error ? "Yükleniyor…" : sel.error ? `Yüklenemedi: ${sel.error}` : "Bu aralıkta veri yok."}
        </div>
      ) : (
        <div style={{ border: "1px solid #d9d5cc", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f4f2ed", color: "#4b5260", textAlign: "left" }}>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Ülke</th>
                <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>{colLabel}</th>
                <th style={{ padding: "10px 14px", fontWeight: 700, width: "34%" }}>Pay</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(c => {
                const share = total > 0 ? Math.round((c.value / total) * 100) : 0;
                return (
                  <tr key={c.country} style={{ borderTop: "1px solid #d9d5cc" }}>
                    <td style={{ padding: "9px 14px", color: "#16181d", fontWeight: 600 }}>
                      {flag(c.country)} {countryName(c.country)}
                      <span style={{ color: "#5f6672", fontFamily: "monospace", fontSize: 11, marginLeft: 6 }}>{c.country !== "XX" ? c.country : ""}</span>
                    </td>
                    <td style={{ padding: "9px 14px", color: "#16181d", textAlign: "right", fontWeight: 700 }}>{num(c.value)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(22,24,29,0.06)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${share}%`, height: "100%", background: "#16181d" }} />
                        </div>
                        <span style={{ color: "#4b5260", fontSize: 11, width: 34, textAlign: "right" }}>%{share}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 15 && (
            <button onClick={() => setShowAll(v => !v)}
              style={{ width: "100%", padding: 10, background: "#f4f2ed", border: "none", borderTop: "1px solid #d9d5cc", color: "#16181d", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {showAll ? "Daha az göster" : `Tüm ülkeleri göster (${rows.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StatsSection({ apiUrl, appKey, scope, scopeLabel, kind, onPickApp, allowByApp }) {
  return <StatsBlock apiUrl={apiUrl} appKey={appKey} scope={scope} scopeLabel={scopeLabel} kind={kind} onPickApp={onPickApp} allowByApp={allowByApp} />;
}

function StatsBlock({ apiUrl, appKey, scope, scopeLabel, kind, onPickApp, allowByApp }) {
  const [range, setRange] = useRange();
  const byApp = allowByApp && scope === "all" && kind !== "countries";
  const { data, error } = useStatsSeries({ apiUrl, appKey, scope, range, byApp });
  const [metric, setMetricState] = useState(() => { try { return localStorage.getItem("panelMetric") || "visitors"; } catch (e) { return "visitors"; } });
  const setMetric = (m) => { setMetricState(m); try { localStorage.setItem("panelMetric", m); } catch (e) {} };
  const longRange = ["24h", "7d", "30d"].includes(range);
  const showVisitors = longRange && metric === "visitors" && kind === "overview";
  const vis = useVisitorSeries({ apiUrl, appKey, scope, range, enabled: showVisitors });
  const hint = (RANGES.find(r => r.key === range) || {}).hint;
  const title = kind === "ringtone" ? "Zil sesi / müzik grafiği" : kind === "countries" ? "İçerik kaynağı" : "Aktif kullanıcılar";
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="st-head">
        <div><h3>{title}</h3><p>{scopeLabel} · {hint}</p></div>
        <div className="st-head-r">
          {longRange && kind === "overview" && (
            <div className="st-seg" title="Kaç kişi girdi: o saatte/günde uygulamayı açan farklı kişi · Aynı anda: o anda aktif kişilerin ortalaması">
              <button type="button" className={metric === "visitors" ? "on" : ""} onClick={() => setMetric("visitors")}>Kaç kişi girdi</button>
              <button type="button" className={metric === "active" ? "on" : ""} onClick={() => setMetric("active")}>Aynı anda (ort.)</button>
            </div>
          )}
          <RangePicker range={range} onChange={setRange} />
        </div>
      </div>
      {error && !data && <div className="st-card"><Empty error={error} /></div>}
      {kind === "overview" && <StatTiles data={data} />}
      {kind !== "countries" && (
        <div className="st-grid">
          <ModeChart data={data} range={range}
            title={kind === "ringtone" ? "Zil sesi ve müzik modundaki cihazlar" : "Aktif cihazlar (mod kırılımlı)"}
            sub="Alanların üstüne gel: saat ve kişi sayısı" />
        </div>
      )}
      {byApp && (
        <div className="st-grid">
          <AppTrendChart data={data} range={range} metric={kind === "ringtone" ? "r" : "t"} />
          <AppCompareBar data={data} range={range} onPickApp={onPickApp} />
        </div>
      )}
      {kind === "overview" && (
        <div className="st-grid">
          {showVisitors
            ? <VisitorCountryChart data={vis.data} error={vis.error} height={320} />
            : <CountryTrendChart data={data} range={range} height={340} />}
        </div>
      )}
      {(kind === "countries" || kind === "overview") && (
        <div className="st-grid">
          <ModeChart data={data} range={range} series={EXTRACTOR_SERIES} height={240}
            title="İçerik kaynağına göre" sub="NewPipe cihazda çözer, Backend sunucu API'lerini kullanır · üstüne gel: saat ve kişi sayısı" />
        </div>
      )}
    </div>
  );
}

/* ===== Açık tema: sütun üstü sayılı çubuk grafik ===== */
export const BAR_COLORS = { music: "#3c4fe0", ring: "#b9c1f5", unknown: "#d6d3cc", single: "#3c4fe0", now: "#16181d" };
const LIVE_RANGES = [
  { key: "live", label: "Anlık", hint: "Son 15 dakika, dakika dakika" },
  { key: "1h", label: "Saatlik", hint: "Son 1 saat, 5 dakikalık dilimler" },
  { key: "24h", label: "24 saat", hint: "Son 24 saat, saat saat" },
  { key: "7d", label: "1 hafta", hint: "Son 7 gün, gün gün" },
  { key: "30d", label: "30 gün", hint: "Son 30 gün, gün gün" },
];
const intTR = (v) => Math.round(Number(v) || 0).toLocaleString("tr-TR");
const shortTR = (v) => {
  const n = Math.round(Number(v) || 0);
  if (n >= 10000) return Math.round(n / 1000) + "B";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "B";
  return String(n);
};

// bars: [{ key, label, title, total, segs: [{ v, color }] (alttan üste), missing }]
export function LabeledBars({ bars, height = 220 }) {
  const max = Math.max(1, ...bars.map(b => b.total || 0));
  const dense = bars.length > 16;
  const plotH = height - 22;
  const step = Math.ceil(bars.length / 8);
  return (
    <div className="lb">
      <div className="lb-plot" style={{ height, gap: dense ? 3 : 6 }}>
        {bars.map((b, i) => {
          const last = i === bars.length - 1;
          const h = b.missing ? 0 : Math.max(2, Math.round(((b.total || 0) / max) * plotH));
          return (
            <div key={b.key} className={"lb-c" + (last ? " now" : "")} title={b.title}>
              <span className="lb-v" style={{ fontSize: dense ? 9.5 : 11 }}>{b.missing ? "–" : (dense ? shortTR(b.total) : intTR(b.total))}</span>
              <div className="lb-stack" style={{ height: h }}>
                {b.segs.slice().reverse().map((sg, j) => sg.v > 0 && (
                  <i key={j} style={{ flex: sg.v, background: last && b.segs.length === 1 ? BAR_COLORS.now : sg.color }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="lb-x" style={{ gap: dense ? 3 : 6 }}>
        {bars.map((b, i) => (
          <small key={b.key}>{bars.length <= 8 || i % step === 0 || i === bars.length - 1 ? b.label : ""}</small>
        ))}
      </div>
    </div>
  );
}

const istDay = (ts) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(ts));
function groupAvg(points, keyOf) {
  const groups = [];
  points.forEach(p => {
    const k = keyOf(p);
    let g = groups[groups.length - 1];
    if (!g || g.k !== k) { g = { k, ts: p.ts, pts: [] }; groups.push(g); }
    if (!p.missing) g.pts.push(p);
  });
  return groups.map(g => {
    const n = g.pts.length;
    const avg = (f) => (n ? g.pts.reduce((a, p) => a + (Number(p[f]) || 0), 0) / n : 0);
    return { ts: g.ts, missing: !n, t: avg("t"), r: avg("r"), y: avg("y"), u: avg("u") };
  });
}

export function LiveActivityChart({ apiUrl, appKey, scope, scopeLabel }) {
  const [range, setRangeState] = useState(() => {
    try { const r = localStorage.getItem("panelLiveRange"); if (LIVE_RANGES.some(x => x.key === r)) return r; } catch (e) {}
    return "24h";
  });
  const setRange = (r) => { setRangeState(r); try { localStorage.setItem("panelLiveRange", r); } catch (e) {} };
  const [metric, setMetricState] = useState(() => { try { return localStorage.getItem("panelLiveMetric") || "visitors"; } catch (e) { return "visitors"; } });
  const setMetric = (m) => { setMetricState(m); try { localStorage.setItem("panelLiveMetric", m); } catch (e) {} };
  const visOk = ["24h", "7d", "30d"].includes(range);
  const useVis = visOk && metric === "visitors";
  const st = useStatsSeries({ apiUrl, appKey, scope, range, enabled: !useVis });
  const vs = useVisitorSeries({ apiUrl, appKey, scope, range, enabled: useVis });
  const src = useVis ? vs : st;

  const bars = useMemo(() => {
    const d = src.data;
    if (!d || !d.points) return [];
    if (useVis) {
      const lab = (ts) => d.unit === "hour"
        ? new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(ts))
        : new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "numeric", month: "short", ...(d.points.length <= 7 ? { weekday: "short" } : {}) }).format(new Date(ts));
      return d.points.map(p => ({
        key: p.ts, label: lab(p.ts), total: p.total, title: `${lab(p.ts)} — ${intTR(p.total)} kişi girdi`,
        segs: [{ v: p.total, color: BAR_COLORS.single }],
      }));
    }
    let pts = d.points;
    if (range === "1h") pts = groupAvg(pts, p => Math.floor(p.ts / 300000));
    else if (range === "7d") pts = groupAvg(pts, p => istDay(p.ts));
    const lab = (ts) => (range === "7d" ? fmt({ weekday: "short", day: "numeric", month: "short" }).format(new Date(ts)) : axisLabel(ts, range === "30d" ? "day" : range === "24h" ? "hour" : "minute", range));
    return pts.map(p => {
      const t = Math.round(p.t || 0), y = p.y || 0, r = p.r || 0, u = p.u || 0;
      return {
        key: p.ts, label: lab(p.ts), total: t, missing: p.missing,
        title: p.missing ? `${lab(p.ts)} — veri yok` : `${lab(p.ts)} — Müzik ${intTR(y)} · Zil sesi ${intTR(r)}${u >= 0.5 ? ` · Bilinmiyor ${intTR(u)}` : ""}`,
        segs: [{ v: y, color: BAR_COLORS.music }, { v: r, color: BAR_COLORS.ring }, { v: u, color: BAR_COLORS.unknown }],
      };
    });
  }, [src.data, useVis, range]);

  const hint = (LIVE_RANGES.find(r => r.key === range) || {}).hint;
  return (
    <div className="lb-card">
      <div className="lb-head">
        <div>
          <h3>{useVis ? "Kaç kişi girdi" : "Aynı anda aktif kişi"}</h3>
          <p>{scopeLabel} · {hint}{useVis ? " · benzersiz cihaz" : (range === "live" ? "" : " · dönem ortalaması")}</p>
        </div>
        <div className="lb-ctrl">
          {visOk && (
            <div className="st-seg">
              <button type="button" className={metric === "visitors" ? "on" : ""} onClick={() => setMetric("visitors")}>Kaç kişi girdi</button>
              <button type="button" className={metric === "active" ? "on" : ""} onClick={() => setMetric("active")}>Aynı anda</button>
            </div>
          )}
          <RangePicker range={range} onChange={setRange} ranges={LIVE_RANGES} />
        </div>
      </div>
      {!bars.length ? (
        <div className="st-empty">{!src.data && !src.error ? "Yükleniyor…" : src.error ? `Grafik yüklenemedi: ${src.error}` : "Bu aralıkta henüz veri yok."}</div>
      ) : (
        <LabeledBars bars={bars} />
      )}
      {!useVis && bars.length > 0 && (
        <div className="lb-legend">
          <span><i style={{ background: BAR_COLORS.music }} />Müzik</span>
          <span><i style={{ background: BAR_COLORS.ring }} />Zil sesi</span>
        </div>
      )}
    </div>
  );
}
