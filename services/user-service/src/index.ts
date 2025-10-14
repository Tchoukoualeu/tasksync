import express from "express"
import cors from "cors"

// User service

const port = 3003

const app = express()

app.get("/", (_req, res) => {
  return res.redirect(`http://localhost:${port}/health`)
})

app.get("/health", (_req, res) => {
  return res.json({ online: true, name: "User service" })
})

app.use((_req, res, next) => {
  const err = new Error("Not found")

  res.status(400)

  next(err)
})

app.use((err, req, res, next) => {
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
