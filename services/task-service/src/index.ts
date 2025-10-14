import express from "express"
import cors from "cors"

// Task service

const port = 3002

const app = express()

app.get("/", (_req, res) => {
  return res.redirect(`http://localhost:${port}/health`)
})

app.get("/health", (_req, res) => {
  return res.json({ online: true })
})

app.use(cors)

app.listen(port, () => {
  return console.log(`App listening at http://localhost:${port}`)
})
