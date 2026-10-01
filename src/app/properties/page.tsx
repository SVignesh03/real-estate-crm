"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  ProjectResponse,
  BuildingResponse,
  UnitResponse,
} from "@/models/propertyModel";
import { LeadResponse } from "@/models/leadModel";
import {
  Plus,
  Building2,
  Layers,
  Home,
  Mail,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  MapPin,
  Building,
  Maximize2,
  Zap,
  Lock,
} from "lucide-react";

export default function PropertiesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  const isGuest = !authLoading && !user;
  const isAdmin = user?.role === "ADMIN";

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // -------------------------------------------------------------
  // BOOKING MODAL (AUTHENTICATED STAFF)
  // -------------------------------------------------------------
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitResponse | null>(null);
  const [availableLeads, setAvailableLeads] = useState<LeadResponse[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // -------------------------------------------------------------
  // INQUIRY MODAL (PUBLIC GUEST VISITOR)
  // -------------------------------------------------------------
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryUnit, setInquiryUnit] = useState<UnitResponse | null>(null);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");

  // -------------------------------------------------------------
  // ADMIN INVENTORY CREATION MODALS
  // -------------------------------------------------------------
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState<
    "PLANNING" | "UNDER_CONSTRUCTION" | "COMPLETED"
  >("UNDER_CONSTRUCTION");
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState("");

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [buildingProjectId, setBuildingProjectId] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [buildingFloors, setBuildingFloors] = useState("1");
  const [buildingSubmitting, setBuildingSubmitting] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [unitBuildingId, setUnitBuildingId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitFloor, setUnitFloor] = useState("1");
  const [unitType, setUnitType] = useState("TWO_BHK");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitAreaSqFt, setUnitAreaSqFt] = useState("");
  const [unitSubmitting, setUnitSubmitting] = useState(false);
  const [unitError, setUnitError] = useState("");

  // Load Inventory Hierarchy
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProjects(json.data.projects);
          // Set default building for unit modal if available
          if (
            json.data.projects.length > 0 &&
            json.data.projects[0].buildings?.length > 0
          ) {
            setBuildingProjectId((prev) => prev || json.data.projects[0].id);
            setUnitBuildingId(
              (prev) => prev || json.data.projects[0].buildings[0].id,
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to load properties hierarchy:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Load Leads for Booking Modal (Staff only)
  const openBookingModal = async (unit: UnitResponse) => {
    setSelectedUnit(unit);
    setBookingAmount(String(Math.round(unit.price * 0.1))); // 10% default deposit
    setBookingError("");
    setBookingSuccess("");
    setBookingModalOpen(true);

    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const eligible = json.data.filter(
            (l: LeadResponse) => l.stage !== "BOOKED" && l.stage !== "LOST",
          );
          setAvailableLeads(eligible);
          if (eligible.length > 0) setSelectedLeadId(eligible[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch leads for booking:", err);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !selectedLeadId) return;

    setBookingError("");
    setBookingSuccess("");
    setBookingSubmitting(true);

    try {
      const payload = {
        unitId: selectedUnit.id,
        leadId: selectedLeadId,
        bookingAmount: parseFloat(bookingAmount),
        totalAmount: Number(selectedUnit.price),
        notes: bookingNotes || undefined,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setBookingError(json.error || "Failed to complete property booking");
        setBookingSubmitting(false);
        return;
      }

      setBookingSuccess(
        `Success! Booking confirmed with code: ${json.data.bookingNumber}`,
      );
      setTimeout(() => {
        setBookingModalOpen(false);
        fetchInventory();
        router.push("/bookings");
      }, 1500);
    } catch {
      setBookingError("Transaction aborted due to network failure");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Open Guest Inquiry Modal
  const openInquiryModal = (unit: UnitResponse) => {
    setInquiryUnit(unit);
    setInquiryName("");
    setInquiryEmail("");
    setInquiryPhone("");
    setInquiryNotes(
      `I am interested in Unit ${unit.unitNumber} (${unit.type.replace("_", " ")}). Please provide more details.`,
    );
    setInquiryError("");
    setInquirySuccess("");
    setInquiryModalOpen(true);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryUnit || !inquiryName || !inquiryEmail) return;

    setInquiryError("");
    setInquirySuccess("");
    setInquirySubmitting(true);

    try {
      const res = await fetch("/api/leads/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail,
          phone: inquiryPhone || undefined,
          notes: inquiryNotes || undefined,
          note: inquiryNotes || undefined,
          unitId: inquiryUnit.id,
          interestedUnitId: inquiryUnit.id,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setInquiryError(
          json.error || "Failed to submit inquiry. Please try again.",
        );
        setInquirySubmitting(false);
        return;
      }

      setInquirySuccess(
        "Inquiry received! Our sales representative will reach out to you shortly.",
      );
      setTimeout(() => {
        setInquiryModalOpen(false);
      }, 1800);
    } catch {
      setInquiryError("Network error. Please verify your connection.");
    } finally {
      setInquirySubmitting(false);
    }
  };

  // Handle Admin Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError("");
    setProjectSubmitting(true);

    try {
      const res = await fetch("/api/properties?type=project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          location: projectLocation,
          description: projectDescription || undefined,
          status: projectStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setProjectError(json.error || "Failed to create project");
        setProjectSubmitting(false);
        return;
      }

      setProjectModalOpen(false);
      setProjectName("");
      setProjectLocation("");
      setProjectDescription("");
      fetchInventory();
    } catch {
      setProjectError("Failed to communicate with server");
    } finally {
      setProjectSubmitting(false);
    }
  };

  // Handle Admin Building Creation
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingProjectId) return;
    setBuildingError("");
    setBuildingSubmitting(true);

    try {
      const res = await fetch("/api/properties?type=building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: buildingProjectId,
          name: buildingName,
          floors: parseInt(buildingFloors, 10),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setBuildingError(json.error || "Failed to create building");
        setBuildingSubmitting(false);
        return;
      }

      setBuildingModalOpen(false);
      setBuildingName("");
      setBuildingFloors("1");
      fetchInventory();
    } catch {
      setBuildingError("Failed to communicate with server");
    } finally {
      setBuildingSubmitting(false);
    }
  };

  // Handle Admin Unit Creation
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitBuildingId) return;
    setUnitError("");
    setUnitSubmitting(true);

    try {
      const res = await fetch("/api/properties?type=unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId: unitBuildingId,
          unitNumber,
          floor: parseInt(unitFloor, 10),
          type: unitType,
          price: parseFloat(unitPrice),
          areaSqFt: parseFloat(unitAreaSqFt),
          status: "AVAILABLE",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setUnitError(json.error || "Failed to create unit");
        setUnitSubmitting(false);
        return;
      }

      setUnitModalOpen(false);
      setUnitNumber("");
      setUnitPrice("");
      setUnitAreaSqFt("");
      setUnitFloor("1");
      fetchInventory();
    } catch {
      setUnitError("Failed to communicate with server");
    } finally {
      setUnitSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "AVAILABLE":
        return "success";
      case "BOOKED":
        return "info";
      case "BLOCKED":
        return "warning";
      case "SOLD":
        return "neutral";
      default:
        return "default";
    }
  };

  // Flat list of buildings for unit creation dropdown
  const allBuildings = projects.flatMap((p) =>
    (p.buildings || []).map((b) => ({
      id: b.id,
      name: `${p.name} - ${b.name}`,
    })),
  );

  // Filter out units first, then strip empty buildings, then strip empty projects
  const filteredProjects = useMemo(() => {
    return projects
      .map((project) => {
        const matchingBuildings = (project.buildings || [])
          .map((building) => {
            const matchingUnits = (building.units || []).filter((u) => {
              if (statusFilter && u.status !== statusFilter) return false;
              if (typeFilter && u.type !== typeFilter) return false;
              return true;
            });

            return {
              ...building,
              units: matchingUnits,
            };
          })
          .filter((building) => building.units.length > 0); // Hide buildings with 0 matching units

        return {
          ...project,
          buildings: matchingBuildings,
        };
      })
      .filter((project) => project.buildings.length > 0); // Hide projects with 0 matching buildings
  }, [projects, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.nav.properties}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isGuest
              ? "Explore prime residential & commercial developments with real-time availability"
              : "Hierarchical Project > Building > Unit Inventory & Real-Time Booking"}
          </p>
        </div>

        {/* Admin Inventory Management Action Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setProjectError("");
                setProjectModalOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-xs"
              leftIcon={
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              }
            >
              <span>{t.actions.newProject}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={projects.length === 0}
              onClick={() => {
                if (projects.length > 0 && !buildingProjectId) {
                  setBuildingProjectId(projects[0].id);
                }
                setBuildingError("");
                setBuildingModalOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-xs"
              leftIcon={
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              }
            >
              <span>{t.actions.newBuilding}</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={allBuildings.length === 0}
              onClick={() => {
                if (allBuildings.length > 0 && !unitBuildingId) {
                  setUnitBuildingId(allBuildings[0].id);
                }
                setUnitError("");
                setUnitModalOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-xs"
              leftIcon={
                <Home className="w-4 h-4 text-white-600 dark:text-white-400" />
              }
            >
              <span>{t.actions.newUnit}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Unit Statuses" },
            { value: "AVAILABLE", label: `🟢 ${t.unitStatuses.AVAILABLE}` },
            { value: "BOOKED", label: `🔵 ${t.unitStatuses.BOOKED}` },
            { value: "BLOCKED", label: `🟡 ${t.unitStatuses.BLOCKED}` },
            { value: "SOLD", label: `⚪ ${t.unitStatuses.SOLD}` },
          ]}
        />

        <Select
          label="Filter by Unit Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: "", label: "All Floor Plans" },
            { value: "STUDIO", label: "Studio Apartment" },
            { value: "ONE_BHK", label: "1 BHK" },
            { value: "TWO_BHK", label: "2 BHK" },
            { value: "THREE_BHK", label: "3 BHK" },
            { value: "PENTHOUSE", label: "Penthouse" },
          ]}
        />

        {(statusFilter || typeFilter) && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-1.5"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
              }}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Reset Filters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Hierarchical Project Accordions / Sections */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {statusFilter || typeFilter
              ? "No units match your selected filter criteria."
              : "No projects found in the inventory catalog."}
          </p>
          {(statusFilter || typeFilter) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 inline-flex items-center gap-1.5"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
      ) : (
        filteredProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            {/* Project Header Banner */}
            <div className="p-6 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-purple-950/40 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              {/* Subtle Blueprint Dot Grid Accent */}
              <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {project.name}
                  </h2>
                  <Badge variant="purple" size="sm">
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>{project.location}</span>
                </p>

                {project.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Project Stats Pill */}
              <div className="relative z-10 flex items-center gap-4 bg-white/90 dark:bg-slate-800/80 backdrop-blur-xs px-4 py-2.5 rounded-xl text-xs shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                    Total Units
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {project.buildings?.reduce(
                      (acc, b) => acc + (b.units?.length || 0),
                      0,
                    )}
                  </span>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

                <div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                    Available
                  </span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    {project.buildings?.reduce(
                      (acc, b) =>
                        acc +
                        (b.units?.filter((u) => u.status === "AVAILABLE")
                          .length || 0),
                      0,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Buildings and Nested Units */}
            <CardContent className="p-6 space-y-6">
              {project.buildings?.map((building: BuildingResponse) => (
                <div key={building.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {building.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({building.floors} Floors)
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {building.units?.length || 0} Units Listed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {building.units?.map((unit: UnitResponse) => (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                          unit.status === "AVAILABLE"
                            ? "border-emerald-200/80 bg-white hover:border-emerald-500 hover:shadow-xs dark:bg-slate-900 dark:border-emerald-900/50"
                            : "border-slate-200/70 bg-slate-50/60 dark:bg-slate-900/50 dark:border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                                {unit.unitNumber}
                              </h4>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {unit.type.replace("_", " ")} • Floor{" "}
                                {unit.floor}
                              </p>
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(unit.status)}
                              size="sm"
                            >
                              {t.unitStatuses[unit.status] || unit.status}
                            </Badge>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {unit.areaSqFt} sq ft
                            </span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              ₹{Number(unit.price).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Booking or Inquiry Action Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          {unit.status === "AVAILABLE" ? (
                            isGuest ? (
                              <Button
                                size="sm"
                                variant="primary"
                                className="w-full text-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => openInquiryModal(unit)}
                                leftIcon={
                                  <Mail className="w-3.5 h-3.5 shrink-0" />
                                }
                              >
                                <span>{t.actions.inquire}</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                className="w-full text-xs inline-flex items-center justify-center gap-1.5"
                                onClick={() => openBookingModal(unit)}
                                leftIcon={
                                  <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                                }
                              >
                                <span>{t.actions.bookUnit}</span>
                              </Button>
                            )
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 italic inline-flex items-center gap-1">
                              {unit.status === "BOOKED" ? (
                                <>
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Confirmed Booking</span>
                                </>
                              ) : (
                                "Not Available"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* ------------------------------------------------------------- */}
      {/* PUBLIC GUEST INQUIRY MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        title="Inquire About Property"
        description={
          inquiryUnit
            ? `Unit ${inquiryUnit.unitNumber} (${inquiryUnit.type.replace("_", " ")}) • ₹${inquiryUnit.price.toLocaleString()}`
            : ""
        }
      >
        <form onSubmit={handleInquirySubmit} className="space-y-4">
          {inquiryError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inquiryError}</span>
            </div>
          )}

          {inquirySuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{inquirySuccess}</span>
            </div>
          )}

          <Input
            label="Full Name"
            required
            placeholder="e.g. John Doe"
            value={inquiryName}
            onChange={(e) => setInquiryName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. john@example.com"
            value={inquiryEmail}
            onChange={(e) => setInquiryEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +1 (555) 234-5678"
            value={inquiryPhone}
            onChange={(e) => setInquiryPhone(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Message or Specific Inquiries (Optional)
            </label>
            <textarea
              rows={3}
              value={inquiryNotes}
              onChange={(e) => setInquiryNotes(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInquiryModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={inquirySubmitting}
            >
              Submit Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* ATOMIC BOOKING MODAL (ACID CONCURRENCY PROTECTED - STAFF)      */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={t.actions.confirm}
        description={`Unit: ${selectedUnit?.unitNumber} • Price: ₹${selectedUnit?.price.toLocaleString()}`}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {bookingError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bookingSuccess}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">
                Total Agreed Property Value:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{selectedUnit?.price.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Executing Representative:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {user?.name} ({user?.role})
              </span>
            </div>
          </div>

          <Select
            label="Select Lead to Bind Booking"
            required
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            options={availableLeads.map((l) => ({
              value: l.id,
              label: `${l.name} (${l.stage}) • ${l.email}`,
            }))}
          />

          <Input
            label="Booking Token Amount (₹)"
            type="number"
            required
            value={bookingAmount}
            onChange={(e) => setBookingAmount(e.target.value)}
            helperText="Token advance deposit received from buyer (e.g. 10%)"
          />

          <Input
            label="Booking Terms & Wire Reference (Optional)"
            placeholder="e.g. Wire transfer deposit #TX-9021 confirmed"
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBookingModalOpen(false)}
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={bookingSubmitting}
            >
              Execute Atomic Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* ADMIN MODAL: CREATE PROJECT                                   */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && (
        <Modal
          isOpen={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          title={t.actions.newProject}
          description="Create a new master development project in the CRM inventory"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            {projectError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{projectError}</span>
              </div>
            )}

            <Input
              label="Project Name"
              required
              placeholder="e.g. Marina Horizon Towers"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <Input
              label="Location"
              required
              placeholder="e.g. Waterfront Boulevard, Sector 4"
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
            />

            <Select
              label="Project Status"
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value as any)}
              options={[
                { value: "UNDER_CONSTRUCTION", label: "Under Construction" },
                { value: "PLANNING", label: "Planning Phase" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="High-end waterfront residential community..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProjectModalOpen(false)}
              >
                {t.actions.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={projectSubmitting}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADMIN MODAL: CREATE BUILDING                                  */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && (
        <Modal
          isOpen={buildingModalOpen}
          onClose={() => setBuildingModalOpen(false)}
          title={t.actions.newBuilding}
          description="Add a new building or tower under an existing development project"
        >
          <form onSubmit={handleCreateBuilding} className="space-y-4">
            {buildingError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />{" "}
                <span>{buildingError}</span>
              </div>
            )}

            <Select
              label="Select Parent Project"
              required
              value={buildingProjectId}
              onChange={(e) => setBuildingProjectId(e.target.value)}
              options={projects.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />

            <Input
              label="Building / Tower Name"
              required
              placeholder="e.g. Tower A or North Wing"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
            />

            <Input
              label="Total Floors"
              type="number"
              min="1"
              required
              value={buildingFloors}
              onChange={(e) => setBuildingFloors(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBuildingModalOpen(false)}
              >
                {t.actions.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={buildingSubmitting}
              >
                Create Building
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADMIN MODAL: CREATE UNIT                                      */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && (
        <Modal
          isOpen={unitModalOpen}
          onClose={() => setUnitModalOpen(false)}
          title={t.actions.newUnit}
          description="Add a new individual unit / apartment to inventory"
        >
          <form onSubmit={handleCreateUnit} className="space-y-4">
            {unitError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />{" "}
                <span>{unitError}</span>
              </div>
            )}

            <Select
              label="Select Parent Building"
              required
              value={unitBuildingId}
              onChange={(e) => setUnitBuildingId(e.target.value)}
              options={allBuildings.map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Unit Identifier / Number"
                required
                placeholder="e.g. 1004"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />

              <Input
                label="Floor Level"
                type="number"
                min="0"
                required
                value={unitFloor}
                onChange={(e) => setUnitFloor(e.target.value)}
              />
            </div>

            <Select
              label="Unit Type / Floor Plan"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              options={[
                { value: "STUDIO", label: "Studio Apartment" },
                { value: "ONE_BHK", label: "1 BHK" },
                { value: "TWO_BHK", label: "2 BHK" },
                { value: "THREE_BHK", label: "3 BHK" },
                { value: "PENTHOUSE", label: "Penthouse" },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total Price (₹)"
                type="number"
                required
                placeholder="e.g. 350000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />

              <Input
                label="Area (Sq Ft)"
                type="number"
                required
                placeholder="e.g. 1250"
                value={unitAreaSqFt}
                onChange={(e) => setUnitAreaSqFt(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUnitModalOpen(false)}
              >
                {t.actions.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={unitSubmitting}
              >
                Add Unit to Inventory
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
