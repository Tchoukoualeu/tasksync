import { getDB } from "../../../../shared/config/db"
import express, { Request, Response } from "express"
import { v4 as uuidv4 } from "uuid"
import * as z from "zod"

const tasksRouter = express.Router()

tasksRouter
  .get("/", (_req: Request, res: Response) => {
    const dbInstance = getDB()

    try {
      const query1 = dbInstance.prepare("SELECT * FROM tasks")

      const tasks = query1.all()

      return res.json(tasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

  .get("/:id", (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Task ID is required" })
    }

    try {
      const dbInstance = getDB()
      const query = dbInstance.prepare("SELECT * FROM tasks WHERE id = ?")
      const task = query.get(id)

      if (!task) {
        return res.status(404).json({ error: "Task not found" })
      }

      return res.json(task)
    } catch (error) {
      console.error("Error fetching task:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

  // title, description, status, assignee, comments)
  .post("/", (req: Request, res: Response) => {
    const TaskSchema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      comments: z.string().min(1).optional().default(""),
      status: z
        .enum(["pending", "in-progress", "completed"])
        .optional()
        .default("pending"),
      assignee: z.string().optional().nullable(),
    })

    try {
      TaskSchema.parse(req.body)
    } catch (err) {
      return res.send({
        message: err instanceof z.ZodError ? err.issues : "Error",
      })
    }

    try {
      const validatedTask = TaskSchema.parse(req.body)
      const dbInstance = getDB()
      const status = validatedTask.status || "pending"
      const assignee = validatedTask.assignee || null
      const query = dbInstance.prepare(
        "INSERT INTO tasks (id, title, description, status, assignee, comments) VALUES (?, ?, ?, ?, ?, ?)",
      )
      query.run(
        uuidv4(),
        validatedTask.title,
        validatedTask.description,
        status,
        assignee,
        JSON.stringify(validatedTask.comments),
      )
      return res.status(201).json(validatedTask)
    } catch (error) {
      console.error("Error creating task:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

  .delete("/:id", (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Task ID is required" })
    }

    try {
      const dbInstance = getDB()
      const query = dbInstance.prepare("DELETE FROM tasks WHERE id = ?")
      const result = query.run(id)

      if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" })
      }

      return res.status(204).send()
    } catch (error) {
      console.error("Error deleting task:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

  .put("/:id", (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Task ID is required" })
    }
    const TaskUpdateSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      comments: z.string().min(1).optional(),
      status: z.enum(["pending", "in-progress", "completed"]).optional(),
      assignee: z.string().optional().nullable(),
    })

    try {
      TaskUpdateSchema.parse(req.body)
    } catch (err) {
      return res.send({
        message: err instanceof z.ZodError ? err.issues : "Error",
      })
    }

    try {
      const validatedTask = TaskUpdateSchema.parse(req.body)
      const dbInstance = getDB()

      // Build dynamic query based on provided fields
      const fields = []
      const values = []

      for (const [key, value] of Object.entries(validatedTask)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" })
      }

      values.push(id) // Add ID for WHERE clause

      const query = dbInstance.prepare(
        `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      )
      const result = query.run(...values)

      if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" })
      }

      return res.json({ id, ...validatedTask })
    } catch (error) {
      console.error("Error updating task:", error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  })

export { tasksRouter }
