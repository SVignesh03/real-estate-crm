"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { UserDirectoryItem } from "@/models/userModel";
import AccessDeniedNaas from "@/components/AccessDeniedNaas";
import {
  UserPlus,
  KeyRound,
  Trash2,
  Search,
  ArrowRightLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Crown,
  Sparkles,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Main Users & Team Management Page                                         */
/* -------------------------------------------------------------------------- */
export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  // Authentication Guard: Redirect unauthenticated sessions to /login
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, authLoading, router]);

  // Directory Data & Filtering
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDirectoryItem | null>(
    null,
  );

  // Create User Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SALES_REP">("SALES_REP");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Password Reset Form State
  const [resetPassword, setResetPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Action Feedback Toast/Banner
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch Users Directory
  const fetchUsers = useCallback(
    async (pageToFetch: number, append: boolean = false) => {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToFetch));
        params.set("limit", "10");
        if (search.trim()) params.set("search", search.trim());
        if (roleFilter) params.set("role", roleFilter);

        const res = await fetch(`/api/users?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (append) {
              setUsers((prev) => [...prev, ...json.data]);
            } else {
              setUsers(json.data);
            }
            setCurrentPage(json.currentPage || pageToFetch);
            setTotalPages(json.totalPages || 1);
            setTotalCount(json.totalCount || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load users directory:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [search, roleFilter],
  );

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchUsers(1, false);
    }
  }, [fetchUsers, currentUser]);

  // Aggregate KPI Stats
  const metrics = useMemo(() => {
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const repCount = users.filter((u) => u.role === "SALES_REP").length;
    const totalLeads = users.reduce((acc, u) => acc + (u.leadsCount || 0), 0);
    const totalBookings = users.reduce(
      (acc, u) => acc + (u.bookingsCount || 0),
      0,
    );

    return {
      total: totalCount || users.length,
      admins: adminCount,
      reps: repCount,
      leads: totalLeads,
      bookings: totalBookings,
    };
  }, [users, totalCount]);

  // Filter Pills configuration
  const filterPills = [
    { key: "", label: "All Staff", count: metrics.total },
    { key: "ADMIN", label: "Administrators", count: metrics.admins },
    { key: "SALES_REP", label: "Sales Representatives", count: metrics.reps },
  ];

  // Handle Create User Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreateSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error || "Failed to create user");
        setCreateSubmitting(false);
        return;
      }

      setCreateSuccess(`Team member ${json.data.name} added successfully.`);
      setTimeout(() => {
        setCreateModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("SALES_REP");
        setCreateSuccess("");
        fetchUsers(1, false);
      }, 1500);
    } catch {
      setCreateError("Network failure occurred. Please try again.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Password Reset Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setResetError("");
    setResetSuccess("");
    setResetSubmitting(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setResetError(json.error || "Failed to reset password");
        setResetSubmitting(false);
        return;
      }

      setResetSuccess(
        `Password for ${selectedUser.name} has been reset successfully.`,
      );
      setTimeout(() => {
        setResetModalOpen(false);
        setResetPassword("");
        setResetSuccess("");
        setSelectedUser(null);
      }, 1500);
    } catch {
      setResetError("Network error occurred. Please verify connection.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Toggle User Role
  const handleToggleRole = async (targetUser: UserDirectoryItem) => {
    if (targetUser.id === currentUser?.id) {
      setActionMessage({
        type: "error",
        text: "You cannot alter your own administrative role.",
      });
      return;
    }

    const nextRole = targetUser.role === "ADMIN" ? "SALES_REP" : "ADMIN";
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({
          type: "success",
          text: `Role for ${targetUser.name} updated to ${
            nextRole === "ADMIN" ? "Administrator" : "Sales Representative"
          }.`,
        });
        fetchUsers(currentPage, false);
      } else {
        setActionMessage({
          type: "error",
          text: json.error || "Failed to update user role",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Connection failed while changing role.",
      });
    }
  };

  // Delete User Account
  const handleDeleteUser = async (targetUser: UserDirectoryItem) => {
    if (targetUser.id === currentUser?.id) {
      setActionMessage({
        type: "error",
        text: "You cannot delete your own active account.",
      });
      return;
    }

    if (targetUser.leadsCount > 0 || targetUser.bookingsCount > 0) {
      setActionMessage({
        type: "error",
        text: `Cannot delete ${targetUser.name}: Account has ${targetUser.leadsCount} lead(s) and ${targetUser.bookingsCount} booking(s) associated. Reassign them first.`,
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete the account for ${targetUser.name} (${targetUser.email})?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({
          type: "success",
          text: `Account for ${targetUser.name} deleted.`,
        });
        fetchUsers(1, false);
      } else {
        setActionMessage({
          type: "error",
          text: json.error || "Failed to delete user",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Network failure during deletion.",
      });
    }
  };

  // Loading Session State
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict RBAC: Sales Reps render the standalone AccessDeniedNaas component
  if (currentUser.role !== "ADMIN") {
    return <AccessDeniedNaas requiredRole="Administrator" />;
  }

  // Table Columns Definition
  const columns: Column<UserDirectoryItem>[] = [
    {
      header: "Team Member",
      cell: (row) => (
        <div className="flex sm:items-center sm:gap-3 justify-end sm:justify-start">
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-800">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-right sm:text-left min-w-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 justify-end sm:justify-start">
              <span>{row.name}</span>
              {row.id === currentUser.id && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
                  You
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[170px] sm:max-w-none">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (row) => (
        <Badge variant={row.role === "ADMIN" ? "purple" : "info"} size="sm">
          {row.role === "ADMIN" ? "Administrator" : "Sales Representative"}
        </Badge>
      ),
    },
    {
      header: "Assigned Leads",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.leadsCount}</span>
        </span>
      ),
    },
    {
      header: "Bookings",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
          <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
          <span>{row.bookingsCount}</span>
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      className: "w-[280px] min-w-[280px] whitespace-nowrap",
      headerClassName: "w-[280px] min-w-[280px] text-right",
      cell: (row) => (
        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
          {/* Password Reset */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs whitespace-nowrap shrink-0 rounded-lg border-slate-200 dark:border-slate-700"
            title={`Reset password for ${row.name}`}
            leftIcon={
              <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            }
            onClick={() => {
              setSelectedUser(row);
              setResetPassword("");
              setResetError("");
              setResetSuccess("");
              setResetModalOpen(true);
            }}
          >
            <span>Reset PW</span>
          </Button>

          {/* Toggle Role */}
          {row.id !== currentUser.id && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs whitespace-nowrap shrink-0 rounded-lg border-slate-200 dark:border-slate-700"
              title={
                row.role === "ADMIN"
                  ? "Change to Sales Rep"
                  : "Promote to Admin"
              }
              leftIcon={
                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              }
              onClick={() => handleToggleRole(row)}
            >
              <span>{row.role === "ADMIN" ? "Make Rep" : "Make Admin"}</span>
            </Button>
          )}

          {/* Delete Account */}
          {row.id !== currentUser.id && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0 rounded-lg"
              title="Delete account"
              onClick={() => handleDeleteUser(row)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sales Team &amp; Brokers
            </h1>
            <Badge variant="purple" size="sm">
              Admin Exclusive
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directory of administrative personnel and sales advisors with RBAC
            permissions
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => {
            setCreateError("");
            setCreateSuccess("");
            setCreateModalOpen(true);
          }}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          <span>Add Team Member</span>
        </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Agents
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {metrics.total}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/60">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Admins
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {metrics.admins}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Pipeline Leads
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {metrics.leads}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Deals Closed
            </p>
            <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {metrics.bookings}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Global Action Message Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-in ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterPills.map((pill) => {
          const isActive = roleFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => {
                setRoleFilter(pill.key);
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

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs sm:items-end">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div>
          <Select
            label="Filter by Role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "", label: "All Roles (Admin & Reps)" },
              { value: "ADMIN", label: "Administrators" },
              { value: "SALES_REP", label: "Sales Representatives" },
            ]}
          />
        </div>
      </div>

      {/* Adaptive Users Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <Table<UserDirectoryItem>
          columns={columns}
          data={users}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyMessage="No team members match the search criteria."
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(page) => fetchUsers(page, false)}
          onLoadMore={() => fetchUsers(currentPage + 1, true)}
          isLoadingMore={isLoadingMore}
          hasMore={currentPage < totalPages}
          mobileCardRenderer={(item) => (
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-800">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.id === currentUser.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80">
                          You
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">{item.email}</p>
                  </div>
                </div>
                <Badge
                  variant={item.role === "ADMIN" ? "purple" : "info"}
                  size="sm"
                >
                  {item.role === "ADMIN" ? "Admin" : "Rep"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Leads: {item.leadsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bookings: {item.bookingsCount}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs whitespace-nowrap shrink-0 rounded-lg"
                  onClick={() => {
                    setSelectedUser(item);
                    setResetPassword("");
                    setResetError("");
                    setResetSuccess("");
                    setResetModalOpen(true);
                  }}
                  leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Reset PW
                </Button>

                {item.id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs whitespace-nowrap shrink-0 rounded-lg"
                    onClick={() => handleToggleRole(item)}
                    leftIcon={
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-500" />
                    }
                  >
                    {item.role === "ADMIN" ? "Make Rep" : "Make Admin"}
                  </Button>
                )}

                {item.id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-rose-600 p-2 shrink-0 rounded-lg"
                    onClick={() => handleDeleteUser(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADD TEAM MEMBER MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Team Member"
        description="Register a new Administrator or Sales Representative to EstateCore CRM"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{createSuccess}</span>
            </div>
          )}

          <Input
            label="Full Name"
            required
            placeholder="e.g. Rachel Adams"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. rachel.adams@realestate.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <Input
            label="Initial Temporary Password"
            type="password"
            required
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="The user will use this password to sign into the staff portal."
          />

          <Select
            label="Role & Permissions"
            value={newRole}
            onChange={(e) =>
              setNewRole(e.target.value as "ADMIN" | "SALES_REP")
            }
            options={[
              {
                value: "SALES_REP",
                label:
                  "💼 Sales Representative (Scored lead assignment & bookings)",
              },
              {
                value: "ADMIN",
                label:
                  "👑 Administrator (Global visibility, inventory edits, user management)",
              },
            ]}
          />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-700 text-xs"
              onClick={() => setCreateModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              isLoading={createSubmitting}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* ADMIN RESET USER PASSWORD MODAL                               */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset User Password"
        description={
          selectedUser
            ? `Set a new secure password for ${selectedUser.name} (${selectedUser.email})`
            : ""
        }
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {resetError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Member:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedUser?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Email:</span>
              <span className="text-slate-600 dark:text-slate-300">
                {selectedUser?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Role:</span>
              <Badge
                variant={selectedUser?.role === "ADMIN" ? "purple" : "info"}
                size="sm"
              >
                {selectedUser?.role}
              </Badge>
            </div>
          </div>

          <Input
            label="New Password"
            type="password"
            required
            placeholder="Min. 6 characters"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            helperText="The user's old password will be immediately overwritten."
          />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-700 text-xs"
              onClick={() => setResetModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              isLoading={resetSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
