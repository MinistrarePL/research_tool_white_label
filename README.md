# UX Research Tool

Self-hosted, open-source UX research platform for conducting:
- **Card Sorting** - Understand how users categorize content (Open, Closed, Hybrid)
- **Tree Testing** - Validate your information architecture
- **First-Click Testing** - See where users click on your designs with heatmap visualization

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🎯 **Three study types** in one platform
- 🔐 Simple admin authentication (email/password)
- 📊 Built-in results dashboard with exports (CSV/JSON)
- 🗺️ Heatmap visualization for click data
- 🎨 Dark mode support
- 📱 Responsive design
- 🚀 Easy deployment (Netlify, Vercel, self-hosted)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling |
| **Flowbite React** | UI components |
| **Prisma ORM** | Database access |
| **SQLite** | Database (local development) |
| **NextAuth.js** | Authentication |
| **@dnd-kit** | Drag & drop functionality |
| **Konva.js** | Canvas/heatmap rendering |

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js 18+** (recommended: 20+)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/MinistrarePL/research_tool_white_label.git
cd research_tool_white_label
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

Or create `.env` manually with:
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters-long

# Admin credentials (used during seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

> 💡 Generate a secure secret: `openssl rand -base64 32`

4. **Initialize the database:**
```bash
npm run db:push      # Create database schema
npm run db:seed      # Create admin user
```

5. **Start the development server:**
```bash
npm run dev
```

6. **Open the app:**
- App: [http://localhost:3000](http://localhost:3000)
- Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)
- Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed admin user |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:migrate` | Run database migrations |

---

## Deployment to Netlify

### Option A: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MinistrarePL/research_tool_white_label)

### Option B: Manual Deployment

1. **Fork/clone this repository** to your GitHub account

2. **Set up external database** (SQLite doesn't work on serverless)
   
   Recommended providers (free tiers available):
   - [Turso](https://turso.tech/) - SQLite-compatible, edge-optimized
   - [Neon](https://neon.tech/) - PostgreSQL
   - [PlanetScale](https://planetscale.com/) - MySQL
   - [Supabase](https://supabase.com/) - PostgreSQL

3. **Update Prisma schema** for your database provider:

   For **PostgreSQL** (Neon/Supabase), edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

   For **MySQL** (PlanetScale):
   ```prisma
   datasource db {
     provider     = "mysql"
     url          = env("DATABASE_URL")
     relationMode = "prisma"
   }
   ```

   For **Turso** (LibSQL):
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("TURSO_DATABASE_URL")
   }
   ```

4. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

5. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

6. **Set environment variables** in Netlify dashboard (Site settings → Environment variables):
   ```
   DATABASE_URL=your-database-connection-string
   NEXTAUTH_URL=https://your-site.netlify.app
   NEXTAUTH_SECRET=your-secure-secret-key
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   ```

7. **Initialize database:**
   - Run locally with production DATABASE_URL:
   ```bash
   DATABASE_URL="your-production-db-url" npm run db:push
   DATABASE_URL="your-production-db-url" npm run db:seed
   ```

8. **Deploy!** Netlify will automatically build and deploy your site.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production only | Database connection string |
| `NEXTAUTH_URL` | Yes | Your app URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT encryption (min 32 chars) |
| `ADMIN_EMAIL` | No | Admin login email (default: `admin@example.com`) |
| `ADMIN_PASSWORD` | No | Admin login password (default: `admin123`) |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login)
│   ├── admin/             # Admin dashboard & study editor
│   ├── api/               # API routes
│   └── study/[id]/        # Public study page (for participants)
├── components/            # React components
│   ├── card-sorting/      # Card sorting study components
│   ├── tree-testing/      # Tree testing study components
│   └── first-click/       # First-click study components
├── lib/                   # Utilities (auth, prisma client)
└── types/                 # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Admin user seeder
```

---

## Usage Guide

### Creating a Study

1. Log in to admin panel (`/admin`)
2. Click "New Study"
3. Choose study type:
   - **Card Sorting**: Add cards and optionally categories
   - **Tree Testing**: Build navigation tree and add tasks
   - **First-Click**: Add tasks with screenshots
4. Configure study content in "Content" tab
5. Click "Activate" to start collecting responses
6. Share the study link with participants

### Collecting Results

- View results in "Results" tab
- Export data as CSV or JSON
- For First-Click: view heatmap overlay on images

---

## Customization

### Branding

Edit `src/app/layout.tsx` to change:
- App title and metadata
- Favicon

### Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.js` (if exists)
- Component styles: Flowbite theme customization

---

## Troubleshooting

### "Database does not exist"
```bash
npm run db:push
```

### "Admin user not found"
```bash
npm run db:seed
```

### "NEXTAUTH_SECRET missing"
Add to your `.env`:
```env
NEXTAUTH_SECRET=generate-a-32-char-secret-here
```

### Prisma Client issues
```bash
npx prisma generate
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- 🐛 [Report bugs](https://github.com/MinistrarePL/research_tool_white_label/issues)
- 💡 [Request features](https://github.com/MinistrarePL/research_tool_white_label/issues)
- ⭐ Star this repo if you find it useful!
