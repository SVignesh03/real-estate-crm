import { test, expect } from "@playwright/test";

test.describe("02. Sales Representative Persona - Assigned CRUD & RBAC Boundaries", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as Sarah Jenkins (Sales Rep)
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("sarah.rep@realestate.com");
    await page.getByLabel(/Password/i).fill("Sales@123");
    await page.getByRole("button", { name: /Sign In|Login/i }).click();

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("text=Sarah Jenkins").first()).toBeVisible();
  });

  test("Navigation & Sidebar RBAC: Rep navigation is scoped, /users is restricted", async ({
    page,
  }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Rep sidebar must contain standard links
    await expect(sidebar.locator('nav a[href="/dashboard"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/leads"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/properties"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/bookings"]')).toBeVisible();

    // Rep sidebar MUST NOT display Team & Users link
    await expect(sidebar.locator('a[href="/users"]')).toHaveCount(0);
    await expect(sidebar.locator("text=Team & Users")).toHaveCount(0);

    // Direct navigation attempt to /users must immediately redirect to /dashboard
    await page.goto("/users");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator("main h1")).toContainText(/Dashboard/i);
  });

  test("Leads CRUD: View assigned leads, create new lead, update stage, and add note", async ({
    page,
  }) => {
    await page.goto("/leads");
    await expect(page.locator("main h1")).toContainText(/Leads/i);

    // 1. Verify Rep sees only their assigned leads (Sarah has Robert Chen and Emily Watson)
    await expect(page.locator("text=Robert Chen").first()).toBeVisible();

    // David's assigned leads (e.g. Julian Vance) must NOT appear in Sarah's table
    await expect(page.locator("text=Julian Vance")).toHaveCount(0);

    // 2. Create a new Lead
    const newLeadName = `Client Sarah ${Date.now()}`;
    const newLeadEmail = `sarah.client.${Date.now()}@domain.com`;

    await page.getByRole("button", { name: /New Lead/i }).click();
    await expect(page.locator("h2", { hasText: /New Lead/i })).toBeVisible();

    await page.getByLabel(/Prospect Full Name/i).fill(newLeadName);
    await page.getByLabel(/^Email/i).fill(newLeadEmail);
    await page.getByLabel(/^Phone/i).fill("+1 (555) 321-4567");
    await page.getByLabel(/Approximate Budget/i).fill("600000");

    // Submit the modal form
    await page.getByRole("button", { name: /Submit/i }).click();

    // Verify lead appears in table
    await expect(page.locator(`text=${newLeadName}`).first()).toBeVisible({
      timeout: 10000,
    });

    // 3. Open Lead Detail Modal
    await page.locator(`text=${newLeadName}`).first().click();
    await expect(page.locator("h2", { hasText: newLeadName })).toBeVisible();

    // 4. Update Pipeline Stage
    // Inside the detail modal, change stage to SITE_VISIT
    const stageSelect = page.locator('[role="dialog"] select').first();
    await stageSelect.selectOption("SITE_VISIT");

    // Click Save Changes
    const saveBtn = page.getByRole("button", { name: /Save Changes/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.locator("text=Changes saved successfully!")).toBeVisible({
      timeout: 10000,
    });

    // 5. Add a Timeline Note
    const noteText = `Discussion note logged at ${new Date().toISOString()}`;
    await page.locator('input[placeholder*="Log call outcome"]').fill(noteText);
    await page.getByRole("button", { name: /Add Note/i }).click();

    // Verify note is rendered in timeline
    await expect(page.locator(`text=${noteText}`).first()).toBeVisible({
      timeout: 10000,
    });

    // Close detail modal
    await page
      .locator('[role="dialog"] button[aria-label="Close dialog"]')
      .click();
  });

  test("Properties & Bookings CRUD: Inventory browsing, Rep restrictions, and atomic booking", async ({
    page,
  }) => {
    await page.goto("/properties");
    await expect(page.locator("main h1")).toContainText(/Properties/i);

    // 1. Confirm Rep cannot access Admin-only global reconfiguration controls
    await expect(
      page.getByRole("button", { name: /New Project/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /New Building/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /New Unit/i })).toHaveCount(
      0,
    );

    // 2. Filter to AVAILABLE units to execute a booking
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("AVAILABLE");

    // Click "Book Unit" on the first available unit
    const bookUnitBtn = page
      .getByRole("button", { name: /Book Unit/i })
      .first();
    await expect(bookUnitBtn).toBeVisible();
    await bookUnitBtn.click();

    // Booking modal must open with atomic confirmation form
    await expect(
      page.locator("text=Total Agreed Property Value"),
    ).toBeVisible();
    await expect(page.locator("text=Sarah Jenkins (SALES_REP)")).toBeVisible();

    // Ensure lead select has loaded eligible leads
    const leadSelect = page.getByLabel(/Select Lead to Bind Booking/i);
    await expect(leadSelect.locator("option")).not.toHaveCount(0);

    // Fill booking details
    await page
      .getByLabel(/Booking Terms & Wire Reference/i)
      .fill("Wire transfer confirmation #WT-E2E-TEST");

    // Execute Atomic Booking
    await page.getByRole("button", { name: /Execute Atomic Booking/i }).click();

    // Verify success confirmation message
    await expect(
      page.locator("text=Success! Booking confirmed with code:"),
    ).toBeVisible({
      timeout: 15000,
    });

    // 3. Verify booking appears under /bookings
    await page.goto("/bookings");
    await expect(page).toHaveURL(/\/bookings/);
    await expect(
      page.locator("text=Rep: Bookings by Sarah Jenkins"),
    ).toBeVisible();

    // Verify confirmed booking badge and row are present in table
    await expect(
      page.locator("table").getByText("CONFIRMED").first(),
    ).toBeVisible();
  });
});
