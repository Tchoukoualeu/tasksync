// db.js - Shared DB connection and initialization

import Database from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"

let dbInstance: Database.Database | null = null

function getDB() {
  if (!dbInstance) {
    dbInstance = new Database("./mydbo.db")

    console.log("Connected to SQLite database.")

    // Initialize schema (idempotent)
    // tasks (title, description, status, assignee, comments).
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE
      );

        CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        assignee TEXT,
        comments TEXT,
        FOREIGN KEY (assignee) REFERENCES users(id) ON DELETE SET NULL
      );
    `)

    // insert a default user if none exists
    dbInstance.exec(`
      INSERT INTO users (id, password, role, email)
      SELECT '${uuidv4()}', 'adminpass', 'admin', 'admin@example.com'
      WHERE NOT EXISTS (SELECT 1 FROM users)
    `)
  }
  return dbInstance
}

function closeDB() {
  if (dbInstance) {
    dbInstance.close()
    console.log("Database connection closed.")
    dbInstance = null
  }
}

export { getDB, closeDB }
