"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  clientVolumeData,
  kpis,
  liveRequests,
  navItems,
  qualityBreakdown,
  timelinessBreakdown,
  type DonutPoint,
  type LiveRequest,
  type RequestStatus,
} from "./data";

const statusClasses: Record<RequestStatus, string> = {
  "On Track": "text-[#22b66f]",
  Delayed: "text-[#e56a38]",
  Critical: "text-[#df3f3f]",
};

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          className="h-17 animate-pulse rounded-lg bg-[#eef2f1]"
          key={index}
        />
      ))}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8d3] bg-white px-4 text-center">
      <p className="text-sm font-semibold text-[#2f3a35]">{title}</p>
      <p className="mt-1 text-xs text-[#8a9690]">
        Clear the search field or broaden the visible request list.
      </p>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div
      className="h-full min-h-44 animate-pulse rounded-lg bg-[#eef4f1]"
      aria-label="Chart loading"
    />
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-[#dbe5df] bg-white px-3 py-2 text-xs text-[#37433d] shadow-lg">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      {payload.map((item) => (
        <div className="flex items-center gap-4" key={item.name}>
          <span>{item.name}</span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function HeaderSelect({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1 border-[#dbe2de] bg-white px-3 text-[11px] font-medium text-[#9aa39f] hover:bg-[#f4f7f5]">
      {label}
      <ChevronDown className="size-3.5" />
    </Button>
  );
}

function RequestCard({ request }: { request: LiveRequest }) {
  return (
    <button className="w-full rounded-md bg-white px-2.5 py-2 text-left shadow-[0_1px_4px_rgba(25,48,38,0.08)] transition hover:bg-[#f9fbfa]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#a3aba7]">
            {request.id}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[#2b3430]">
            {request.title}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {request.badges.map((badge, index) => (
            <span
              className={cn(
                "grid size-4 place-items-center rounded border text-[10px] font-bold",
                request.status === "Critical"
                  ? "border-[#e7b7ac] bg-[#fff6f2] text-[#d75135]"
                  : "border-[#aee1c6] bg-[#f2fbf6] text-[#38b879]",
              )}
              key={`${request.id}-${request.title}-${index}`}>
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="truncate text-[11px] font-medium text-[#3f4a45]">
          {request.owner}
        </p>
        <div className="text-right">
          <p
            className={cn(
              "text-[10px] font-bold leading-none",
              statusClasses[request.status],
            )}>
            {request.status}
          </p>
          <p className="mt-1 text-[9px] text-[#b0bab5]">{request.date}</p>
        </div>
      </div>
    </button>
  );
}

function DonutChart({
  data,
  score,
  title,
}: {
  data: DonutPoint[];
  score: string;
  title: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <div className="flex min-h-72 flex-col items-center justify-center">
      <div className="relative h-50 w-50">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={data}
                dataKey="value"
                innerRadius={64}
                outerRadius={82}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                stroke="none">
                {data.map((entry) => (
                  <Cell fill={entry.color} key={entry.name} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartPlaceholder />
        )}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-semibold text-[#3a443f]">{score}</p>
            <p className="text-[11px] text-[#9da8a2]">{title}</p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex max-w-72 flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((item) => (
          <span
            className="flex items-center gap-1.5 text-[10px] font-semibold text-[#33403a]"
            key={item.name}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [query, setQuery] = useState("");

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return liveRequests.filter((request) => {
      return (
        !normalizedQuery ||
        request.title.toLowerCase().includes(normalizedQuery) ||
        request.owner.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  return (
    <main className="min-h-screen bg-[#f2f5f4] text-[#2d3632]">
      <div className="flex min-h-screen">
        <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[#dfe6e2] bg-white">
          <div className="grid h-12 w-full place-items-center border-b border-[#e6ebe8]">
            {/* Replace this text mark with the final brand image/logo asset when available. */}
            <div className="grid size-7 place-items-center rounded border-2 border-[#6fcaf0] bg-[#f7fcff] text-sm font-black text-[#37aadd]">
              EZ
            </div>
          </div>
          <nav
            className="flex flex-1 flex-col items-center gap-4 py-5"
            aria-label="Live Requests navigation">
            {navItems.slice(0, 5).map((item) => (
              <Button
                variant={item.active ? "outline" : "ghost"}
                size="icon-sm"
                className={cn(
                  "text-[#7f8e87] hover:bg-[#eef7f2] hover:text-[#245f46]",
                  item.active &&
                    "border-[#b7d3c6] bg-[#eaf6f0] text-[#285f48]",
                )}
                aria-label={item.label}
                key={item.label}>
                <item.icon className="size-4" />
              </Button>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-4 py-5">
            {navItems.slice(5).map((item) => (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#7f8e87] hover:bg-[#eef7f2] hover:text-[#245f46]"
                aria-label={item.label}
                key={item.label}>
                <item.icon className="size-4" />
              </Button>
            ))}
          </div>
        </aside>

        <aside className="hidden w-64 shrink-0 border-r border-[#dfe6e2] bg-[#f8faf9] lg:block">
          <div className="flex h-12 items-center justify-between border-b border-[#e2e8e4] px-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-0 text-sm font-semibold text-[#28332e] hover:bg-transparent">
              Live Requests
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              className="bg-black text-white shadow-md hover:bg-black/85"
              aria-label="Add request">
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="space-y-3 p-3">
            <label className="relative block">
              <span className="sr-only">Search requests</span>
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#a9b2ad]" />
              <input
                className="h-9 w-full rounded-lg border border-[#dfe6e2] bg-white px-3 pr-9 text-xs font-medium text-[#35413b] outline-none transition placeholder:text-[#b5bfba] focus:border-[#84c9a4] focus:ring-3 focus:ring-[#53bf83]/15"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="flex items-center justify-between text-xs font-semibold text-[#99a39e]">
              <span>September 2025</span>
              <ChevronUp className="size-4" />
            </div>
            <div className="space-y-2">
              {filteredRequests.length ? (
                filteredRequests.map((request, index) => (
                  <RequestCard
                    request={request}
                    key={`${request.title}-${request.owner}-${index}`}
                  />
                ))
              ) : (
                <EmptyState title="No requests match this search" />
              )}
            </div>
            <div className="space-y-2 pt-1 text-xs font-semibold text-[#9aa49f]">
              <button className="flex w-full items-center justify-between py-1">
                August 2025
                <ChevronDown className="size-3.5" />
              </button>
              <button className="flex w-full items-center justify-between py-1">
                July 2025
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-12 items-center justify-end gap-3 border-b border-[#dfe6e2] bg-white px-4">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[#2f3934]"
              aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            <div className="grid size-7 place-items-center rounded-full border border-[#cfd9d4] bg-white text-xs font-semibold">
              PS
            </div>
          </header>

          <div className="p-4">
            <div className="flex flex-col gap-3 border-b border-[#e1e7e4] pb-3 xl:flex-row xl:items-center xl:justify-between">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-fit border-[#dbe2de] bg-white px-3 text-[11px] font-semibold text-[#838e88]">
                <CalendarDays className="size-3.5" />
                7 Apr - 14 Apr
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <HeaderSelect label="Client" />
                <HeaderSelect label="Entity" />
                <HeaderSelect label="Service Line" />
                <HeaderSelect label="Offering" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#89948e]"
                  aria-label="Dashboard settings">
                  <SlidersHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            <div className="sr-only">
              <DashboardSkeleton />
            </div>

            <section
              className="grid border-b border-[#e1e7e4] md:grid-cols-4"
              aria-label="Live request key metrics">
              {kpis.map((kpi) => (
                <div
                  className="flex h-20 flex-col items-center justify-center border-[#e8eeeb] md:border-r last:border-r-0"
                  key={kpi.label}>
                  <p className="text-3xl font-medium tracking-normal text-[#313b36]">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#46514c]">
                    {kpi.label}
                  </p>
                </div>
              ))}
            </section>

            <Card className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
              <CardContent className="grid gap-0 p-0 xl:grid-cols-2">
                <div className="border-b border-[#e1e7e4] xl:border-b-0 xl:border-r">
                  <DonutChart
                    data={qualityBreakdown}
                    score="90%"
                    title="Quality"
                  />
                </div>
                <div className="border-b border-[#e1e7e4] xl:border-b-0">
                  <DonutChart
                    data={timelinessBreakdown}
                    score="75%"
                    title="Timeliness"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
              <CardContent className="p-0">
                <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-[#a1aaa6]">
                    Volume by Client
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <HeaderSelect label="X: Assignments" />
                    <HeaderSelect label="Y: Clients" />
                    <HeaderSelect label="Bar Chart" />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-[#89948e]"
                      aria-label="Chart settings">
                      <Settings2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-64">
                  {mounted && clientVolumeData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={clientVolumeData}
                        layout="vertical"
                        margin={{ top: 4, right: 30, left: 46, bottom: 16 }}>
                        <CartesianGrid
                          stroke="#e1e8e4"
                          strokeDasharray="4 4"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          domain={[0, 80]}
                          tick={{ fill: "#a2aca7", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="client"
                          width={72}
                          tick={{ fill: "#9aa49f", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="assignments"
                          name="Total Assignments"
                          fill="#b6dec8"
                          stroke="#48b978"
                          strokeWidth={2}
                          radius={[5, 5, 5, 5]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : clientVolumeData.length ? (
                    <ChartPlaceholder />
                  ) : (
                    <EmptyState title="No client volume data available" />
                  )}
                </div>
                <div className="grid gap-2 pt-1 text-[11px] font-semibold text-[#6c7872] sm:grid-cols-[auto_1fr_auto]">
                  <div className="space-y-2">
                    <p>
                      <span className="text-[#3e4a44]">X axis:</span>{" "}
                      Assignments
                    </p>
                    <p>
                      <span className="text-[#3e4a44]">Y axis:</span> Clients
                    </p>
                  </div>
                  <div />
                  <div className="flex items-center gap-1.5 self-end">
                    <span className="size-3 rounded-full border-2 border-[#4dbb7b] bg-[#b6dec8]" />
                    Total Assignments
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
