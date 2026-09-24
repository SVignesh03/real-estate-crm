"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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

import { useRequireAuth } from "@/lib/useRequireAuth";
import { Flame, TrendingUp, Users, IndianRupee, Phone } from "lucide-react";

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
    { key: "NEW", label: t.stages.NEW, color: "bg-blue-500" },
    { key: "CONTACTED", label: t.stages.CONTACTED, color: "bg-sky-500" },
    { key: "SITE_VISIT", label: t.stages.SITE_VISIT, color: "bg-purple-500" },
    { key: "INTERESTED", label: t.stages.INTERESTED, color: "bg-indigo-500" },
    { key: "NEGOTIATION", label: t.stages.NEGOTIATION, color: "bg-amber-500" },
    { key: "BOOKED", label: t.stages.BOOKED, color: "bg-emerald-500" },
    { key: "LOST", label: t.stages.LOST, color: "bg-rose-500" },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Leads */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-2">
                {t.dashboard.totalLeads}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {loading ? "..." : (metrics?.totalLeads ?? 0)}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                {user?.role === "ADMIN" ? "All Sales Reps" : "Assigned to you"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Active Pipeline */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-2">
                {t.dashboard.activePipeline}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {loading ? "..." : (metrics?.activePipelineCount ?? 0)}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                In negotiation / visit
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Occupancy Rate */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-2">
                {t.dashboard.occupancyRate}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {loading ? "..." : `${inventory?.occupancyRate ?? 0}%`}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                {inventory?.counts.available ?? 0} units available
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Booked Revenue */}
        <Card hoverEffect>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-2">
                {t.dashboard.bookedRevenue}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {loading
                  ? "..."
                  : `₹${((inventory?.bookedRevenue ?? 0) / 1000).toLocaleString()}k`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Confirmed bookings
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Visual Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t.dashboard.pipelineFunnel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stagesList.map((stage) => {
              const count = metrics?.stageCounts?.[stage.key] || 0;
              const total = metrics?.totalLeads || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div
                  key={stage.key}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {stage.label}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {count}
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Follow-ups Due Today & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Follow-ups Due Today (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {t.dashboard.followUpsToday}
                </CardTitle>
              </div>
              <Badge variant="warning" size="sm">
                {metrics?.followUpsDueToday?.length || 0} Due
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 py-2">
                  <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
              ) : !metrics?.followUpsDueToday ||
                metrics.followUpsDueToday.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  {t.dashboard.noFollowUps}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.followUpsDueToday.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {item.lead.name}
                          </span>
                          <Badge variant="default" size="sm">
                            {item.lead.stage}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${item.lead.phone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Inventory Status Breakdown (1 col) */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t.dashboard.inventoryBreakdown}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    🟢 {t.unitStatuses.AVAILABLE}
                  </span>
                  <span className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    {inventory?.counts.available ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                    🔵 {t.unitStatuses.BOOKED}
                  </span>
                  <span className="text-base font-bold text-indigo-900 dark:text-indigo-200">
                    {inventory?.counts.booked ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    🟡 {t.unitStatuses.BLOCKED}
                  </span>
                  <span className="text-base font-bold text-amber-900 dark:text-amber-200">
                    {inventory?.counts.blocked ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ⚪ {t.unitStatuses.SOLD}
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {inventory?.counts.sold ?? 0}
                  </span>
                </div>
              </div>

              <Link href="/properties" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Inventory Grid →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
