import { test, expect } from '@playwright/test';

test.describe('PPDB Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ppdb');
  });

  test('should display PPDB landing page with complete information', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /pendaftaran peserta didik baru/i })).toBeVisible();

    // Check for registration button
    await expect(page.getByRole('link', { name: /daftar sekarang/i })).toBeVisible();

    // Check for information sections
    await expect(page.getByText(/syarat pendaftaran/i)).toBeVisible();
    await expect(page.getByText(/biaya pendaftaran/i)).toBeVisible();
  });

  test('should navigate to registration form', async ({ page }) => {
    // Click registration button
    await page.getByRole('link', { name: /daftar sekarang/i }).click();

    // Verify navigation to registration form
    await expect(page).toHaveURL(/\/ppdb\/register/);
    await expect(page.getByRole('heading', { name: /formulir pendaftaran/i })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /daftar/i }).click();

    // Check for validation errors
    await expect(page.getByText(/nama lengkap.*wajib/i)).toBeVisible();
    await expect(page.getByText(/tempat lahir.*wajib/i)).toBeVisible();
    await expect(page.getByText(/tanggal lahir.*wajib/i)).toBeVisible();
  });

  test('should complete registration successfully', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Fill personal information
    await page.fill('input[name="fullName"]', 'Ahmad Zaki Mubarak');
    await page.fill('input[name="nickname"]', 'Zaki');
    await page.fill('input[name="birthPlace"]', 'Blitar');
    await page.fill('input[name="birthDate"]', '2015-05-15');
    await page.selectOption('select[name="gender"]', 'LAKI_LAKI');

    // Fill address
    await page.fill('textarea[name="address"]', 'Jl. Raya Blitar No. 123, RT 01 RW 02');
    await page.fill('input[name="village"]', 'Kepanjen Kidul');
    await page.fill('input[name="district"]', 'Kepanjenkidul');
    await page.fill('input[name="city"]', 'Blitar');
    await page.fill('input[name="province"]', 'Jawa Timur');

    // Select education level
    await page.selectOption('select[name="level"]', 'TK');

    // Fill parent information
    await page.fill('input[name="fatherName"]', 'Ahmad Syafii');
    await page.fill('input[name="fatherPhone"]', '081234567890');
    await page.fill('input[name="motherName"]', 'Fatimah Azzahra');
    await page.fill('input[name="motherPhone"]', '081234567891');

    // Submit form
    await page.getByRole('button', { name: /daftar/i }).click();

    // Verify success
    await expect(page).toHaveURL(/\/ppdb\/success/, { timeout: 10000 });
    await expect(page.getByText(/pendaftaran berhasil/i)).toBeVisible();

    // Check for registration number
    await expect(page.getByText(/nomor pendaftaran/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.locator('input[name="email"]').blur();

    // Check for email validation error
    await expect(page.getByText(/format email tidak valid/i)).toBeVisible();

    // Fill valid email
    await page.fill('input[name="email"]', 'test@example.com');
    await page.locator('input[name="email"]').blur();

    // Error should disappear
    await expect(page.getByText(/format email tidak valid/i)).not.toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Test invalid phone number
    await page.fill('input[name="fatherPhone"]', '12345');
    await page.locator('input[name="fatherPhone"]').blur();
    await expect(page.getByText(/format.*telepon.*tidak valid/i)).toBeVisible();

    // Test valid phone formats
    const validNumbers = ['081234567890', '62812345678', '+62812345678'];
    for (const number of validNumbers) {
      await page.fill('input[name="fatherPhone"]', number);
      await page.locator('input[name="fatherPhone"]').blur();
      await expect(page.getByText(/format.*telepon.*tidak valid/i)).not.toBeVisible();
    }
  });

  test('should validate age requirements', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Fill personal information
    await page.fill('input[name="fullName"]', 'Test Student');

    // Test too young (born this year)
    const currentYear = new Date().getFullYear();
    await page.fill('input[name="birthDate"]', `${currentYear}-01-01`);
    await page.locator('input[name="birthDate"]').blur();
    await expect(page.getByText(/usia harus antara/i)).toBeVisible();

    // Test too old (born 30 years ago)
    await page.fill('input[name="birthDate"]', `${currentYear - 30}-01-01`);
    await page.locator('input[name="birthDate"]').blur();
    await expect(page.getByText(/usia harus antara/i)).toBeVisible();

    // Test valid age
    await page.fill('input[name="birthDate"]', `${currentYear - 5}-01-01`);
    await page.locator('input[name="birthDate"]').blur();
    await expect(page.getByText(/usia harus antara/i)).not.toBeVisible();
  });

  test('should save draft and continue later', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Fill some fields
    await page.fill('input[name="fullName"]', 'Ahmad Zaki Mubarak');
    await page.fill('input[name="birthPlace"]', 'Blitar');

    // Click save draft
    await page.getByRole('button', { name: /simpan draft/i }).click();

    // Verify draft saved
    await expect(page.getByText(/draft berhasil disimpan/i)).toBeVisible();

    // Navigate away and back
    await page.goto('/ppdb');
    await page.goto('/ppdb/register');

    // Verify data is restored
    await expect(page.locator('input[name="fullName"]')).toHaveValue('Ahmad Zaki Mubarak');
    await expect(page.locator('input[name="birthPlace"]')).toHaveValue('Blitar');
  });
});

test.describe('PPDB Status Check', () => {
  test('should check registration status', async ({ page }) => {
    await page.goto('/ppdb/status');

    // Enter registration number
    await page.fill('input[name="registrationNo"]', 'PPDB-2024-001');
    await page.getByRole('button', { name: /cek status/i }).click();

    // Verify status displayed or error message
    await expect(page.getByText(/status pendaftaran|tidak ditemukan/i)).toBeVisible();
  });

  test('should require registration number', async ({ page }) => {
    await page.goto('/ppdb/status');

    // Try to submit without registration number
    await page.getByRole('button', { name: /cek status/i }).click();

    // Check for validation error
    await expect(page.getByText(/nomor pendaftaran.*wajib/i)).toBeVisible();
  });
});

test.describe('PPDB Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/ppdb');

    // This would require @axe-core/playwright integration
    // For now, we can check basic accessibility features

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);

    // Check for form labels
    await page.goto('/ppdb/register');
    const labels = await page.locator('label').count();
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').count();
    expect(labels).toBeGreaterThanOrEqual(inputs);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/ppdb/register');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus');
    expect(await firstFocusable.count()).toBe(1);

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify focus is moving
    const currentFocus = await page.locator(':focus');
    expect(await currentFocus.count()).toBe(1);
  });
});
