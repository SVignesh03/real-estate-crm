"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldX, RefreshCw, ArrowLeft, Lock } from "lucide-react";

const FALLBACK_REASONS = [
  "This feels like something Future Me would yell at Present Me for agreeing to.",
  "Your current security clearance has been misplaced in the cloud.",
  "Computer says no, and the computer sounded unusually confident about it.",
  "The database looked at your credentials, smiled politely, and closed the blinds.",
  "Access restricted: Even the administrator is debating whether they should be here.",
];

export default function AccessDeniedNaas({
  requiredRole = "Administrator",
}: {
  requiredRole?: string;
}) {
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchNo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://naas.isalman.dev/no");
      if (res.ok) {
        const data = await res.json();
        setReason(data.reason || FALLBACK_REASONS[0]);
      } else {
        setReason(
          FALLBACK_REASONS[Math.floor(Math.random() * FALLBACK_REASONS.length)],
        );
      }
    } catch {
      setReason(
        FALLBACK_REASONS[Math.floor(Math.random() * FALLBACK_REASONS.length)],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNo();
  }, [fetchNo]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      {/* Outer Modal Card */}
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Top Radial Glow Accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-3xl pointer-events-none" />

        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center border border-purple-200 dark:border-purple-800/80 shadow-xs relative z-10">
          <ShieldX className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Heading Section */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>403 • Restricted Route</span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Administrator Clearance Required
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            You do not possess the required RBAC role permissions to inspect,
            create, or alter staff accounts.
          </p>

          <p className="text-sm italic font-medium leading-relaxed min-h-[48px] flex items-center justify-center px-4 text-slate-700 dark:text-slate-200">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
                Querying rejection telemetry...
              </span>
            ) : (
              `“${reason}”`
            )}
          </p>

          <button
            type="button"
            onClick={fetchNo}
            disabled={loading}
            className="text-[11px] font-semibold text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Get another excuse</span>
          </button>
        </div>

        {/* Back to Dashboard CTA */}
        <div className="pt-2 flex items-center justify-center relative z-10">
          <Link href="/dashboard">
            <Button
              size="md"
              variant="primary"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 shadow-xs"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
