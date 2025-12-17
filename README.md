# Yoga App Backend

A comprehensive Express + TypeScript + Prisma backend for a yoga studio management application.

## Features

### Authentication & Users
- JWT-based authentication
- User registration and login
- Password hashing with bcrypt
- Admin role support

### Classes & Instructors
- Yoga class management (title, level, tags, pricing)
- Instructor profiles with bio, certifications, experience
- Class search and filtering by level, instructor, price, tags
- Favorites system for users

### Bookings & Scheduling
- Class scheduling system
- Booking creation and cancellation
- Capacity management
- Stub payment system

### Admin Features
- Full CRUD operations for instructors
- Class and schedule management
- Admin-only endpoints with role-based access

### Technical Features
- RESTful API design
- Comprehensive input validation with Zod
- Database migrations and seeding
- Health check endpoint
- Docker support
- Comprehensive test suite

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod
- **Testing**: Vitest + Supertest
- **Containerization**: Docker

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and navigate to the project**
```bash
git clone <repository-url>
cd yoga-app-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
npm run db:setup
```
This will:
- Run Prisma migrations to create tables
- Seed the database with sample data

5. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (authenticated)

### Classes
- `GET /api/classes` - List classes (with filtering)
  - Query params: `level`, `instructorId`, `tags`, `minPrice`, `maxPrice`, `search`, `page`, `limit`
- `GET /api/classes/:id` - Get class details
- `GET /api/classes/favorites` - Get user's favorite classes (authenticated)
- `POST /api/classes/favorites` - Add class to favorites (authenticated)
- `DELETE /api/classes/favorites/:classId` - Remove from favorites (authenticated)

### Bookings
- `POST /api/bookings` - Create a booking (authenticated)
- `GET /api/bookings/my` - Get user's bookings (authenticated)
- `GET /api/bookings/:id` - Get booking details (authenticated)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (authenticated)

### Instructors
- `GET /api/instructors` - List all instructors
- `GET /api/instructors/:id` - Get instructor profile

### Admin (Admin only)
- `POST /api/admin/instructors` - Create instructor
- `PUT /api/admin/instructors/:id` - Update instructor
- `DELETE /api/admin/instructors/:id` - Delete instructor
- `POST /api/admin/classes` - Create class
- `PUT /api/admin/classes/:id` - Update class
- `DELETE /api/admin/classes/:id` - Delete class
- `POST /api/admin/schedules` - Create schedule
- `PUT /api/admin/schedules/:id` - Update schedule
- `DELETE /api/admin/schedules/:id` - Delete schedule

### Health Check
- `GET /api/health` - Health check endpoint

## Database Schema

### Models
- **User**: Authentication and user data
- **Instructor**: Yoga instructor profiles
- **Class**: Yoga class definitions
- **Schedule**: Class time slots
- **Booking**: User bookings for classes
- **Payment**: Stub payment records
- **Favorite**: User favorite classes

### Relationships
- Users can have many bookings and favorites
- Instructors can teach many classes
- Classes can have many schedules and be favorited by many users
- Schedules belong to classes and can have many bookings
- Bookings connect users to schedules and have payments

## Scripts

### Development
```bash
npm run dev          # Start development server with watch mode
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:setup     # Run migrations and seed
npm run db:reset     # Reset database and seed
npm run prisma:studio # Open Prisma Studio
```

### Testing
```bash
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Code Quality
```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run type-check  # Run TypeScript type checking
npm run ci          # Run all quality checks (type-check, lint, test)
```

### Docker
```bash
npm run docker:build    # Build Docker image
npm run docker:run      # Run container
npm run docker:compose  # Run with docker-compose
```

## Sample Data

The seed script creates:

**Test Users:**
- Admin: `admin@yoga.com` / `admin123`
- User 1: `john@example.com` / `user123`
- User 2: `jane@example.com` / `user123`

**Instructors:**
- Sarah Williams (Hatha/Vinyasa specialist)
- Michael Chen (Ashtanga/Power yoga specialist)
- Emma Johnson (Gentle yoga/meditation teacher)

**Classes:**
- Morning Flow (Intermediate Vinyasa)
- Gentle Hatha (Beginner-friendly)
- Power Yoga (Advanced Ashtanga)
- Yin Yoga (Beginner meditation)
- Hot Yoga (Intermediate heated)

**Schedules:**
- Morning Flow: Mon/Wed/Fri at 7:00 AM
- Gentle Hatha: Tue/Thu at 9:30 AM
- Power Yoga: Saturdays at 8:00 AM
- Yin Yoga: Sundays at 6:00 PM
- Hot Yoga: Tue/Thu at 6:00 PM

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Bcrypt
BCRYPT_ROUNDS=10
```

## Docker Deployment

### Using Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Using Docker directly
```bash
# Build image
docker build -t yoga-app-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prod.db" \
  -e JWT_SECRET="your-production-jwt-secret" \
  yoga-app-backend
```

## Project Structure

```
yoga-app-backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── src/
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── test/            # Test files
│   ├── types/           # TypeScript types & Zod schemas
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── package.json         # Dependencies and scripts
```

## API Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by signing up or logging in through the auth endpoints.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the quality checks: `npm run ci`
6. Submit a pull request

## License

MIT