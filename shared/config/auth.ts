import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { Request, Response, NextFunction } from "express"
import { getDB } from "./db"

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRES_IN = "7d"

export interface AuthUser {
  id: string
  email: string
  role?: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  if (!email || !password) {
    return null
  }

  const dbInstance = getDB()
  const queryByEmail = dbInstance.prepare("SELECT * FROM users WHERE email = ?")

  const user = queryByEmail.get(email) as
    | {
        email: string
        password: string
        id: string
      }
    | undefined

  if (!user) {
    return null // User not found
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return null
  }

  return { id: user.id, email: user.email }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return { id: decoded.id, email: decoded.email }
  } catch (error) {
    return null
  }
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized - No token provided",
      message: "Unauthorized",
    })
    return
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const user = verifyToken(token)

  if (!user) {
    res
      .status(401)
      .json({ error: "Unauthorized - Invalid token", message: "Unauthorized" })
    return
  }

  req.user = user
  next()
}
