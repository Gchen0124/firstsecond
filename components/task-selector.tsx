"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Database, Plus } from "lucide-react"

interface TaskSelectorProps {
  isOpen: boolean
  onClose: () => void
  onTaskSelect: (task: any) => void
  blockTime?: {
    startTime: string
    endTime: string
  }
}

export default function TaskSelector({ isOpen, onClose, onTaskSelect, blockTime }: TaskSelectorProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "notion" | "custom">("calendar")
  const [customTask, setCustomTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    color: "bg-blue-500",
  })

  // Mock calendar events for this time slot
  const suggestedCalendarEvents = [
    {
      id: "cal-1",
      title: "Focus Time",
      description: "Deep work session",
      color: "bg-blue-500",
    },
    {
      id: "cal-2",
      title: "Email Processing",
      description: "Check and respond to emails",
      color: "bg-green-500",
    },
  ]

  // Mock Notion tasks
  const notionTasks = [
    {
      id: "notion-1",
      title: "Complete project proposal",
      description: "Finish the Q1 project proposal document",
      priority: "high",
      color: "bg-red-500",
    },
    {
      id: "notion-2",
      title: "Review design mockups",
      description: "Review and provide feedback on new designs",
      priority: "medium",
      color: "bg-purple-500",
    },
    {
      id: "notion-3",
      title: "Update documentation",
      description: "Update API documentation",
      priority: "low",
      color: "bg-gray-500",
    },
  ]

  const handleCustomTaskCreate = () => {
    if (customTask.title.trim()) {
      onTaskSelect({
        id: `custom-${Date.now()}`,
        ...customTask,
        type: "custom",
      })
      setCustomTask({ title: "", description: "", priority: "medium", color: "bg-blue-500" })
    }
  }

  const colorOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-gray-500",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Select Task for {blockTime?.startTime} - {blockTime?.endTime}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === "calendar" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar Events
            </button>
            <button
              onClick={() => setActiveTab("notion")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === "notion" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              <Database className="h-4 w-4" />
              Notion Tasks
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === "custom" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              <Plus className="h-4 w-4" />
              Create New
            </button>
          </div>

          {/* Calendar Events Tab */}
          {activeTab === "calendar" && (
            <div className="space-y-3">
              <h3 className="font-medium">Suggested Calendar Events</h3>
              {suggestedCalendarEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onTaskSelect(event)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    <Badge className={`text-white ${event.color}`}>Calendar</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notion Tasks Tab */}
          {activeTab === "notion" && (
            <div className="space-y-3">
              <h3 className="font-medium">Available Notion Tasks</h3>
              {notionTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskSelect(task)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge className={`text-white ${task.color}`}>Notion</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Task Tab */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <h3 className="font-medium">Create New Task</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={customTask.title}
                    onChange={(e) => setCustomTask((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title..."
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={customTask.description}
                    onChange={(e) => setCustomTask((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="flex gap-2 mt-1">
                    {["low", "medium", "high"].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setCustomTask((prev) => ({ ...prev, priority }))}
                        className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                          customTask.priority === priority ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCustomTask((prev) => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full ${color} ${
                          customTask.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCustomTaskCreate} className="w-full">
                  Create Task
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
