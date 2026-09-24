"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Search,
  ArrowRightLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Shield,
  Briefcase,
  Lock,
} from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  // Route Guard: Strict ADMIN only
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.replace("/login");
      } else if (currentUser.role !== "ADMIN") {
        router.replace("/dashboard");
      }
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

  // Action feedback
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

  // Handle Create User
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

  // Handle Password Reset
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
          text: `Role for ${targetUser.name} updated to ${nextRole === "ADMIN" ? "Administrator" : "Sales Representative"}.`,
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

  // If unauthorized or loading auth
  if (authLoading || !currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Table Columns Definition
  const columns: Column<UserDirectoryItem>[] = [
    {
      header: "Team Member",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{row.name}</span>
              {row.id === currentUser.id && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  You
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400">{row.email}</p>
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Users className="w-3 h-3 text-slate-400" />
          <span>{row.leadsCount}</span>
        </span>
      ),
    },
    {
      header: "Bookings",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
          <Briefcase className="w-3 h-3 text-emerald-500" />
          <span>{row.bookingsCount}</span>
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
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
          {/* Password Reset Button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs whitespace-nowrap shrink-0"
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

          {/* Toggle Role Button */}
          {row.id !== currentUser.id && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs whitespace-nowrap shrink-0"
              title={
                row.role === "ADMIN"
                  ? "Change to Sales Rep"
                  : "Promote to Admin"
              }
              leftIcon={
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              }
              onClick={() => handleToggleRole(row)}
            >
              <span>{row.role === "ADMIN" ? "Make Rep" : "Make Admin"}</span>
            </Button>
          )}

          {/* Delete Button */}
          {row.id !== currentUser.id && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.nav.users}
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
          className="flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          <span>Add Team Member</span>
        </Button>
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs sm:items-end">
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
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: "", label: "All Roles (Admin & Reps)" },
              { value: "ADMIN", label: "Administrators" },
              { value: "SALES_REP", label: "Sales Representatives" },
            ]}
          />
        </div>
      </div>

      {/* Adaptive Users Table */}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.id === currentUser.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
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
                className="text-xs whitespace-nowrap shrink-0"
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
                  className="text-xs whitespace-nowrap shrink-0"
                  onClick={() => handleToggleRole(item)}
                  leftIcon={
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                  }
                >
                  {item.role === "ADMIN" ? "Make Rep" : "Make Admin"}
                </Button>
              )}

              {item.id !== currentUser.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-rose-600 p-2 shrink-0"
                  onClick={() => handleDeleteUser(item)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      />

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
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
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

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
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
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
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

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button type="submit" variant="primary" isLoading={resetSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
