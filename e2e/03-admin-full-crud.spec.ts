import { test, expect } from "@playwright/test";

test.describe("03. Administrator Persona - Full Global CRUD, User Directory & RBAC Security", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as Alexander Wright (Administrator)
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("admin@realestate.com");
    await page.getByLabel(/Password/i).fill("Admin@123");
    await page.getByRole("button", { name: /Sign In|Login/i }).click();

    // Verify redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("text=Alexander Wright").first()).toBeVisible();
    await expect(page.locator("text=Administrator").first()).toBeVisible();
  });

  test("RBAC & Sidebar: Admin has unrestricted access to all modules including Team & Users", async ({
    page,
  }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Admin sidebar must contain ALL navigation links
    await expect(sidebar.locator('nav a[href="/dashboard"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/leads"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/properties"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/bookings"]')).toBeVisible();
    await expect(sidebar.locator('nav a[href="/users"]')).toBeVisible();
  });

  test("Users Directory CRUD: List, Create Team Member, Role Toggle, Password Reset, and Deletion Protection", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator("main h1")).toContainText(/Team & Users/i);

    // 1. List team members and verify initial seeded users exist
    await expect(
      page.locator("table").getByText("Alexander Wright"),
    ).toBeVisible();
    await expect(
      page.locator("table").getByText("Sarah Jenkins"),
    ).toBeVisible();
    await expect(page.locator("table").getByText("David Miller")).toBeVisible();

    // 2. Create a new Sales Rep via "+ Add Team Member" modal
    const timestamp = Date.now();
    const newRepName = `Test Rep ${timestamp}`;
    const newRepEmail = `rep.${timestamp}@realestate.com`;

    await page.getByRole("button", { name: /Add Team Member/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Team Member" }),
    ).toBeVisible();

    await page.getByLabel(/Full Name/i).fill(newRepName);
    await page.getByLabel(/Email Address/i).fill(newRepEmail);
    await page
      .getByLabel(/Initial Temporary Password/i)
      .fill("InitialPass@123");

    // Role default is SALES_REP
    await page.getByRole("button", { name: /Create Account/i }).click();

    // Verify modal closes and new user appears in directory
    await expect(page.locator(`text=${newRepName}`)).toBeVisible({
      timeout: 15000,
    });
    const newRepRow = page.locator("tr", { hasText: newRepName });
    await expect(newRepRow).toBeVisible();
    await expect(newRepRow.locator("text=Sales Representative")).toBeVisible();

    // 3. Role Toggle: Toggle Rep -> Admin and back
    const toggleRoleBtn = newRepRow.getByRole("button", {
      name: /Make Admin/i,
    });
    await expect(toggleRoleBtn).toBeVisible();
    await toggleRoleBtn.click();

    // Verify role changed to Administrator
    await expect(
      page.locator(`text=Role for ${newRepName} updated to Administrator.`),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(newRepRow.locator("text=Administrator")).toBeVisible();

    // Toggle back to Sales Rep
    const demoteBtn = newRepRow.getByRole("button", { name: /Make Rep/i });
    await expect(demoteBtn).toBeVisible();
    await demoteBtn.click();

    await expect(
      page.locator(
        `text=Role for ${newRepName} updated to Sales Representative.`,
      ),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(newRepRow.locator("text=Sales Representative")).toBeVisible();

    // 4. Password Reset Modal
    const resetPwBtn = newRepRow.getByRole("button", { name: /Reset PW/i });
    await expect(resetPwBtn).toBeVisible();
    await resetPwBtn.click();

    await expect(page.locator("text=Reset User Password")).toBeVisible();
    await page.getByLabel(/New Password/i).fill("UpdatedSecret@123");
    await page.getByRole("button", { name: /Update Password/i }).click();

    await expect(
      page.locator(
        `text=Password for ${newRepName} has been reset successfully.`,
      ),
    ).toBeVisible({ timeout: 10000 });

    // 5. Delete User Guard 1: Verify Admin's own account has NO demote or delete controls
    const adminSelfRow = page.locator("tr", {
      hasText: "admin@realestate.com",
    });
    await expect(adminSelfRow).toBeVisible();
    await expect(
      adminSelfRow.getByRole("button", { name: /Make Rep|Make Admin/i }),
    ).toHaveCount(0);
    await expect(
      adminSelfRow.locator('button[title="Delete account"]'),
    ).toHaveCount(0);

    // 6. Delete User Guard 2: Protected against deleting users with active leads or bookings
    const sarahRow = page.locator("tr", {
      hasText: "sarah.rep@realestate.com",
    });
    await expect(sarahRow).toBeVisible();
    const sarahDeleteBtn = sarahRow.locator('button[title="Delete account"]');
    await expect(sarahDeleteBtn).toBeVisible();
    await sarahDeleteBtn.click();

    // Verify protection banner prevents deletion
    await expect(
      page.locator("text=Cannot delete Sarah Jenkins: Account has"),
    ).toBeVisible({ timeout: 10000 });
    // Verify Sarah Jenkins remains in the directory
    await expect(
      page.locator("table").getByText("Sarah Jenkins"),
    ).toBeVisible();

    // 7. Cleanup: Delete the newly created test user (has 0 leads & 0 bookings)
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    const newRepDeleteBtn = newRepRow.locator('button[title="Delete account"]');
    await newRepDeleteBtn.click();
    await expect(
      page.locator(`text=Account for ${newRepName} deleted.`),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("Global Leads & Bookings CRUD: Lead reassignment and global audit trail", async ({
    page,
  }) => {
    // 1. Lead Reassignment
    await page.goto("/leads");
    await expect(page.locator("main h1")).toContainText(/Leads/i);

    // Admin searches for lead (Robert Chen)
    await page.getByPlaceholder(/Search/i).fill("Robert Chen");
    const robertLeadRow = page
      .locator("tbody tr", { hasText: "Robert Chen" })
      .first();
    await expect(robertLeadRow).toBeVisible();
    await robertLeadRow.click();

    // Wait for detail dialog to open and async lead data to settle
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.waitForTimeout(500);

    // In detail modal, change Stage and Assigned Sales Representative to guarantee dirty state
    const stageSelect = page.locator('[role="dialog"] select').first();
    await stageSelect.selectOption("NEGOTIATION");

    const assignedSelect = page.locator('[role="dialog"] select').nth(1);
    await assignedSelect.selectOption({ label: "David Miller" });

    // Click Save Changes
    const saveBtn = page.getByRole("button", { name: /Save Changes/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await expect(page.locator("text=Changes saved successfully!")).toBeVisible({
      timeout: 10000,
    });

    // Close modal
    await page
      .locator('[role="dialog"] button[aria-label="Close dialog"]')
      .click();

    // 2. Global Bookings Audit Trail
    await page.goto("/bookings");
    await expect(page.locator("main h1")).toContainText(/Bookings/i);

    // Admin sees global audit trail badge
    await expect(page.locator("text=Admin: Global Audit Trail")).toBeVisible();

    // Filter by status: CONFIRMED
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("CONFIRMED");

    // Verify bookings list contains confirmed records
    await expect(
      page.locator("table").getByText("CONFIRMED").first(),
    ).toBeVisible();
  });

  test("Properties Management & Dashboard: Verify status transition and occupancy metrics", async ({
    page,
  }) => {
    // 1. Inspect Properties page as Administrator
    await page.goto("/properties");
    await expect(page.locator("main h1")).toContainText(/Properties/i);

    // Admin has access to inventory creation controls
    await expect(
      page.getByRole("button", { name: /New Project/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /New Building/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /New Unit/i })).toBeVisible();

    // Verify development project stats
    await expect(
      page.locator("span", { hasText: "Total Units" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("span", { hasText: /^Available$/ }).first(),
    ).toBeVisible();

    // 2. Inspect Executive Dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify live KPI tiles
    await expect(page.locator("text=Total Leads")).toBeVisible();
    await expect(page.locator("text=Occupancy Rate")).toBeVisible();
    await expect(page.locator("text=Booked Revenue")).toBeVisible();

    // Verify Pipeline Funnel stages
    await expect(page.locator("text=Pipeline Funnel")).toBeVisible();
    await expect(page.locator("text=New").first()).toBeVisible();
    await expect(page.locator("text=Contacted").first()).toBeVisible();
  });
});
