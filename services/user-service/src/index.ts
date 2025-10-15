import express from "express"
import cors from "cors"
import { closeDB } from "../../../shared/config/db"
import { userRouter } from "./controllers/users"

// User service

const port = 3003

const app = express()

app.get("/", (_req, res) => {
  return res.redirect(`http://localhost:${port}/health`)
})
app.use(express.json())

app.get("/health", (_req, res) => {
  return res.json({ online: true, name: "User service" })
})

app.use("/users", userRouter)

app.use((_req, res, next) => {
  const err = new Error("Not found")

  res.status(400)

  next(err)
})

app.use((err, _req, res, _next) => {
  res.status(err.status || 500)

  res.json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  })
})

app.use(cors)

const server = app.listen(port, () => {
  return console.log(`App listening at http://localhost:${port}`)
})

process.on("SIGINT", () => {
  console.log("Shutting down...")
  server.close(() => {
    closeDB()
    process.exit(0)
  })
})
