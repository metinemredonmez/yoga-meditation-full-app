# Yoga App Backend Documentation

## Overview

This is the backend API for the Yoga App - a comprehensive yoga and wellness platform.

## Quick Links

- [API Documentation](./api/README.md)
- [Developer Guide](./guides/developer-guide.md)
- [Architecture Overview](./architecture/README.md)
- [Deployment Guide](./guides/deployment.md)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Message Queue**: Bull (Redis-based)
- **Real-time**: Socket.IO
- **Auth**: JWT (Access + Refresh tokens)

## Features

### Core Features
- User authentication & authorization
- Class & program management
- Booking system
- Payment processing (Stripe, Iyzico)
- Push notifications (Firebase)

### Advanced Features
- Live streaming (Agora)
- Podcast module
- Gamification & achievements
- Community & social features
- Multi-language support (i18n)
- Admin dashboard
- CMS integration

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yoga-app/backend.git
cd backend

# Install dependencies
yarn install

# Setup environment
cp .env.example .env
# Edit .env with your configurations

# Generate Prisma client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# Seed database (optional)
yarn prisma:seed

# Start development server
yarn dev
```

## Environment Variables

See [.env.example](./.env.example) for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe API key

## API Documentation

Interactive API documentation is available at:
- Development: http://localhost:3000/api/docs
- Production: https://api.yogaapp.com/api/docs

## Testing

```bash
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Run specific test file
yarn test path/to/test.ts
```

## Deployment

See [Deployment Guide](./guides/deployment.md) for detailed instructions.

### Quick Deploy with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
