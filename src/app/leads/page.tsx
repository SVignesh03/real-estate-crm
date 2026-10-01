"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useI18n } from "@/lib/i18n/context";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LeadResponse, LeadNoteResponse } from "@/models/leadModel";
import {
  UserPlus,
  Search,
  Eye,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function LeadsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { t } = useI18n();

  const [leads, setLeads] = useState<LeadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedRep, setSelectedRep] = useState("");
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; role: string }>
  >([]);

  // Stage Metrics for Pill Badges
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadResponse | null>(null);

  // Staged states for Lead Detail Modal
  const [stagedStage, setStagedStage] = useState("");
  const [stagedAssignedToId, setStagedAssignedToId] = useState("");
  const [saveChangesSubmitting, setSaveChangesSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Form states for creating lead
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("WEBSITE");
  const [newBudget, setNewBudget] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Form states for adding note in detail modal
  const [noteContent, setNoteContent] = useState("");
  const [noteFollowUpDate, setNoteFollowUpDate] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Load Team Members & Stage Counts
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [teamRes, metricsRes] = await Promise.all([
          fetch("/api/auth?team=true"),
          fetch("/api/leads?metrics=true"),
        ]);

        if (teamRes.ok) {
          const json = await teamRes.json();
          if (json.success && json.data) setTeamMembers(json.data);
        }

        if (metricsRes.ok) {
          const mJson = await metricsRes.json();
          if (mJson.success && mJson.data?.stageCounts) {
            setStageCounts(mJson.data.stageCounts);
          }
        }
      } catch (err) {
        console.error("Error loading team/metrics:", err);
      }
    }
    loadInitialData();
  }, []);

  // Fetch Leads with Limit 10
  const fetchLeads = useCallback(
    async (pageToFetch: number, append: boolean = false) => {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToFetch));
        params.set("limit", "10");
        if (search) params.set("search", search);
        if (selectedStage) params.set("stage", selectedStage);
        if (selectedRep) params.set("assignedToId", selectedRep);

        const res = await fetch(`/api/leads?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (append) {
              setLeads((prev) => [...prev, ...json.data]);
            } else {
              setLeads(json.data);
            }
            setTotalCount(json.totalCount || json.data.length);
            setTotalPages(json.totalPages || 1);
            setCurrentPage(json.currentPage || pageToFetch);
          }
        }
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [search, selectedStage, selectedRep],
  );

  useEffect(() => {
    if (!user) return;
    setCurrentPage(1);
    fetchLeads(1, false);
  }, [user, fetchLeads]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLeads(newPage, false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      const nextPage = currentPage + 1;
      fetchLeads(nextPage, true);
    }
  };

  const getStageBadgeVariant = (stage: string): BadgeVariant => {
    switch (stage) {
      case "NEW":
        return "info";
      case "CONTACTED":
        return "default";
      case "SITE_VISIT":
        return "purple";
      case "INTERESTED":
        return "default";
      case "NEGOTIATION":
        return "warning";
      case "BOOKED":
        return "success";
      case "LOST":
        return "danger";
      default:
        return "neutral";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "LD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenDetail = async (lead: LeadResponse) => {
    setSelectedLead(lead);
    setStagedStage(lead.stage);
    setStagedAssignedToId(lead.assignedToId || "");
    setSaveSuccessMsg("");
    setDetailModalOpen(true);

    try {
      const res = await fetch(`/api/leads/${lead.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedLead(json.data);
        }
      }
    } catch (err) {
      console.error("Error fetching full lead detail:", err);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedLead) return;
    setSaveChangesSubmitting(true);
    setSaveSuccessMsg("");

    try {
      const payload: Record<string, unknown> = {};
      if (stagedStage !== selectedLead.stage) {
        payload.stage = stagedStage;
      }
      if (
        user?.role === "ADMIN" &&
        stagedAssignedToId !== (selectedLead.assignedToId || "")
      ) {
        payload.assignedToId = stagedAssignedToId || null;
      }

      if (Object.keys(payload).length === 0) {
        setSaveChangesSubmitting(false);
        return;
      }

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSaveSuccessMsg("Changes saved successfully!");
          setSelectedLead((prev) =>
            prev ? ({ ...prev, ...payload } as LeadResponse) : null,
          );
          fetchLeads(currentPage, false);
          setTimeout(() => setSaveSuccessMsg(""), 2500);
        }
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setSaveChangesSubmitting(false);
    }
  };

  const handleCancelChanges = () => {
    if (selectedLead) {
      setStagedStage(selectedLead.stage);
      setStagedAssignedToId(selectedLead.assignedToId || "");
    }
    setSaveSuccessMsg("");
  };

  const isDirty =
    selectedLead &&
    (stagedStage !== selectedLead.stage ||
      (user?.role === "ADMIN" &&
        stagedAssignedToId !== (selectedLead.assignedToId || "")));

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: newName,
        email: newEmail,
        phone: newPhone,
        source: newSource,
        budget: newBudget ? parseFloat(newBudget) : null,
      };

      if (user?.role === "ADMIN" && newAssignedTo) {
        payload.assignedToId = newAssignedTo;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error || "Failed to create lead");
        setCreateSubmitting(false);
        return;
      }

      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewBudget("");
      setNewAssignedTo("");
      setCreateModalOpen(false);
      fetchLeads(1, false);
    } catch {
      setCreateError("Network error while creating lead");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteContent.trim()) return;
    setNoteSubmitting(true);

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent,
          nextFollowUpDate: noteFollowUpDate || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNoteContent("");
          setNoteFollowUpDate("");
          const updatedRes = await fetch(`/api/leads/${selectedLead.id}`);
          if (updatedRes.ok) {
            const uJson = await updatedRes.json();
            if (uJson.success) setSelectedLead(uJson.data);
          }
        }
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Filter Pill Configuration
  const filterPills = [
    { key: "", label: "All Leads", count: totalCount },
    { key: "NEW", label: t.stages.NEW, count: stageCounts.NEW || 0 },
    {
      key: "CONTACTED",
      label: t.stages.CONTACTED,
      count: stageCounts.CONTACTED || 0,
    },
    {
      key: "SITE_VISIT",
      label: t.stages.SITE_VISIT,
      count: stageCounts.SITE_VISIT || 0,
    },
    {
      key: "INTERESTED",
      label: t.stages.INTERESTED,
      count: stageCounts.INTERESTED || 0,
    },
    {
      key: "NEGOTIATION",
      label: t.stages.NEGOTIATION,
      count: stageCounts.NEGOTIATION || 0,
    },
    { key: "BOOKED", label: t.stages.BOOKED, count: stageCounts.BOOKED || 0 },
    { key: "LOST", label: t.stages.LOST, count: stageCounts.LOST || 0 },
  ];

  // Upgraded Columns definition with 2-Line Rich Cells & Action Icons
  const columns: Column<LeadResponse>[] = [
    {
      header: "Customer",
      cell: (lead) => (
        <div className="flex sm:items-center sm:gap-3 justify-end sm:justify-start">
          {/* Avatar: Hidden on mobile cards, visible on desktop/table */}
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold text-xs items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-800">
            {getInitials(lead.name)}
          </div>

          {/* Text block: Right-aligned on mobile card, left-aligned on desktop table */}
          <div className="text-right sm:text-left min-w-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              {lead.name}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[170px] sm:max-w-none">
              {lead.email}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {lead.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Stage",
      cell: (lead) => (
        <Badge variant={getStageBadgeVariant(lead.stage)} size="sm">
          {t.stages[lead.stage] || lead.stage}
        </Badge>
      ),
    },
    {
      header: "Budget",
      cell: (lead) => (
        <span className="font-bold text-sm text-slate-900 dark:text-white">
          {lead.budget ? `₹${Number(lead.budget).toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      header: "Assigned Representative",
      cell: (lead) => (
        <div>
          {lead.assignedTo ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {getInitials(lead.assignedTo.name)}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {lead.assignedTo.name}
              </span>
            </div>
          ) : (
            <Badge variant="neutral" size="sm">
              Unassigned
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Interested Unit",
      cell: (lead) =>
        lead.interestedUnit ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800">
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
            {lead.interestedUnit.unitNumber}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (lead) => (
        <div className="flex items-center justify-end gap-1.5">
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            title="Call Prospect"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            title="Email Prospect"
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(lead);
            }}
            title="Inspect Details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors ml-1"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
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
      {/* Top Header & New Lead Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.nav.leads}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
              {totalCount} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track inquiries, stage progressions, interactions, and bookings
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="primary"
          size="md"
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs flex items-center gap-2"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          <span>{t.actions.createLead}</span>
        </Button>
      </div>

      {/* Stage Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterPills.map((pill) => {
          const isActive = selectedStage === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => {
                setSelectedStage(pill.key);
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
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-xs">
        <Input
          placeholder={t.actions.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          value={selectedStage}
          onChange={(e) => {
            setSelectedStage(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Filter by Stage (All)"
          options={[
            { value: "", label: "All Stages" },
            { value: "NEW", label: t.stages.NEW },
            { value: "CONTACTED", label: t.stages.CONTACTED },
            { value: "SITE_VISIT", label: t.stages.SITE_VISIT },
            { value: "INTERESTED", label: t.stages.INTERESTED },
            { value: "NEGOTIATION", label: t.stages.NEGOTIATION },
            { value: "BOOKED", label: t.stages.BOOKED },
            { value: "LOST", label: t.stages.LOST },
          ]}
        />

        {user?.role === "ADMIN" && (
          <Select
            value={selectedRep}
            onChange={(e) => {
              setSelectedRep(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by Rep (All)"
            options={[
              { value: "", label: "All Representatives" },
              { value: "unassigned", label: "Unassigned Leads" },
              ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        )}

        {(search || selectedStage || selectedRep) && (
          <Button
            variant="ghost"
            size="md"
            className="rounded-xl text-xs font-semibold text-slate-500 hover:text-purple-600"
            onClick={() => {
              setSearch("");
              setSelectedStage("");
              setSelectedRep("");
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Adaptive Responsive Leads Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={leads}
          keyExtractor={(lead) => lead.id}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMore={currentPage < totalPages}
          onRowClick={handleOpenDetail}
          emptyMessage="No leads match your current search or filter criteria."
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CREATE LEAD MODAL                                             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t.actions.createLead}
        description="Record a prospective buyer or investor into the active pipeline"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              {createError}
            </div>
          )}

          <Input
            label="Prospect Full Name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Rachel Adams"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t.common.email}
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="rachel@example.com"
            />
            <Input
              label={t.common.phone}
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Inquiry Source"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              options={[
                { value: "WEBSITE", label: "Website Portal" },
                { value: "REFERRAL", label: "Client Referral" },
                { value: "WALK_IN", label: "Experience Center Walk-in" },
                { value: "CAMPAIGN", label: "Digital Campaign" },
              ]}
            />
            <Input
              label="Approximate Budget (₹)"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="e.g. 650000"
            />
          </div>

          {user?.role === "ADMIN" && (
            <Select
              label="Assign to Sales Representative"
              value={newAssignedTo}
              onChange={(e) => setNewAssignedTo(e.target.value)}
              options={[
                { value: "", label: "Unassigned (Distribute later)" },
                ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          )}

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
              {t.actions.submit}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* LEAD DETAIL & ACTIVITY TIMELINE MODAL                         */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="4xl"
        title={selectedLead?.name || "Lead Details"}
        description={`Inbound via ${selectedLead?.source} • ID: ${selectedLead?.id?.slice(0, 8)}`}
      >
        {selectedLead && (
          <div className="space-y-4">
            {/* Save Success Banner */}
            {saveSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Quick Contact & Info Strip */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Email
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {selectedLead.email}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Phone
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {selectedLead.phone}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Budget
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {selectedLead.budget
                      ? `₹${Number(selectedLead.budget).toLocaleString()}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Direct Touchpoint CTAs */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* 2-Column Work Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Stage Transition & Assignment (5 cols) */}
              <div className="lg:col-span-5 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pipeline Controls
                  </h4>
                  {isDirty && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900">
                      Unsaved Changes
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Sales Stage Transition
                    </label>
                    <Select
                      value={stagedStage}
                      onChange={(e) => setStagedStage(e.target.value)}
                      options={[
                        { value: "NEW", label: `1. ${t.stages.NEW}` },
                        {
                          value: "CONTACTED",
                          label: `2. ${t.stages.CONTACTED}`,
                        },
                        {
                          value: "SITE_VISIT",
                          label: `3. ${t.stages.SITE_VISIT}`,
                        },
                        {
                          value: "INTERESTED",
                          label: `4. ${t.stages.INTERESTED}`,
                        },
                        {
                          value: "NEGOTIATION",
                          label: `5. ${t.stages.NEGOTIATION}`,
                        },
                        { value: "BOOKED", label: `6. ${t.stages.BOOKED}` },
                        { value: "LOST", label: `7. ${t.stages.LOST}` },
                      ]}
                    />
                  </div>

                  {user?.role === "ADMIN" ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Agent (Admin Only)
                      </label>
                      <Select
                        value={stagedAssignedToId}
                        onChange={(e) => setStagedAssignedToId(e.target.value)}
                        options={[
                          { value: "", label: "Unassigned" },
                          ...teamMembers.map((m) => ({
                            value: m.id,
                            label: m.name,
                          })),
                        ]}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Agent
                      </label>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 py-1">
                        {selectedLead.assignedTo?.name || "Unassigned"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isDirty || saveChangesSubmitting}
                    onClick={handleCancelChanges}
                    className="text-xs rounded-lg"
                  >
                    {t.actions.cancel}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!isDirty || saveChangesSubmitting}
                    isLoading={saveChangesSubmitting}
                    onClick={handleSaveChanges}
                    className="text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    {t.actions.save}
                  </Button>
                </div>
              </div>

              {/* Right Column: Interaction Log & History (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Note Log Form */}
                <form
                  onSubmit={handleAddNote}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-2.5"
                >
                  <Input
                    placeholder="Log call outcome, site visit notes, pricing feedback..."
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={noteFollowUpDate}
                        onChange={(e) => setNoteFollowUpDate(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      isLoading={noteSubmitting}
                      className="text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 shrink-0"
                    >
                      {t.actions.addNote}
                    </Button>
                  </div>
                </form>

                {/* Timeline Feed */}
                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Activity History ({selectedLead.notes?.length || 0})
                  </h4>
                  {!selectedLead.notes || selectedLead.notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No customer interactions recorded yet.
                    </p>
                  ) : (
                    selectedLead.notes
                      .slice(0, 3)
                      .map((note: LeadNoteResponse) => (
                        <div
                          key={note.id}
                          className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {note.author?.name || "Representative"}
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            {note.content}
                          </p>
                          {note.nextFollowUpDate && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Follow-up scheduled:{" "}
                                {new Date(
                                  note.nextFollowUpDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
