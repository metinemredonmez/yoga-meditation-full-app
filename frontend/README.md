# Yoga Admin Dashboard

Modern admin dashboard for managing the Yoga platform. Built with Next.js 15, React 19, and Tailwind CSS.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.2 | React framework |
| React | 19.0.0 | UI library |
| TypeScript | 5.7.2 | Type safety |
| Tailwind CSS | 4.0.0 | Styling |
| shadcn/ui | Latest | UI components |
| Zustand | 5.0.2 | State management |
| React Hook Form | 7.54.1 | Form handling |
| Zod | 4.1.8 | Schema validation |
| Axios | 1.13.2 | HTTP client |
| Recharts | 2.15.1 | Charts |
| Tabler Icons | 3.31.0 | Icons |

## Getting Started

### Prerequisites
- Node.js 18+
- Yarn
- Backend running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
yarn install

# Create environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3000" > .env.local

# Start development server
yarn dev
```

Frontend runs on `http://localhost:3001`

### Scripts

```bash
yarn dev        # Start development server
yarn build      # Build for production
yarn start      # Start production server
yarn lint       # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── auth/              # Auth pages (sign-in, sign-up, etc.)
│   └── dashboard/         # Admin dashboard pages
├── features/              # Feature modules (15 modules)
│   ├── analytics/
│   ├── auth/
│   ├── challenges/
│   ├── classes/
│   ├── financial/
│   ├── instructors/
│   ├── kanban/
│   ├── live-streams/
│   ├── moderation/
│   ├── overview/
│   ├── poses/
│   ├── programs/
│   ├── profile/
│   ├── settings/
│   └── users/
├── components/            # Shared components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/
│   ├── api.ts            # API client (88 endpoints)
│   └── auth.ts           # Token management
└── hooks/                 # Custom hooks
```

## Pages

### Auth Pages
| Page | URL | Status |
|------|-----|--------|
| Sign In | `/auth/sign-in` | ✅ |
| Sign Up | `/auth/sign-up` | ✅ |
| Forgot Password | `/auth/forgot-password` | ✅ |
| Reset Password | `/auth/reset-password` | ✅ |

### Dashboard Pages
| Page | URL | Status |
|------|-----|--------|
| Overview | `/dashboard/overview` | ✅ |
| Programs | `/dashboard/programs` | ✅ |
| Classes | `/dashboard/classes` | ✅ |
| Poses | `/dashboard/poses` | ✅ |
| Challenges | `/dashboard/challenges` | ✅ |
| Users | `/dashboard/users` | ✅ |
| Instructors | `/dashboard/instructors` | ✅ |
| Payments | `/dashboard/payments` | ✅ |
| Subscriptions | `/dashboard/subscriptions` | ✅ |
| Analytics | `/dashboard/analytics` | ✅ |
| Moderation | `/dashboard/moderation` | ✅ |
| Live Streams | `/dashboard/live-streams` | ✅ |
| Settings | `/dashboard/settings` | ✅ |
| Profile | `/dashboard/profile` | ✅ |

## API Integration

88 API endpoints in `src/lib/api.ts`:

- **Auth**: login, signup, password reset, profile
- **Users**: CRUD, ban, warn, role management
- **Content**: programs, classes, poses, challenges
- **Instructors**: approve, reject, payouts
- **Financial**: subscriptions, payments, coupons
- **Moderation**: reports, comments
- **Analytics**: users, revenue, content
- **Settings**: feature flags, i18n, CMS
- **Maintenance**: cache, backups, health

## Features Completed ✅

- [x] JWT Authentication
- [x] Dashboard overview with stats
- [x] Programs CRUD
- [x] Classes CRUD
- [x] Poses CRUD
- [x] Challenges CRUD
- [x] User management
- [x] Instructor management
- [x] Payment/subscription management
- [x] Content moderation
- [x] Live stream management
- [x] Analytics & exports
- [x] System settings
- [x] Profile management

## Missing Features 🔴

- [ ] Community/forums management
- [ ] Reviews/ratings
- [ ] Email template builder
- [ ] API key management
- [ ] Webhook configuration
- [ ] Audit logs page
- [ ] WebSocket real-time updates

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```
