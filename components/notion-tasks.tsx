"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Database, RefreshCw, ExternalLink } from "lucide-react"

interface NotionTasksProps {
  isOpen: boolean
  onClose: () => void
  onTaskSelect: (task: any) => void
}

interface NotionTask {
  id: string
  title: string
  description: string
  status: string
  priority: string
  database: string
  url: string
  color: string
  tags: string[]
  dueDate?: string
}

export default function NotionTasks({ isOpen, onClose, onTaskSelect }: NotionTasksProps) {
  const [tasks, setTasks] = useState<NotionTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<NotionTask[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDatabase, setSelectedDatabase] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  // Mock Notion databases
  const databases = [
    { id: "all", name: "All Databases" },
    { id: "projects", name: "Projects" },
    { id: "tasks", name: "Personal Tasks" },
    { id: "work", name: "Work Items" },
    { id: "learning", name: "Learning Goals" },
  ]

  // Mock Notion tasks
  const mockTasks: NotionTask[] = [
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
    {
      id: "notion-2",
      title: "Review Design System Updates",
      description: "Review and approve the latest design system component updates",
      status: "To Do",
      priority: "Medium",
      database: "work",
      url: "https://notion.so/design-review",
      color: "bg-purple-500",
      tags: ["design", "review", "components"],
    },
    {
      id: "notion-3",
      title: "Learn React Server Components",
      description: "Study and practice React Server Components implementation",
      status: "To Do",
      priority: "Low",
      database: "learning",
      url: "https://notion.so/learning-rsc",
      color: "bg-blue-500",
      tags: ["react", "learning", "server-components"],
    },
    {
      id: "notion-4",
      title: "Update API Documentation",
      description: "Update the API documentation with new endpoints and examples",
      status: "To Do",
      priority: "Medium",
      database: "work",
      url: "https://notion.so/api-docs",
      color: "bg-green-500",
      tags: ["documentation", "api", "technical"],
    },
    {
      id: "notion-5",
      title: "Plan Team Retrospective",
      description: "Organize and plan the quarterly team retrospective meeting",
      status: "To Do",
      priority: "High",
      database: "work",
      url: "https://notion.so/retrospective",
      color: "bg-orange-500",
      tags: ["meeting", "team", "retrospective"],
      dueDate: "2024-01-20",
    },
    {
      id: "notion-6",
      title: "Organize Home Office",
      description: "Declutter and reorganize the home office workspace",
      status: "To Do",
      priority: "Low",
      database: "tasks",
      url: "https://notion.so/home-office",
      color: "bg-gray-500",
      tags: ["personal", "organization", "workspace"],
    },
  ]

  useEffect(() => {
    // Simulate loading Notion tasks
    setIsLoading(true)
    setTimeout(() => {
      setTasks(mockTasks)
      setFilteredTasks(mockTasks)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = tasks

    // Filter by database
    if (selectedDatabase !== "all") {
      filtered = filtered.filter((task) => task.database === selectedDatabase)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, selectedDatabase, searchQuery])

  const refreshTasks = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-yellow-100 text-yellow-800"
      case "to do":
        return "bg-blue-100 text-blue-800"
      case "done":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Notion Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedDatabase}
                onChange={(e) => setSelectedDatabase(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={refreshTasks}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading Notion tasks...</span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || selectedDatabase !== "all"
                  ? "No tasks found matching your criteria"
                  : "No tasks available"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(task.url, "_blank")
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge variant="outline">{databases.find((db) => db.id === task.database)?.name}</Badge>
                          {task.dueDate && (
                            <Badge variant="outline" className="text-orange-600">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          onTaskSelect({
                            ...task,
                            type: "notion",
                          })
                        }
                        className="ml-4"
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected to Notion</span>
            </div>
            <span>{filteredTasks.length} tasks available</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
