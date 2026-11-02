# Connect InsightAI to Supabase: Beginner Step-by-Step Guide

This guide walks you through creating a Supabase project and preparing it for your InsightAI app. You don't need prior database experience.

## What We're Trying to Achieve

Currently, your InsightAI application works like this:

```text
InsightAI Dashboard
       |
       ▼
Upload CSV
       |
       ▼
Generate Dashboard
       |
       ▼
Refresh Browser
       |
       ▼
Dataset Disappears ❌
```

We want:

```text
InsightAI Dashboard
       |
       ▼
Upload CSV
       |
       ▼
Save Dataset
       |
       ▼
Supabase Database
       |
       ▼
Refresh Browser
       |
       ▼
Dataset Still Available ✅
```

For now, we'll focus on the first six setup steps. We won't change your dashboard code until the database connection is ready.

---

# Step 1: Create Your Supabase Account and Project

## 1.1 Open Supabase

Visit:

https://supabase.com

Click **Start your project** and sign up with GitHub or email. The free plan is sufficient for getting started.

## 1.2 Create a New Project

After logging in:

1. Open your Supabase dashboard.
2. Click **New Project**.
3. Select your organization.
4. Fill in the project details.

Suggested settings:

| Setting | What to Enter |
|---|---|
| Project Name | `insight-ai` |
| Database Password | Generate a strong password |
| Region | Choose the closest region |
| Pricing Plan | Free |

Save your database password somewhere secure. Click **Create new project** and wait for Supabase to finish setting up the database.

## 1.3 Confirm Your Project Is Ready

You should see your project dashboard. The sidebar includes sections such as:

- Table Editor
- SQL Editor
- Database
- Authentication
- Storage
- Project Settings

**Step 1 complete.**

---

# Step 2: Get Your Database Connection URL

Your Next.js application needs a connection string to communicate with Supabase.

## 2.1 Find the Connection Settings

Inside your Supabase project:

1. Look near the top of the dashboard.
2. Click **Connect**.
3. Find **Connection string**.
4. Choose **URI**.

A connection URL may look like this:

```text
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxx.supabase.co:5432/postgres
```

## 2.2 Choose a Connection Method

Supabase may show several connection methods:

- Direct connection
- Session pooler
- Transaction pooler

For local development, use the connection method recommended by the Supabase dashboard. If your Linux network doesn't support IPv6, the **Session pooler** may be suitable.

A Session pooler URL may look like:

```text
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

Use the exact hostname and username supplied by Supabase. Replace the password placeholder with your database password.

If your password contains special characters such as `@`, `#`, `/`, or `:`, those characters may need to be URL-encoded.

**Security:** Don't share your real connection string publicly or commit it to GitHub.

**Step 2 complete.**

---

# Step 3: Connect Supabase to VS Code

## 3.1 Open Your Project

In the VS Code terminal, navigate to your project folder:

```bash
cd ~/Projects/insight-ai
```

If your project is stored somewhere else, use its actual path.

## 3.2 Open or Create the `.env` File

In the VS Code Explorer, look for `.env` in the project root—the folder containing `package.json`.

If it doesn't exist, create a file named `.env` in that folder.

## 3.3 Add Your Database URLs

Add the following to `.env`:

```env
DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING"

DIRECT_URL="YOUR_SUPABASE_CONNECTION_STRING"
```

Replace both placeholders with the appropriate connection strings from Supabase. For this beginner setup, the same Session pooler connection string may be used for both if that matches the connection details Supabase provides.

## 3.4 Save the File

Press **Ctrl+S**.

## 3.5 Protect Your Password

Open `.gitignore` and make sure it includes:

```gitignore
.env
.env.*
!.env.example
```

This helps prevent your database credentials from being uploaded to GitHub.

**Step 3 complete.**

---

# Step 4: Install Prisma

Prisma helps your Next.js application communicate with PostgreSQL using TypeScript.

For example:

```typescript
const datasets = await prisma.dataset.findMany();
```

This retrieves saved datasets.

## 4.1 Confirm You're in the Project Folder

In the VS Code terminal, run:

```bash
pwd
```

The result should be similar to:

```text
/home/yourusername/Projects/insight-ai
```

## 4.2 Install Prisma

Run these commands in the terminal:

```bash
npm install @prisma/client
```

```bash
npm install -D prisma
```

Install the PostgreSQL adapter:

```bash
npm install @prisma/adapter-pg pg
```

Install PostgreSQL TypeScript definitions:

```bash
npm install -D @types/pg
```

## 4.3 Initialize Prisma

Run:

```bash
npx prisma init
```

After initialization, your project should contain files similar to these:

```text
insight-ai/
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── .env
├── src/
└── package.json
```

If Prisma tells you it is already initialized, don't initialize it again.

**Step 4 complete.**

---

# Step 5: Create Your Database Table

Prisma needs to know what information the database should store.

## 5.1 Open the Prisma Schema

In VS Code, open:

```text
prisma/schema.prisma
```

## 5.2 Replace Its Contents

Delete the existing code and paste:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Dataset {
  id          String   @id @default(cuid())

  name        String

  description String?

  rowCount    Int

  columnCount Int

  columns     Json

  rows        Json

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt
}
```

## 5.3 What This Table Stores

The `Dataset` table stores information about an uploaded dataset:

| Field | What It Stores |
|---|---|
| `id` | Unique dataset identifier |
| `name` | Dataset filename |
| `description` | Optional description |
| `rowCount` | Number of rows |
| `columnCount` | Number of columns |
| `columns` | Column information |
| `rows` | Actual CSV data |
| `createdAt` | Upload date |
| `updatedAt` | Last modification date |

For example, if you upload `sales-2026.csv`, the database can store its name, number of rows and columns, column information, CSV records, and upload date.

This JSON-based approach is suitable for a small MVP. Larger datasets will need a more scalable storage design.

## 5.4 Save the File

Press **Ctrl+S**.

**Step 5 complete.**

---

# Step 6: Connect Prisma to Supabase

## 6.1 Open Prisma Configuration

Open:

```text
prisma.config.ts
```

Replace its contents with:

```typescript
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

Save the file.

## 6.2 Validate Your Prisma Schema

In the VS Code terminal, run:

```bash
npx prisma validate
```

If the configuration is valid, you should see a message similar to:

```text
The schema at prisma/schema.prisma is valid 🚀
```

This checks the Prisma configuration and schema. It doesn't by itself prove that Supabase is reachable.

## 6.3 Create the Database Table

Run:

```bash
npx prisma migrate dev --name init
```

Prisma will connect to Supabase, read the schema, create a migration, and create the `Dataset` table in PostgreSQL.

## 6.4 Generate Prisma Client

Run:

```bash
npx prisma generate
```

This generates the TypeScript database client that your Next.js application will use.

## 6.5 Verify the Table in Supabase

Return to:

https://supabase.com/dashboard

Then:

1. Open your `insight-ai` project.
2. Click **Table Editor**.
3. Look for a table called `Dataset`.

The table will be empty because no datasets have been saved yet. That's expected.

**Step 6 complete.**

---

# What You Should Have Now

Your application is prepared to connect through Prisma to Supabase PostgreSQL:

```text
┌───────────────────────────┐
│         InsightAI         │
│                           │
│      Next.js + React      │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│          Prisma           │
│       Database ORM        │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│         Supabase          │
│       PostgreSQL          │
│       Dataset table       │
└───────────────────────────┘
```

The Save Dataset button isn't connected yet. That will be a later step.

## Checklist

Before moving forward, verify:

- [ ] Supabase project created.
- [ ] PostgreSQL connection URL copied.
- [ ] `.env` configured.
- [ ] Prisma installed.
- [ ] `schema.prisma` configured.
- [ ] `prisma.config.ts` configured.
- [ ] `npx prisma validate` succeeded.
- [ ] `npx prisma migrate dev --name init` succeeded.
- [ ] `Dataset` table is visible in Supabase.

## Next Step

Complete Steps 1–6. When you can see the `Dataset` table in Supabase, you can continue with connecting the Save Dataset button.

If a command produces an error, keep the error message but **don't share passwords or connection strings**.
