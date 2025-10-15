import express from "express"
import cors from "cors"
import { ta } from "zod/v4/locales"
import { tasksRouter } from "./routes/tasks"

// Task service

const port = 3002

const app = express()

app.get("/", (_req, res) => {
  return res.redirect(`http://localhost:${port}/health`)
})

app.get("/health", (_req, res) => {
  return res.json({ online: true, name: "Task service" })
})
app.use(express.json())
app.use("/tasks", tasksRouter)

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

app.listen(port, () => {
  return console.log(`App listening at http://localhost:${port}`)
})
