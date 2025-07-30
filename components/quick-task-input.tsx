"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2 } from "lucide-react"

interface QuickTaskInputProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskTitle: string) => void
  onDelete?: () => void
  initialValue?: string
  position: { x: number; y: number }
  isEditing?: boolean
}

export default function QuickTaskInput({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialValue = "",
  position,
  isEditing = false,
}: QuickTaskInputProps) {
  const [taskTitle, setTaskTitle] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTaskTitle(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  const handleSave = () => {
    if (taskTitle.trim()) {
      onSave(taskTitle.trim())
      setTaskTitle("")
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed z-50 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 min-w-72"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 120),
      }}
    >
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter task name..."
          className="flex-1"
        />
        <Button onClick={handleSave} size="sm" disabled={!taskTitle.trim()} className="px-2">
          <Check className="h-4 w-4" />
        </Button>
        {isEditing && onDelete && (
          <Button onClick={handleDelete} variant="destructive" size="sm" className="px-2">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={onClose} variant="outline" size="sm" className="px-2 bg-transparent">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {isEditing ? "Edit task • " : "Create task • "}
        Press Enter to save, Esc to cancel
      </div>
    </div>
  )
}
