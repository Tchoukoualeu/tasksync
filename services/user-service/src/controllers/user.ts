import { getDB } from "../../../../shared/config/db"
import express, { Request, Response } from "express"
import * as z from "zod"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { UserRegister } from "../../../../shared/config/dto"
import {
  AuthRequest,
  generateToken,
  requireAuth,
  verifyCredentials,
} from "../../../../shared/config/auth"

const userRouter = express.Router()

userRouter
  .get("/", (_req: Request, res: Response) => {
    const dbInstance = getDB()

    try {
      const query1 = dbInstance.prepare("SELECT id, email, role FROM users")

      const users = query1.all()

      return res.json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

  .post("/register", async (req: Request, res: Response) => {
    try {
      UserRegister.parse(req.body)
    } catch (err) {
      return res.send({
        message: err instanceof z.ZodError ? err.issues : "Error",
      })
    }

    const { email, password } = UserRegister.parse(req.body)

    try {
      const hashedPass = await bcrypt.hash(password, 10)

      const dbInstance = getDB()

      const getUserByEmail = dbInstance.prepare(
        "SELECT * FROM users WHERE email = ?",
      )
      const isAlreadyAUser = getUserByEmail.get(email)

      if (isAlreadyAUser) {
        return res
          .status(409)
          .send({ message: "This user already exist.", user: null })
      }

      const insertUser = dbInstance.prepare(
        "INSERT INTO users (id, password, role, email) VALUES (?, ?, ?, ?)",
      )
      insertUser.run(uuidv4(), hashedPass, "admin", email)

      const getUserWithoutPassword = dbInstance.prepare(
        "SELECT id, email, role FROM users WHERE email = ?",
      )
      const user = getUserWithoutPassword.get(email)

      return res.json({ user })
    } catch (error) {
      console.error("Error registering a user:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })
  .get("/profile", requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.user })
  })
  .post("/login", async (req, res) => {
    const { email, password } = req.body
    const user = await verifyCredentials(email, password)

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials", message: "Unauthorized" })
    }

    const token = generateToken(user)
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  })

export { userRouter }
