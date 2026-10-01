"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { HeroVideo } from "@/components/home/HeroVideo";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProjectResponse, UnitResponse } from "@/models/propertyModel";
import {
  Building2,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";

interface FeaturedProject {
  id: string;
  name: string;
  location: string;
  status: string;
  minPrice: number;
  availableUnits: number;
  totalUnits: number;
  featuredUnit?: UnitResponse;
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useI18n();

  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>(
    [],
  );
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Authenticated users get routed to /dashboard immediately
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Load properties for featured preview section
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.projects) {
            const projects: ProjectResponse[] = json.data.projects;

            // Process top 3 projects with available units
            const processed: FeaturedProject[] = projects.map((p) => {
              const allUnits: UnitResponse[] = [];
              (p.buildings || []).forEach((b) => {
                if (b.units) allUnits.push(...b.units);
              });

              const available = allUnits.filter(
                (u) => u.status === "AVAILABLE",
              );
              const prices = available
                .map((u) => Number(u.price))
                .filter((price) => price > 0);
              const minPrice =
                prices.length > 0
                  ? Math.min(...prices)
                  : allUnits[0]?.price
                    ? Number(allUnits[0].price)
                    : 0;

              return {
                id: p.id,
                name: p.name,
                location: p.location,
                status: p.status,
                minPrice,
                availableUnits: available.length,
                totalUnits: allUnits.length,
                featuredUnit: available[0] || allUnits[0],
              };
            });

            // Prioritize projects with available units, take top 3
            processed.sort((a, b) => b.availableUnits - a.availableUnits);
            setFeaturedProjects(processed.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load featured properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    }

    if (!user) {
      loadProperties();
    }
  }, [user]);

  // While checking auth state or redirecting authenticated user
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">
            Loading EstateCore CRM...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO VIDEO SECTION                                         */}
      {/* ------------------------------------------------------------- */}
      <HeroVideo />

      {/* ------------------------------------------------------------- */}
      {/* 2. VALUE PROPOSITION & METRICS STRIP                          */}
      {/* ------------------------------------------------------------- */}
      <section className="relative z-20 -mt-10 sm:-mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Real-Time Inventory Tracking */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-slate-900/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t.landing.stats.trackingTitle}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.landing.stats.trackingDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Live Synced Database</span>
            </div>
          </div>

          {/* Card 2: Zero Double-Booking Guarantee */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-slate-900/5 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t.landing.stats.guaranteeTitle}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.landing.stats.guaranteeDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>ACID Row-Locking</span>
            </div>
          </div>

          {/* Card 3: Dedicated Sales Advisory */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-slate-900/5 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-xs">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t.landing.stats.advisoryTitle}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.landing.stats.advisoryDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Direct Rep Assignment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FEATURED PROPERTIES PREVIEW SECTION                        */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t.landing.featured.title}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.landing.featured.title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {t.landing.featured.subtitle}
            </p>
          </div>

          <Link href="/properties">
            <Button
              variant="outline"
              size="sm"
              className="group flex items-center gap-1.5 text-xs font-semibold rounded-xl border-slate-200 hover:border-purple-300 dark:border-slate-800 dark:hover:border-purple-700 hover:text-purple-700 dark:hover:text-purple-300 transition-all shadow-2xs"
              rightIcon={
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-purple-500" />
              }
            >
              <span>{t.actions.viewDetails}</span>
            </Button>
          </Link>
        </div>

        {/* Property Grid or Loading Skeletons */}
        {loadingProperties ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-850 animate-pulse border border-slate-200/60 dark:border-slate-800" />
            <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-850 animate-pulse border border-slate-200/60 dark:border-slate-800" />
            <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-850 animate-pulse border border-slate-200/60 dark:border-slate-800" />
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t.landing.featured.noUnits}
            </p>
            <Link href="/properties" className="inline-block mt-4">
              <Button size="sm" variant="primary">
                {t.landing.browseCta}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden group hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between rounded-2xl"
              >
                <div>
                  {/* Adaptive Banner: Architectural Blueprint pattern if no image, adapts seamlessly */}
                  <div className="h-44 relative overflow-hidden flex flex-col justify-between p-5 bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-slate-100 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                    {/* Subtle Architectural Grid Background */}
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-2xl pointer-events-none" />

                    {/* Top Badges */}
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100/90 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs">
                        {project.status.replace("_", " ")}
                      </span>

                      <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {project.availableUnits}{" "}
                          {t.landing.featured.availableUnits}
                        </span>
                      </div>
                    </div>

                    {/* Title & Location */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-0.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                        <span className="line-clamp-1 font-medium">
                          {project.location}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Card Content & Features */}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                        Total Units:{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {project.totalUnits}
                        </strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Featured
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t.landing.featured.startingFrom}
                      </span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        $
                        {project.minPrice
                          ? project.minPrice.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-0">
                  <Link href="/properties" className="block">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm rounded-xl py-2.5 bg-purple-600 hover:bg-purple-700 text-white"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      <span>{t.landing.featured.viewDetails}</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              ESTATE
              <span className="text-indigo-600 dark:text-indigo-400">
                CORE
              </span>{" "}
              CRM
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} EstateCore Systems. All rights
            reserved. Enterprise-grade Real Estate Platform.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href="/properties"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {t.nav.properties}
            </Link>
            <span>•</span>
            <Link
              href="/login"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {t.nav.staffLogin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
