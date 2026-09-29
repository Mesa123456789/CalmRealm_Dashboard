"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import type { Participant, SceneData } from "@/lib/supabase";
import {
  BarPanel,
  DataTable,
  DonutPanel,
  FilterPanel,
  Header,
  MetricCard,
  RecordList,
  average,
  countBy,
  downloadCsv,
  formatNumber,
  formatPercent,
  latestDate,
  matchesParticipant,
  participantName,
  sceneDuration,
  sceneResult,
  sceneScore,
  sceneStars,
  uniqueValues,
  withinDateRange,
  type Filters,
} from "./shared";

export function OverviewPage({
  participants,
  sceneData,
  filters,
  setFilters,
  canExport,
}: {
  participants: Participant[];
  sceneData: SceneData[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  canExport: boolean;
}) {
  const userById = useMemo(() => new Map(participants.map((user) => [user.userId, user])), [participants]);
  const availableActs = useMemo(() => uniqueValues(sceneData, (scene) => scene.act), [sceneData]);
  const filteredParticipants = participants.filter((user) => matchesParticipant(user, filters));
  const filteredUserIds = new Set(filteredParticipants.map((user) => user.userId));
  const filteredScenes = sceneData.filter(
    (scene) =>
      scene.userId !== null &&
      filteredUserIds.has(scene.userId) &&
      withinDateRange(scene.createdAt, filters),
  );
  const completionKeys = new Set(filteredScenes.map((scene) => `${scene.userId}:${scene.act}`));
  const completedUserIds = new Set(filteredScenes.map((scene) => scene.userId));
  const completionRate = filteredParticipants.length ? (completedUserIds.size / filteredParticipants.length) * 100 : 0;
  const scoreValues = filteredScenes.map(sceneScore).filter((value): value is number => value !== null);
  const durationValues = filteredScenes.map(sceneDuration).filter((value): value is number => value !== null);
  const averageScore = average(scoreValues);
  const averageDuration = average(durationValues);
  const ageData = countBy(filteredParticipants, (user) => user.age);
  const genderData = countBy(filteredParticipants, (user) => user.gender);
  const schoolData = countBy(filteredParticipants, (user) => user.school);

  const rows = filteredParticipants.map((user) => ({
    User: `${user.name ?? ""} ${user.lastname ?? ""}`.trim() || user.email || `User ${user.userId}`,
    Age: user.age ?? "",
    Gender: user.gender ?? "",
    School: user.school ?? "",
    "Completion Rate": availableActs.length
      ? formatPercent((Array.from(completionKeys).filter((key) => key.startsWith(`${user.userId}:`)).length / availableActs.length) * 100)
      : "-",
    "Latest Complete": latestDate(filteredScenes.filter((scene) => scene.userId === user.userId).map((scene) => scene.createdAt)),
  }));

  const recentCompletions = filteredScenes
    .slice()
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 8)
    .map((scene) => ({
      User: participantName(scene.userId == null ? undefined : userById.get(scene.userId)),
      ACT: scene.act ?? "-",
      Score: sceneScore(scene) ?? "-",
      Stars: sceneStars(scene) ?? "-",
      Result: sceneResult(scene),
      Completed: scene.createdAt ? new Date(scene.createdAt).toLocaleString() : "-",
    }));

  return (
    <>
      <Header title="Dashboard Overview" description="Completion, demographics, and ACT performance across all participants." />
      <FilterPanel filters={filters} setFilters={setFilters} participants={participants} acts={[]} />
      <section className="metric-grid overview-metrics">
        <MetricCard label="Participants" value={filteredParticipants.length} />
        <MetricCard label="Completed Users" value={completedUserIds.size} />
        <MetricCard label="Completion Rate" value={formatPercent(completionRate)} />
        <MetricCard label="Average score" value={formatNumber(averageScore, 1)} />
        <MetricCard label="Avg play time" value={averageDuration === null ? "-" : `${formatNumber(averageDuration / 60, 1)} min`} />
      </section>
      <section className="dashboard-layout overview-layout">
        <div className="main-stack">
          <section className="insight-grid overview-charts">
            <BarPanel title="Age Distribution" data={ageData} />
            <DonutPanel title="Gender" data={genderData} />
          </section>
          <section className="insight-grid school-distribution">
            <BarPanel title="School Distribution" data={schoolData} wide />
          </section>
          <div className="table-heading">
            <h2>Participant Progress</h2>
            <button className="secondary-button" disabled={!canExport || !rows.length} onClick={() => downloadCsv("overview.csv", rows)}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          {!canExport ? <p className="hint">Admin role can view data only. Export is available for super admin.</p> : null}
          <DataTable rows={rows} />
        </div>
        {/* <aside className="side-stack">
          <RecordList title="Recent Records" rows={recentCompletions} />
        </aside> */}
      </section>
    </>
  );
}
