import { test, expect } from "@playwright/test";

test.describe("01. General Visitor (Guest) - Public Access & Boundary Guard", () => {
  test("Landing page and property catalog browsing with filtering", async ({
    page,
  }) => {
    // 1. Visit the public home page
    await page.goto("/");
    await expect(page).toHaveTitle(/EstateCore CRM/i);
    await expect(page.locator("text=ESTATECORE").first()).toBeVisible();

    // Verify key guest value propositions are visible on landing page
    await expect(page.locator("text=Live Synced Database")).toBeVisible();
    await expect(page.locator("text=ACID Row-Locking")).toBeVisible();
    await expect(page.locator("text=Dedicated Sales Advisory")).toBeVisible();

    // 2. Navigate to Properties Catalog
    await page.goto("/properties");
    await expect(page.locator("main h1")).toContainText(/Properties/i);

    // Verify project developments are rendered
    await expect(page.locator("text=Skyline Heights").first()).toBeVisible();
    await expect(page.locator("text=Emerald Gardens").first()).toBeVisible();

    // 3. Filter by Status: AVAILABLE
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("AVAILABLE");
    await expect(
      page.locator("span", { hasText: /^Available$/ }).first(),
    ).toBeVisible();

    // 4. Filter by Unit Type: TWO_BHK
    const typeSelect = page.locator("select").nth(1);
    await typeSelect.selectOption("TWO_BHK");

    // Both Skyline Heights and Emerald Gardens have 2 BHK units
    await expect(
      page.locator("p", { hasText: /TWO BHK/i }).first(),
    ).toBeVisible();

    // Reset filters
    const resetBtn = page.getByRole("button", { name: /Reset Filters/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    }
  });

  test("Guest inquiry submission flow on an available unit", async ({
    page,
  }) => {
    await page.goto("/properties");

    // Filter to available units to guarantee an Inquire button is present
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("AVAILABLE");

    // Find and click the first "Inquire" button
    const inquireButton = page
      .getByRole("button", { name: /Inquire/i })
      .first();
    await expect(inquireButton).toBeVisible();
    await inquireButton.click();

    // Verify the inquiry modal opens
    await expect(page.locator("text=Inquire About Property")).toBeVisible();

    // Fill the guest lead inquiry form
    const uniqueEmail = `guest.visitor.${Date.now()}@example.com`;
    await page.getByLabel(/Full Name/i).fill("Alexander Guest");
    await page.getByLabel(/Email Address/i).fill(uniqueEmail);
    await page.getByLabel(/Phone Number/i).fill("+1 (555) 987-6543");
    await page
      .locator("textarea")
      .fill("Interested in scheduling a weekend viewing for this unit.");

    // Submit inquiry
    await page.getByRole("button", { name: /Submit Inquiry/i }).click();

    // Verify success feedback toast/message
    await expect(
      page.locator(
        "text=Inquiry received! Our sales representative will reach out to you shortly.",
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Boundary Guards: Direct navigation redirects unauthenticated guests to login", async ({
    page,
  }) => {
    const protectedRoutes = ["/dashboard", "/leads", "/bookings", "/users"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Client-side authentication guard must immediately redirect to /login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      await expect(page.locator("text=Standard Sign In")).toBeVisible();
    }
  });

  test("Guest UI: Desktop & Mobile navigation sidebars are completely hidden", async ({
    page,
  }) => {
    await page.goto("/properties");

    // Authenticated navigation sidebar <aside> must not be in the DOM
    const sidebar = page.locator("aside");
    await expect(sidebar).toHaveCount(0);

    // Verify staff login CTA button is available instead
    await expect(page.getByRole("button", { name: /Login/i })).toBeVisible();
  });

  test("API Boundary Guards: Direct unauthenticated API requests return 401 Unauthorized", async ({
    request,
  }) => {
    // 1. GET /api/users
    const usersRes = await request.get("/api/users");
    expect(usersRes.status()).toBe(401);
    const usersJson = await usersRes.json();
    expect(usersJson.success).toBe(false);

    // 2. POST /api/leads
    const leadsRes = await request.post("/api/leads", {
      data: {
        name: "Malicious Injected Lead",
        email: "malicious@test.com",
      },
    });
    expect(leadsRes.status()).toBe(401);
    const leadsJson = await leadsRes.json();
    expect(leadsJson.success).toBe(false);

    // 3. GET /api/bookings
    const bookingsRes = await request.get("/api/bookings");
    expect(bookingsRes.status()).toBe(401);
    const bookingsJson = await bookingsRes.json();
    expect(bookingsJson.success).toBe(false);
  });
});
