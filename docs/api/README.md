# API Documentation

## Base URL

- Development: `http://localhost:3000/api`
- Staging: `https://api-staging.yogaapp.com/api`
- Production: `https://api.yogaapp.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Using Tokens

Include the access token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Yes | Get current user |
| PUT | `/users/me` | Yes | Update current user |
| GET | `/users/:id` | Admin | Get user by ID |
| GET | `/users` | Admin | List all users |

### Classes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/classes` | No | List classes |
| GET | `/classes/:id` | No | Get class details |
| POST | `/classes` | Teacher | Create class |
| PUT | `/classes/:id` | Teacher | Update class |
| DELETE | `/classes/:id` | Teacher | Delete class |

### Programs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/programs` | No | List programs |
| GET | `/programs/:id` | No | Get program details |
| POST | `/programs/:id/enroll` | Yes | Enroll in program |
| GET | `/programs/:id/progress` | Yes | Get enrollment progress |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | Yes | List user bookings |
| POST | `/bookings` | Yes | Create booking |
| DELETE | `/bookings/:id` | Yes | Cancel booking |

### Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Unified search |
| GET | `/search/trending` | No | Trending searches |
| GET | `/search/popular` | No | Popular content |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-intent` | Yes | Create payment intent |
| POST | `/payments/confirm` | Yes | Confirm payment |
| GET | `/payments/history` | Yes | Payment history |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | List notifications |
| PUT | `/notifications/:id/read` | Yes | Mark as read |
| POST | `/push/subscribe` | Yes | Subscribe to push |

## Query Parameters

### Pagination

```
?page=1&limit=20
```

### Filtering

```
?level=BEGINNER&category=YOGA
```

### Sorting

```
?sort=createdAt&order=desc
```

### Search

```
?q=morning+yoga
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 200 requests/minute
- Admin endpoints: 500 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Webhooks

The API supports webhooks for real-time event notifications.

See [Webhook Documentation](./webhooks.md) for details.

## SDKs

Official SDKs:
- [JavaScript/TypeScript](https://github.com/yoga-app/sdk-js)
- [Swift (iOS)](https://github.com/yoga-app/sdk-swift)
- [Kotlin (Android)](https://github.com/yoga-app/sdk-kotlin)
