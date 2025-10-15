# TaskSync: Real-Time Collaborative Task Management API

## Project Overview

TaskSync is a scalable, real-time task management API built with Node.js, designed for teams to collaborate on tasks with features like task creation, assignment, status updates, and real-time notifications. The system uses a microservices architecture, WebSockets for real-time updates, and integrates with a modern tech stack.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB (for task and user data) + Redis (for caching and session management)
- **Real-Time**: Socket.IO for WebSocket-based real-time updates
- **Authentication**: JWT for secure API access
- **Message Queue**: RabbitMQ for handling task assignment notifications
- **Containerization**: Docker for service orchestration
- **Testing**: Jest for unit and integration tests
- **API Documentation**: Swagger/OpenAPI
- **Deployment**: Deployable to AWS ECS or Kubernetes (optional)

## Features

### User Management

- Register and authenticate users (JWT-based).
- Role-based access (Admin, Member).

### Task Management

- Create, update, delete, and assign tasks.
- Task status tracking (e.g., To Do, In Progress, Done).
- Task comments and history.

### Real-Time Collaboration

- Real-time task updates (e.g., when a task is assigned or updated).
- Notifications for task assignments and status changes.

### Microservices

- **User Service**: Manages user data and authentication.
- **Task Service**: Handles task CRUD operations.
- **Notification Service**: Manages real-time notifications and emails.

### Scalability

- Redis for caching frequently accessed data.
- RabbitMQ for asynchronous task processing (e.g., sending emails).

### Monitoring

- Integrate Winston for logging and Prometheus for metrics.

## Project Structure

```
tasksync-api/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── task-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── notification-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── sockets/
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── Dockerfile
├── shared/
│   ├── config/
│   ├── utils/
│   └── middleware/
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

## Implementation Steps

### Setup Project

- Initialize a Node.js project with `npm init`.
- Install dependencies: `express`, `mongoose`, `redis`, `socket.io`, `jsonwebtoken`, `amqplib`, `winston`, `prom-client`, `jest`, `swagger-ui-express`.
- Configure ESLint and Prettier for code quality.

### User Service

- Create a MongoDB schema for users (email, password, role).
- Implement JWT-based authentication (login/register endpoints).
- Add middleware for role-based access control.

### Task Service

- Create a MongoDB schema for tasks (title, description, status, assignee, comments).
- Implement CRUD endpoints for tasks.
- Use Redis to cache task lists for faster retrieval.

### Notification Service

- Set up Socket.IO for real-time task updates.
- Use RabbitMQ to queue notification tasks (e.g., send email on task assignment).
- Integrate a third-party email service (e.g., SendGrid) for notifications.

### Real-Time Features

- Use Socket.IO to broadcast task updates to relevant users.
- Implement a WebSocket event for task comments and status changes.

### Testing

- Write unit tests for controllers and services using Jest.
- Write integration tests for API endpoints.
- Mock MongoDB and Redis using `mongodb-memory-server` and `redis-mock`.

### API Documentation

- Use Swagger to document all endpoints.
- Host Swagger UI at `/api-docs`.

### Containerization

- Write Dockerfiles for each service.
- Use `docker-compose.yml` to orchestrate services (MongoDB, Redis, RabbitMQ, and Node.js services).

### Monitoring and Logging

- Use Winston for structured logging.
- Expose metrics (e.g., request latency, error rates) using Prometheus.

# Usage

To run the task-service, `docker run -d -p 6379:6379 --name redis redis:latest` make sure redis is running
