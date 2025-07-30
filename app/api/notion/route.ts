export async function GET() {
  // Mock Notion API response
  const mockTasks = [
    {
      id: "notion-1",
      title: "Complete Q1 Project Proposal",
      description: "Finalize the project proposal document with budget and timeline",
      status: "In Progress",
      priority: "High",
      database: "projects",
      url: "https://notion.so/project-1",
      color: "bg-red-500",
      tags: ["urgent", "proposal", "Q1"],
      dueDate: "2024-01-15",
    },
    // Add more mock tasks as needed
  ]

  return Response.json({ tasks: mockTasks })
}

export async function POST(request: Request) {
  try {
    const { taskId, action } = await request.json()

    // Mock task update
    console.log(`Updating task ${taskId} with action: ${action}`)

    return Response.json({ success: true, message: "Task updated successfully" })
  } catch (error) {
    console.error("Notion API error:", error)
    return Response.json({ error: "Failed to update task" }, { status: 500 })
  }
}
