"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useI18n } from "@/lib/i18n/context";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { BookingResponse } from "@/models/bookingModel";

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { t } = useI18n();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

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

  const columns: Column<BookingResponse>[] = [
    {
      header: "Booking Number",
      cell: (b) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
            {b.bookingNumber}
          </span>
          <p className="text-[11px] text-slate-400">
            {new Date(b.bookingDate).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (b) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {b.lead?.name || "Customer"}
          </p>
          <p className="text-xs text-slate-400">{b.lead?.email}</p>
        </div>
      ),
    },
    {
      header: "Unit & Development",
      cell: (b) => (
        <div>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            Unit {b.unit?.unitNumber}
          </span>
          <p className="text-xs text-slate-400">
            {b.unit?.building?.project?.name} ({b.unit?.type.replace("_", " ")})
          </p>
        </div>
      ),
    },
    {
      header: "Token Deposit",
      cell: (b) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          ₹{Number(b.bookingAmount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Total Agreed Price",
      cell: (b) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          ₹{Number(b.totalAmount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Processed By",
      cell: (b) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {b.bookedBy?.name || "Representative"}
        </span>
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.nav.bookings}
          </h1>
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

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Booking Statuses" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "PENDING", label: "Pending Deposit" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </div>
        <p className="text-xs text-slate-400">
          Total: {totalCount} verified booking records
        </p>
      </div>

      {/* Adaptive Responsive Bookings Table with Limit-10 Pagination */}
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
        emptyMessage="No property bookings recorded yet."
      />
    </div>
  );
}
