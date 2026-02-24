# King & Queen Voting App

Real-time voting app built with Next.js, Tailwind CSS, and Supabase.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and add your credentials
3. Run the migration in Supabase SQL Editor:
   - Open **SQL Editor** in your Supabase dashboard
   - Paste contents of `supabase/migrations/001_initial_schema.sql`
   - Run it
4. (Optional) Run `supabase/seed.sql` to add sample candidates
5. Enable Realtime for `votes` and `settings` tables in **Database → Replication**
6. **Reset Voting**: Run `supabase/RESET_SETUP.sql` in SQL Editor (required for Reset Voting button)

### 3. Run the app

```bash
npm run dev
```

- **User voting**: [http://localhost:3000/vote](http://localhost:3000/vote) (mobile-friendly)
- **Admin dashboard**: [http://localhost:3000/admin-secret](http://localhost:3000/admin-secret) (for projector)

## Features

- One vote for King and one vote for Queen per user (tracked via `voter_id` in localStorage)
- Admin-controlled countdown timer and voting session
- Real-time leaderboard updates via Supabase Realtime
- Winner reveal with confetti effect
- Luxury dark theme (Navy Blue & Royal Gold)
