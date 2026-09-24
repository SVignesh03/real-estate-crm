"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  mobileCardRenderer?: (row: T, index: number) => React.ReactNode;

  // Database-Level Pagination (Limit 10)
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
  emptyState,
  emptyMessage = "No records found",
  onRowClick,
  className = "",
  mobileCardRenderer,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
  onLoadMore,
  isLoadingMore = false,
  hasMore,
}: TableProps<T>) {
  const alignStyles = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  // Shared Empty State
  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
      <svg
        className="w-10 h-10 stroke-current text-slate-300 dark:text-slate-700"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </p>
    </div>
  );

  const canLoadMore =
    hasMore !== undefined ? hasMore : currentPage < totalPages;

  return (
    <div className={`w-full ${className}`}>
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP VIEW: Full Data Table with Dark Mode Thead          */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            {/* Header with explicit dark mode tokens */}
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className={`px-5 py-3.5 dark:bg-slate-800 dark:text-slate-200 ${
                      alignStyles[col.align || "left"]
                    } ${col.headerClassName || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, rIdx) => (
                  <tr
                    key={`desktop-skeleton-${rIdx}`}
                    className="animate-pulse"
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={`desktop-skeleton-${rIdx}-${cIdx}`}
                        className="px-5 py-4"
                      >
                        <div
                          className={`h-4 bg-slate-200/70 dark:bg-slate-800 rounded-md ${
                            cIdx === 0 ? "w-3/4" : "w-1/2"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-10 text-center"
                  >
                    {emptyState || defaultEmptyState}
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => (
                  <tr
                    key={keyExtractor(row, rIdx)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-100 ${
                      onRowClick
                        ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100 dark:hover:bg-slate-800/60"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-5 py-3.5 text-sm ${alignStyles[col.align || "left"]} ${
                          col.className || ""
                        }`}
                      >
                        {col.cell
                          ? col.cell(row, rIdx)
                          : col.accessorKey
                            ? String(row[col.accessorKey] ?? "")
                            : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination Bar */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Page{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {totalPages}
              </span>
              {totalCount !== undefined && ` • Total: ${totalCount} records`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => onPageChange(currentPage + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE VIEW: Adaptive Responsive Cards with Load More       */}
      {/* ------------------------------------------------------------- */}
      <div className="block md:hidden w-full space-y-3">
        {isLoading && data.length === 0 ? (
          Array.from({ length: Math.min(skeletonRows, 3) }).map((_, rIdx) => (
            <div
              key={`mobile-skeleton-${rIdx}`}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-center">
            {emptyState || defaultEmptyState}
          </div>
        ) : (
          <>
            {data.map((row, rIdx) => (
              <div
                key={keyExtractor(row, rIdx)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 ${
                  onRowClick
                    ? "cursor-pointer active:scale-[0.99] hover:border-indigo-400 dark:hover:border-indigo-600"
                    : ""
                }`}
              >
                {mobileCardRenderer ? (
                  mobileCardRenderer(row, rIdx)
                ) : (
                  <div className="space-y-2">
                    {columns
                      .filter((col) => !col.hideOnMobile)
                      .map((col, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between gap-3 text-sm py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none"
                        >
                          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 shrink-0">
                            {col.header}
                          </span>
                          <div className="text-right font-medium text-slate-800 dark:text-slate-200">
                            {col.cell
                              ? col.cell(row, rIdx)
                              : col.accessorKey
                                ? String(row[col.accessorKey] ?? "")
                                : null}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile "Load More" Button */}
            {canLoadMore && onLoadMore && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  className="w-full py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs tracking-wide uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More Records ({data.length} of {totalCount || "many"}
                      )
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
