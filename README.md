# TaskSync: Real-Time Collaborative Task Management API

A scalable, real-time task management API built with Node.js and TypeScript, featuring microservices architecture, WebSocket-based real-time updates, and Redis caching for optimal performance.

## Features

### Core Functionality

- **User Management**: JWT-based authentication with role-based access control (Admin, Member)
- **Task Management**: Complete CRUD operations for tasks with status tracking
- **Real-Time Updates**: WebSocket-powered instant notifications for task changes
- **Performance Optimization**: Redis caching with automatic invalidation
- **Microservices Architecture**: Three independent, scalable services

### Key Features

- Task creation, assignment, and status tracking (Pending → In Progress → Completed)
- Real-time task update broadcasting to all connected clients
- Redis pub/sub for inter-service messaging
- JWT authentication and protected routes
- Health check endpoints for monitoring
- Graceful shutdown handling
- Input validation with Zod schemas

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client/Frontend                           │
│            (HTTP API + WebSocket Connection)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         v               v               v
    ┌─────────┐    ┌─────────┐    ┌──────────────┐
    │  User   │    │  Task   │    │Notification  │
    │ Service │    │ Service │    │  Service     │
    │ :3003   │    │ :3002   │    │  :3001       │
    └────┬────┘    └────┬────┘    └────┬─────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ SQLite   │  │  Redis   │  │    Redis     │
    │ Database │  │  Cache   │  │   Pub/Sub    │
    └──────────┘  └──────────┘  └──────────────┘
```

### Data Flow

1. Client makes HTTP request to Task Service (e.g., `POST /tasks`)
2. Task Service writes to SQLite database
3. Task Service invalidates relevant Redis cache entries
4. Task Service publishes update to Redis pub/sub channel
5. Notification Service receives pub/sub message
6. Notification Service broadcasts update via Socket.IO to all connected clients

## Tech Stack

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.3

### Data Storage

- **Database**: SQLite (via better-sqlite3)
- **Caching**: Redis 5.8.3
- **Pub/Sub**: Redis

### Real-Time

- **WebSocket**: Socket.IO 4.8.1

### Authentication & Security

- **JWT**: jsonwebtoken
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

### Validation & Utilities

- **Schema Validation**: Zod 4.1.12
- **UUID**: uuid 13.0.0

### Monitoring & Logging

- **Logging**: Winston 3.14.2
- **Metrics**: prom-client 15.1.3

### Development Tools

- **Testing**: Jest 29.7.0
- **Linting**: ESLint 9.37.0
- **Formatting**: Prettier 3.6.2
- **Process Management**: concurrently

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Redis** >= 6.0.0 (for caching and pub/sub)
- **Docker** (optional, for containerized deployment)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd tasksync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Redis

**Option A: Using Docker**

```bash
docker run -d -p 6379:6379 --name redis redis:latest

```

**Option B: Local Installation**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL or Redis for Windows)
# Follow https://redis.io/docs/getting-started/installation/
```

### 4. Configure environment variables

Create a `.env` file in the root directory:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL for CORS (Socket.IO)
FRONTEND_URL=http://localhost:3000

# Cache Configuration (optional)
CACHE_TTL_SECONDS=60
```

### 5. Initialize the database

The database will be automatically created when you first start the services. A default admin user will be created:

- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin

## Usage

### Development Mode (Recommended)

Run all three services concurrently with auto-reload:

```bash
npm run start:dev
```

This will start:

- **User Service**: http://localhost:3003
- **Task Service**: http://localhost:3002
- **Notification Service**: http://localhost:3001

### Production Mode (Docker)

```bash
npm start
# or
docker-compose up --build
```

### Run Individual Services

```bash
# User Service only
npm run dev:user

# Task Service only
npm run dev:task

# Notification Service only
npm run dev:notification
```

### Verify Services are Running

Check health endpoints:

```bash
curl http://localhost:3003/health  # User Service
curl http://localhost:3002/health  # Task Service
curl http://localhost:3001/health  # Notification Service
```

## API Documentation

### User Service (Port 3003)

#### Authentication Endpoints

**Register New User**

```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "member"
}
```

**Login**

```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "member"
  }
}
```

**Get User Profile** (Protected)

```http
GET /users/profile
Authorization: Bearer <jwt-token>

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "member"
}
```

**List All Users**

```http
GET /users

Response:
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "member"
  }
]
```

### Task Service (Port 3002)

**Create Task**

```http
POST /tasks
Content-Type: application/json

{
  "title": "Implement feature X",
  "description": "Add new feature to the application",
  "status": "pending",
  "assignee": "user-id-uuid"
}

Response:
{
  "id": "task-uuid",
  "title": "Implement feature X",
  "description": "Add new feature to the application",
  "status": "pending",
  "assignee": "user-id-uuid",
  "comments": null
}
```

**Get All Tasks**

```http
GET /tasks

Response:
[
  {
    "id": "task-uuid",
    "title": "Implement feature X",
    "status": "in_progress",
    "assignee": "user-id-uuid"
  }
]
```

**Get Task by ID**

```http
GET /tasks/:id
```

**Update Task**

```http
PUT /tasks/:id
Content-Type: application/json

{
  "status": "completed",
  "comments": "Task completed successfully"
}
```

**Delete Task**

```http
DELETE /tasks/:id
```

### Notification Service (Port 3001)

**WebSocket Connection**

```javascript
import io from "socket.io-client"

const socket = io("http://localhost:3001", {
  withCredentials: true,
})

// Listen for task updates
socket.on("task-update", (data) => {
  console.log("Task updated:", data)
})

// Optional: Authenticate
socket.emit("authenticate", { token: "your-jwt-token" })
```

**Health Check**

```http
GET /health

Response:
{
  "online": true,
  "name": "Notification service",
  "socketio": true,
  "connections": 5
}
```

## Project Structure

```
tasksync/
├── services/
│   ├── user-service/              # User authentication & management
│   │   ├── src/
│   │   │   ├── index.ts          # Express app initialization
│   │   │   └── routes/
│   │   │       └── users.ts      # User endpoints
│   │   └── package.json
│   │
│   ├── task-service/              # Task CRUD operations
│   │   ├── src/
│   │   │   ├── index.ts          # Express app initialization
│   │   │   └── routes/
│   │   │       └── tasks.ts      # Task endpoints
│   │   └── package.json
│   │
│   └── notification-service/      # WebSocket server
│       ├── src/
│       │   └── index.ts          # Socket.IO + Redis subscriber
│       ├── public/
│       │   └── index.html        # WebSocket test client
│       └── package.json
│
├── shared/                        # Shared configurations
│   └── config/
│       ├── db.ts                 # SQLite database setup
│       ├── auth.ts               # JWT authentication
│       ├── redis.ts              # Redis cache client
│       ├── redisPublisher.ts     # Redis pub/sub publisher
│       ├── redisTask.ts          # Task caching utilities
│       └── dto.ts                # Data validation schemas
│
├── scripts/
│   ├── migrate-db.ts             # Database migration script
│   └── stress-test-tasks.ts      # Load testing script
│
├── mydbo2.db                      # SQLite database file
├── docker-compose.yml             # Docker orchestration
├── package.json                   # Root package.json
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member'))
);
```

### Tasks Table

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed')),
  assignee TEXT,
  comments TEXT,
  FOREIGN KEY (assignee) REFERENCES users(id) ON DELETE SET NULL
);
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:user
npm run test:task
npm run test:notification
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Build all services
npm run build
```

### Stress Testing

Test the API with high load (creates 1000 tasks):

```bash
npm run stress-test
```

### Docker Commands

```bash
# Build Docker images
npm run docker:build

# Start services with Docker Compose
npm start

# Stop all services
npm run docker:down
```

## Environment Variables

| Variable            | Description                         | Default                  |
| ------------------- | ----------------------------------- | ------------------------ |
| `REDIS_URL`         | Redis connection URL                | `redis://localhost:6379` |
| `JWT_SECRET`        | Secret key for JWT signing          | (required)               |
| `FRONTEND_URL`      | Frontend URL for CORS               | `http://localhost:3000`  |
| `CACHE_TTL_SECONDS` | Cache expiration time               | `60`                     |
| `TASK_SERVICE_URL`  | Task service endpoint (for scripts) | `http://localhost:3002`  |

## Monitoring & Health Checks

Each service exposes a `/health` endpoint for monitoring:

```bash
# Check all services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

**Metrics available** (via prom-client):

- Request latency
- Error rates
- Active connections (Socket.IO)
- Cache hit/miss ratios

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should respond with "PONG"

# Check Redis connection
redis-cli
> INFO
```

### Port Already in Use

```bash
# Find and kill process using port 3001, 3002, or 3003
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:3003 | xargs kill -9
```

### Database Issues

```bash
# Delete and recreate database
rm mydbo2.db
npm run migrate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- Open an issue on GitHub
- Email: support@tasksync.com
- Documentation: [Project Wiki](link-to-wiki)
