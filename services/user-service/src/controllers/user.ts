import { getDB } from "../../../../shared/config/db"

import express, { Request, Response } from "express"

const userRouter = express.Router()

userRouter.get("/", (req: Request, res: Response) => {
  const dbInstance = getDB()

  try {
    const query1 = dbInstance.prepare("SELECT * FROM users")

    const users = query1.all()

    return res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return res.status(500).json({ error: "Internal Server Error" })
  }
})

export { userRouter }
