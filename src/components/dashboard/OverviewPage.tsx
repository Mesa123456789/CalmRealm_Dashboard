"use client";

import { CircleCheckBig, Clock3, Download, Gauge, LineChart, Star, Trophy, UsersRound } from "lucide-react";
import { useMemo } from "react";
import type { Participant, SceneData } from "@/lib/supabase";
import {
  BarPanel,
  DataTable,
  DonutPanel,
  MetricCard,
  PageHeader,
  average,
  countBy,
  downloadCsv,
  formatNumber,
  formatPercent,
  matchesParticipant,
  participantName,
  sceneDuration,
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
  const availableActs = useMemo(() => uniqueValues(sceneData, (scene) => scene.act), [sceneData]);
  const filteredParticipants = participants.filter((user) => matchesParticipant(user, filters));
  const filteredUserIds = new Set(filteredParticipants.map((user) => user.userId));
  const filteredScenes = sceneData.filter(
    (scene) =>
      scene.userId !== null &&
      filteredUserIds.has(scene.userId) &&
      (filters.act === "all" || scene.act === filters.act) &&
      withinDateRange(scene.createdAt, filters),
  );
  const completionKeys = new Set(filteredScenes.map((scene) => `${scene.userId}:${scene.act}`));
  const completedUserIds = new Set(filteredScenes.map((scene) => scene.userId));
  const completionRate = filteredParticipants.length ? (completedUserIds.size / filteredParticipants.length) * 100 : 0;

  const scoreValues = filteredScenes.map(sceneScore).filter((value): value is number => value !== null);
  const durationValues = filteredScenes.map(sceneDuration).filter((value): value is number => value !== null);
  const starValues = filteredScenes.map(sceneStars).filter((value): value is number => value !== null);

  const averageScore = average(scoreValues);
  const averageDuration = average(durationValues);
  const averageStars = average(starValues);

  const minScore = scoreValues.length ? Math.min(...scoreValues) : null;
  const maxScore = scoreValues.length ? Math.max(...scoreValues) : null;

  const minDuration = durationValues.length ? Math.min(...durationValues) : null;
  const maxDuration = durationValues.length ? Math.max(...durationValues) : null;

  const minStars = starValues.length ? Math.min(...starValues) : null;
  const maxStars = starValues.length ? Math.max(...starValues) : null;

  const ageData = countBy(filteredParticipants, (user) => user.age);
  const genderData = countBy(filteredParticipants, (user) => user.gender);
  const schoolData = countBy(filteredParticipants, (user) => user.school);

  const rows = filteredParticipants.flatMap((user) => {
    const userScenes = filteredScenes
      .filter((scene) => scene.userId === user.userId)
      .sort((a, b) => String(a.act ?? "").localeCompare(String(b.act ?? ""), undefined, { numeric: true }));

    if (!userScenes.length) {
      if (filters.act !== "all") return [];
      return [
        {
          User: participantName(user),
          Age: user.age ?? "",
          Gender: user.gender ?? "",
          School: user.school ?? "",
          ACT: "-",
          Score: "-",
          Ranks: "-",
          "Completion Rate": "0%",
          "Latest Complete": "-",
        },
      ];
    }

    const seen = new Set<string>();
    const uniqueUserScenes = userScenes.filter((scene) => {
      const key = `${scene.act}:${scene.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueUserScenes.map((scene) => ({
      User: participantName(user),
      Age: user.age ?? "",
      Gender: user.gender ?? "",
      School: user.school ?? "",
      ACT: scene.act ?? "-",
      Score: sceneScore(scene) ?? "-",
      Ranks: sceneStars(scene) ?? "-",
      "Completion Rate": availableActs.length
        ? formatPercent(
            (Array.from(completionKeys).filter((key) => key.startsWith(`${user.userId}:`)).length /
              availableActs.length) *
              100,
          )
        : "-",
      "Latest Complete": scene.createdAt ? new Date(scene.createdAt).toLocaleString() : "-",
    }));
  });

  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        description="Completion, demographics, and ACT performance across all participants."
        filters={filters}
        setFilters={setFilters}
        participants={participants}
        acts={availableActs}
        showAct
      />
      <div className="page-body">
        <section className="metric-grid overview-metrics">
          <MetricCard label="Participants" value={filteredParticipants.length} icon={UsersRound} />
          <MetricCard label="Completed Users" value={completedUserIds.size} icon={CircleCheckBig} />
          <MetricCard label="Completion Rate" value={formatPercent(completionRate)} icon={Gauge} />
        </section>
        <section className="dashboard-layout overview-layout">
          <div className="main-stack">
            <section className="overview-visual-grid">
              <div className="overview-left-stack">
                <BarPanel title="Age Distribution" data={ageData} />
                <BarPanel title="School Distribution" data={schoolData} wide />
              </div>
              <div className="overview-right-stack">
                <DonutPanel title="Gender" data={genderData} icon={UsersRound} />
                <article className="performance-panel">
                  <div className="section-title">
                    <span className="section-icon">
                      <LineChart size={16} />
                    </span>
                    <h2>Performance Snapshot</h2>
                  </div>
                  <div className="performance-chips">
                    <div className="perf-chip perf-score">
                      <div className="perf-chip-left">
                        <span className="perf-icon-badge">
                          <Trophy size={20} />
                        </span>
                        <div className="perf-main-info">
                          <small>Average score</small>
                          <strong>{formatNumber(averageScore, 1)}</strong>
                        </div>
                      </div>
                      <div className="perf-range-right">
                        <span>Min: {formatNumber(minScore, 0)}</span>
                        <span>Max: {formatNumber(maxScore, 0)}</span>
                      </div>
                    </div>
                    <div className="perf-chip perf-time">
                      <div className="perf-chip-left">
                        <span className="perf-icon-badge">
                          <Clock3 size={20} />
                        </span>
                        <div className="perf-main-info">
                          <small>Avg play time</small>
                          <strong>
                            {averageDuration === null ? "-" : `${formatNumber(averageDuration / 60, 1)} min`}
                          </strong>
                        </div>
                      </div>
                      <div className="perf-range-right">
                        <span>Min: {minDuration === null ? "-" : `${formatNumber(minDuration / 60, 1)}m`}</span>
                        <span>Max: {maxDuration === null ? "-" : `${formatNumber(maxDuration / 60, 1)}m`}</span>
                      </div>
                    </div>
                    <div className="perf-chip perf-rank">
                      <div className="perf-chip-left">
                        <span className="perf-icon-badge">
                          <Star size={20} fill="currentColor" />
                        </span>
                        <div className="perf-main-info">
                          <small>Avg rank</small>
                          <strong>{formatNumber(averageStars, 1)}</strong>
                        </div>
                      </div>
                      <div className="perf-range-right">
                        <span>Min: {formatNumber(minStars, 0)}</span>
                        <span>Max: {formatNumber(maxStars, 0)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
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
        </section>
      </div>
    </>
  );
}
