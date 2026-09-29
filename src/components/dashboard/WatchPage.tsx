"use client";

import { Download } from "lucide-react";
import type { Participant, WatchLog } from "@/lib/supabase";
import {
  BarPanel,
  DataTable,
  FilterPanel,
  Header,
  MetricCard,
  SensorCard,
  SummaryPanel,
  asNumber,
  average,
  countBy,
  downloadCsv,
  estimateAverageDuration,
  formatNumber,
  matchesParticipant,
  uniqueValues,
  withinDateRange,
  type Filters,
} from "./shared";

export function WatchPage({
  participants,
  watchLogs,
  filters,
  setFilters,
  canExport,
}: {
  participants: Participant[];
  watchLogs: WatchLog[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  canExport: boolean;
}) {
  const userById = new Map(participants.map((user) => [user.userId, user]));
  const acts = uniqueValues(watchLogs, (log) => log.act);
  const filteredLogs = watchLogs.filter((log) => {
    const user = log.userId == null ? undefined : userById.get(log.userId);
    if (!matchesParticipant(user, filters)) return false;
    if (filters.act !== "all" && log.act !== filters.act) return false;
    return withinDateRange(log.timestamp, filters);
  });

  const ppgValues = filteredLogs.map((log) => asNumber(log.PPG)).filter((value): value is number => value !== null);
  const edaValues = filteredLogs.map((log) => asNumber(log.EDA)).filter((value): value is number => value !== null);
  const imuValues = filteredLogs.map((log) => asNumber(log.IMU)).filter((value): value is number => value !== null);
  const watchParticipants = new Set(filteredLogs.map((log) => log.userId).filter(Boolean));
  const emotionData = countBy(filteredLogs, (log) => log.emotionValue || "No emotion");
  const signalItems = [
    { label: "Average PPG", value: formatNumber(average(ppgValues), 1) },
    { label: "Average EDA", value: formatNumber(average(edaValues), 2) },
    { label: "Average IMU", value: formatNumber(average(imuValues), 2) },
    { label: "Emotion groups", value: emotionData.length },
  ];
  const actSensorRows = acts.map((act) => {
    const actLogs = filteredLogs.filter((log) => log.act === String(act));
    const actPpg = actLogs.map((log) => asNumber(log.PPG)).filter((value): value is number => value !== null);
    const actEda = actLogs.map((log) => asNumber(log.EDA)).filter((value): value is number => value !== null);
    const actImu = actLogs.map((log) => asNumber(log.IMU)).filter((value): value is number => value !== null);
    return {
      ACT: act,
      Samples: actLogs.length,
      Participants: new Set(actLogs.map((log) => log.userId)).size,
      "Avg PPG": formatNumber(average(actPpg), 1),
      "Avg EDA": formatNumber(average(actEda), 2),
      "Avg IMU": formatNumber(average(actImu), 2),
    };
  });

  const rows = filteredLogs.map((log) => {
    const user = log.userId == null ? undefined : userById.get(log.userId);
    return {
      User: user ? `${user.name ?? ""} ${user.lastname ?? ""}`.trim() || user.email || user.userId : log.userId ?? "",
      Age: user?.age ?? "",
      Gender: user?.gender ?? "",
      School: user?.school ?? "",
      ACT: log.act ?? "",
      PPG: log.PPG ?? "",
      EDA: log.EDA ?? "",
      IMU: asNumber(log.IMU) ?? JSON.stringify(log.IMU ?? ""),
      "emotion value": log.emotionValue ?? "",
      "Time Stamps": log.timestamp ?? "",
    };
  });

  return (
    <>
      <Header title="Watch Data" description="Watch records grouped by ACT, participant, and physiological signal." />
      <FilterPanel filters={filters} setFilters={setFilters} participants={participants} acts={acts} showAct />
      <section className="metric-grid watch-metrics">
        <MetricCard label="Watch Participants" value={watchParticipants.size} />
        <MetricCard label="Avg Duration" value={estimateAverageDuration(filteredLogs)} />
      </section>
      <section className="dashboard-layout">
        <div className="main-stack">
          <section className="insight-grid sensor-overview">
            <SensorCard title="PPG" values={ppgValues} />
            <SensorCard title="EDA" values={edaValues} />
            <SensorCard title="IMU" values={imuValues} />
          </section>
          <div className="table-heading">
            <h2>Sensor Summary by ACT</h2>
          </div>
          <DataTable rows={actSensorRows} />
          <div className="table-heading secondary-heading">
            <h2>Watch Samples</h2>
            <button className="secondary-button" disabled={!canExport || !rows.length} onClick={() => downloadCsv("watch-data.csv", rows)}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          {!canExport ? <p className="hint">Admin role can view data only. Export is available for super admin.</p> : null}
          <DataTable rows={rows} />
        </div>
        <aside className="side-stack">
          <SummaryPanel title="Signal Snapshot" items={signalItems} />
          <BarPanel title="Emotion Values" data={emotionData} />
        </aside>
      </section>
    </>
  );
}

