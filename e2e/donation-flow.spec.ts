import { test, expect } from '@playwright/test';

test.describe('Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donasi');
  });

  test('should display donation homepage with categories', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /donasi|sedekah/i })).toBeVisible();

    // Check for donation categories
    await expect(page.getByText(/pendidikan/i)).toBeVisible();
    await expect(page.getByText(/pembangunan/i)).toBeVisible();
    await expect(page.getByText(/operasional/i)).toBeVisible();

    // Check for donation button
    await expect(page.getByRole('link', { name: /donasi sekarang/i })).toBeVisible();
  });

  test('should display active campaigns', async ({ page }) => {
    // Check for campaigns section
    await expect(page.getByText(/kampanye.*aktif/i)).toBeVisible();

    // Check for at least one campaign card
    const campaigns = page.locator('[data-testid="campaign-card"]');
    await expect(campaigns.first()).toBeVisible();

    // Each campaign should have title, target, and current amount
    const firstCampaign = campaigns.first();
    await expect(firstCampaign.getByRole('heading')).toBeVisible();
    await expect(firstCampaign.getByText(/target/i)).toBeVisible();
    await expect(firstCampaign.getByText(/terkumpul/i)).toBeVisible();
  });

  test('should navigate to donation form', async ({ page }) => {
    // Click donate button
    await page.getByRole('link', { name: /donasi sekarang/i }).first().click();

    // Verify navigation to donation form
    await expect(page).toHaveURL(/\/donasi\/donate/);
    await expect(page.getByRole('heading', { name: /form.*donasi/i })).toBeVisible();
  });

  test('should complete donation successfully', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Select donation category
    await page.selectOption('select[name="categoryId"]', { index: 1 });

    // Enter donation amount
    await page.fill('input[name="amount"]', '100000');

    // Fill donor information
    await page.fill('input[name="donorName"]', 'Ahmad Abdullah');
    await page.fill('input[name="donorEmail"]', 'ahmad@example.com');
    await page.fill('input[name="donorPhone"]', '081234567890');
    await page.fill('textarea[name="message"]', 'Semoga bermanfaat');

    // Select payment method
    await page.selectOption('select[name="paymentMethod"]', 'BANK_TRANSFER');

    // Submit form
    await page.getByRole('button', { name: /lanjutkan pembayaran/i }).click();

    // Verify payment page or instructions
    await expect(page).toHaveURL(/\/donasi\/payment|\/ppdb\/payment/, { timeout: 10000 });
    await expect(page.getByText(/instruksi pembayaran|transfer ke rekening/i)).toBeVisible();
  });

  test('should validate minimum donation amount', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Select donation category
    await page.selectOption('select[name="categoryId"]', { index: 1 });

    // Try amount below minimum
    await page.fill('input[name="amount"]', '5000');
    await page.locator('input[name="amount"]').blur();

    // Check for validation error
    await expect(page.getByText(/minimal.*10\.000/i)).toBeVisible();

    // Enter valid amount
    await page.fill('input[name="amount"]', '50000');
    await page.locator('input[name="amount"]').blur();

    // Error should disappear
    await expect(page.getByText(/minimal.*10\.000/i)).not.toBeVisible();
  });

  test('should support anonymous donation', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Fill required fields
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.fill('input[name="amount"]', '100000');

    // Check anonymous checkbox
    await page.check('input[name="isAnonymous"]');

    // Donor name should be disabled or hidden
    const donorNameInput = page.locator('input[name="donorName"]');
    await expect(donorNameInput).toBeDisabled();
  });

  test('should display quick amount buttons', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Check for quick amount buttons
    const quickAmounts = ['50000', '100000', '200000', '500000'];

    for (const amount of quickAmounts) {
      await expect(page.getByRole('button', { name: new RegExp(amount) })).toBeVisible();
    }

    // Click one and verify amount is filled
    await page.getByRole('button', { name: /100.000|100000/i }).click();
    await expect(page.locator('input[name="amount"]')).toHaveValue('100000');
  });
});

test.describe('Campaign Detail Page', () => {
  test('should display campaign information', async ({ page }) => {
    // Navigate to first campaign (assuming at least one exists)
    await page.goto('/donasi');
    const firstCampaign = page.locator('[data-testid="campaign-card"]').first();
    await firstCampaign.click();

    // Verify campaign detail page
    await expect(page).toHaveURL(/\/donasi\/campaign\//);

    // Check for campaign elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/deskripsi/i)).toBeVisible();
    await expect(page.getByText(/target.*donasi/i)).toBeVisible();
    await expect(page.getByText(/terkumpul/i)).toBeVisible();

    // Check for donate button
    await expect(page.getByRole('button', { name: /donasi sekarang/i })).toBeVisible();
  });

  test('should show donation progress', async ({ page }) => {
    await page.goto('/donasi');
    const firstCampaign = page.locator('[data-testid="campaign-card"]').first();
    await firstCampaign.click();

    // Check for progress bar
    const progressBar = page.locator('[role="progressbar"], .progress-bar');
    await expect(progressBar).toBeVisible();

    // Check for percentage
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test('should display recent donors', async ({ page }) => {
    await page.goto('/donasi');
    const firstCampaign = page.locator('[data-testid="campaign-card"]').first();
    await firstCampaign.click();

    // Check for recent donors section
    await expect(page.getByText(/donatur terbaru|daftar donatur/i)).toBeVisible();
  });
});

test.describe('OTA (Anak Asuh) Program', () => {
  test('should display OTA program list', async ({ page }) => {
    await page.goto('/donasi/ota');

    // Check for heading
    await expect(page.getByRole('heading', { name: /program.*anak.*asuh|ota/i })).toBeVisible();

    // Check for program cards
    const programs = page.locator('[data-testid="ota-program-card"]');
    await expect(programs.first()).toBeVisible();
  });

  test('should show student information', async ({ page }) => {
    await page.goto('/donasi/ota');

    // Click on first program
    const firstProgram = page.locator('[data-testid="ota-program-card"]').first();
    await firstProgram.click();

    // Verify student information is displayed
    await expect(page.getByText(/nama|jenjang|kelas/i)).toBeVisible();
    await expect(page.getByText(/kebutuhan.*bulanan/i)).toBeVisible();
  });

  test('should complete OTA sponsorship', async ({ page }) => {
    await page.goto('/donasi/ota');

    // Click on first program
    const firstProgram = page.locator('[data-testid="ota-program-card"]').first();
    await firstProgram.click();

    // Click sponsor button
    await page.getByRole('button', { name: /sponsori sekarang|jadi sponsor/i }).click();

    // Fill sponsor information
    await page.fill('input[name="donorName"]', 'Ahmad Abdullah');
    await page.fill('input[name="donorEmail"]', 'ahmad@example.com');
    await page.fill('input[name="donorPhone"]', '081234567890');
    await page.fill('input[name="amount"]', '500000');

    // Check recurring option
    await page.check('input[name="isRecurring"]');

    // Submit
    await page.getByRole('button', { name: /lanjutkan/i }).click();

    // Verify payment instructions
    await expect(page.getByText(/instruksi pembayaran|transfer/i)).toBeVisible();
  });
});

test.describe('Zakat Calculator', () => {
  test('should display zakat calculator', async ({ page }) => {
    await page.goto('/donasi/zakat-calculator');

    // Check for heading
    await expect(page.getByRole('heading', { name: /kalkulator zakat/i })).toBeVisible();

    // Check for zakat types
    await expect(page.getByText(/zakat mal/i)).toBeVisible();
    await expect(page.getByText(/zakat penghasilan/i)).toBeVisible();
    await expect(page.getByText(/zakat fitrah/i)).toBeVisible();
  });

  test('should calculate zakat mal', async ({ page }) => {
    await page.goto('/donasi/zakat-calculator');

    // Select Zakat Mal
    await page.click('text=Zakat Mal');

    // Enter total assets
    await page.fill('input[name="totalAssets"]', '100000000');

    // Enter total debts
    await page.fill('input[name="totalDebts"]', '10000000');

    // Click calculate
    await page.getByRole('button', { name: /hitung zakat/i }).click();

    // Verify result is displayed
    await expect(page.getByText(/jumlah zakat.*wajib/i)).toBeVisible();
    await expect(page.getByText(/2\.250\.000|2250000/i)).toBeVisible(); // 2.5% of 90M
  });

  test('should calculate zakat penghasilan', async ({ page }) => {
    await page.goto('/donasi/zakat-calculator');

    // Select Zakat Penghasilan
    await page.click('text=Zakat Penghasilan');

    // Enter monthly income
    await page.fill('input[name="monthlyIncome"]', '10000000');

    // Enter monthly expenses
    await page.fill('input[name="monthlyExpenses"]', '3000000');

    // Click calculate
    await page.getByRole('button', { name: /hitung zakat/i }).click();

    // Verify result
    await expect(page.getByText(/jumlah zakat.*wajib/i)).toBeVisible();
  });

  test('should calculate zakat fitrah', async ({ page }) => {
    await page.goto('/donasi/zakat-calculator');

    // Select Zakat Fitrah
    await page.click('text=Zakat Fitrah');

    // Enter number of people
    await page.fill('input[name="numberOfPeople"]', '5');

    // Enter rice price
    await page.fill('input[name="ricePrice"]', '15000');

    // Click calculate
    await page.getByRole('button', { name: /hitung zakat/i }).click();

    // Verify result (5 people x 3.5 liters x 15000 = 262,500)
    await expect(page.getByText(/jumlah zakat.*wajib/i)).toBeVisible();
    await expect(page.getByText(/262\.500|262500/i)).toBeVisible();
  });

  test('should allow direct payment after calculation', async ({ page }) => {
    await page.goto('/donasi/zakat-calculator');

    // Calculate zakat
    await page.click('text=Zakat Mal');
    await page.fill('input[name="totalAssets"]', '100000000');
    await page.getByRole('button', { name: /hitung zakat/i }).click();

    // Click pay now button
    await page.getByRole('button', { name: /bayar sekarang|donasi sekarang/i }).click();

    // Verify redirected to donation form with amount pre-filled
    await expect(page).toHaveURL(/\/donasi\/donate/);
    const amountInput = page.locator('input[name="amount"]');
    const value = await amountInput.inputValue();
    expect(parseInt(value)).toBeGreaterThan(0);
  });
});

test.describe('Donation Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBe(1);

    // Tab through form elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify focus is still within the page
    focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBe(1);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/donasi/donate');

    // Check that all inputs have associated labels
    const inputs = await page.locator('input[type="text"], input[type="number"], input[type="email"], select, textarea').count();
    const labels = await page.locator('label').count();

    // Labels should be at least as many as inputs
    expect(labels).toBeGreaterThanOrEqual(inputs);
  });
});
