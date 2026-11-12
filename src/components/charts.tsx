"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { cn } from "@/lib/cn";

const COLORS = {
  primary: "#1860f8",
  primarySoft: "#e7efff",
  amber: "#c4840a",
  amberSoft: "#fff4d6",
  ok: "#157a42",
  okSoft: "#e5f6ec",
  bad: "#d92d3a",
  badSoft: "#fde8ea",
  muted: "#5c6b80",
  line: "#d7e1ee",
  ink: "#102033",
  surface: "#ffffff",
  bg: "#f3f6fb",
};

const darkColors = {
  primary: "#5b8cff",
  primarySoft: "#1b2c4d",
  amber: "#f0b429",
  amberSoft: "#3a2d12",
  ok: "#3dce7a",
  okSoft: "#123524",
  bad: "#ff5d6c",
  badSoft: "#3d1720",
  muted: "#9aabc2",
  line: "#2c3e58",
  ink: "#e8eef8",
  surface: "#172033",
  bg: "#0e1524",
};

export function getChartColors(isDark: boolean) {
  return isDark ? darkColors : COLORS;
}

const tooltipStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? "#172033" : "#ffffff",
  border: `1px solid ${isDark ? "#2c3e58" : "#d7e1ee"}`,
  borderRadius: "12px",
  boxShadow: "0 10px 28px rgba(16, 32, 51, 0.06)",
  padding: "12px 16px",
});

const labelStyle = (isDark: boolean) => ({
  fill: isDark ? "#9aabc2" : "#5c6b80",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "Outfit, sans-serif",
});

export function XPTimelineChart({
  data,
  isDark = false,
  className,
}: {
  data: Array<{ date: string; xp: number; cumulative: number }>;
  isDark?: boolean;
  className?: string;
}) {
  const colors = getChartColors(isDark);

  return (
    <div className={cn("h-64", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
            tick={{ ...labelStyle(isDark), dy: 8 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ ...labelStyle(isDark), dx: -8 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          />
          <Tooltip
            contentStyle={tooltipStyle(isDark)}
            formatter={(value: number) => [value.toLocaleString(), "XP"]}
            labelFormatter={(value) => new Date(value).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={colors.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#xpGradient)"
            dot={false}
            activeDot={{ r: 6, fill: colors.primary, strokeWidth: 2, stroke: colors.surface }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyXPBarChart({
  data,
  isDark = false,
  className,
}: {
  data: Array<{ day: string; xp: number; goal: number }>;
  isDark?: boolean;
  className?: string;
}) {
  const colors = getChartColors(isDark);

  return (
    <div className={cn("h-48", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ ...labelStyle(isDark), dy: 8 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ ...labelStyle(isDark), dx: -8 }}
            axisLine={false}
            tickLine={false}
            hide={true}
          />
          <Tooltip
            contentStyle={tooltipStyle(isDark)}
            formatter={(value: number) => [value.toLocaleString(), "XP"]}
            labelFormatter={(value) => value}
          />
          <Bar dataKey="xp" fill={colors.primary} radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccuracyRadialChart({
  accuracy,
  isDark = false,
  className,
  size = 120,
}: {
  accuracy: number;
  isDark?: boolean;
  className?: string;
  size?: number;
}) {
  const colors = getChartColors(isDark);
  const color = accuracy >= 80 ? colors.ok : accuracy >= 60 ? colors.amber : colors.bad;

  return (
    <div className={cn("flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart>
          <RadialBar
            cx="50%"
            cy="50%"
            // @ts-expect-error innerRadius/outerRadius not in types
            innerRadius={70}
            outerRadius={95}
            dataKey="value"
            minAngle={0}
            background={{ fill: colors.line, opacity: 0.3 }}
            roundCap={true}
          >
            <Cell fill={color} />
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: "Fraunces, serif", fontSize: size * 0.22, fontWeight: 700, color: colors.ink }}>
          {accuracy}%
        </span>
        <span style={{ fontSize: size * 0.09, color: colors.muted }}>Precisão</span>
      </div>
    </div>
  );
}

export function CourseProgressPieChart({
  data,
  isDark = false,
  className,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  isDark?: boolean;
  className?: string;
}) {
  const colors = getChartColors(isDark);

  return (
    <div className={cn("h-48", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            startAngle={90}
            endAngle={270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle(isDark)}
            formatter={(value: number) => [value, "lições"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StreakHeatmap({
  activeDays,
  isDark = false,
  className,
  weeks = 12,
}: {
  activeDays: string[];
  isDark?: boolean;
  className?: string;
  weeks?: number;
}) {
  const colors = getChartColors(isDark);
  const today = new Date();
  const cells: Array<{ date: string; day: number; week: number; active: boolean; level: number }> = [];

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weeks - 1 - w) * 7 - (6 - d));
      const dateStr = date.toISOString().split("T")[0];
      const active = activeDays.includes(dateStr);
      cells.push({ date: dateStr, day: d, week: w, active, level: active ? 1 : 0 });
    }
  }

  const maxWeek = weeks - 1;

  return (
    <div className={cn("flex items-end gap-1 overflow-x-auto pb-2", className)}>
      {[6, 5, 4, 3, 2, 1, 0].map((day) => (
        <div key={day} className="flex flex-col gap-1">
          <div className="w-5 text-right pr-1" style={{ fontSize: 10, color: colors.muted }}>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day].slice(0, 1)}
          </div>
          {cells
            .filter((c) => c.day === day)
            .map((cell, weekIndex) => (
              <div
                key={cell.date}
                className="w-5 h-5 rounded-sm transition-colors"
                style={{
                  backgroundColor: cell.active
                    ? weekIndex === maxWeek
                      ? colors.primary
                      : colors.primarySoft
                    : colors.line,
                }}
                title={new Date(cell.date).toLocaleDateString("pt-PT") + (cell.active ? " ✓" : "")}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

export function LessonTypeDistributionChart({
  data,
  isDark = false,
  className,
}: {
  data: Array<{ type: string; count: number; color: string }>;
  isDark?: boolean;
  className?: string;
}) {
  const colors = getChartColors(isDark);

  return (
    <div className={cn("h-48", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.line} horizontal={false} />
          <XAxis type="number" tick={{ ...labelStyle(isDark) }} axisLine={false} tickLine={false} hide />
          <YAxis
            dataKey="type"
            type="category"
            tick={{ ...labelStyle(isDark), dx: -8 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value: number) => [value, "exercícios"]} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyComparisonChart({
  currentWeek,
  previousWeek,
  isDark = false,
  className,
}: {
  currentWeek: Array<{ day: string; xp: number }>;
  previousWeek: Array<{ day: string; xp: number }>;
  isDark?: boolean;
  className?: string;
}) {
  const colors = getChartColors(isDark);

  const data = currentWeek.map((c, i) => ({
    day: c.day,
    atual: c.xp,
    anterior: previousWeek[i]?.xp ?? 0,
  }));

  return (
    <div className={cn("h-48", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
          <XAxis dataKey="day" tick={{ ...labelStyle(isDark), dy: 8 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ ...labelStyle(isDark), dx: -8 }} axisLine={false} tickLine={false} hide />
          <Tooltip
            contentStyle={tooltipStyle(isDark)}
            formatter={(value: number, name: string) => [value.toLocaleString(), name === "atual" ? "Esta semana" : "Semana passada"]}
          />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar dataKey="atual" fill={colors.primary} name="Esta semana" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="anterior" fill={colors.muted} name="Semana passada" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}