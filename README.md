# TaskSync: Real-Time Collaborative Task Management API

A scalable, real-time task management API built with Node.js and TypeScript, featuring microservices architecture, WebSocket-based real-time updates, and Redis caching for optimal performance.



https://github.com/user-attachments/assets/312838bd-f77b-4eab-8b15-f2ca13ac0fa7



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

### Real-Time

- **WebSocket**: Socket.IO 4.8.1

### Authentication & Security

- **JWT**: jsonwebtoken
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

### Development Tools

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Redis** >= 6.0.0 (for caching and pub/sub)
- **Docker** (optional, for containerized deployment)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Tchoukoualeu/tasksync.git
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

## Development

### Stress Testing

Test the API with high load (creates 1000 tasks):

```bash
npm run stress-test
```

## Environment Variables

| Variable            | Description                         | Default                  |
| ------------------- | ----------------------------------- | ------------------------ |
| `REDIS_URL`         | Redis connection URL                | `redis://localhost:6379` |
| `JWT_SECRET`        | Secret key for JWT signing          | (required)               |
| `FRONTEND_URL`      | Frontend URL for CORS               | `http://localhost:3000`  |
| `CACHE_TTL_SECONDS` | Cache expiration time               | `60`                     |
| `TASK_SERVICE_URL`  | Task service endpoint (for scripts) | `http://localhost:3002`  |
