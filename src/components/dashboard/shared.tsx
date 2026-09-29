"use client";

import { CheckCircle2, Clock3, Database, HeartPulse, Search } from "lucide-react";
import { useState } from "react";
import type { Participant, SceneData, WatchLog } from "@/lib/supabase";
export type Filters = {
  from: string;
  to: string;
  gender: string;
  age: string;
  school: string;
  act: string;
};

export const emptyFilters: Filters = {
  from: "",
  to: "",
  gender: "all",
  age: "all",
  school: "all",
  act: "all",
};

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const body = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  if (value && typeof value === "object" && "value" in value) {
    return asNumber((value as { value: unknown }).value);
  }
  return null;
}

export function withinDateRange(dateValue: string | null | undefined, filters: Filters) {
  if (!dateValue) return !filters.from && !filters.to;
  const time = new Date(dateValue).getTime();
  if (filters.from && time < new Date(`${filters.from}T00:00:00`).getTime()) return false;
  if (filters.to && time > new Date(`${filters.to}T23:59:59`).getTime()) return false;
  return true;
}

export function matchesParticipant(user: Participant | undefined, filters: Filters) {
  if (!user) return false;
  if (filters.gender !== "all" && user.gender !== filters.gender) return false;
  if (filters.age !== "all" && String(user.age ?? "") !== filters.age) return false;
  if (filters.school !== "all" && user.school !== filters.school) return false;
  return true;
}

export function uniqueValues<T>(items: T[], getValue: (item: T) => unknown) {
  return Array.from(
    new Set(
      items
        .map(getValue)
        .filter((value): value is string | number => value !== null && value !== undefined && value !== ""),
    ),
  ).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

export function countBy<T>(items: T[], getValue: (item: T) => unknown) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = String(getValue(item) ?? "Unknown");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts, ([label, value]) => ({ label, value })).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
}

export function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatNumber(value: number | null | undefined, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function participantName(user: Participant | undefined) {
  if (!user) return "Unknown user";
  return `${user.name ?? ""} ${user.lastname ?? ""}`.trim() || user.email || `User ${user.userId}`;
}

export function sceneScore(scene: SceneData) {
  return asNumber(scene.details?.score);
}

export function sceneStars(scene: SceneData) {
  return asNumber(scene.details?.stars);
}

export function sceneDuration(scene: SceneData) {
  return asNumber(scene.details?.timePlayed);
}

export function sceneResult(scene: SceneData) {
  const result = scene.details?.result;
  return typeof result === "string" && result ? result : "-";
}

export function latestDate(values: (string | null | undefined)[]) {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  if (!dates.length) return "-";
  return new Date(Math.max(...dates)).toLocaleString();
}

export function FilterPanel({
  filters,
  setFilters,
  participants,
  acts,
  showAct,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  participants: Participant[];
  acts: (string | number)[];
  showAct?: boolean;
}) {
  const genders = uniqueValues(participants, (user) => user.gender);
  const ages = uniqueValues(participants, (user) => user.age);
  const schools = uniqueValues(participants, (user) => user.school);

  return (
    <section className="filter-panel">
      <h2>Filters</h2>
      <div className="filter-grid">
        <label>
          Date from
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        </label>
        <label>
          Date to
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        </label>
        <label>
          Gender
          <select value={filters.gender} onChange={(event) => setFilters({ ...filters, gender: event.target.value })}>
            <option value="all">All</option>
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </label>
        <label>
          Age
          <select value={filters.age} onChange={(event) => setFilters({ ...filters, age: event.target.value })}>
            <option value="all">All</option>
            {ages.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </label>
        <label>
          School
          <select value={filters.school} onChange={(event) => setFilters({ ...filters, school: event.target.value })}>
            <option value="all">All</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </label>
        {showAct ? (
          <label>
            ACT
            <select value={filters.act} onChange={(event) => setFilters({ ...filters, act: event.target.value })}>
              <option value="all">All</option>
              {acts.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <button className="text-button" onClick={() => setFilters(emptyFilters)}>
        Reset filters
      </button>
    </section>
  );
}

export function Header({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function SummaryPanel({ title, items }: { title: string; items: { label: string; value: string | number }[] }) {
  const icons = [CheckCircle2, Database, Clock3, HeartPulse];
  return (
    <article className="summary-panel">
      <h3>{title}</h3>
      <div className="summary-list">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div className="summary-item" key={item.label}>
              <span>
                <Icon size={16} />
              </span>
              <div>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function RecordList({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  return (
    <article className="record-list">
      <h3>{title}</h3>
      <div className="record-items">
        {rows.length ? (
          rows.map((row, index) => (
            <div className="record-item" key={index}>
              <strong>{String(row.User ?? row.ACT ?? `Record ${index + 1}`)}</strong>
              <span>
                ACT {String(row.ACT ?? "-")} · Score {String(row.Score ?? "-")} · {String(row.Completed ?? "-")}
              </span>
            </div>
          ))
        ) : (
          <p className="empty-state">No data</p>
        )}
      </div>
    </article>
  );
}

export function SensorCard({ title, values }: { title: string; values: number[] }) {
  const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return (
    <article className="sensor-card">
      <h3>{title}</h3>
      <p>Max {values.length ? Math.max(...values).toFixed(2) : "-"} / Avg {values.length ? avg.toFixed(2) : "-"} / Min{" "}
        {values.length ? Math.min(...values).toFixed(2) : "-"}
      </p>
    </article>
  );
}

export function BarPanel({ title, data, wide }: { title: string; data: { label: string; value: number }[]; wide?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <article className={`chart-panel ${wide ? "wide" : ""}`}>
      <h3>{title}</h3>
      <div className="bar-chart">
        {data.length ? (
          data.map((item) => (
            <div className="bar-item" key={item.label}>
              <span>{item.label}</span>
              <div>
                <i style={{ width: `${(item.value / max) * 100}%` }} />
              </div>
              <b>{item.value}</b>
            </div>
          ))
        ) : (
          <p className="empty-state">No data</p>
        )}
      </div>
    </article>
  );
}

export function DonutPanel({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const first = total ? Math.round(((data[0]?.value ?? 0) / total) * 100) : 0;
  return (
    <article className="donut-panel">
      <h3>{title}</h3>
      <div className="donut" style={{ background: `conic-gradient(#0b58a4 0 ${first}%, #53b7df ${first}% 100%)` }}>
        <span>{total}</span>
      </div>
      <div className="legend">
        {data.map((item) => (
          <span key={item.label}>
            {item.label}: {item.value}
          </span>
        ))}
      </div>
    </article>
  );
}

export function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const [query, setQuery] = useState("");
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const visibleRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="table-card">
      <div className="table-tools">
        <Search size={16} />
        <input placeholder="Search..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={header}>{String(row[header] ?? "")}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(headers.length, 1)} className="empty-state">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function estimateAverageDuration(logs: WatchLog[]) {
  const grouped = new Map<string, number[]>();
  logs.forEach((log) => {
    if (!log.userId || !log.act || !log.timestamp) return;
    const key = `${log.userId}:${log.act}`;
    grouped.set(key, [...(grouped.get(key) ?? []), new Date(log.timestamp).getTime()]);
  });
  const durations = Array.from(grouped.values())
    .map((times) => (Math.max(...times) - Math.min(...times)) / 60000)
    .filter((duration) => Number.isFinite(duration) && duration > 0);
  if (!durations.length) return "-";
  const avg = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  return `${avg.toFixed(1)} min`;
}
