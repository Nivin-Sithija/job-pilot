"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type DayPoint = {
  day: string;
  value: number;
};

type ScoreRangePoint = {
  range: string;
  value: number;
};

type AnalyticsChartsProps = {
  jobsOverTime: DayPoint[];
  companyResearchActivity: DayPoint[];
  matchScoreDistribution: ScoreRangePoint[];
  hasJobsOverTimeData?: boolean;
  hasCompanyResearchData?: boolean;
  hasMatchScoreData?: boolean;
};

const axisTick = { fill: "#9CA3AF", fontSize: 12 };
const gridProps = { stroke: "#E7EAF3", strokeDasharray: "3 3", vertical: false };

function JobsOverTimeChart({ data, hasData }: { data: DayPoint[]; hasData: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Jobs Found Over Time</h2>
      {!hasData ? (
        <p className="mt-4 text-sm text-text-muted">No jobs found yet.</p>
      ) : (
        <div className="mt-2 min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="jobsOverTimeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7C5CFC"
                strokeWidth={3}
                fill="url(#jobsOverTimeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function CompanyResearchChart({ data, hasData }: { data: DayPoint[]; hasData: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Company Research Activity</h2>
      {!hasData ? (
        <p className="mt-4 text-sm text-text-muted">No company research yet.</p>
      ) : (
        <div className="mt-2 min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Bar dataKey="value" fill="#61A8FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MatchScoreChart({ data, hasData }: { data: ScoreRangePoint[]; hasData: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Match Score Distribution</h2>
      {!hasData ? (
        <p className="mt-4 text-sm text-text-muted">No match scores yet.</p>
      ) : (
        <div className="mt-2 min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="range" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function AnalyticsCharts({
  jobsOverTime,
  companyResearchActivity,
  matchScoreDistribution,
  hasJobsOverTimeData = true,
  hasCompanyResearchData = true,
  hasMatchScoreData = true,
}: AnalyticsChartsProps) {
  return (
    <>
      <CompanyResearchChart data={companyResearchActivity} hasData={hasCompanyResearchData} />
      <JobsOverTimeChart data={jobsOverTime} hasData={hasJobsOverTimeData} />
      <MatchScoreChart data={matchScoreDistribution} hasData={hasMatchScoreData} />
    </>
  );
}

export type { DayPoint, ScoreRangePoint };
