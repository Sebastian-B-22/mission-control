# Mission Control - Life OS Dashboard

A NextJS + Convex web application for daily accountability, RPM (Results-Purpose-Massive Action) planning, and habit tracking using the High Performance Habits framework.

## Tech Stack

- **Frontend**: NextJS 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Deployment**: Vercel
- **Visualization**: Recharts

## Features

### Dashboard
- Two main tabs: PERSONAL | PROFESSIONAL
- RPM categories with yearly goals and monthly needle movers
- Clean, professional UI with gold/red accent colors

### Daily Check-Ins
**Morning Check-In:**
- What's your ONE THING today?
- One thing I can get excited about today
- Someone I could surprise with a note, gift, or sign of appreciation
- Today's top 3 priorities

**Evening Check-In:**
- Did ONE THING get done? (Y/N + reflection)
- A moment that I really appreciated today
- Something I learned or realized today
- Daily Habits Scorecard (1-5 rating):
  - CLARITY
  - PRODUCTIVITY
  - ENERGY
  - INFLUENCE
  - NECESSITY
  - COURAGE

### Habit Tracking
- Visualizations of daily scorecard trends
- ONE THING completion tracking
- Weekly/monthly summaries

### Weekly RPM View
- Review weekly wins
- Plan next week's priorities per RPM category
- Set top 3-5 focus areas

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone the Repository

```bash
git clone <repo-url>
cd mission-control
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project (or login to existing)
- Generate a `NEXT_PUBLIC_CONVEX_URL`
- Create the `convex/_generated` folder

Copy the Convex URL provided.

### 4. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Get your Clerk keys from the dashboard
3. Configure OAuth providers if desired (Google, GitHub, etc.)

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard
6. Deploy!

#### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

## Project Structure

```
mission-control/
├── app/
│   ├── dashboard/           # Main dashboard page
│   ├── sign-in/            # Clerk sign-in
│   ├── sign-up/            # Clerk sign-up
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── ConvexClientProvider.tsx
├── components/
│   └── ui/                 # shadcn/ui components
├── convex/
│   ├── schema.ts           # Database schema
│   ├── users.ts            # User functions
│   ├── rpm.ts              # RPM category functions
│   ├── checkIns.ts         # Daily check-in functions
│   └── habits.ts           # Habit tracking functions
├── lib/
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Data Schema

### Users
- id, clerkId, email, name, createdAt

### RPM Categories
- id, userId, name, type (personal/professional), yearlyGoals, monthlyFocus, order

### Daily Check-Ins
- id, userId, date, type (morning/evening), responses (JSON), completedAt

### Habit Scores
- id, userId, date, clarity, productivity, energy, influence, necessity, courage, completedAt

### Weekly RPM
- id, userId, weekStartDate, wins, priorities, focusAreas, completedAt

## Admin Credentials

For Corinne:
- Email: [To be configured during setup]
- Password: [To be set during first login via Clerk]

## Development Timeline

- **Friday Night (Feb 7)**: ✅ Initial scaffold + deployment ready
- **Saturday (Feb 8)**: Core dashboard with RPM categories, basic UI polished
- **Sunday (Feb 9 AM)**: Check-in forms functional, data saving to Convex
- **Sunday (Feb 9 PM)**: Habit tracking + visualization, final polish
- **Monday (Feb 10 AM)**: Production ready

## Success Criteria

- ✅ Morning check-in in <3 minutes
- ✅ Evening check-in in <5 minutes
- ✅ Dashboard loads fast (<2 seconds)
- ✅ Data persists correctly in Convex
- ✅ No bugs on core user flows
- ✅ Professional, empowering design

## Phase 2 Features (Deferred)

- Project-specific dashboards (HTA, Aspire, Homeschool)
- Marketing calendar management
- Global search across all data
- Document repository
- Conversation history archive
- Wheel of Life visualization
- Google Calendar integration

## Support

For issues or questions, contact the development team.

## License

Private project - All rights reserved.
