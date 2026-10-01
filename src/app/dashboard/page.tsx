"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Flame,
  TrendingUp,
  Users,
  IndianRupee,
  Phone,
  Building2,
  CalendarCheck2,
  ArrowUpRight,
  Sparkles,
  Mail,
  ChevronRight,
} from "lucide-react";

interface DashboardMetrics {
  totalLeads: number;
  activePipelineCount: number;
  stageCounts: Record<string, number>;
  followUpsDueToday: Array<{
    id: string;
    content: string;
    nextFollowUpDate: string;
    lead: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      stage: string;
    };
    author: {
      id: string;
      name: string;
    };
  }>;
}

interface InventorySummary {
  counts: {
    total: number;
    available: number;
    booked: number;
    blocked: number;
    sold: number;
  };
  occupancyRate: number;
  totalInventoryValue: number;
  bookedRevenue: number;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { t } = useI18n();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadDashboard() {
      try {
        const [metricsRes, invRes] = await Promise.all([
          fetch("/api/leads?metrics=true"),
          fetch("/api/properties?summary=true"),
        ]);

        if (metricsRes.ok) {
          const mJson = await metricsRes.json();
          if (mJson.success) setMetrics(mJson.data);
        }

        if (invRes.ok) {
          const iJson = await invRes.json();
          if (iJson.success) setInventory(iJson.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard telemetry:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const stagesList = [
    {
      key: "NEW",
      label: t.stages.NEW,
      dotColor: "bg-blue-500",
      barColor: "bg-blue-500",
    },
    {
      key: "CONTACTED",
      label: t.stages.CONTACTED,
      dotColor: "bg-sky-500",
      barColor: "bg-sky-500",
    },
    {
      key: "SITE_VISIT",
      label: t.stages.SITE_VISIT,
      dotColor: "bg-purple-500",
      barColor: "bg-purple-500",
    },
    {
      key: "INTERESTED",
      label: t.stages.INTERESTED,
      dotColor: "bg-indigo-500",
      barColor: "bg-indigo-500",
    },
    {
      key: "NEGOTIATION",
      label: t.stages.NEGOTIATION,
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
    },
    {
      key: "BOOKED",
      label: t.stages.BOOKED,
      dotColor: "bg-emerald-500",
      barColor: "bg-emerald-500",
    },
    {
      key: "LOST",
      label: t.stages.LOST,
      dotColor: "bg-rose-500",
      barColor: "bg-rose-500",
    },
  ];

  const getInitials = (name: string) => {
    if (!name) return "LD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.dashboard.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back,{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {user.name}
            </strong>
            . Here is your pipeline summary today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/leads">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold hover:border-purple-300"
            >
              View All Leads
            </Button>
          </Link>
          <Link href="/properties">
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
            >
              Browse Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Leads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.dashboard.totalLeads}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                {loading ? "..." : (metrics?.totalLeads ?? 0)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/60">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {user?.role === "ADMIN" ? "All Sales Reps" : "Assigned to you"}
            </span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
        </div>

        {/* KPI 2: Active Pipeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.dashboard.activePipeline}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                {loading ? "..." : (metrics?.activePipelineCount ?? 0)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/60">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              In negotiation / visit
            </span>
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
              Hot Deals
            </span>
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.dashboard.occupancyRate}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                {loading ? "..." : `${inventory?.occupancyRate ?? 0}%`}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {inventory?.counts.available ?? 0} available
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {inventory?.counts.total ?? 0} total
            </span>
          </div>
        </div>

        {/* KPI 4: Booked Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.dashboard.bookedRevenue}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                {loading
                  ? "..."
                  : `₹${((inventory?.bookedRevenue ?? 0) / 1000).toLocaleString()}k`}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/60">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Confirmed bookings
            </span>
            <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              ACID Locked
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Visual Pipeline Funnel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {t.dashboard.pipelineFunnel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live distribution of registered prospective buyers across sales
              stages
            </p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
          >
            Manage Pipeline <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stagesList.map((stage) => {
            const count = metrics?.stageCounts?.[stage.key] || 0;
            const total = metrics?.totalLeads || 1;
            const percentage = Math.round((count / total) * 100);

            return (
              <div
                key={stage.key}
                className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/35 p-3.5 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-600/50 hover:bg-white dark:hover:bg-slate-800/60 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {stage.label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${stage.dotColor}`}
                  />
                </div>

                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {count}
                  </span>
                  <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full ${stage.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Follow-ups Due Today & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Follow-ups Due Today (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.dashboard.followUpsToday}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scheduled calls and pending prospect touchpoints
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                {metrics?.followUpsDueToday?.length || 0} Due
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            ) : !metrics?.followUpsDueToday ||
              metrics.followUpsDueToday.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                {t.dashboard.noFollowUps}
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.followUpsDueToday.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-purple-200 dark:hover:border-purple-900/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                        {getInitials(item.lead.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.lead.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                            {item.lead.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {item.lead.email && (
                        <a
                          href={`mailto:${item.lead.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-purple-600 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>Email</span>
                        </a>
                      )}
                      <a
                        href={`tel:${item.lead.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inventory Status Breakdown (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.dashboard.inventoryBreakdown}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current unit allocation status
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Available */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {t.unitStatuses.AVAILABLE}
                </span>
                <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  {inventory?.counts.available ?? 0}
                </span>
              </div>

              {/* Booked */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  {t.unitStatuses.BOOKED}
                </span>
                <span className="text-sm font-extrabold text-purple-900 dark:text-purple-200">
                  {inventory?.counts.booked ?? 0}
                </span>
              </div>

              {/* Blocked */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {t.unitStatuses.BLOCKED}
                </span>
                <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  {inventory?.counts.blocked ?? 0}
                </span>
              </div>

              {/* Sold */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {t.unitStatuses.SOLD}
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {inventory?.counts.sold ?? 0}
                </span>
              </div>
            </div>
          </div>

          <Link href="/properties" className="block pt-5">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              Browse Inventory Grid →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
