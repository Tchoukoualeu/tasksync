// db.js - Shared DB connection and initialization

import Database from "better-sqlite3"

let dbInstance: Database.Database | null = null

function getDB() {
  if (!dbInstance) {
    dbInstance = new Database("./mydb.db")
    console.log("Connected to SQLite database.")

    // Initialize schema (idempotent)
    // tasks (title, description, status, assignee, comments).
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE
      );

        CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        assignee INTEGER,
        comments TEXT,
        FOREIGN KEY (assignee) REFERENCES users(id) ON DELETE SET NULL
      );
    `)

    // insert a default user if none exists
    dbInstance.exec(`
      INSERT INTO users (password, role, email)
      SELECT 'adminpass', 'admin', 'admin@example.com'
      WHERE NOT EXISTS (SELECT 1 FROM users)
    `)

    const query1 = dbInstance.prepare("SELECT * FROM users")
    console.log(query1.all())

    console.log("Users table ready.")
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
