import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import { createClient } from "redis"

// Notification service with Socket.IO

const port = 3001

const app = express()
const httpServer = createServer(app)

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Redis subscriber setup
const redisSubscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

redisSubscriber.on("error", (err) =>
  console.error("Redis Subscriber Error", err),
)

// Connect to Redis and subscribe to task updates
async function setupRedisSubscription() {
  try {
    await redisSubscriber.connect()
    console.log("✅ Redis subscriber connected")

    await redisSubscriber.subscribe("task-updates", (message) => {
      try {
        const data = JSON.parse(message)
        console.log("📢 Broadcasting task update:", data)

        // Emit to all connected clients
        io.emit("task-update", data)
      } catch (err) {
        console.error("Error processing task update message:", err)
      }
    })

    console.log("✅ Subscribed to task-updates channel")
  } catch (err) {
    console.error("❌ Failed to setup Redis subscription:", err)
  }
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`)
  })
})

// Express routes
app.use(cors())

// Serve static files from public directory
app.use(express.static("public"))

app.get("/", (_req, res) => {
  return res.sendFile("index.html", { root: "public" })
})

app.get("/health", (_req, res) => {
  return res.json({
    online: true,
    name: "Notification service",
    socketio: true,
    connections: io.engine.clientsCount,
  })
})

app.use((_req, res, next) => {
  const err = new Error("Not found")
  res.status(400)
  next(err)
})

app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status || 500)
  res.json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  })
})

// Start server and setup Redis subscription
httpServer.listen(port, () => {
  console.log(`🚀 Notification service listening at http://localhost:${port}`)
  console.log(`🔌 Socket.IO server ready`)
  setupRedisSubscription()
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing connections...")
  await redisSubscriber.quit()
  httpServer.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})
