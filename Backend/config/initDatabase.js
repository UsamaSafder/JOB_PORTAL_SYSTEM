const { getPool } = require('./database');

// Ensure database exists (skip if already created)
async function ensureDatabaseExists() {
  console.log('✓ Database already exists, skipping creation');
  return true;
}

// Detect whether the existing tables have the old wrong-column schema and drop them so
// they will be recreated with the correct schema that the models expect.
async function dropTablesIfWrongSchema(pool) {
  // We check for a known column from the old schema that would not exist in the new one.
  // Old Candidates had 'firstName'; new one has 'FullName'.
  const check = await pool.request().query(`
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Candidates' AND COLUMN_NAME = 'firstName'
  `);

  if (check.recordset[0].cnt === 0) {
    // Already correct schema or table doesn't exist — nothing to do.
    return;
  }

  console.log('⚠ Detected old schema — dropping tables to recreate with correct column names...');

  // Drop in reverse FK dependency order.
  const drops = [
    'SystemLogs', 'Notifications', 'Interviews',
    'Applications', 'Jobs', 'Admins', 'Candidates', 'Companies', 'Users'
  ];

  for (const table of drops) {
    await pool.request().query(`
      IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE ${table};
    `);
    console.log(`  Dropped table: ${table}`);
  }
}

async function ensureCandidateProfileColumns(pool) {
  const columnsToAdd = [
    { name: 'Location', sql: 'NVARCHAR(255) NULL' },
    { name: 'Education', sql: 'NVARCHAR(255) NULL' },
    { name: 'Bio', sql: 'NVARCHAR(MAX) NULL' },
    { name: 'LinkedinUrl', sql: 'NVARCHAR(500) NULL' },
    { name: 'PortfolioUrl', sql: 'NVARCHAR(500) NULL' },
    { name: 'ProfilePicture', sql: 'NVARCHAR(500) NULL' }
  ];

  for (const column of columnsToAdd) {
    await pool.request().query(`
      IF COL_LENGTH('Candidates', '${column.name}') IS NULL
      BEGIN
        ALTER TABLE Candidates ADD ${column.name} ${column.sql};
      END
    `);
  }
}

// Create all tables with column names that match the model classes.
async function createTables() {
  try {
    const pool = await getPool();

    await dropTablesIfWrongSchema(pool);

    console.log('Creating database tables...');

    // ── Users ─────────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          id           INT IDENTITY(1,1) PRIMARY KEY,
          email        NVARCHAR(255) NOT NULL UNIQUE,
          password     NVARCHAR(255) NOT NULL,
          role         NVARCHAR(50)  NOT NULL CHECK (role IN ('admin', 'company', 'candidate')),
          isActive     BIT           DEFAULT 1,
          isVerified   BIT           DEFAULT 0,
          createdAt    DATETIME      DEFAULT GETDATE(),
          updatedAt    DATETIME      DEFAULT GETDATE()
        );
      END
    `);

    // ── Candidates ────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Candidates')
      BEGIN
        CREATE TABLE Candidates (
          CandidateID      INT IDENTITY(1,1) PRIMARY KEY,
          userId           INT           NOT NULL UNIQUE,
          FullName         NVARCHAR(500) NOT NULL,
          PhoneNumber      NVARCHAR(20)  NOT NULL,
          Skills           NVARCHAR(MAX),
          ExperienceYears  INT           DEFAULT 0,
          ResumeLink       NVARCHAR(500),
          Location         NVARCHAR(255),
          Education        NVARCHAR(255),
          Bio              NVARCHAR(MAX),
          LinkedinUrl      NVARCHAR(500),
          PortfolioUrl     NVARCHAR(500),
          ProfilePicture   NVARCHAR(500),
          CreatedAt        DATETIME      DEFAULT GETDATE(),
          UpdatedAt        DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
        );
      END
    `);

    await ensureCandidateProfileColumns(pool);

    // ── Companies ─────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
      BEGIN
        CREATE TABLE Companies (
          CompanyID    INT IDENTITY(1,1) PRIMARY KEY,
          userId       INT           NOT NULL UNIQUE,
          CompanyName  NVARCHAR(255) NOT NULL,
          PhoneNumber  NVARCHAR(20)  NOT NULL,
          Industry     NVARCHAR(100) NOT NULL,
          Location     NVARCHAR(255),
          Website      NVARCHAR(500),
          Description  NVARCHAR(MAX),
          Logo         NVARCHAR(500),
          IsVerified   BIT           DEFAULT 0,
          CreatedAt    DATETIME      DEFAULT GETDATE(),
          UpdatedAt    DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
        );
      END
    `);

    // ── Admins ────────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Admins')
      BEGIN
        CREATE TABLE Admins (
          AdminID      INT IDENTITY(1,1) PRIMARY KEY,
          userId       INT           NOT NULL UNIQUE,
          Username     NVARCHAR(100) NOT NULL UNIQUE,
          PhoneNumber  NVARCHAR(20),
          Department   NVARCHAR(100),
          CreatedAt    DATETIME      DEFAULT GETDATE(),
          UpdatedAt    DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
        );
      END
    `);

    // ── Jobs ──────────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Jobs')
      BEGIN
        CREATE TABLE Jobs (
          JobID            INT IDENTITY(1,1) PRIMARY KEY,
          CompanyID        INT           NOT NULL,
          Title            NVARCHAR(255) NOT NULL,
          Description      NVARCHAR(MAX),
          Requirements     NVARCHAR(MAX),
          Location         NVARCHAR(255),
          SalaryRange      NVARCHAR(100),
          EmploymentType   NVARCHAR(50),
          Deadline         DATETIME,
          IsActive         BIT           DEFAULT 1,
          CreatedAt        DATETIME      DEFAULT GETDATE(),
          UpdatedAt        DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID) ON DELETE CASCADE
        );
      END
    `);

    // ── Applications ──────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Applications')
      BEGIN
        CREATE TABLE Applications (
          ApplicationID  INT IDENTITY(1,1) PRIMARY KEY,
          JobID          INT          NOT NULL,
          CandidateID    INT          NOT NULL,
          CoverLetter    NVARCHAR(MAX),
          AppliedAt      DATETIME     DEFAULT GETDATE(),
          Status         NVARCHAR(50) DEFAULT 'pending' CHECK (Status IN ('pending', 'reviewed', 'shortlisted', 'accepted', 'rejected')),
          UpdatedAt      DATETIME     DEFAULT GETDATE(),
          FOREIGN KEY (JobID)       REFERENCES Jobs(JobID)             ON DELETE CASCADE,
          FOREIGN KEY (CandidateID) REFERENCES Candidates(CandidateID) ON DELETE NO ACTION,
          UNIQUE (JobID, CandidateID)
        );
      END
    `);

    // ── Interviews ────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Interviews')
      BEGIN
        CREATE TABLE Interviews (
          InterviewID      INT IDENTITY(1,1) PRIMARY KEY,
          ApplicationID    INT           NOT NULL,
          ScheduledDate    DATETIME      NOT NULL,
          Location         NVARCHAR(500),
          Mode             NVARCHAR(50)  DEFAULT 'in-person',
          InterviewerName  NVARCHAR(255),
          Notes            NVARCHAR(MAX),
          Status           NVARCHAR(50)  DEFAULT 'scheduled' CHECK (Status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
          CreatedAt        DATETIME      DEFAULT GETDATE(),
          UpdatedAt        DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID) ON DELETE CASCADE
        );
      END
    `);

    // ── Notifications ─────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
      BEGIN
        CREATE TABLE Notifications (
          NotificationID  INT IDENTITY(1,1) PRIMARY KEY,
          userId          INT           NOT NULL,
          Title           NVARCHAR(255) NOT NULL,
          Message         NVARCHAR(MAX),
          Type            NVARCHAR(50)  DEFAULT 'info',
          Link            NVARCHAR(500),
          IsRead          BIT           DEFAULT 0,
          CreatedAt       DATETIME      DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
        );
      END
    `);

    // ── SystemLogs ────────────────────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemLogs')
      BEGIN
        CREATE TABLE SystemLogs (
          LogID       INT IDENTITY(1,1) PRIMARY KEY,
          UserId      INT,
          Action      NVARCHAR(255) NOT NULL,
          Entity      NVARCHAR(100),
          EntityId    INT,
          Details     NVARCHAR(MAX),
          IpAddress   NVARCHAR(50),
          UserAgent   NVARCHAR(500),
          CreatedAt   DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL
        );
      END
    `);

    console.log('✓ All database tables are ready');

  } catch (error) {
    console.error('✗ Error creating tables:', error.message);
    throw error;
  }
}

module.exports = {
  ensureDatabaseExists,
  createTables
};