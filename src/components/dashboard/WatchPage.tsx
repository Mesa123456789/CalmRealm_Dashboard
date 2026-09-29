"use client";

import { ChevronDown, ChevronRight, Clock3, Download, UsersRound } from "lucide-react";
import { useState } from "react";
import type { Participant, WatchLog } from "@/lib/supabase";
import {
  DataTable,
  MetricCard,
  PageHeader,
  SensorCard,
  asNumber,
  average,
  downloadCsv,
  estimateAverageDuration,
  formatNumber,
  matchesParticipant,
  participantName,
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
  const [showActSummary, setShowActSummary] = useState(true);
  const [showUserSummary, setShowUserSummary] = useState(true);

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

  const userSensorRows = Array.from(
    new Set(filteredLogs.map((log) => log.userId).filter((id): id is number => id !== null)),
  ).map((userId) => {
    const user = userById.get(userId);
    const userLogs = filteredLogs.filter((log) => log.userId === userId);
    const userPpg = userLogs.map((log) => asNumber(log.PPG)).filter((v): v is number => v !== null);
    const userEda = userLogs.map((log) => asNumber(log.EDA)).filter((v): v is number => v !== null);
    const userImu = userLogs.map((log) => asNumber(log.IMU)).filter((v): v is number => v !== null);
    return {
      User: participantName(user),
      Samples: userLogs.length,
      "Avg PPG": formatNumber(average(userPpg), 1),
      "Avg EDA": formatNumber(average(userEda), 2),
      "Avg IMU": formatNumber(average(userImu), 2),
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
      <PageHeader
        title="Watch Data"
        description="Watch records grouped by ACT, participant, and physiological signal."
        filters={filters}
        setFilters={setFilters}
        participants={participants}
        acts={acts}
        showAct
      />
      <div className="page-body">
        <section className="metric-grid watch-metrics">
          <MetricCard label="Watch Participants" value={watchParticipants.size} icon={UsersRound} />
          <MetricCard label="Avg Duration" value={estimateAverageDuration(filteredLogs)} icon={Clock3} />
        </section>
        <section className="dashboard-layout overview-layout">
          <div className="main-stack">
            <section className="insight-grid sensor-overview">
              <SensorCard title="PPG" values={ppgValues} />
              <SensorCard title="EDA" values={edaValues} />
              <SensorCard title="IMU" values={imuValues} />
            </section>
            <div className="table-heading clickable-heading" onClick={() => setShowActSummary((prev) => !prev)}>
              <div className="heading-title">
                <button type="button" className="icon-toggle-button" aria-label="Toggle ACT Summary">
                  {showActSummary ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <h2>Sensor Summary by ACT</h2>
              </div>
            </div>
            {showActSummary ? <DataTable rows={actSensorRows} /> : null}

            <div className="table-heading secondary-heading clickable-heading" onClick={() => setShowUserSummary((prev) => !prev)}>
              <div className="heading-title">
                <button type="button" className="icon-toggle-button" aria-label="Toggle User Summary">
                  {showUserSummary ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <h2>Sensor Summary by User</h2>
              </div>
            </div>
            {showUserSummary ? <DataTable rows={userSensorRows} /> : null}
            <div className="table-heading secondary-heading">
              <h2>Watch Samples</h2>
              <button className="secondary-button" disabled={!canExport || !rows.length} onClick={() => downloadCsv("watch-data.csv", rows)}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            {!canExport ? <p className="hint">Admin role can view data only. Export is available for super admin.</p> : null}
            <DataTable rows={rows} />
          </div>
        </section>
      </div>
    </>
  );
}
