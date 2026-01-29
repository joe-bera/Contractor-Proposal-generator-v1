# AI Contractor Proposal Generator

AI-powered proposal and estimating platform for contractors. Generate accurate estimates, create compelling Good-Better-Best proposals, track job costs, and close more deals.

## Features

- **AI Voice Receptionist** - 24/7 lead capture and qualification via phone
- **AI Estimating Engine** - Generate estimates from photos, measurements, or scope descriptions
- **Good-Better-Best Proposals** - Psychology-optimized tiered pricing proposals
- **Digital Signatures & Payments** - Sign proposals and collect deposits online
- **Job Costing** - Track actual vs. estimated costs in real-time
- **Change Order Automation** - Detect and generate change orders automatically
- **Learning Loop** - Each completed job makes future estimates more accurate
- **GoHighLevel Integration** - Two-way sync with your CRM

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| AI/LLM | Anthropic Claude API |
| Auth | Clerk |
| Payments | Stripe |
| Voice AI | Retell AI / Synthflow |
| CRM | GoHighLevel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Docker (optional, for local database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/joe-bera/Contractor-Proposal-generator-v1.git
cd Contractor-Proposal-generator-v1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the database (using Docker):
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start development servers:
```bash
npm run dev
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

## Project Structure

```
├── frontend/          # Next.js 14 frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom hooks
│   │   ├── lib/       # Utilities
│   │   └── types/     # TypeScript types
│   └── package.json
│
├── backend/           # Express backend
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── prompts/   # AI prompts
│   │   ├── middleware/ # Auth, error handling
│   │   ├── integrations/ # Third-party APIs
│   │   └── db/        # Database client
│   ├── prisma/        # Database schema
│   └── package.json
│
├── shared/            # Shared types
├── docker-compose.yml # Local development
└── package.json       # Monorepo root
```

## API Endpoints

### Leads
- `POST /api/leads` - Create lead
- `GET /api/leads` - List leads (paginated)
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/convert` - Convert to project

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/:id/summary` - Financial summary

### Estimates
- `POST /api/projects/:id/estimates` - Create estimate
- `POST /api/projects/:id/estimates/ai-generate` - AI generate estimate

### Proposals
- `POST /api/projects/:id/proposals` - Create proposal
- `POST /api/projects/:id/proposals/ai-generate` - AI generate proposal
- `GET /api/proposals/:publicUrl` - Public proposal view
- `POST /api/proposals/:publicUrl/sign` - Sign proposal

### Job Costing
- `POST /api/projects/:id/time-entries` - Log time
- `POST /api/projects/:id/material-purchases` - Log purchase
- `GET /api/projects/:id/job-cost-report` - Get cost report

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude AI API key
- `CLERK_SECRET_KEY` - Clerk authentication
- `STRIPE_SECRET_KEY` - Stripe payments
- `GHL_API_KEY` - GoHighLevel CRM

## Development

### Running Tests
```bash
npm test
```

### Database Commands
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

### Building for Production
```bash
npm run build
```

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Backend (Railway)
1. Create Railway project
2. Add PostgreSQL addon
3. Deploy from repository

## License

Private - AI Biz Automate

## Support

For support, contact support@aibizautomate.com
