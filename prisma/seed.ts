import {
  PrismaClient,
  Role,
  ProjectStatus,
  UnitType,
  UnitStatus,
  LeadStage,
  BookingStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Starting Database Seeding ---");

  // 1. Clean existing records in reverse dependency order
  await prisma.booking.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing records.");

  // 2. Hash default passwords
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const salesPassword = await bcrypt.hash("Sales@123", 10);

  // 3. Seed Users (1 Admin, 2 Sales Reps)
  const admin = await prisma.user.create({
    data: {
      email: "admin@realestate.com",
      password: adminPassword,
      name: "Alexander Wright",
      role: Role.ADMIN,
    },
  });

  const rep1 = await prisma.user.create({
    data: {
      email: "sarah.rep@realestate.com",
      password: salesPassword,
      name: "Sarah Jenkins",
      role: Role.SALES_REP,
    },
  });

  const rep2 = await prisma.user.create({
    data: {
      email: "david.rep@realestate.com",
      password: salesPassword,
      name: "David Miller",
      role: Role.SALES_REP,
    },
  });

  console.log("Seeded Users: 1 Admin, 2 Sales Reps");

  // 4. Seed Projects & Buildings
  // Project 1: Skyline Heights (Luxury High-Rise)
  const project1 = await prisma.project.create({
    data: {
      name: "Skyline Heights",
      description:
        "Ultra-luxury high-rise residential towers with panoramic city views and smart home automation.",
      location: "Downtown Financial District, Metro City",
      status: ProjectStatus.UNDER_CONSTRUCTION,
      buildings: {
        create: [
          {
            name: "Tower Alpha",
            floors: 30,
          },
          {
            name: "Tower Bravo",
            floors: 25,
          },
        ],
      },
    },
    include: {
      buildings: true,
    },
  });

  const towerAlpha = project1.buildings.find((b) => b.name === "Tower Alpha")!;
  const towerBravo = project1.buildings.find((b) => b.name === "Tower Bravo")!;

  // Project 2: Emerald Gardens (Eco-Friendly Gated Community)
  const project2 = await prisma.project.create({
    data: {
      name: "Emerald Gardens",
      description:
        "Sustainable eco-friendly gated township featuring 70% open green landscapes and clubhouse amenities.",
      location: "Oakridge Suburb, Metro City",
      status: ProjectStatus.PLANNING,
      buildings: {
        create: [
          {
            name: "Willow Wing",
            floors: 14,
          },
        ],
      },
    },
    include: {
      buildings: true,
    },
  });

  const willowWing = project2.buildings.find((b) => b.name === "Willow Wing")!;

  console.log("Seeded Projects: Skyline Heights & Emerald Gardens");

  // 5. Seed Units (6+ units across different states)
  // Skyline Heights - Tower Alpha
  const unit101 = await prisma.unit.create({
    data: {
      unitNumber: "A-101",
      buildingId: towerAlpha.id,
      floor: 10,
      type: UnitType.TWO_BHK,
      areaSqFt: 1250,
      price: 450000.0,
      status: UnitStatus.AVAILABLE,
    },
  });

  const unit102 = await prisma.unit.create({
    data: {
      unitNumber: "A-102",
      buildingId: towerAlpha.id,
      floor: 10,
      type: UnitType.THREE_BHK,
      areaSqFt: 1850,
      price: 720000.0,
      status: UnitStatus.AVAILABLE,
    },
  });

  const unitPH1 = await prisma.unit.create({
    data: {
      unitNumber: "A-PH01",
      buildingId: towerAlpha.id,
      floor: 30,
      type: UnitType.PENTHOUSE,
      areaSqFt: 3400,
      price: 1650000.0,
      status: UnitStatus.BLOCKED, // Blocked for VIP client review
    },
  });

  // Skyline Heights - Tower Bravo
  const unitB201 = await prisma.unit.create({
    data: {
      unitNumber: "B-201",
      buildingId: towerBravo.id,
      floor: 20,
      type: UnitType.TWO_BHK,
      areaSqFt: 1300,
      price: 480000.0,
      status: UnitStatus.BOOKED, // Booked with active booking
    },
  });

  const unitB202 = await prisma.unit.create({
    data: {
      unitNumber: "B-202",
      buildingId: towerBravo.id,
      floor: 20,
      type: UnitType.ONE_BHK,
      areaSqFt: 850,
      price: 320000.0,
      status: UnitStatus.SOLD, // Fully completed sale
    },
  });

  // Emerald Gardens - Willow Wing
  const unitW401 = await prisma.unit.create({
    data: {
      unitNumber: "W-401",
      buildingId: willowWing.id,
      floor: 4,
      type: UnitType.STUDIO,
      areaSqFt: 550,
      price: 195000.0,
      status: UnitStatus.AVAILABLE,
    },
  });

  const unitW402 = await prisma.unit.create({
    data: {
      unitNumber: "W-402",
      buildingId: willowWing.id,
      floor: 4,
      type: UnitType.TWO_BHK,
      areaSqFt: 1100,
      price: 380000.0,
      status: UnitStatus.AVAILABLE,
    },
  });

  console.log(
    "Seeded 7 Units across AVAILABLE, BOOKED, BLOCKED, and SOLD states",
  );

  // 6. Seed 8 Realistic Leads with notes and follow-ups
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Lead 1: New inbound lead (Assigned to Sarah)
  await prisma.lead.create({
    data: {
      name: "Robert Chen",
      email: "robert.chen@techcorp.io",
      phone: "+1 (555) 234-8901",
      source: "WEBSITE",
      stage: LeadStage.NEW,
      budget: 500000,
      assignedToId: rep1.id,
      interestedUnitId: unit101.id,
      notes: {
        create: [
          {
            authorId: rep1.id,
            content:
              "Inbound web inquiry submitted via property portal. Looking for high-floor 2BHK with balcony.",
            nextFollowUpDate: tomorrow,
          },
        ],
      },
    },
  });

  // Lead 2: Contacted (Assigned to Sarah)
  await prisma.lead.create({
    data: {
      name: "Emily Watson",
      email: "emily.watson@lawpartners.com",
      phone: "+1 (555) 345-6712",
      source: "REFERRAL",
      stage: LeadStage.CONTACTED,
      budget: 750000,
      assignedToId: rep1.id,
      interestedUnitId: unit102.id,
      notes: {
        create: [
          {
            authorId: rep1.id,
            content:
              "Introductory phone call completed. Discussed payment schedules and construction timeline.",
            nextFollowUpDate: inThreeDays,
          },
        ],
      },
    },
  });

  // Lead 3: Site Visit Scheduled (Assigned to Sarah)
  await prisma.lead.create({
    data: {
      name: "Marcus Brody",
      email: "marcus.brody@consulting.com",
      phone: "+1 (555) 456-7890",
      source: "CAMPAIGN",
      stage: LeadStage.SITE_VISIT,
      budget: 800000,
      assignedToId: rep1.id,
      interestedUnitId: unit102.id,
      notes: {
        create: [
          {
            authorId: rep1.id,
            content:
              "Site visit confirmed for this Saturday at 11:00 AM at Skyline Heights experience center.",
            nextFollowUpDate: inThreeDays,
          },
        ],
      },
    },
  });

  // Lead 4: Interested (Assigned to David)
  await prisma.lead.create({
    data: {
      name: "Sophia Patel",
      email: "sophia.patel@biolabs.org",
      phone: "+1 (555) 567-8901",
      source: "WALK_IN",
      stage: LeadStage.INTERESTED,
      budget: 400000,
      assignedToId: rep2.id,
      interestedUnitId: unitW402.id,
      notes: {
        create: [
          {
            authorId: rep2.id,
            content:
              "Visited sales lounge. Very positive impression of eco-friendly green initiatives at Emerald Gardens.",
            nextFollowUpDate: tomorrow,
          },
        ],
      },
    },
  });

  // Lead 5: Negotiation (Assigned to David)
  await prisma.lead.create({
    data: {
      name: "Julian Vance",
      email: "jvance@vancecapital.com",
      phone: "+1 (555) 678-9012",
      source: "REFERRAL",
      stage: LeadStage.NEGOTIATION,
      budget: 1600000,
      assignedToId: rep2.id,
      interestedUnitId: unitPH1.id,
      notes: {
        create: [
          {
            authorId: rep2.id,
            content:
              "Negotiating customized marble flooring and parking slot allocation for Penthouse A-PH01.",
            nextFollowUpDate: tomorrow,
          },
        ],
      },
    },
  });

  // Lead 6: Booked (Assigned to Sarah) - Has matching confirmed booking on unit B-201
  const bookedLead = await prisma.lead.create({
    data: {
      name: "Arthur Pendelton",
      email: "arthur.p@globallogistics.com",
      phone: "+1 (555) 789-0123",
      source: "CAMPAIGN",
      stage: LeadStage.BOOKED,
      budget: 500000,
      assignedToId: rep1.id,
      interestedUnitId: unitB201.id,
      notes: {
        create: [
          {
            authorId: rep1.id,
            content:
              "Booking token payment received via wire transfer. Formal sales contract signed.",
            nextFollowUpDate: null,
          },
        ],
      },
    },
  });

  // Create corresponding Booking record for unitB201
  await prisma.booking.create({
    data: {
      bookingNumber: "BK-2026-0001",
      unitId: unitB201.id,
      leadId: bookedLead.id,
      bookedById: rep1.id,
      bookingAmount: 50000.0,
      totalAmount: 480000.0,
      status: BookingStatus.CONFIRMED,
      notes:
        "Initial 10% token deposit cleared. Next milestone payment due in 45 days upon slab casting.",
      bookingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  // Lead 7: Lost (Assigned to David)
  await prisma.lead.create({
    data: {
      name: "Daniel Ortega",
      email: "dortega@designworks.net",
      phone: "+1 (555) 890-1234",
      source: "WEBSITE",
      stage: LeadStage.LOST,
      budget: 200000,
      assignedToId: rep2.id,
      interestedUnitId: unitW401.id,
      notes: {
        create: [
          {
            authorId: rep2.id,
            content:
              "Client decided to purchase in another district closer to workplace. Marked as Lost.",
            nextFollowUpDate: null,
          },
        ],
      },
    },
  });

  // Lead 8: Unassigned Inbound Lead (Awaiting Admin assignment)
  await prisma.lead.create({
    data: {
      name: "Victoria Sterling",
      email: "vsterling@venturegrowth.co",
      phone: "+1 (555) 901-2345",
      source: "WEBSITE",
      stage: LeadStage.NEW,
      budget: 900000,
      assignedToId: null, // Unassigned for Admin RBAC distribution
      interestedUnitId: unit102.id,
      notes: {
        create: [
          {
            authorId: admin.id,
            content:
              "High-value inquiry received via VIP investor web portal. Needs immediate sales rep allocation.",
            nextFollowUpDate: tomorrow,
          },
        ],
      },
    },
  });

  console.log("Seeded 8 Leads with Notes, Follow-ups, and 1 Active Booking.");
  console.log("--- Database Seeding Complete ---");
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
