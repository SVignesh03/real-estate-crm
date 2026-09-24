"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export function HeroVideo() {
  const { t } = useI18n();

  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND VIDEO & CINEMATIC GRADIENT OVERLAY                 */}
      {/* ------------------------------------------------------------- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://res.cloudinary.com/dau24dmlo/video/upload/v1790184842/hero_gwzxkk.mp4"
          type="video/mp4"
        />
      </video>

      {/* High-Contrast Gradient Backdrop Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50 z-10 backdrop-blur-[1px]" />

      {/* Subtle radial glow for visual depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)] z-10" />

      {/* ------------------------------------------------------------- */}
      {/* FOREGROUND HERO CONTENT                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] text-balance drop-shadow-md">
          {t.landing.headline}
        </h1>

        {/* Hero Subhead */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed text-balance drop-shadow-sm font-normal">
          {t.landing.subhead}
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link href="/properties" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="primary"
              rightIcon={
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              }
              className="w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-semibold shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 whitespace-nowrap group transition-all"
            >
              {t.landing.browseCta}
            </Button>
          </Link>

          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
              className="w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-semibold border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-lg whitespace-nowrap transition-all"
            >
              {t.landing.staffCta}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
