# UX Research Tool

Self-hosted, open-source UX research platform for conducting:
- **Card Sorting** - Understand how users categorize content
- **Tree Testing** - Validate your information architecture
- **First-Click Testing** - See where users click on your designs

## Features

- 🎯 Three study types in one platform
- 🔐 Simple admin authentication
- 📊 Built-in results dashboard with exports (CSV/JSON)
- 🗺️ Heatmap visualization for click data
- 🐳 Docker-ready for easy deployment
- 🌙 Dark mode support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (or Docker)
- npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd ux-research-tool
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and admin credentials
```

4. Start PostgreSQL (using Docker):
```bash
docker compose up -d
```

5. Initialize the database:
```bash
npm run db:push
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | - |
| `ADMIN_EMAIL` | Admin login email | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed admin user
- `npm run db:studio` - Open Prisma Studio

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Flowbite React + Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Drag & Drop**: @dnd-kit

## License

MIT
