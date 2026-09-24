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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadResponse | null>(null);

  // Staged states for Lead Detail Modal (Explicit Save/Cancel)
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

  // Load Team Members (for Admin assignment filter and dropdown)
  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch("/api/auth?team=true");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setTeamMembers(json.data);
        }
      } catch (err) {
        console.error("Error fetching team members:", err);
      }
    }
    loadTeam();
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

  // Stage Badge Variant Mapping
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

  // Open Lead Detail
  const handleOpenDetail = async (lead: LeadResponse) => {
    setSelectedLead(lead);
    setStagedStage(lead.stage);
    setStagedAssignedToId(lead.assignedToId || "");
    setSaveSuccessMsg("");
    setDetailModalOpen(true);

    // Fetch full lead with latest notes
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

  // Explicit Save Changes for Stage / Assignment
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

  // Cancel / Discard Dirty Changes in Detail Modal
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

  // Create Lead Submit
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

      // Reset form & reload
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

  // Add Note Submit
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
          // Refresh lead details
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

  // Columns definition for Adaptive Table
  const columns: Column<LeadResponse>[] = [
    {
      header: "Customer",
      cell: (lead) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900 dark:text-white">
            {lead.name}
          </p>
          <p className="text-xs text-slate-400">{lead.email}</p>
          <p className="text-xs text-slate-400">{lead.phone}</p>
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
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {lead.budget ? `₹${Number(lead.budget).toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      header: "Assigned Representative",
      cell: (lead) => (
        <div>
          {lead.assignedTo ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {lead.assignedTo.name}
            </span>
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
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {lead.interestedUnit.unitNumber}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      header: "Action",
      align: "right",
      cell: (lead) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail(lead);
          }}
        >
          {t.actions.viewDetails}
        </Button>
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
      {/* Top Header & New Lead Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.nav.leads}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track inquiries, stage progressions, interactions, and bookings
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="primary"
          size="md"
        >
          + {t.actions.createLead}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-xs">
        <Input
          placeholder={t.actions.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
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
            onChange={(e) => setSelectedRep(e.target.value)}
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
            onClick={() => {
              setSearch("");
              setSelectedStage("");
              setSelectedRep("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Adaptive Responsive Leads Table with Limit-10 Pagination */}
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

      {/* ------------------------------------------------------------- */}
      {/* CREATE LEAD MODAL                                             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t.actions.createLead}
        description="Add an incoming prospect to your CRM pipeline"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
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
              {t.actions.submit}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* LEAD DETAIL & ACTIVITY TIMELINE MODAL (WITH EXPLICIT SAVE/CANCEL) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="4xl"
        title={selectedLead?.name || "Lead Details"}
        description={`Inbound via ${selectedLead?.source} • ID: ${selectedLead?.id?.slice(0, 8)}`}
      >
        {selectedLead && (
          <div className="space-y-3">
            {/* Save Success Banner */}
            {saveSuccessMsg && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                ✓ {saveSuccessMsg}
              </div>
            )}

            {/* Compact Top Info Strip */}
            <div className="grid grid-cols-3 gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                  Email
                </span>
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {selectedLead.email}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                  Phone
                </span>
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {selectedLead.phone}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                  Budget
                </span>
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedLead.budget
                    ? `₹${Number(selectedLead.budget).toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* 2-Column Desktop Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              {/* Left Column: Stage & Assignment Controls (5 cols) */}
              <div className="lg:col-span-5 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pipeline & Assignment
                  </h4>
                  {isDirty && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      Unsaved
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Stage Transition
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
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Representative (Admin Only)
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
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Representative
                      </label>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 py-1">
                        {selectedLead.assignedTo?.name || "Unassigned"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isDirty || saveChangesSubmitting}
                    onClick={handleCancelChanges}
                    className="text-xs py-1 px-2.5 h-auto"
                  >
                    {t.actions.cancel}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!isDirty || saveChangesSubmitting}
                    isLoading={saveChangesSubmitting}
                    onClick={handleSaveChanges}
                    className="text-xs py-1 px-2.5 h-auto"
                  >
                    {t.actions.save}
                  </Button>
                </div>
              </div>

              {/* Right Column: Add Note Form + Timeline Feed (7 cols) */}
              <div className="lg:col-span-7 space-y-2">
                {/* Add Note Form */}
                <form
                  onSubmit={handleAddNote}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <Input
                    placeholder="Log call outcome, site visit notes..."
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
                      className="text-xs py-1.5 px-3 shrink-0"
                    >
                      {t.actions.addNote}
                    </Button>
                  </div>
                </form>

                {/* Timeline Feed */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Recent Activity ({selectedLead.notes?.length || 0})
                  </h4>
                  {!selectedLead.notes || selectedLead.notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">
                      No notes recorded yet.
                    </p>
                  ) : (
                    selectedLead.notes
                      .slice(0, 2)
                      .map((note: LeadNoteResponse) => (
                        <div
                          key={note.id}
                          className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {note.author?.name || "Representative"}
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                            {note.content}
                          </p>
                          {note.nextFollowUpDate && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              ⏰ Follow-up:{" "}
                              {new Date(
                                note.nextFollowUpDate,
                              ).toLocaleDateString()}
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
