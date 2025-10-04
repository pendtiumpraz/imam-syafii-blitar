-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isUstadz" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "domain" TEXT,
    "subdomain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "accountId" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "entryNo" TEXT NOT NULL,
    "transactionId" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "totalDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isBalanced" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budgetId" TEXT,
    "data" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trails" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channelId" TEXT,
    "channelSecret" TEXT,
    "channelAccessToken" TEXT,
    "webhookUrl" TEXT,
    "liffId" TEXT,
    "richMenuId" TEXT,
    "richMenuEnabled" BOOLEAN NOT NULL DEFAULT true,
    "flexMessagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quickReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "broadcastEnabled" BOOLEAN NOT NULL DEFAULT true,
    "liffEnabled" BOOLEAN NOT NULL DEFAULT false,
    "multicastEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushMessagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messagesPerMinute" INTEGER NOT NULL DEFAULT 60,
    "broadcastDelay" INTEGER NOT NULL DEFAULT 500,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Selamat datang di LINE Official Account Pondok Imam Syafii!',
    "unknownMessage" TEXT NOT NULL DEFAULT 'Maaf, pesan tidak dikenali. Ketik ''menu'' untuk bantuan.',
    "errorMessage" TEXT NOT NULL DEFAULT 'Maaf, terjadi kesalahan. Silakan coba lagi.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "statusMessage" TEXT,
    "language" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canCRUD" BOOLEAN NOT NULL DEFAULT false,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeFlowId" TEXT,
    "flowType" TEXT,
    "flowData" JSONB NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "stepHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "state" JSONB NOT NULL DEFAULT '{}',
    "breadcrumb" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "waitingFor" TEXT,
    "canAbort" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "line_user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_admins" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "userId" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY['BASIC']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "nip" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "gender" TEXT NOT NULL,
    "birthPlace" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "subjects" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT,
    "university" TEXT,
    "major" TEXT,
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "employmentType" TEXT NOT NULL DEFAULT 'TETAP',
    "joinDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "institution" TEXT NOT NULL,
    "specialization" TEXT,
    "experience" INTEGER,
    "photo" TEXT,
    "bio" TEXT,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "isUstadz" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" TEXT,
    "category" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebooks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "fileUrl" TEXT NOT NULL,
    "coverImage" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'id',
    "publisher" TEXT,
    "publishYear" TEXT,
    "isbn" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "nisn" TEXT,
    "nis" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "religion" TEXT NOT NULL DEFAULT 'Islam',
    "nationality" TEXT NOT NULL DEFAULT 'Indonesia',
    "address" TEXT NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'Jawa Timur',
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "fatherName" TEXT NOT NULL,
    "fatherJob" TEXT,
    "fatherPhone" TEXT,
    "fatherEducation" TEXT,
    "motherName" TEXT NOT NULL,
    "motherJob" TEXT,
    "motherPhone" TEXT,
    "motherEducation" TEXT,
    "guardianName" TEXT,
    "guardianJob" TEXT,
    "guardianPhone" TEXT,
    "guardianRelation" TEXT,
    "institutionType" TEXT NOT NULL,
    "grade" TEXT,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "enrollmentYear" TEXT NOT NULL,
    "previousSchool" TEXT,
    "specialNeeds" TEXT,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "photo" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "graduationDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registrationId" TEXT,
    "isOrphan" BOOLEAN NOT NULL DEFAULT false,
    "monthlyNeeds" DECIMAL(65,30),
    "otaProfile" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "nisn" TEXT,
    "nis" TEXT,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "religion" TEXT NOT NULL DEFAULT 'Islam',
    "nationality" TEXT NOT NULL DEFAULT 'Indonesia',
    "currentAddress" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "currentProvince" TEXT,
    "currentCountry" TEXT NOT NULL DEFAULT 'Indonesia',
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "institutionType" TEXT NOT NULL,
    "graduationYear" TEXT NOT NULL,
    "generation" TEXT,
    "currentJob" TEXT,
    "jobPosition" TEXT,
    "company" TEXT,
    "furtherEducation" TEXT,
    "university" TEXT,
    "major" TEXT,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "maritalStatus" TEXT,
    "spouseName" TEXT,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "photo" TEXT,
    "memories" TEXT,
    "message" TEXT,
    "availableForEvents" BOOLEAN NOT NULL DEFAULT true,
    "lastContactDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "gender" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "nik" TEXT,
    "nisn" TEXT,
    "address" TEXT NOT NULL,
    "rt" TEXT,
    "rw" TEXT,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'Jawa Timur',
    "postalCode" TEXT,
    "level" TEXT NOT NULL,
    "previousSchool" TEXT,
    "gradeTarget" TEXT,
    "programType" TEXT,
    "boardingType" TEXT,
    "fatherName" TEXT NOT NULL,
    "fatherNik" TEXT,
    "fatherJob" TEXT,
    "fatherPhone" TEXT,
    "fatherEducation" TEXT,
    "fatherIncome" TEXT,
    "motherName" TEXT NOT NULL,
    "motherNik" TEXT,
    "motherJob" TEXT,
    "motherPhone" TEXT,
    "motherEducation" TEXT,
    "motherIncome" TEXT,
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "guardianAddress" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "bloodType" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "specialNeeds" TEXT,
    "medicalHistory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "documents" TEXT NOT NULL DEFAULT '[]',
    "testSchedule" TIMESTAMP(3),
    "testVenue" TEXT,
    "testScore" TEXT,
    "testResult" TEXT,
    "ranking" INTEGER,
    "registrationFee" DECIMAL(65,30) NOT NULL DEFAULT 150000,
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentProof" TEXT,
    "reregStatus" TEXT,
    "reregDate" TIMESTAMP(3),
    "reregPayment" TEXT,
    "notes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "billId" TEXT,
    "registrationId" TEXT,
    "studentId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "description" TEXT,
    "method" TEXT NOT NULL,
    "channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "transactionId" TEXT,
    "paymentUrl" TEXT,
    "vaNumber" TEXT,
    "qrString" TEXT,
    "deeplink" TEXT,
    "expiredAt" TIMESTAMP(3),
    "paymentGatewayData" TEXT NOT NULL DEFAULT '{}',
    "merchantId" TEXT,
    "fraudStatus" TEXT,
    "cardType" TEXT,
    "maskedCard" TEXT,
    "approvalCode" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "story" TEXT,
    "categoryId" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "mainImage" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "video" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donationNo" TEXT NOT NULL,
    "campaignId" TEXT,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "message" TEXT,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "paymentChannel" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "vaNumber" TEXT,
    "qrisCode" TEXT,
    "paymentUrl" TEXT,
    "expiredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "proofUrl" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "certificateNo" TEXT,
    "certificateUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zakat_calculations" (
    "id" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "inputs" TEXT NOT NULL,
    "zakatAmount" DECIMAL(65,30) NOT NULL,
    "nisabAmount" DECIMAL(65,30),
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "donationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zakat_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "preferredCategories" TEXT NOT NULL DEFAULT '[]',
    "allowMarketing" BOOLEAN NOT NULL DEFAULT true,
    "allowNewsletter" BOOLEAN NOT NULL DEFAULT true,
    "totalDonated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "donationCount" INTEGER NOT NULL DEFAULT 0,
    "lastDonationAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "brand" TEXT,
    "supplier" TEXT,
    "location" TEXT NOT NULL DEFAULT 'UMUM',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "taxId" TEXT,
    "bankAccount" TEXT,
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "batchNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "referenceId" TEXT,
    "batchNo" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "remainingQty" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "saleNo" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "location" TEXT NOT NULL DEFAULT 'KOPERASI',
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "paidAmount" DECIMAL(65,30) NOT NULL,
    "changeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentReference" TEXT,
    "cashier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "gradingDeadline" TIMESTAMP(3),
    "reportDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT,
    "academicYearId" TEXT NOT NULL,
    "teacherId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "room" TEXT,
    "level" TEXT NOT NULL,
    "program" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameArabic" TEXT,
    "description" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "type" TEXT NOT NULL DEFAULT 'WAJIB',
    "category" TEXT NOT NULL DEFAULT 'UMUM',
    "level" TEXT NOT NULL,
    "minGrade" TEXT,
    "maxGrade" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_subjects" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "semester" INTEGER,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "minScore" INTEGER NOT NULL DEFAULT 60,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "classId" TEXT,
    "midterm" DECIMAL(65,30),
    "final" DECIMAL(65,30),
    "assignment" DECIMAL(65,30),
    "quiz" DECIMAL(65,30),
    "participation" DECIMAL(65,30),
    "project" DECIMAL(65,30),
    "daily" DECIMAL(65,30),
    "total" DECIMAL(65,30),
    "grade" TEXT,
    "point" DECIMAL(65,30),
    "akhlak" TEXT,
    "quranMemory" TEXT,
    "notes" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "enteredBy" TEXT,
    "enteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3),
    "notes" TEXT,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "totalScore" DECIMAL(65,30),
    "rank" INTEGER,
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,
    "sickDays" INTEGER NOT NULL DEFAULT 0,
    "permittedDays" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "attendancePercentage" DECIMAL(65,30),
    "behavior" TEXT,
    "personality" TEXT NOT NULL DEFAULT '{}',
    "extracurricular" TEXT NOT NULL DEFAULT '[]',
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "recommendations" TEXT,
    "parentNotes" TEXT,
    "generatedAt" TIMESTAMP(3),
    "generatedBy" TEXT,
    "printedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "period" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "room" TEXT,
    "maxScore" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "minScore" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "passingScore" DECIMAL(65,30) NOT NULL DEFAULT 60,
    "instructions" TEXT,
    "materials" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "point" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "enteredBy" TEXT,
    "enteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "whatsapp" TEXT,
    "emergencyContact" TEXT,
    "notificationSettings" TEXT NOT NULL DEFAULT '{"grades": true, "attendance": true, "payments": true, "announcements": true, "messages": true, "pushNotifications": true, "emailNotifications": true}',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'id',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_students" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canViewGrades" BOOLEAN NOT NULL DEFAULT true,
    "canViewAttendance" BOOLEAN NOT NULL DEFAULT true,
    "canViewPayments" BOOLEAN NOT NULL DEFAULT true,
    "canReceiveMessages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "targetClasses" TEXT NOT NULL DEFAULT '[]',
    "targetGrades" TEXT NOT NULL DEFAULT '[]',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentMessageId" TEXT,
    "threadId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "isAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "actionUrl" TEXT,
    "actionText" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "channels" TEXT NOT NULL DEFAULT '["in_app"]',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSentAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_surahs" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameTransliteration" TEXT,
    "totalAyat" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "page" INTEGER,
    "type" TEXT NOT NULL,
    "revelation" INTEGER,
    "meaningId" TEXT,
    "meaningAr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quran_surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "startAyat" INTEGER NOT NULL DEFAULT 1,
    "endAyat" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "quality" TEXT NOT NULL DEFAULT 'B',
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fluency" TEXT,
    "tajweed" TEXT,
    "makharijul" TEXT,
    "voiceNoteUrl" TEXT,
    "notes" TEXT,
    "corrections" TEXT,
    "duration" INTEGER,
    "method" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "previousRecord" TEXT,
    "nextTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalSurah" INTEGER NOT NULL DEFAULT 0,
    "totalAyat" INTEGER NOT NULL DEFAULT 0,
    "totalJuz" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentSurah" INTEGER,
    "currentAyat" INTEGER NOT NULL DEFAULT 1,
    "currentTarget" TEXT,
    "level" TEXT NOT NULL DEFAULT 'PEMULA',
    "badge" TEXT NOT NULL DEFAULT '[]',
    "juz30Progress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overallProgress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastSetoranDate" TIMESTAMP(3),
    "lastMurajaahDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "avgQuality" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avgFluency" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avgTajweed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setoran_schedules" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SETORAN_BARU',
    "duration" INTEGER NOT NULL DEFAULT 15,
    "location" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "reminderMinutes" INTEGER NOT NULL DEFAULT 60,
    "notifyParent" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setoran_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_targets" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "targetSurah" INTEGER NOT NULL,
    "startAyat" INTEGER NOT NULL DEFAULT 1,
    "endAyat" INTEGER,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reward" TEXT,
    "motivation" TEXT,
    "parentInformed" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "level" TEXT NOT NULL DEFAULT 'BRONZE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "badge" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "celebrated" BOOLEAN NOT NULL DEFAULT false,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hafalan_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "duration" INTEGER NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'KELAS',
    "atmosphere" TEXT NOT NULL DEFAULT 'FORMAL',
    "content" TEXT NOT NULL,
    "totalAyat" INTEGER NOT NULL DEFAULT 0,
    "overallQuality" TEXT NOT NULL,
    "overallFluency" TEXT NOT NULL,
    "improvements" TEXT,
    "challenges" TEXT,
    "homework" TEXT,
    "nextTarget" TEXT,
    "reminderNote" TEXT,
    "studentMood" TEXT NOT NULL DEFAULT 'NORMAL',
    "engagement" TEXT NOT NULL DEFAULT 'GOOD',
    "confidence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reportSent" BOOLEAN NOT NULL DEFAULT false,
    "parentFeedback" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "defaultAmount" DECIMAL(65,30),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "priceByGrade" TEXT NOT NULL DEFAULT '{}',
    "dueDayOfMonth" INTEGER,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "latePenaltyType" TEXT NOT NULL DEFAULT 'NONE',
    "latePenaltyAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxPenalty" DECIMAL(65,30),
    "allowSiblingDiscount" BOOLEAN NOT NULL DEFAULT false,
    "siblingDiscountPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allowScholarshipDiscount" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "billTypeId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "period" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OUTSTANDING',
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(65,30) NOT NULL,
    "discounts" TEXT NOT NULL DEFAULT '[]',
    "totalDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "penalties" TEXT NOT NULL DEFAULT '[]',
    "totalPenalty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "daysPastDue" INTEGER NOT NULL DEFAULT 0,
    "firstOverdueDate" TIMESTAMP(3),
    "lastReminderSent" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payments" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "channel" TEXT,
    "reference" TEXT,
    "proofUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "externalId" TEXT,
    "gatewayResponse" TEXT NOT NULL DEFAULT '{}',
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" TEXT,
    "notes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "paymentId" TEXT,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previousAmount" DECIMAL(65,30),
    "newAmount" DECIMAL(65,30),
    "changeAmount" DECIMAL(65,30),
    "performedBy" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "dataType" TEXT NOT NULL DEFAULT 'STRING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_reminders" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "response" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "templateUsed" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" TEXT,
    "summary" TEXT NOT NULL DEFAULT '{}',
    "pdfUrl" TEXT,
    "excelUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ota_programs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "monthlyTarget" DECIMAL(65,30) NOT NULL,
    "currentMonth" TEXT NOT NULL,
    "totalCollected" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "programStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monthlyProgress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthsCompleted" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "showProgress" BOOLEAN NOT NULL DEFAULT true,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ota_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ota_sponsors" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "publicName" TEXT NOT NULL DEFAULT 'Hamba Allah',
    "amount" DECIMAL(65,30) NOT NULL,
    "month" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "paymentProof" TEXT,
    "paymentDate" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "donationType" TEXT NOT NULL DEFAULT 'REGULAR',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "allowPublicDisplay" BOOLEAN NOT NULL DEFAULT true,
    "allowContact" BOOLEAN NOT NULL DEFAULT false,
    "donorMessage" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ota_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ota_reports" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "totalTarget" DECIMAL(65,30) NOT NULL,
    "totalCollected" DECIMAL(65,30) NOT NULL,
    "totalDistributed" DECIMAL(65,30) NOT NULL,
    "totalPending" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalOrphans" INTEGER NOT NULL,
    "fullyFundedCount" INTEGER NOT NULL DEFAULT 0,
    "partialFundedCount" INTEGER NOT NULL DEFAULT 0,
    "unfundedCount" INTEGER NOT NULL DEFAULT 0,
    "totalDonors" INTEGER NOT NULL DEFAULT 0,
    "newDonors" INTEGER NOT NULL DEFAULT 0,
    "recurringDonors" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL DEFAULT '{}',
    "carryOverAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "surplusAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "distributedBy" TEXT,
    "distributionNotes" TEXT,
    "reportFileUrl" TEXT,
    "proofFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ota_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppdb_registrations" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "religion" TEXT NOT NULL DEFAULT 'ISLAM',
    "nationality" TEXT NOT NULL DEFAULT 'INDONESIA',
    "nik" TEXT,
    "nisn" TEXT,
    "birthCertNo" TEXT,
    "familyCardNo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "rt" TEXT,
    "rw" TEXT,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "previousSchool" TEXT,
    "previousGrade" TEXT,
    "previousNISN" TEXT,
    "graduationYear" INTEGER,
    "fatherName" TEXT NOT NULL,
    "fatherNIK" TEXT,
    "fatherBirth" TIMESTAMP(3),
    "fatherEducation" TEXT,
    "fatherOccupation" TEXT,
    "fatherPhone" TEXT,
    "fatherIncome" DECIMAL(65,30),
    "motherName" TEXT NOT NULL,
    "motherNIK" TEXT,
    "motherBirth" TIMESTAMP(3),
    "motherEducation" TEXT,
    "motherOccupation" TEXT,
    "motherPhone" TEXT,
    "motherIncome" DECIMAL(65,30),
    "guardianName" TEXT,
    "guardianNIK" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "guardianAddress" TEXT,
    "hasSpecialNeeds" BOOLEAN NOT NULL DEFAULT false,
    "specialNeeds" TEXT,
    "healthConditions" TEXT,
    "allergies" TEXT,
    "documents" TEXT NOT NULL DEFAULT '[]',
    "photoUrl" TEXT,
    "birthCertUrl" TEXT,
    "familyCardUrl" TEXT,
    "transcriptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "testSchedule" TIMESTAMP(3),
    "testScore" DECIMAL(65,30),
    "testNotes" TEXT,
    "interviewSchedule" TIMESTAMP(3),
    "interviewScore" DECIMAL(65,30),
    "interviewNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "acceptanceNo" TEXT,
    "enrolledAt" TIMESTAMP(3),
    "studentId" TEXT,
    "registrationFee" DECIMAL(65,30),
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentProof" TEXT,
    "internalNotes" TEXT,
    "publicNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppdb_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppdb_activities" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppdb_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppdb_settings" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "openDate" TIMESTAMP(3) NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "quotaTK" INTEGER NOT NULL DEFAULT 30,
    "quotaSD" INTEGER NOT NULL DEFAULT 60,
    "quotaSMP" INTEGER NOT NULL DEFAULT 40,
    "quotaPondok" INTEGER NOT NULL DEFAULT 50,
    "registrationFeeTK" DECIMAL(65,30) NOT NULL DEFAULT 100000,
    "registrationFeeSD" DECIMAL(65,30) NOT NULL DEFAULT 150000,
    "registrationFeeSMP" DECIMAL(65,30) NOT NULL DEFAULT 200000,
    "registrationFeePondok" DECIMAL(65,30) NOT NULL DEFAULT 250000,
    "testEnabled" BOOLEAN NOT NULL DEFAULT true,
    "testPassScore" DECIMAL(65,30) NOT NULL DEFAULT 60,
    "interviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "interviewPassScore" DECIMAL(65,30) NOT NULL DEFAULT 70,
    "requiredDocs" TEXT NOT NULL DEFAULT '[]',
    "acceptanceTemplate" TEXT,
    "rejectionTemplate" TEXT,
    "lastRegistrationNo" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppdb_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_billings" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "sppAmount" DECIMAL(65,30) NOT NULL,
    "booksFee" DECIMAL(65,30),
    "uniformFee" DECIMAL(65,30),
    "activityFee" DECIMAL(65,30),
    "examFee" DECIMAL(65,30),
    "otherFees" TEXT NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountReason" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "lateFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_payments" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "billingId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNo" TEXT,
    "accountName" TEXT,
    "proofUrl" TEXT,
    "externalId" TEXT,
    "vaNumber" TEXT,
    "paymentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "receiptNo" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_reminders" (
    "id" TEXT NOT NULL,
    "billingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_settings" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "monthlyFee" DECIMAL(65,30) NOT NULL,
    "enrollmentFee" DECIMAL(65,30),
    "reEnrollmentFee" DECIMAL(65,30),
    "developmentFee" DECIMAL(65,30),
    "booksFee" DECIMAL(65,30),
    "uniformFee" DECIMAL(65,30),
    "activityFee" DECIMAL(65,30),
    "examFee" DECIMAL(65,30),
    "dueDateDay" INTEGER NOT NULL DEFAULT 10,
    "lateFeeType" TEXT NOT NULL DEFAULT 'FIXED',
    "lateFeeAmount" DECIMAL(65,30) NOT NULL DEFAULT 10000,
    "maxLateDays" INTEGER NOT NULL DEFAULT 30,
    "discountSibling" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "discountOrphan" DECIMAL(65,30) NOT NULL DEFAULT 50,
    "discountStaff" DECIMAL(65,30) NOT NULL DEFAULT 25,
    "reminderDays" TEXT NOT NULL DEFAULT '[7, 3, 1, -1, -3, -7]',
    "reminderChannels" TEXT NOT NULL DEFAULT '["WHATSAPP"]',
    "billTemplate" TEXT,
    "receiptTemplate" TEXT,
    "reminderTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spp_reports" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "data" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "excelUrl" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spp_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" TEXT,
    "managerName" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_unit_reports" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "initialCapital" DECIMAL(65,30) NOT NULL,
    "revenue" DECIMAL(65,30) NOT NULL,
    "expenses" DECIMAL(65,30) NOT NULL,
    "purchaseCost" DECIMAL(65,30) NOT NULL,
    "operationalCost" DECIMAL(65,30) NOT NULL,
    "salaryCost" DECIMAL(65,30) NOT NULL,
    "maintenanceCost" DECIMAL(65,30) NOT NULL,
    "otherCost" DECIMAL(65,30) NOT NULL,
    "salesRevenue" DECIMAL(65,30) NOT NULL,
    "serviceRevenue" DECIMAL(65,30) NOT NULL,
    "otherRevenue" DECIMAL(65,30) NOT NULL,
    "grossProfit" DECIMAL(65,30) NOT NULL,
    "netProfit" DECIMAL(65,30) NOT NULL,
    "profitMargin" DECIMAL(65,30) NOT NULL,
    "inventoryValue" DECIMAL(65,30),
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "revenueTarget" DECIMAL(65,30),
    "targetAchievement" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,
    "highlights" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_unit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_transactions" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "customerName" TEXT,
    "supplierName" TEXT,
    "items" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "receiptNo" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "smsOtp" TEXT,
    "smsOtpExpiresAt" TIMESTAMP(3),
    "smsAttempts" INTEGER NOT NULL DEFAULT 0,
    "totpAttempts" INTEGER NOT NULL DEFAULT 0,
    "totpAttemptsResetAt" TIMESTAMP(3),
    "smsAttemptsResetAt" TIMESTAMP(3),
    "backupAttempts" INTEGER NOT NULL DEFAULT 0,
    "backupAttemptsResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT NOT NULL DEFAULT 'unknown',
    "userAgent" TEXT NOT NULL DEFAULT 'unknown',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "askerName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "ustadzId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_page_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Pondok Imam Syafii',
    "siteDescription" TEXT,
    "siteKeywords" TEXT NOT NULL DEFAULT '[]',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "socialMedia" TEXT NOT NULL DEFAULT '{}',
    "enableHeroSection" BOOLEAN NOT NULL DEFAULT true,
    "enableAboutSection" BOOLEAN NOT NULL DEFAULT true,
    "enableProgramsSection" BOOLEAN NOT NULL DEFAULT true,
    "enableGallerySection" BOOLEAN NOT NULL DEFAULT true,
    "enableNewsSection" BOOLEAN NOT NULL DEFAULT true,
    "enableTestimonials" BOOLEAN NOT NULL DEFAULT true,
    "enableContactSection" BOOLEAN NOT NULL DEFAULT true,
    "enableFacilities" BOOLEAN NOT NULL DEFAULT true,
    "enableStatistics" BOOLEAN NOT NULL DEFAULT true,
    "enableTeachersSection" BOOLEAN NOT NULL DEFAULT true,
    "enableActivitiesSection" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT NOT NULL DEFAULT '[]',
    "openGraphTitle" TEXT,
    "openGraphDescription" TEXT,
    "openGraphImage" TEXT,
    "twitterCard" TEXT,
    "canonicalUrl" TEXT,
    "robotsConfig" TEXT NOT NULL DEFAULT 'index, follow',
    "structuredData" TEXT NOT NULL DEFAULT '{}',
    "customCSS" TEXT,
    "customJS" TEXT,
    "headerScripts" TEXT,
    "footerScripts" TEXT,
    "googleAnalyticsId" TEXT,
    "facebookPixelId" TEXT,
    "layoutStyle" TEXT NOT NULL DEFAULT 'DEFAULT',
    "headerStyle" TEXT NOT NULL DEFAULT 'DEFAULT',
    "footerStyle" TEXT NOT NULL DEFAULT 'DEFAULT',
    "navbarTransparent" BOOLEAN NOT NULL DEFAULT false,
    "stickyNavbar" BOOLEAN NOT NULL DEFAULT true,
    "showBreadcrumbs" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "lastPublishedBy" TEXT,
    "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "themePresetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#10b981',
    "secondaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "backgroundLight" TEXT NOT NULL DEFAULT '#ffffff',
    "backgroundDark" TEXT NOT NULL DEFAULT '#f8fafc',
    "textPrimary" TEXT NOT NULL DEFAULT '#1f2937',
    "textSecondary" TEXT NOT NULL DEFAULT '#6b7280',
    "textMuted" TEXT NOT NULL DEFAULT '#9ca3af',
    "enableGradients" BOOLEAN NOT NULL DEFAULT true,
    "heroGradientStart" TEXT NOT NULL DEFAULT '#10b981',
    "heroGradientEnd" TEXT NOT NULL DEFAULT '#3b82f6',
    "cardGradientStart" TEXT,
    "cardGradientEnd" TEXT,
    "buttonGradientStart" TEXT,
    "buttonGradientEnd" TEXT,
    "gradientDirection" TEXT NOT NULL DEFAULT 'to bottom right',
    "gradientOpacity" DECIMAL(65,30) NOT NULL DEFAULT 0.9,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "headingFont" TEXT,
    "bodyFont" TEXT,
    "fontSize" TEXT NOT NULL DEFAULT '16',
    "headingWeight" TEXT NOT NULL DEFAULT '600',
    "bodyWeight" TEXT NOT NULL DEFAULT '400',
    "lineHeight" TEXT NOT NULL DEFAULT '1.6',
    "containerMaxWidth" TEXT NOT NULL DEFAULT '1200px',
    "sectionPadding" TEXT NOT NULL DEFAULT '4rem',
    "cardRadius" TEXT NOT NULL DEFAULT '0.75rem',
    "buttonRadius" TEXT NOT NULL DEFAULT '0.5rem',
    "borderWidth" TEXT NOT NULL DEFAULT '1px',
    "shadowLight" TEXT NOT NULL DEFAULT '0 1px 3px rgba(0,0,0,0.1)',
    "shadowMedium" TEXT NOT NULL DEFAULT '0 4px 6px rgba(0,0,0,0.1)',
    "shadowHeavy" TEXT NOT NULL DEFAULT '0 10px 25px rgba(0,0,0,0.15)',
    "blurRadius" TEXT NOT NULL DEFAULT '8px',
    "enableAnimations" BOOLEAN NOT NULL DEFAULT true,
    "animationDuration" TEXT NOT NULL DEFAULT '0.3s',
    "animationEasing" TEXT NOT NULL DEFAULT 'ease-out',
    "hoverTransform" TEXT NOT NULL DEFAULT 'translateY(-2px)',
    "navbarBackground" TEXT,
    "navbarTextColor" TEXT,
    "footerBackground" TEXT,
    "footerTextColor" TEXT,
    "cardBackground" TEXT,
    "cardTextColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" TEXT NOT NULL,
    "pageConfigId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "blockKey" TEXT NOT NULL,
    "blockName" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "videoUrl" TEXT,
    "linkUrl" TEXT,
    "linkText" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "richContent" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "customData" TEXT NOT NULL DEFAULT '{}',
    "layout" TEXT NOT NULL DEFAULT 'default',
    "alignment" TEXT NOT NULL DEFAULT 'left',
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "overlayColor" TEXT,
    "overlayOpacity" DECIMAL(65,30) NOT NULL DEFAULT 0.5,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "showTitle" BOOLEAN NOT NULL DEFAULT true,
    "showSubtitle" BOOLEAN NOT NULL DEFAULT true,
    "showImage" BOOLEAN NOT NULL DEFAULT true,
    "showButton" BOOLEAN NOT NULL DEFAULT true,
    "hideOnMobile" BOOLEAN NOT NULL DEFAULT false,
    "hideOnTablet" BOOLEAN NOT NULL DEFAULT false,
    "hideOnDesktop" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigations" (
    "id" TEXT NOT NULL,
    "pageConfigId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "highlightColor" TEXT,
    "menuType" TEXT NOT NULL DEFAULT 'header',
    "requireAuth" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" TEXT NOT NULL DEFAULT '[]',
    "customCSS" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "pageConfigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "layoutType" TEXT NOT NULL DEFAULT 'grid',
    "itemsPerRow" INTEGER NOT NULL DEFAULT 3,
    "showTitles" BOOLEAN NOT NULL DEFAULT true,
    "showDescriptions" BOOLEAN NOT NULL DEFAULT false,
    "enableLightbox" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "imageAlt" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "videoUrl" TEXT,
    "videoPoster" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "dimensions" TEXT,
    "capturedAt" TIMESTAMP(3),
    "location" TEXT,
    "photographer" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sliders" (
    "id" TEXT NOT NULL,
    "pageConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL DEFAULT 'hero',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoPlay" BOOLEAN NOT NULL DEFAULT true,
    "autoPlayDelay" INTEGER NOT NULL DEFAULT 5000,
    "showDots" BOOLEAN NOT NULL DEFAULT true,
    "showArrows" BOOLEAN NOT NULL DEFAULT true,
    "showCaptions" BOOLEAN NOT NULL DEFAULT true,
    "infiniteLoop" BOOLEAN NOT NULL DEFAULT true,
    "transitionType" TEXT NOT NULL DEFAULT 'fade',
    "transitionDuration" INTEGER NOT NULL DEFAULT 500,
    "itemsPerSlide" INTEGER NOT NULL DEFAULT 1,
    "itemsPerSlideTablet" INTEGER NOT NULL DEFAULT 1,
    "itemsPerSlideMobile" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sliders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slider_items" (
    "id" TEXT NOT NULL,
    "sliderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "ctaStyle" TEXT NOT NULL DEFAULT 'primary',
    "secondaryCtaText" TEXT,
    "secondaryCtaUrl" TEXT,
    "textPosition" TEXT NOT NULL DEFAULT 'center',
    "textAlignment" TEXT NOT NULL DEFAULT 'center',
    "overlayColor" TEXT,
    "overlayOpacity" DECIMAL(65,30) NOT NULL DEFAULT 0.4,
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "animationIn" TEXT NOT NULL DEFAULT 'fadeIn',
    "animationOut" TEXT NOT NULL DEFAULT 'fadeOut',
    "animationDuration" INTEGER NOT NULL DEFAULT 1000,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slider_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_prefix_key" ON "tenants"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_userId_endpoint_key" ON "push_subscriptions"("userId", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_code_key" ON "financial_accounts"("code");

-- CreateIndex
CREATE INDEX "financial_accounts_type_isActive_idx" ON "financial_accounts"("type", "isActive");

-- CreateIndex
CREATE INDEX "financial_categories_type_isActive_idx" ON "financial_categories"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_name_type_key" ON "financial_categories"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionNo_key" ON "transactions"("transactionNo");

-- CreateIndex
CREATE INDEX "transactions_type_status_date_idx" ON "transactions"("type", "status", "date");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entryNo_key" ON "journal_entries"("entryNo");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_transactionId_key" ON "journal_entries"("transactionId");

-- CreateIndex
CREATE INDEX "journal_entries_status_date_idx" ON "journal_entries"("status", "date");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journalId_lineOrder_idx" ON "journal_entry_lines"("journalId", "lineOrder");

-- CreateIndex
CREATE INDEX "budgets_status_startDate_idx" ON "budgets"("status", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_budgetId_categoryId_key" ON "budget_items"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "financial_reports_type_period_startDate_idx" ON "financial_reports"("type", "period", "startDate");

-- CreateIndex
CREATE INDEX "audit_trails_tableName_recordId_idx" ON "audit_trails"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_trails_userId_timestamp_idx" ON "audit_trails"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "line_users_userId_key" ON "line_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "line_user_sessions_userId_key" ON "line_user_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "line_admins_lineUserId_key" ON "line_admins"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "line_admins_userId_key" ON "line_admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nip_key" ON "teachers"("nip");

-- CreateIndex
CREATE INDEX "teachers_institution_status_idx" ON "teachers"("institution", "status");

-- CreateIndex
CREATE INDEX "teachers_isUstadz_status_idx" ON "teachers"("isUstadz", "status");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "students_nis_key" ON "students"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "students_registrationId_key" ON "students"("registrationId");

-- CreateIndex
CREATE INDEX "students_institutionType_status_idx" ON "students"("institutionType", "status");

-- CreateIndex
CREATE INDEX "students_enrollmentYear_idx" ON "students"("enrollmentYear");

-- CreateIndex
CREATE INDEX "students_isOrphan_idx" ON "students"("isOrphan");

-- CreateIndex
CREATE INDEX "alumni_institutionType_graduationYear_idx" ON "alumni"("institutionType", "graduationYear");

-- CreateIndex
CREATE INDEX "alumni_generation_idx" ON "alumni"("generation");

-- CreateIndex
CREATE INDEX "alumni_availableForEvents_idx" ON "alumni"("availableForEvents");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registrationNo_key" ON "registrations"("registrationNo");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "registrations_level_idx" ON "registrations"("level");

-- CreateIndex
CREATE INDEX "registrations_paymentStatus_idx" ON "registrations"("paymentStatus");

-- CreateIndex
CREATE INDEX "registrations_testResult_idx" ON "registrations"("testResult");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentNo_key" ON "payments"("paymentNo");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_paymentType_idx" ON "payments"("paymentType");

-- CreateIndex
CREATE INDEX "payments_externalId_idx" ON "payments"("externalId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_categories_name_key" ON "donation_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "donation_campaigns_slug_key" ON "donation_campaigns"("slug");

-- CreateIndex
CREATE INDEX "donation_campaigns_status_isFeatured_idx" ON "donation_campaigns"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "donation_campaigns_categoryId_idx" ON "donation_campaigns"("categoryId");

-- CreateIndex
CREATE INDEX "donation_campaigns_endDate_idx" ON "donation_campaigns"("endDate");

-- CreateIndex
CREATE INDEX "campaign_updates_campaignId_createdAt_idx" ON "campaign_updates"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "donations_donationNo_key" ON "donations"("donationNo");

-- CreateIndex
CREATE INDEX "donations_paymentStatus_createdAt_idx" ON "donations"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "donations_campaignId_idx" ON "donations"("campaignId");

-- CreateIndex
CREATE INDEX "donations_categoryId_idx" ON "donations"("categoryId");

-- CreateIndex
CREATE INDEX "donations_donorEmail_idx" ON "donations"("donorEmail");

-- CreateIndex
CREATE INDEX "zakat_calculations_calculationType_createdAt_idx" ON "zakat_calculations"("calculationType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "donor_profiles_email_key" ON "donor_profiles"("email");

-- CreateIndex
CREATE INDEX "donor_profiles_email_idx" ON "donor_profiles"("email");

-- CreateIndex
CREATE INDEX "donor_profiles_isVerified_idx" ON "donor_profiles"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- CreateIndex
CREATE INDEX "product_categories_isActive_sortOrder_idx" ON "product_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_code_idx" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "products_location_isActive_idx" ON "products"("location", "isActive");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "inventory_productId_location_idx" ON "inventory"("productId", "location");

-- CreateIndex
CREATE INDEX "inventory_expiryDate_idx" ON "inventory"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_productId_location_batchNo_key" ON "inventory"("productId", "location", "batchNo");

-- CreateIndex
CREATE INDEX "inventory_transactions_productId_type_createdAt_idx" ON "inventory_transactions"("productId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_type_createdAt_idx" ON "inventory_transactions"("type", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_transactions_referenceId_idx" ON "inventory_transactions"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNo_key" ON "purchase_orders"("orderNo");

-- CreateIndex
CREATE INDEX "purchase_orders_status_orderDate_idx" ON "purchase_orders"("status", "orderDate");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_items_purchaseOrderId_productId_key" ON "purchase_order_items"("purchaseOrderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNo_key" ON "sales"("saleNo");

-- CreateIndex
CREATE INDEX "sales_saleDate_location_idx" ON "sales"("saleDate", "location");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_cashier_idx" ON "sales"("cashier");

-- CreateIndex
CREATE UNIQUE INDEX "sale_items_saleId_productId_key" ON "sale_items"("saleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "academic_years_isActive_idx" ON "academic_years"("isActive");

-- CreateIndex
CREATE INDEX "academic_years_startDate_endDate_idx" ON "academic_years"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "semesters_isActive_idx" ON "semesters"("isActive");

-- CreateIndex
CREATE INDEX "semesters_startDate_endDate_idx" ON "semesters"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_academicYearId_name_key" ON "semesters"("academicYearId", "name");

-- CreateIndex
CREATE INDEX "classes_grade_level_idx" ON "classes"("grade", "level");

-- CreateIndex
CREATE INDEX "classes_isActive_idx" ON "classes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "classes_academicYearId_name_key" ON "classes"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_level_category_idx" ON "subjects"("level", "category");

-- CreateIndex
CREATE INDEX "subjects_isActive_idx" ON "subjects"("isActive");

-- CreateIndex
CREATE INDEX "teacher_subjects_teacherId_semesterId_idx" ON "teacher_subjects"("teacherId", "semesterId");

-- CreateIndex
CREATE INDEX "teacher_subjects_subjectId_classId_idx" ON "teacher_subjects"("subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacherId_subjectId_classId_semesterId_key" ON "teacher_subjects"("teacherId", "subjectId", "classId", "semesterId");

-- CreateIndex
CREATE INDEX "student_classes_classId_status_idx" ON "student_classes"("classId", "status");

-- CreateIndex
CREATE INDEX "student_classes_academicYearId_idx" ON "student_classes"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_studentId_classId_academicYearId_key" ON "student_classes"("studentId", "classId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculums_code_key" ON "curriculums"("code");

-- CreateIndex
CREATE INDEX "curriculums_level_isActive_idx" ON "curriculums"("level", "isActive");

-- CreateIndex
CREATE INDEX "curriculum_subjects_curriculumId_grade_idx" ON "curriculum_subjects"("curriculumId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_subjects_curriculumId_subjectId_grade_key" ON "curriculum_subjects"("curriculumId", "subjectId", "grade");

-- CreateIndex
CREATE INDEX "grades_semesterId_subjectId_idx" ON "grades"("semesterId", "subjectId");

-- CreateIndex
CREATE INDEX "grades_studentId_semesterId_idx" ON "grades"("studentId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_studentId_subjectId_semesterId_key" ON "grades"("studentId", "subjectId", "semesterId");

-- CreateIndex
CREATE INDEX "attendances_date_classId_idx" ON "attendances"("date", "classId");

-- CreateIndex
CREATE INDEX "attendances_studentId_semesterId_idx" ON "attendances"("studentId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_classId_date_key" ON "attendances"("studentId", "classId", "date");

-- CreateIndex
CREATE INDEX "report_cards_semesterId_status_idx" ON "report_cards"("semesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_studentId_semesterId_key" ON "report_cards"("studentId", "semesterId");

-- CreateIndex
CREATE INDEX "schedules_teacherId_day_idx" ON "schedules"("teacherId", "day");

-- CreateIndex
CREATE INDEX "schedules_classId_day_idx" ON "schedules"("classId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_classId_day_startTime_key" ON "schedules"("classId", "day", "startTime");

-- CreateIndex
CREATE INDEX "exams_date_classId_idx" ON "exams"("date", "classId");

-- CreateIndex
CREATE INDEX "exams_subjectId_semesterId_idx" ON "exams"("subjectId", "semesterId");

-- CreateIndex
CREATE INDEX "exam_results_examId_idx" ON "exam_results"("examId");

-- CreateIndex
CREATE INDEX "exam_results_studentId_idx" ON "exam_results"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_examId_studentId_key" ON "exam_results"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_userId_key" ON "parent_accounts"("userId");

-- CreateIndex
CREATE INDEX "parent_accounts_userId_idx" ON "parent_accounts"("userId");

-- CreateIndex
CREATE INDEX "parent_students_studentId_idx" ON "parent_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_students_parentId_studentId_key" ON "parent_students"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "announcements_status_publishDate_idx" ON "announcements"("status", "publishDate");

-- CreateIndex
CREATE INDEX "announcements_targetAudience_priority_idx" ON "announcements"("targetAudience", "priority");

-- CreateIndex
CREATE INDEX "announcements_category_createdAt_idx" ON "announcements"("category", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_expiryDate_idx" ON "announcements"("expiryDate");

-- CreateIndex
CREATE INDEX "messages_senderId_sentAt_idx" ON "messages"("senderId", "sentAt");

-- CreateIndex
CREATE INDEX "messages_receiverId_isRead_idx" ON "messages"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "messages_parentMessageId_idx" ON "messages"("parentMessageId");

-- CreateIndex
CREATE INDEX "messages_status_priority_idx" ON "messages"("status", "priority");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "quran_surahs_number_key" ON "quran_surahs"("number");

-- CreateIndex
CREATE INDEX "quran_surahs_juz_number_idx" ON "quran_surahs"("juz", "number");

-- CreateIndex
CREATE INDEX "quran_surahs_type_idx" ON "quran_surahs"("type");

-- CreateIndex
CREATE INDEX "hafalan_records_studentId_date_idx" ON "hafalan_records"("studentId", "date");

-- CreateIndex
CREATE INDEX "hafalan_records_surahNumber_status_idx" ON "hafalan_records"("surahNumber", "status");

-- CreateIndex
CREATE INDEX "hafalan_records_teacherId_date_idx" ON "hafalan_records"("teacherId", "date");

-- CreateIndex
CREATE INDEX "hafalan_records_status_quality_idx" ON "hafalan_records"("status", "quality");

-- CreateIndex
CREATE UNIQUE INDEX "hafalan_progress_studentId_key" ON "hafalan_progress"("studentId");

-- CreateIndex
CREATE INDEX "hafalan_progress_level_idx" ON "hafalan_progress"("level");

-- CreateIndex
CREATE INDEX "hafalan_progress_totalSurah_totalAyat_idx" ON "hafalan_progress"("totalSurah", "totalAyat");

-- CreateIndex
CREATE INDEX "setoran_schedules_teacherId_dayOfWeek_idx" ON "setoran_schedules"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "setoran_schedules_dayOfWeek_time_idx" ON "setoran_schedules"("dayOfWeek", "time");

-- CreateIndex
CREATE UNIQUE INDEX "setoran_schedules_studentId_teacherId_dayOfWeek_time_key" ON "setoran_schedules"("studentId", "teacherId", "dayOfWeek", "time");

-- CreateIndex
CREATE INDEX "hafalan_targets_studentId_status_idx" ON "hafalan_targets"("studentId", "status");

-- CreateIndex
CREATE INDEX "hafalan_targets_targetDate_status_idx" ON "hafalan_targets"("targetDate", "status");

-- CreateIndex
CREATE INDEX "hafalan_targets_createdBy_idx" ON "hafalan_targets"("createdBy");

-- CreateIndex
CREATE INDEX "hafalan_achievements_studentId_type_idx" ON "hafalan_achievements"("studentId", "type");

-- CreateIndex
CREATE INDEX "hafalan_achievements_earnedAt_idx" ON "hafalan_achievements"("earnedAt");

-- CreateIndex
CREATE INDEX "hafalan_achievements_level_points_idx" ON "hafalan_achievements"("level", "points");

-- CreateIndex
CREATE INDEX "hafalan_sessions_studentId_sessionDate_idx" ON "hafalan_sessions"("studentId", "sessionDate");

-- CreateIndex
CREATE INDEX "hafalan_sessions_teacherId_sessionDate_idx" ON "hafalan_sessions"("teacherId", "sessionDate");

-- CreateIndex
CREATE INDEX "hafalan_sessions_type_sessionDate_idx" ON "hafalan_sessions"("type", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "bill_types_name_key" ON "bill_types"("name");

-- CreateIndex
CREATE INDEX "bill_types_category_isActive_idx" ON "bill_types"("category", "isActive");

-- CreateIndex
CREATE INDEX "bill_types_isRecurring_idx" ON "bill_types"("isRecurring");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNo_key" ON "bills"("billNo");

-- CreateIndex
CREATE INDEX "bills_studentId_status_idx" ON "bills"("studentId", "status");

-- CreateIndex
CREATE INDEX "bills_billTypeId_period_idx" ON "bills"("billTypeId", "period");

-- CreateIndex
CREATE INDEX "bills_status_dueDate_idx" ON "bills"("status", "dueDate");

-- CreateIndex
CREATE INDEX "bills_isOverdue_dueDate_idx" ON "bills"("isOverdue", "dueDate");

-- CreateIndex
CREATE INDEX "bills_period_billTypeId_idx" ON "bills"("period", "billTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_payments_paymentNo_key" ON "bill_payments"("paymentNo");

-- CreateIndex
CREATE INDEX "bill_payments_billId_paymentDate_idx" ON "bill_payments"("billId", "paymentDate");

-- CreateIndex
CREATE INDEX "bill_payments_method_verificationStatus_idx" ON "bill_payments"("method", "verificationStatus");

-- CreateIndex
CREATE INDEX "bill_payments_paymentDate_idx" ON "bill_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "bill_payments_verificationStatus_idx" ON "bill_payments"("verificationStatus");

-- CreateIndex
CREATE INDEX "payment_history_billId_createdAt_idx" ON "payment_history"("billId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_history_studentId_createdAt_idx" ON "payment_history"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_history_action_createdAt_idx" ON "payment_history"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_settings_key_key" ON "billing_settings"("key");

-- CreateIndex
CREATE INDEX "billing_settings_category_idx" ON "billing_settings"("category");

-- CreateIndex
CREATE INDEX "payment_reminders_billId_scheduledAt_idx" ON "payment_reminders"("billId", "scheduledAt");

-- CreateIndex
CREATE INDEX "payment_reminders_studentId_type_idx" ON "payment_reminders"("studentId", "type");

-- CreateIndex
CREATE INDEX "payment_reminders_status_scheduledAt_idx" ON "payment_reminders"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "payment_reminders_type_status_idx" ON "payment_reminders"("type", "status");

-- CreateIndex
CREATE INDEX "billing_reports_type_startDate_idx" ON "billing_reports"("type", "startDate");

-- CreateIndex
CREATE INDEX "billing_reports_generatedBy_createdAt_idx" ON "billing_reports"("generatedBy", "createdAt");

-- CreateIndex
CREATE INDEX "billing_reports_status_idx" ON "billing_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ota_programs_studentId_key" ON "ota_programs"("studentId");

-- CreateIndex
CREATE INDEX "ota_programs_isActive_displayOrder_idx" ON "ota_programs"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "ota_programs_currentMonth_idx" ON "ota_programs"("currentMonth");

-- CreateIndex
CREATE INDEX "ota_programs_monthlyProgress_idx" ON "ota_programs"("monthlyProgress");

-- CreateIndex
CREATE INDEX "ota_sponsors_programId_month_idx" ON "ota_sponsors"("programId", "month");

-- CreateIndex
CREATE INDEX "ota_sponsors_donorEmail_idx" ON "ota_sponsors"("donorEmail");

-- CreateIndex
CREATE INDEX "ota_sponsors_isPaid_verifiedAt_idx" ON "ota_sponsors"("isPaid", "verifiedAt");

-- CreateIndex
CREATE INDEX "ota_sponsors_paymentStatus_idx" ON "ota_sponsors"("paymentStatus");

-- CreateIndex
CREATE INDEX "ota_sponsors_month_isPaid_idx" ON "ota_sponsors"("month", "isPaid");

-- CreateIndex
CREATE INDEX "ota_reports_year_month_idx" ON "ota_reports"("year", "month");

-- CreateIndex
CREATE INDEX "ota_reports_status_createdAt_idx" ON "ota_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ota_reports_reportType_idx" ON "ota_reports"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "ota_reports_month_reportType_key" ON "ota_reports"("month", "reportType");

-- CreateIndex
CREATE UNIQUE INDEX "ppdb_registrations_registrationNo_key" ON "ppdb_registrations"("registrationNo");

-- CreateIndex
CREATE INDEX "ppdb_registrations_level_academicYear_status_idx" ON "ppdb_registrations"("level", "academicYear", "status");

-- CreateIndex
CREATE INDEX "ppdb_registrations_registrationNo_idx" ON "ppdb_registrations"("registrationNo");

-- CreateIndex
CREATE INDEX "ppdb_registrations_status_createdAt_idx" ON "ppdb_registrations"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ppdb_activities_registrationId_performedAt_idx" ON "ppdb_activities"("registrationId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ppdb_settings_academicYear_key" ON "ppdb_settings"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "spp_billings_billNo_key" ON "spp_billings"("billNo");

-- CreateIndex
CREATE INDEX "spp_billings_status_dueDate_idx" ON "spp_billings"("status", "dueDate");

-- CreateIndex
CREATE INDEX "spp_billings_studentId_year_month_idx" ON "spp_billings"("studentId", "year", "month");

-- CreateIndex
CREATE INDEX "spp_billings_classId_status_idx" ON "spp_billings"("classId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "spp_billings_studentId_month_year_key" ON "spp_billings"("studentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "spp_payments_paymentNo_key" ON "spp_payments"("paymentNo");

-- CreateIndex
CREATE INDEX "spp_payments_billingId_idx" ON "spp_payments"("billingId");

-- CreateIndex
CREATE INDEX "spp_payments_paymentDate_idx" ON "spp_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "spp_payments_status_idx" ON "spp_payments"("status");

-- CreateIndex
CREATE INDEX "spp_reminders_billingId_idx" ON "spp_reminders"("billingId");

-- CreateIndex
CREATE INDEX "spp_reminders_status_scheduledFor_idx" ON "spp_reminders"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "spp_settings_level_key" ON "spp_settings"("level");

-- CreateIndex
CREATE INDEX "spp_reports_reportType_period_idx" ON "spp_reports"("reportType", "period");

-- CreateIndex
CREATE INDEX "spp_reports_generatedBy_generatedAt_idx" ON "spp_reports"("generatedBy", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_code_key" ON "business_units"("code");

-- CreateIndex
CREATE INDEX "business_units_code_idx" ON "business_units"("code");

-- CreateIndex
CREATE INDEX "business_unit_reports_unitId_period_idx" ON "business_unit_reports"("unitId", "period");

-- CreateIndex
CREATE INDEX "business_unit_reports_status_idx" ON "business_unit_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_unit_reports_unitId_year_month_key" ON "business_unit_reports"("unitId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "business_transactions_transactionNo_key" ON "business_transactions"("transactionNo");

-- CreateIndex
CREATE INDEX "business_transactions_unitId_date_idx" ON "business_transactions"("unitId", "date");

-- CreateIndex
CREATE INDEX "business_transactions_type_idx" ON "business_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_verifications_userId_key" ON "two_factor_verifications"("userId");

-- CreateIndex
CREATE INDEX "security_audit_logs_userId_idx" ON "security_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "security_audit_logs_event_idx" ON "security_audit_logs"("event");

-- CreateIndex
CREATE INDEX "security_audit_logs_timestamp_idx" ON "security_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "questions_status_idx" ON "questions"("status");

-- CreateIndex
CREATE INDEX "questions_category_idx" ON "questions"("category");

-- CreateIndex
CREATE INDEX "questions_createdAt_idx" ON "questions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "answers_questionId_key" ON "answers"("questionId");

-- CreateIndex
CREATE INDEX "answers_ustadzId_idx" ON "answers"("ustadzId");

-- CreateIndex
CREATE INDEX "answers_createdAt_idx" ON "answers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_page_configs_tenantId_key" ON "public_page_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "public_page_configs_tenantSlug_key" ON "public_page_configs"("tenantSlug");

-- CreateIndex
CREATE INDEX "public_page_configs_tenantSlug_idx" ON "public_page_configs"("tenantSlug");

-- CreateIndex
CREATE INDEX "public_page_configs_isPublished_idx" ON "public_page_configs"("isPublished");

-- CreateIndex
CREATE INDEX "public_page_configs_updatedAt_idx" ON "public_page_configs"("updatedAt");

-- CreateIndex
CREATE INDEX "theme_presets_isActive_isDefault_idx" ON "theme_presets"("isActive", "isDefault");

-- CreateIndex
CREATE INDEX "content_blocks_pageConfigId_sectionType_idx" ON "content_blocks"("pageConfigId", "sectionType");

-- CreateIndex
CREATE INDEX "content_blocks_sectionType_isVisible_idx" ON "content_blocks"("sectionType", "isVisible");

-- CreateIndex
CREATE INDEX "content_blocks_sortOrder_idx" ON "content_blocks"("sortOrder");

-- CreateIndex
CREATE INDEX "content_blocks_status_publishedAt_idx" ON "content_blocks"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_pageConfigId_blockKey_key" ON "content_blocks"("pageConfigId", "blockKey");

-- CreateIndex
CREATE INDEX "navigations_pageConfigId_menuType_idx" ON "navigations"("pageConfigId", "menuType");

-- CreateIndex
CREATE INDEX "navigations_parentId_sortOrder_idx" ON "navigations"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "navigations_isVisible_menuType_idx" ON "navigations"("isVisible", "menuType");

-- CreateIndex
CREATE INDEX "galleries_pageConfigId_category_idx" ON "galleries"("pageConfigId", "category");

-- CreateIndex
CREATE INDEX "galleries_isVisible_isFeatured_idx" ON "galleries"("isVisible", "isFeatured");

-- CreateIndex
CREATE INDEX "galleries_sortOrder_idx" ON "galleries"("sortOrder");

-- CreateIndex
CREATE INDEX "gallery_items_galleryId_sortOrder_idx" ON "gallery_items"("galleryId", "sortOrder");

-- CreateIndex
CREATE INDEX "gallery_items_isVisible_idx" ON "gallery_items"("isVisible");

-- CreateIndex
CREATE INDEX "gallery_items_mediaType_idx" ON "gallery_items"("mediaType");

-- CreateIndex
CREATE INDEX "gallery_items_category_idx" ON "gallery_items"("category");

-- CreateIndex
CREATE INDEX "sliders_pageConfigId_location_idx" ON "sliders"("pageConfigId", "location");

-- CreateIndex
CREATE INDEX "sliders_isActive_idx" ON "sliders"("isActive");

-- CreateIndex
CREATE INDEX "slider_items_sliderId_sortOrder_idx" ON "slider_items"("sliderId", "sortOrder");

-- CreateIndex
CREATE INDEX "slider_items_isActive_idx" ON "slider_items"("isActive");

-- CreateIndex
CREATE INDEX "slider_items_publishedAt_expiresAt_idx" ON "slider_items"("publishedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_admins" ADD CONSTRAINT "line_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "donation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "donation_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "donation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "quran_surahs"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_progress" ADD CONSTRAINT "hafalan_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_schedules" ADD CONSTRAINT "setoran_schedules_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setoran_schedules" ADD CONSTRAINT "setoran_schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_targets" ADD CONSTRAINT "hafalan_targets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_targets" ADD CONSTRAINT "hafalan_targets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_targets" ADD CONSTRAINT "hafalan_targets_targetSurah_fkey" FOREIGN KEY ("targetSurah") REFERENCES "quran_surahs"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_achievements" ADD CONSTRAINT "hafalan_achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_sessions" ADD CONSTRAINT "hafalan_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_sessions" ADD CONSTRAINT "hafalan_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_billTypeId_fkey" FOREIGN KEY ("billTypeId") REFERENCES "bill_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "bill_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_programs" ADD CONSTRAINT "ota_programs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ota_sponsors" ADD CONSTRAINT "ota_sponsors_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ota_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppdb_registrations" ADD CONSTRAINT "ppdb_registrations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppdb_activities" ADD CONSTRAINT "ppdb_activities_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "ppdb_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_billings" ADD CONSTRAINT "spp_billings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_billings" ADD CONSTRAINT "spp_billings_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_billings" ADD CONSTRAINT "spp_billings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_payments" ADD CONSTRAINT "spp_payments_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "spp_billings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spp_reminders" ADD CONSTRAINT "spp_reminders_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "spp_billings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_unit_reports" ADD CONSTRAINT "business_unit_reports_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_transactions" ADD CONSTRAINT "business_transactions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_verifications" ADD CONSTRAINT "two_factor_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit_logs" ADD CONSTRAINT "security_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_ustadzId_fkey" FOREIGN KEY ("ustadzId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_page_configs" ADD CONSTRAINT "public_page_configs_themePresetId_fkey" FOREIGN KEY ("themePresetId") REFERENCES "theme_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_pageConfigId_fkey" FOREIGN KEY ("pageConfigId") REFERENCES "public_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigations" ADD CONSTRAINT "navigations_pageConfigId_fkey" FOREIGN KEY ("pageConfigId") REFERENCES "public_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigations" ADD CONSTRAINT "navigations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "navigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_pageConfigId_fkey" FOREIGN KEY ("pageConfigId") REFERENCES "public_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sliders" ADD CONSTRAINT "sliders_pageConfigId_fkey" FOREIGN KEY ("pageConfigId") REFERENCES "public_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slider_items" ADD CONSTRAINT "slider_items_sliderId_fkey" FOREIGN KEY ("sliderId") REFERENCES "sliders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
