# Auth Service

Authentication service for the Vedda System using Node.js, Express, MongoDB, and JWT.

## Features

- User registration with validation
- User login with JWT tokens
- Password hashing with bcrypt
- Protected routes using JWT middleware
- User profile management
- Token verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
- PORT: Service port (default: 5001)
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: Secret key for JWT tokens
- JWT_EXPIRE: Token expiration time (default: 7d)

3. Start the service:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/register` - Register a new user
  - Body: `{ username, email, password }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`

### Protected Endpoints (Require Bearer Token)

- `GET /api/auth/profile` - Get user profile
  - Headers: `Authorization: Bearer <token>`
  
- `PUT /api/auth/profile` - Update user profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ username?, email? }`
  
- `POST /api/auth/verify` - Verify token validity
  - Headers: `Authorization: Bearer <token>`

### Health Check

- `GET /health` - Service health status

## Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "success": true/false,
  "message": "Description",
  "data": { ... }
}
```

## Error Handling

The service handles various error types:
- Validation errors (400)
- Authentication errors (401)
- Not found errors (404)
- Server errors (500)
