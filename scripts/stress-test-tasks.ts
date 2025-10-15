#!/usr/bin/env tsx

/**
 * Task Stress Test Script
 * Creates, updates, and deletes 1000 tasks with 1 second delay between calls
 * Throttles creation to max 12 pending tasks (todo + in-progress) at a time
 * During throttling, automatically completes tasks to make room for new ones
 * All remaining tasks will be marked as completed before deletion
 * Total estimated time: Variable depending on completion rate
 */

const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://localhost:3002"
const NUM_TASKS = 1000
const DELAY_BETWEEN_CALLS_MS = 1000 // 1 second between each HTTP call
const MAX_PENDING_TASKS = 12 // Maximum combined tasks in todo and in-progress before throttling

interface Task {
  id?: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed"
  assignee?: string | null
  comments?: string
}

const createdTaskIds: string[] = []
let stats = {
  created: 0,
  updated: 0,
  completed: 0,
  deleted: 0,
  errors: 0,
}

// Helper to make API calls
async function apiCall(method: string, path: string, body?: any): Promise<any> {
  try {
    const response = await fetch(`${TASK_SERVICE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok && response.status !== 204) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (error) {
    stats.errors++
    console.error(`API Error [${method} ${path}]:`, error)
    throw error
  }
}

// Generate random task data
function generateTaskData(index: number): Omit<Task, "id"> {
  const statuses: Array<"pending" | "in-progress"> = ["pending", "in-progress"]
  return {
    title: `Task #${index}: ${randomTaskName()}`,
    description: `This is test task number ${index} created for stress testing the notification system`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignee: Math.random() > 0.5 ? randomUserId() : null,
    comments: `Initial comment for task ${index}`,
  }
}

function randomTaskName(): string {
  const names = [
    "Update documentation",
    "Fix bug in authentication",
    "Implement new feature",
    "Refactor codebase",
    "Write unit tests",
    "Review pull request",
    "Deploy to production",
    "Optimize database queries",
    "Update dependencies",
    "Design new UI component",
  ]
  return names[Math.floor(Math.random() * names.length)]
}

function randomUserId(): string {
  const userIds = ["user-1", "user-2", "user-3", "user-4", "user-5"]
  return userIds[Math.floor(Math.random() * userIds.length)]
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Get count of tasks by status
async function getTaskCountsByStatus(): Promise<{
  todo: number
  inProgress: number
  completed: number
}> {
  try {
    const response = await apiCall("GET", "/tasks")

    // Handle both direct array and wrapped response
    let tasks: Task[] = []
    if (Array.isArray(response)) {
      tasks = response
    } else if (response?.tasks && Array.isArray(response.tasks)) {
      tasks = response.tasks
    }

    const counts = {
      todo: 0,
      inProgress: 0,
      completed: 0,
    }

    tasks.forEach((task) => {
      const status = task.status?.toLowerCase().replace(/[_\s]+/g, "-")
      if (status === "pending" || status === "todo") {
        counts.todo++
      } else if (status === "in-progress") {
        counts.inProgress++
      } else if (status === "completed") {
        counts.completed++
      }
    })

    return counts
  } catch (error) {
    console.error("Error fetching task counts:", error)
    return { todo: 0, inProgress: 0, completed: 0 }
  }
}

// Wait until there's room for more tasks (less than MAX_PENDING_TASKS in todo + in-progress)
// During throttling, automatically complete tasks to make room
async function waitForTaskRoom(): Promise<void> {
  let attempts = 0
  const maxAttempts = 300 // Max 5 minutes of waiting

  while (attempts < maxAttempts) {
    const counts = await getTaskCountsByStatus()
    const pendingCount = counts.todo + counts.inProgress

    if (pendingCount < MAX_PENDING_TASKS) {
      return // Room available
    }

    if (attempts === 0) {
      console.log(
        `  ⏸️  Throttling: ${pendingCount} pending tasks (todo: ${counts.todo}, in-progress: ${counts.inProgress}). Completing tasks...`,
      )
    }

    // Complete a batch of tasks to make room
    await completeSomeTasks(3) // Complete 3 tasks at a time

    await sleep(1000) // Wait a second before checking again
    attempts++
  }

  console.warn("  ⚠️  Max wait time reached, continuing anyway...")
}

// Complete some tasks to make room for new ones
async function completeSomeTasks(count: number): Promise<void> {
  try {
    const response = await apiCall("GET", "/tasks")

    // Handle both direct array and wrapped response
    let tasks: Task[] = []
    if (Array.isArray(response)) {
      tasks = response
    } else if (response?.tasks && Array.isArray(response.tasks)) {
      tasks = response.tasks
    }

    // Filter to only incomplete tasks that we created
    const incompleteTasks = tasks.filter(
      (task) =>
        createdTaskIds.includes(task.id || "") &&
        task.status !== "completed",
    )

    // Complete up to 'count' tasks
    const tasksToComplete = incompleteTasks.slice(0, count)

    for (const task of tasksToComplete) {
      try {
        await apiCall("PUT", `/tasks/${task.id}`, { status: "completed" })
        stats.completed++
        console.log(`  ✓ Auto-completed task ${task.id} to make room`)
        await sleep(DELAY_BETWEEN_CALLS_MS)
      } catch (error) {
        // Continue on error
      }
    }
  } catch (error) {
    console.error("Error completing tasks during throttling:", error)
  }
}

// Phase 1: Create all tasks
async function createTasks(): Promise<void> {
  console.log(`\n📝 Phase 1: Creating ${NUM_TASKS} tasks...`)
  console.log(
    `   Throttling enabled: Max ${MAX_PENDING_TASKS} pending tasks at a time`,
  )
  const delayBetweenCreates = DELAY_BETWEEN_CALLS_MS

  const startTime = Date.now()

  for (let i = 0; i < NUM_TASKS; i++) {
    // Wait for room before creating new task
    await waitForTaskRoom()

    const taskData = generateTaskData(i + 1)

    try {
      const result = await apiCall("POST", "/tasks", taskData)
      if (result?.id) {
        createdTaskIds.push(result.id)
        stats.created++
      }

      if ((i + 1) % 100 === 0) {
        console.log(
          `  ✓ Created ${i + 1}/${NUM_TASKS} tasks (${stats.errors} errors)`,
        )
      }

      await sleep(delayBetweenCreates)
    } catch (error) {
      // Continue on error
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `✅ Phase 1 complete: ${stats.created} tasks created in ${elapsed}s`,
  )
}

// Phase 2: Update tasks randomly
async function updateTasks(): Promise<void> {
  console.log(`\n🔄 Phase 2: Updating tasks...`)
  const numUpdates = NUM_TASKS * 2 // Update each task ~2 times
  const delayBetweenUpdates = DELAY_BETWEEN_CALLS_MS

  const startTime = Date.now()

  for (let i = 0; i < numUpdates; i++) {
    const randomTaskId =
      createdTaskIds[Math.floor(Math.random() * createdTaskIds.length)]

    if (!randomTaskId) continue

    const updates: Partial<Task> = {
      description: `Updated at ${new Date().toISOString()}`,
      status: Math.random() > 0.5 ? "in-progress" : "pending",
    }

    try {
      await apiCall("PUT", `/tasks/${randomTaskId}`, updates)
      stats.updated++

      if ((i + 1) % 200 === 0) {
        console.log(
          `  ✓ Completed ${i + 1}/${numUpdates} updates (${stats.errors} errors)`,
        )
      }

      await sleep(delayBetweenUpdates)
    } catch (error) {
      // Continue on error
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ Phase 2 complete: ${stats.updated} updates in ${elapsed}s`)
}

// Phase 3: Mark all tasks as completed
async function completeTasks(): Promise<void> {
  console.log(`\n✔️  Phase 3: Marking all tasks as completed...`)
  const delayBetweenCompletes = DELAY_BETWEEN_CALLS_MS

  const startTime = Date.now()

  for (let i = 0; i < createdTaskIds.length; i++) {
    const taskId = createdTaskIds[i]

    try {
      await apiCall("PUT", `/tasks/${taskId}`, { status: "completed" })
      stats.completed++

      if ((i + 1) % 100 === 0) {
        console.log(
          `  ✓ Completed ${i + 1}/${createdTaskIds.length} tasks (${stats.errors} errors)`,
        )
      }

      await sleep(delayBetweenCompletes)
    } catch (error) {
      // Continue on error
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `✅ Phase 3 complete: ${stats.completed} tasks completed in ${elapsed}s`,
  )
}

// Phase 4: Delete all tasks
async function deleteTasks(): Promise<void> {
  console.log(`\n🗑️  Phase 4: Deleting all tasks...`)
  const delayBetweenDeletes = DELAY_BETWEEN_CALLS_MS

  const startTime = Date.now()

  for (let i = 0; i < createdTaskIds.length; i++) {
    const taskId = createdTaskIds[i]

    try {
      await apiCall("DELETE", `/tasks/${taskId}`)
      stats.deleted++

      if ((i + 1) % 100 === 0) {
        console.log(
          `  ✓ Deleted ${i + 1}/${createdTaskIds.length} tasks (${stats.errors} errors)`,
        )
      }

      await sleep(delayBetweenDeletes)
    } catch (error) {
      // Continue on error
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `✅ Phase 4 complete: ${stats.deleted} tasks deleted in ${elapsed}s`,
  )
}

// Main execution
async function main() {
  console.log("🚀 Starting Task Stress Test")
  console.log(`   Target: ${NUM_TASKS} tasks`)
  console.log(`   Delay between calls: ${DELAY_BETWEEN_CALLS_MS}ms`)
  console.log(`   Max pending tasks: ${MAX_PENDING_TASKS}`)
  console.log(`   Endpoint: ${TASK_SERVICE_URL}`)
  console.log("=".repeat(60))

  const overallStart = Date.now()

  try {
    // Test connection first
    console.log("\n🔍 Testing connection...")
    await apiCall("GET", "/health")
    console.log("✅ Connection successful")

    // Run all phases
    await createTasks()
    await updateTasks()
    await completeTasks()
    await deleteTasks()

    const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1)

    console.log("\n" + "=".repeat(60))
    console.log("📊 Final Statistics:")
    console.log(`   Total Time: ${totalElapsed}s`)
    console.log(`   Tasks Created: ${stats.created}`)
    console.log(`   Tasks Updated: ${stats.updated}`)
    console.log(`   Tasks Completed: ${stats.completed}`)
    console.log(`   Tasks Deleted: ${stats.deleted}`)
    console.log(`   Errors: ${stats.errors}`)
    console.log(
      `   Success Rate: ${(((stats.created + stats.updated + stats.completed + stats.deleted) / (stats.created + stats.updated + stats.completed + stats.deleted + stats.errors)) * 100).toFixed(2)}%`,
    )
    console.log("=".repeat(60))
    console.log("\n✅ Stress test completed!")
  } catch (error) {
    console.error("\n❌ Stress test failed:", error)
    process.exit(1)
  }
}

// Run the script
main()
