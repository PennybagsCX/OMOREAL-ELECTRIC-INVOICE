# Electrician Invoices

Estimate & invoice management for electricians.

## Features

- Client management
- Invoice creation and tracking
- Estimate creation with public links
- PDF generation
- QR code support
- Payment tracking
- Calendar feed integration
- Team management
- Responsive design (PWA)

## Tech Stack

- Next.js 15.0.0
- Supabase (authentication & database)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- @react-pdf/renderer

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/electrician-invoices.git
cd electrician-invoices

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev
```

### Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SETUP_TOKEN=your_secure_random_token_for_admin_setup
CALENDAR_FEED_TOKEN=your_secure_random_calendar_feed_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run migrations in Supabase SQL Editor:

```bash
# Copy contents of combined_migrations.sql
# Paste in Supabase SQL Editor
# Execute
```

### Create Admin User

```bash
# Option 1: Use the API endpoint (requires SETUP_TOKEN)
curl -X POST http://localhost:3000/api/setup-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-token: YOUR_SETUP_TOKEN" \
  -d '{"email":"admin@example.com","password":"secure_password"}'

# Option 2: Run setup script
pnpm run setup-admin
```

## Deployment

Deployed on Vercel: [Your Deployment URL]

## Security Notes

- API routes are protected with authentication
- Calendar feed requires secure token
- Admin setup requires SETUP_TOKEN
- Row Level Security (RLS) enabled on all database tables

## License

MIT
