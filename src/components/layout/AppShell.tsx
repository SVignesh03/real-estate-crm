"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard,
  Users,
  Home,
  CalendarCheck,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Building2,
  LogIn,
  ShieldCheck,
  Languages,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realestate_crm_sidebar_collapsed");
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("realestate_crm_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  // If on login page, don't show shell navigation
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const isGuest = !isLoading && !user;

  const navLinks = [
    {
      name: t.nav.dashboard,
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      name: t.nav.leads,
      href: "/leads",
      icon: <Users className="w-5 h-5 shrink-0" />,
    },
    {
      name: t.nav.properties,
      href: "/properties",
      icon: <Home className="w-5 h-5 shrink-0" />,
    },
    {
      name: t.nav.bookings,
      href: "/bookings",
      icon: <CalendarCheck className="w-5 h-5 shrink-0" />,
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            name: t.nav.users,
            href: "/users",
            icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col md:flex-row overflow-x-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* 1. FIXED DESKTOP SIDEBAR (AUTHENTICATED ONLY)                     */}
      {/* ----------------------------------------------------------------- */}
      {!isGuest && (
        <aside
          className={`hidden md:flex flex-col fixed top-0 left-0 h-screen overflow-y-auto z-40 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 select-none transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Header */}
          <div
            className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0 px-4 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                    ESTATE
                    <span className="text-indigo-600 dark:text-indigo-400">
                      CORE
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    CRM
                  </p>
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {collapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <span
                    className={
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {link.icon}
                  </span>
                  {!collapsed && <span className="truncate">{link.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            {user && (
              <div
                className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <Badge
                      variant={user.role === "ADMIN" ? "purple" : "info"}
                      size="sm"
                      className="mt-0.5 text-[10px]"
                    >
                      {user.role === "ADMIN" ? t.roles.admin : t.roles.salesRep}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. MOBILE DRAWER NAVIGATION                                       */}
      {/* ----------------------------------------------------------------- */}
      {!isGuest && (
        <div
          className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
            mobileMenuOpen
              ? "visible pointer-events-auto"
              : "invisible pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div
            className={`relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full p-4 flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight">
                  ESTATE
                  <span className="text-indigo-600 dark:text-indigo-400">
                    CORE
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 mt-4 flex-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
                <div className="flex items-center gap-2.5 px-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {user.role === "ADMIN" ? t.roles.admin : t.roles.salesRep}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  {t.nav.logout}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. MAIN CONTENT CONTAINER                                         */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${
          isGuest ? "md:ml-0" : collapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Responsive Sticky Header */}
        <header className="h-16 px-3 sm:px-6 border-b border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0 sticky top-0 z-30">
          {/* Left: Mobile hamburger or Guest Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!isGuest && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link
              href="/"
              className={`flex items-center gap-2 ${isGuest ? "flex" : "md:hidden flex"}`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                ESTATE
                <span className="text-indigo-600 dark:text-indigo-400">
                  CORE
                </span>
              </span>
            </Link>
          </div>

          {/* Right Toolbar: Language Switcher + Theme Toggle + Auth Action */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              {(["en", "ta", "hi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 sm:px-2 py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                    language === lang
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "ta" ? "தமிழ்" : "हिंदी"}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Auth Action */}
            {isGuest ? (
              <Link href="/login">
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs px-2.5 sm:px-3 py-1.5 whitespace-nowrap"
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                >
                  <span className="hidden xs:inline">{t.nav.staffLogin}</span>
                  <span className="xs:hidden">Login</span>
                </Button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={logout}
                title={t.nav.logout}
                aria-label={t.nav.logout}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Main Viewport */}
        <main
          className={`flex-1 w-full max-w-full overflow-x-hidden ${
            pathname === "/" ? "" : "p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
