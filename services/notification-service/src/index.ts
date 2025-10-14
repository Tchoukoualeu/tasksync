import express from "express"
import cors from "cors"

// Notification service

const port = 3001

const app = express()
app.use(cors)

app.get("/", (_req, res) => {
  return res.redirect(`http://localhost:${port}/health`)
})

app.get("/health", (_req, res) => {
  return res.json({ online: true })
})

app.use((_req, res) => {
  console.log("here")
  return res.status(400).end("Not found!")
})

app.listen(port, () => {
  return console.log(`App listening at http://localhost:${port}`)
})
