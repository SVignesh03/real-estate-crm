"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useI18n } from "@/lib/i18n/context";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BookingResponse } from "@/models/bookingModel";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Building2,
  IndianRupee,
  ShieldCheck,
  Eye,
  Phone,
  Mail,
  Receipt,
  FileCheck,
} from "lucide-react";

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { t } = useI18n();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State for Booking Audit Inspection
  const [selectedBooking, setSelectedBooking] =
    useState<BookingResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBookings = useCallback(
    async (pageToFetch: number, append: boolean = false) => {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToFetch));
        params.set("limit", "10");
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/bookings?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (append) {
              setBookings((prev) => [...prev, ...json.data]);
            } else {
              setBookings(json.data);
            }
            setTotalCount(json.totalCount || json.data.length);
            setTotalPages(json.totalPages || 1);
            setCurrentPage(json.currentPage || pageToFetch);
          }
        }
      } catch (err) {
        console.error("Failed to load bookings audit trail:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (!user) return;
    setCurrentPage(1);
    fetchBookings(1, false);
  }, [user, fetchBookings]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchBookings(newPage, false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      const nextPage = currentPage + 1;
      fetchBookings(nextPage, true);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "BK";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // KPI Stat Aggregations
  const stats = useMemo(() => {
    const confirmedCount = bookings.filter(
      (b) => b.status === "CONFIRMED",
    ).length;
    const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
    const totalVolume = bookings.reduce(
      (sum, b) => sum + Number(b.totalAmount || 0),
      0,
    );

    return {
      total: totalCount || bookings.length,
      confirmed: confirmedCount,
      pending: pendingCount,
      volume: totalVolume,
    };
  }, [bookings, totalCount]);

  // Filter Pills configuration
  const filterPills = [
    { key: "", label: "All Bookings", count: totalCount },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      count: bookings.filter((b) => b.status === "CONFIRMED").length,
    },
    {
      key: "PENDING",
      label: "Pending",
      count: bookings.filter((b) => b.status === "PENDING").length,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: bookings.filter((b) => b.status === "CANCELLED").length,
    },
  ];

  const columns: Column<BookingResponse>[] = [
    {
      header: "Booking Ref",
      cell: (b) => (
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-200/70 dark:border-purple-800/80 inline-block shadow-2xs">
            {b.bookingNumber}
          </span>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(b.bookingDate).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (b) => (
        <div className="flex sm:items-center sm:gap-3 justify-end sm:justify-start">
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-800">
            {getInitials(b.lead?.name)}
          </div>
          <div className="text-right sm:text-left min-w-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              {b.lead?.name || "Customer"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[170px] sm:max-w-none">
              {b.lead?.email || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Unit & Development",
      cell: (b) => (
        <div className="space-y-0.5 text-right sm:text-left">
          <span className="inline-flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            Unit {b.unit?.unitNumber}
          </span>
          <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-none">
            {b.unit?.building?.project?.name} •{" "}
            <span className="capitalize">
              {b.unit?.type.toLowerCase().replace("_", " ")}
            </span>
          </p>
        </div>
      ),
    },
    {
      header: "Token Deposit",
      cell: (b) => (
        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
          ₹{Number(b.bookingAmount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Total Agreed Price",
      cell: (b) => (
        <span className="font-bold text-sm text-slate-900 dark:text-white">
          ₹{Number(b.totalAmount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Processed By",
      cell: (b) => (
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center border border-slate-200 dark:border-slate-700">
            {getInitials(b.bookedBy?.name)}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {b.bookedBy?.name || "Representative"}
          </span>
        </div>
      ),
    },
    {
      header: "Audit Status",
      cell: (b) => (
        <Badge
          variant={b.status === "CONFIRMED" ? "success" : "warning"}
          size="sm"
        >
          {b.status}
        </Badge>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBooking(b);
            setDetailModalOpen(true);
          }}
          title="Audit Record"
          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.nav.bookings}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ACID Safe
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable transaction records and ACID concurrency audit trail
          </p>
        </div>

        <Badge variant="purple" size="md">
          {user?.role === "ADMIN"
            ? "Admin: Global Audit Trail"
            : `Rep: Bookings by ${user?.name}`}
        </Badge>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Bookings
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {stats.total}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/60">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Confirmed
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {stats.confirmed}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pending Review
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {stats.pending}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Escrow Value
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              ₹{(stats.volume / 100000).toFixed(1)}L
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/60">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Status Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterPills.map((pill) => {
          const isActive = statusFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => {
                setStatusFilter(pill.key);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-purple-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Selector & Summary Strip */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "", label: "All Booking Statuses" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "PENDING", label: "Pending Deposit" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {bookings.length} of {totalCount} verified audit records
        </p>
      </div>

      {/* Adaptive Responsive Bookings Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={bookings}
          keyExtractor={(b) => b.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMore={currentPage < totalPages}
          onRowClick={(b) => {
            setSelectedBooking(b);
            setDetailModalOpen(true);
          }}
          emptyMessage="No property bookings recorded yet."
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOOKING AUDIT DETAIL MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="2xl"
        title={`Booking Audit #${selectedBooking?.bookingNumber || ""}`}
        description="ACID transaction verification and escrow settlement details"
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Top Status Strip */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedBooking.bookingNumber}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created on{" "}
                    {new Date(selectedBooking.bookingDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  selectedBooking.status === "CONFIRMED" ? "success" : "warning"
                }
                size="md"
              >
                {selectedBooking.status}
              </Badge>
            </div>

            {/* Client & Unit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Client Details
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedBooking.lead?.name || "Customer"}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedBooking.lead?.email}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedBooking.lead?.phone}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reserved Property
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Unit {selectedBooking.unit?.unitNumber}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedBooking.unit?.building?.project?.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 capitalize">
                  {selectedBooking.unit?.type.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Financials Strip */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Token Deposit Received
                </span>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{Number(selectedBooking.bookingAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Agreed Price
                </span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  ₹{Number(selectedBooking.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Footer info */}
            <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>
                Handled by:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {selectedBooking.bookedBy?.name || "Representative"}
                </strong>
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setDetailModalOpen(false)}
              >
                Close Audit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
