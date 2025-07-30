"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Mic, Calendar, Database, ArrowRight, Undo2, Clock, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import TaskSelector from "@/components/task-selector"
import VoiceInterface from "@/components/voice-interface"
import NotionTasks from "@/components/notion-tasks"
import QuickTaskInput from "@/components/quick-task-input"
import ProgressCheckPopup from "@/components/progress-check-popup"

interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  task?: {
    id: string
    title: string
    type: "calendar" | "notion" | "custom"
    color: string
  }
  isActive: boolean
  isCompleted: boolean
  isRecentlyMoved?: boolean
}

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  color: string
}

interface TaskChange {
  type: "edit" | "push"
  blockId: string
  oldTask?: any
  newTask?: any
  affectedBlocks?: string[]
  timestamp: Date
}

interface BlockDurationOption {
  value: number
  label: string
  description: string
}

export default function TimeTracker() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [showNotionTasks, setShowNotionTasks] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showQuickInput, setShowQuickInput] = useState(false)
  const [quickInputPosition, setQuickInputPosition] = useState({ x: 0, y: 0 })
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [gradientIndex, setGradientIndex] = useState(0)
  const [isShining, setIsShining] = useState(false)
  const [recentChanges, setRecentChanges] = useState<TaskChange[]>([])
  const [showChangeNotification, setShowChangeNotification] = useState(false)
  const [blockDurationMinutes, setBlockDurationMinutes] = useState(10)
  const [showDurationSelector, setShowDurationSelector] = useState(false)
  const [showProgressCheck, setShowProgressCheck] = useState(false)
  const [progressCheckTimer, setProgressCheckTimer] = useState<NodeJS.Timeout | null>(null)
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [notificationType, setNotificationType] = useState<"rescheduled" | "disrupted" | "paused">("rescheduled")

  // Block duration options
  const blockDurationOptions: BlockDurationOption[] = [
    { value: 1, label: "1 min", description: "1440 blocks/day - Ultra micro focus" },
    { value: 3, label: "3 min", description: "480 blocks/day - Micro focus" },
    { value: 5, label: "5 min", description: "288 blocks/day - Ultra detailed" },
    { value: 10, label: "10 min", description: "144 blocks/day - Detailed" },
    { value: 15, label: "15 min", description: "96 blocks/day - Standard" },
    { value: 20, label: "20 min", description: "72 blocks/day - Focused" },
    { value: 30, label: "30 min", description: "48 blocks/day - High level" },
  ]

  // Mock calendar events
  const [calendarEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Meeting",
      startTime: "09:00",
      endTime: "10:00",
      color: "bg-blue-500",
    },
    {
      id: "2",
      title: "Project Review",
      startTime: "14:30",
      endTime: "15:30",
      color: "bg-green-500",
    },
    {
      id: "3",
      title: "Client Call",
      startTime: "16:00",
      endTime: "17:00",
      color: "bg-purple-500",
    },
  ])

  // Generate time blocks based on configurable duration
  useEffect(() => {
    const blocks: TimeBlock[] = []
    const totalMinutesInDay = 24 * 60
    const blocksPerDay = totalMinutesInDay / blockDurationMinutes

    for (let blockIndex = 0; blockIndex < blocksPerDay; blockIndex++) {
      const startMinutes = blockIndex * blockDurationMinutes
      const endMinutes = startMinutes + blockDurationMinutes

      const startHour = Math.floor(startMinutes / 60)
      const startMinute = startMinutes % 60
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60

      const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`

      blocks.push({
        id: `${startHour}-${startMinute}`,
        startTime,
        endTime,
        isActive: false,
        isCompleted: false,
      })
    }

    // Map calendar events to blocks
    calendarEvents.forEach((event) => {
      const [startHour, startMinute] = event.startTime.split(":").map(Number)
      const [endHour, endMinute] = event.endTime.split(":").map(Number)

      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute

      const startBlockIndex = Math.floor(startTotalMinutes / blockDurationMinutes)
      const endBlockIndex = Math.floor(endTotalMinutes / blockDurationMinutes)

      for (let i = startBlockIndex; i < endBlockIndex && i < blocks.length; i++) {
        if (blocks[i]) {
          blocks[i].task = {
            id: event.id,
            title: event.title,
            type: "calendar",
            color: event.color,
          }
        }
      }
    })

    console.log("Generated time blocks:", blocks.length, "blocks")
    setTimeBlocks(blocks)
  }, [calendarEvents, blockDurationMinutes])

  // Initialize current time on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Update current time and handle block transitions
  useEffect(() => {
    if (!currentTime) return
    
    const timer = setInterval(() => {
      const now = new Date()
      const prevTime = currentTime
      setCurrentTime(now)

      const currentBlockId = getCurrentBlockId(now)
      const prevBlockId = getCurrentBlockId(prevTime) // Get previous block ID

      // Check if we've moved to a new block
      if (prevBlockId !== currentBlockId && prevBlockId) {
        const prevBlock = timeBlocks.find((b) => b.id === prevBlockId)

        console.log("Block transition detected:", {
          from: prevBlockId,
          to: currentBlockId,
          prevBlock: prevBlock?.task?.title || "No task",
          wasActive: prevBlock?.isActive,
          timerRunning: isTimerRunning,
          showProgressCheck,
        })

        // If previous block was active AND timer was running, trigger completion
        if (prevBlock && prevBlock.isActive && isTimerRunning) {
          console.log("Triggering block completion for:", prevBlockId)
          handleBlockCompletion(prevBlock, currentBlockId)
          return // Don't auto-start next block yet
        }
        
        // Also trigger completion for blocks with real tasks (not pause/disruption), even if not marked as active
        if (prevBlock && 
            prevBlock.task && 
            !prevBlock.task.title?.includes("Paused") && 
            !prevBlock.task.title?.includes("Disrupted") && 
            isTimerRunning) {
          console.log("Triggering block completion for task block:", prevBlockId, prevBlock.task.title)
          handleBlockCompletion(prevBlock, currentBlockId)
          return // Don't auto-start next block yet
        }
      }

      // Auto-start timer for current block if it has a real task and timer isn't running
      const currentBlock = timeBlocks.find((b) => b.id === currentBlockId)
      
      if (
        currentBlock &&
        currentBlock.task &&
        !currentBlock.task.title?.includes("Paused") &&
        !currentBlock.task.title?.includes("Disrupted") &&
        !isTimerRunning &&
        !showProgressCheck &&
        !currentBlock.isActive
      ) {
        console.log("Auto-starting timer for task block:", currentBlockId, currentBlock.task.title)
        setIsTimerRunning(true)
        setTimerSeconds(0)
        setTimeBlocks((prev) =>
          prev.map((block) =>
            block.id === currentBlockId ? { ...block, isActive: true } : { ...block, isActive: false },
          ),
        )
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [currentTime, timeBlocks, isTimerRunning, blockDurationMinutes, showProgressCheck])

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Clear recently moved indicators after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeBlocks((prev) => prev.map((block) => ({ ...block, isRecentlyMoved: false })))
    }, 2000)
    return () => clearTimeout(timer)
  }, [timeBlocks.some((block) => block.isRecentlyMoved)])

  // AI-themed gradient combinations
  const aiGradients = [
    "from-blue-400 via-purple-500 to-pink-500",
    "from-cyan-400 via-blue-500 to-purple-600",
    "from-green-400 via-blue-500 to-purple-600",
    "from-pink-400 via-red-500 to-yellow-500",
    "from-indigo-400 via-purple-500 to-pink-500",
    "from-teal-400 via-cyan-500 to-blue-600",
    "from-orange-400 via-pink-500 to-purple-600",
    "from-emerald-400 via-teal-500 to-cyan-600",
  ]

  // Cycle through gradients and trigger shine effect
  useEffect(() => {
    const gradientTimer = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % aiGradients.length)
    }, 3000) // Change gradient every 3 seconds

    const shineTimer = setInterval(() => {
      setIsShining(true)
      setTimeout(() => setIsShining(false), 800) // Shine duration
    }, 1000) // Shine every second

    return () => {
      clearInterval(gradientTimer)
      clearInterval(shineTimer)
    }
  }, [])

  const getCurrentBlockId = (time?: Date) => {
    const now = time || new Date()
    const totalMinutes = now.getHours() * 60 + now.getMinutes()
    const blockIndex = Math.floor(totalMinutes / blockDurationMinutes)
    const startMinutes = blockIndex * blockDurationMinutes
    const hour = Math.floor(startMinutes / 60)
    const minute = startMinutes % 60
    return `${hour}-${minute}`
  }

  const getBlockTimeStatus = (blockId: string) => {
    const now = new Date()
    const currentBlockId = getCurrentBlockId(now)
    const [hour, minute] = blockId.split("-").map(Number)
    const blockTime = new Date()
    blockTime.setHours(hour, minute, 0, 0)

    if (blockId === currentBlockId) return "current"
    if (blockTime < now) return "past"
    return "future"
  }

  const getBlockIndex = (blockId: string) => {
    return timeBlocks.findIndex((block) => block.id === blockId)
  }

  const pushTasksForward = (fromBlockIndex: number) => {
    const affectedBlocks: string[] = []
    const updatedBlocks = [...timeBlocks]

    // Collect all tasks from the current position onwards that need to be moved
    const tasksToMove: Array<{ task: any; originalIndex: number }> = []

    for (let i = fromBlockIndex; i < updatedBlocks.length; i++) {
      if (updatedBlocks[i].task) {
        tasksToMove.push({
          task: updatedBlocks[i].task,
          originalIndex: i,
        })
        updatedBlocks[i].task = undefined // Clear the original position
      }
    }

    // Place tasks in new positions (one block later)
    tasksToMove.forEach(({ task }, index) => {
      const newIndex = fromBlockIndex + 1 + index
      if (newIndex < updatedBlocks.length) {
        updatedBlocks[newIndex].task = task
        updatedBlocks[newIndex].isRecentlyMoved = true
        affectedBlocks.push(updatedBlocks[newIndex].id)
      }
    })

    return { updatedBlocks, affectedBlocks }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleBlockClick = (blockId: string, event: React.MouseEvent) => {
    setSelectedBlock(blockId)
    const block = timeBlocks.find((b) => b.id === blockId)

    const rect = event.currentTarget.getBoundingClientRect()
    setQuickInputPosition({
      x: rect.left,
      y: rect.bottom + 5,
    })
    setEditingBlockId(blockId)
    setShowQuickInput(true)
  }

  const handleTaskAssign = (task: any, blockId: string) => {
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, task: { ...task, type: "custom" } } : block)),
    )
    setShowTaskSelector(false)
    setSelectedBlock(null)
  }

  const startTimer = () => {
    setIsTimerRunning(true)
    const currentBlockId = getCurrentBlockId(currentTime || new Date())
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === currentBlockId ? { ...block, isActive: true } : { ...block, isActive: false })),
    )
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(0)
    const currentBlockId = getCurrentBlockId(currentTime || new Date())
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === currentBlockId ? { ...block, isActive: false, isCompleted: true } : block)),
    )
  }

  const currentBlockId = getCurrentBlockId(currentTime || new Date())
  const currentBlock = timeBlocks.find((b) => b.id === currentBlockId)

  const getRemainingTime = (block: TimeBlock) => {
    const now = new Date()
    const [endHour, endMinute] = block.endTime.split(":").map(Number)
    const blockEnd = new Date()
    blockEnd.setHours(endHour, endMinute, 0, 0)

    const remaining = Math.max(0, Math.floor((blockEnd.getTime() - now.getTime()) / 1000))
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleQuickTaskSave = (taskTitle: string) => {
    if (!editingBlockId) return

    const blockIndex = getBlockIndex(editingBlockId)
    const blockStatus = getBlockTimeStatus(editingBlockId)
    const existingBlock = timeBlocks[blockIndex]
    const existingTask = existingBlock?.task

    const newTask = {
      id: `quick-${Date.now()}`,
      title: taskTitle,
      description: `Quick task: ${taskTitle}`,
      type: "custom" as const,
      color: "bg-blue-500",
      priority: "medium",
    }

    // For past blocks, just edit the specific block
    if (blockStatus === "past") {
      setTimeBlocks((prev) => prev.map((block) => (block.id === editingBlockId ? { ...block, task: newTask } : block)))

      const change: TaskChange = {
        type: "edit",
        blockId: editingBlockId,
        oldTask: existingTask,
        newTask,
        timestamp: new Date(),
      }
      setRecentChanges((prev) => [change, ...prev.slice(0, 4)])
    } else {
      // For current and future blocks, push tasks forward if there's a change
      const isTaskChanged = !existingTask || existingTask.title !== taskTitle

      if (isTaskChanged && (blockStatus === "current" || blockStatus === "future")) {
        const { updatedBlocks, affectedBlocks } = pushTasksForward(blockIndex)

        // Set the new task in the edited block
        updatedBlocks[blockIndex].task = newTask

        setTimeBlocks(updatedBlocks)

        const change: TaskChange = {
          type: "push",
          blockId: editingBlockId,
          oldTask: existingTask,
          newTask,
          affectedBlocks,
          timestamp: new Date(),
        }
        setRecentChanges((prev) => [change, ...prev.slice(0, 4)])

        // Show notification
        setShowChangeNotification(true)
        setTimeout(() => setShowChangeNotification(false), 3000)
      } else {
        // No change needed, just update the task
        setTimeBlocks((prev) =>
          prev.map((block) => (block.id === editingBlockId ? { ...block, task: newTask } : block)),
        )
      }
    }

    setShowQuickInput(false)
    setEditingBlockId(null)
  }

  const handleQuickTaskDelete = () => {
    if (!editingBlockId) return

    const blockIndex = getBlockIndex(editingBlockId)
    const existingTask = timeBlocks[blockIndex]?.task

    // Simply delete the task from the specific block - no pushing forward
    setTimeBlocks((prev) => prev.map((block) => (block.id === editingBlockId ? { ...block, task: undefined } : block)))

    // Record the deletion for undo functionality
    const change: TaskChange = {
      type: "edit",
      blockId: editingBlockId,
      oldTask: existingTask,
      newTask: undefined,
      timestamp: new Date(),
    }
    setRecentChanges((prev) => [change, ...prev.slice(0, 4)])

    setShowQuickInput(false)
    setEditingBlockId(null)
  }

  const undoLastChange = () => {
    if (recentChanges.length === 0) return

    const lastChange = recentChanges[0]
    // Simple undo implementation - in a real app, you'd want more sophisticated undo/redo
    // For now, we'll just show the concept
    console.log("Undoing change:", lastChange)
    setRecentChanges((prev) => prev.slice(1))
  }

  const handleBlockDurationChange = (newDuration: number) => {
    setBlockDurationMinutes(newDuration)
    setShowDurationSelector(false)
    // Clear any existing tasks when changing duration to avoid confusion
    setRecentChanges([])
  }

  // Calculate grid columns based on block duration for better layout
  const getGridColumns = () => {
    const blocksPerHour = 60 / blockDurationMinutes
    if (blocksPerHour <= 4) return 4
    if (blocksPerHour <= 6) return 6
    if (blocksPerHour <= 8) return 8
    return 12
  }

  const totalBlocks = timeBlocks.length
  const blocksPerHour = 60 / blockDurationMinutes

  // Voice alert function
  const speakTimeAlert = (message: string) => {
    console.log("Speaking:", message) // Debug log
    if ("speechSynthesis" in window) {
      // Cancel any existing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      // Add event listeners for debugging
      utterance.onstart = () => console.log("Speech started")
      utterance.onend = () => console.log("Speech ended")
      utterance.onerror = (e) => console.error("Speech error:", e)

      speechSynthesis.speak(utterance)
    } else {
      console.log("Speech synthesis not supported")
    }
  }

  // Handle block completion and show progress check
  const handleBlockCompletion = (completedBlock: TimeBlock, nextBlockId: string) => {
    console.log("handleBlockCompletion called:", { completedBlock: completedBlock.id, nextBlockId })

    // Stop current timer
    setIsTimerRunning(false)

    // Mark completed block as finished
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === completedBlock.id ? { ...block, isActive: false, isCompleted: true } : block)),
    )

    // Voice alert
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const taskName = completedBlock.task?.title || "time block"
    speakTimeAlert(`Time block completed. Current time is ${timeString}. How did you do with ${taskName}?`)

    // Show progress check popup
    setCompletedBlockId(completedBlock.id)
    setShowProgressCheck(true)

    // Set 15-second auto-timeout
    const timeout = setTimeout(() => {
      handleProgressTimeout(nextBlockId)
    }, 15000)
    setProgressCheckTimer(timeout)
  }

  // Handle progress check responses
  const handleProgressDone = () => {
    if (progressCheckTimer) clearTimeout(progressCheckTimer)
    setShowProgressCheck(false)
    setCompletedBlockId(null)
    setProgressCheckTimer(null)

    // Start next block normally
    const currentBlockId = getCurrentBlockId(currentTime || new Date())
    setIsTimerRunning(true)
    setTimerSeconds(0)
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === currentBlockId ? { ...block, isActive: true } : { ...block, isActive: false })),
    )
  }

  const handleProgressStillDoing = () => {
    if (progressCheckTimer) clearTimeout(progressCheckTimer)
    if (!completedBlockId) return

    const completedBlock = timeBlocks.find((b) => b.id === completedBlockId)
    if (!completedBlock?.task) return

    // Continue with same task in next block and push all future tasks forward
    const currentBlockId = getCurrentBlockId(currentTime || new Date())
    const currentBlockIndex = getBlockIndex(currentBlockId)

    const { updatedBlocks } = pushTasksForward(currentBlockIndex)

    // Set the continued task in current block
    updatedBlocks[currentBlockIndex].task = {
      ...completedBlock.task,
      id: `continued-${Date.now()}`,
    }

    setTimeBlocks(updatedBlocks)

    // Show notification
    setNotificationType("rescheduled")
    setShowChangeNotification(true)
    setTimeout(() => setShowChangeNotification(false), 3000)

    // Record change
    const change: TaskChange = {
      type: "push",
      blockId: currentBlockId,
      oldTask: undefined,
      newTask: completedBlock.task,
      affectedBlocks: [],
      timestamp: new Date(),
    }
    setRecentChanges((prev) => [change, ...prev.slice(0, 4)])

    setShowProgressCheck(false)
    setCompletedBlockId(null)
    setProgressCheckTimer(null)

    // Start timer for continued task
    setIsTimerRunning(true)
    setTimerSeconds(0)
    setTimeBlocks((prev) =>
      prev.map((block) => (block.id === currentBlockId ? { ...block, isActive: true } : { ...block, isActive: false })),
    )
  }

  const handleProgressTimeout = (nextBlockId: string) => {
    console.log("handleProgressTimeout called:", { completedBlockId, nextBlockId })

    if (!completedBlockId) return

    // Get the completed block and its original task
    const completedBlock = timeBlocks.find((b) => b.id === completedBlockId)
    const originalTask = completedBlock?.task

    // Step 1: Mark the completed block as "Disrupted"
    setTimeBlocks((prev) =>
      prev.map((block) =>
        block.id === completedBlockId
          ? {
              ...block,
              isActive: false,
              isCompleted: false,
              task: {
                id: `disrupted-${Date.now()}`,
                title: "Disrupted - No Response",
                type: "custom",
                color: "bg-red-500",
              },
            }
          : block,
      ),
    )

    // Step 2: Get the next block (current time block) and push all tasks forward
    const nextBlockIndex = getBlockIndex(nextBlockId)
    const { updatedBlocks } = pushTasksForward(nextBlockIndex)

    // Step 3: If the completed block had a task, move it to the next available slot
    if (originalTask) {
      // Find the first available slot after pushing tasks forward
      let targetIndex = nextBlockIndex + 1 // Skip the paused block
      while (targetIndex < updatedBlocks.length && updatedBlocks[targetIndex].task) {
        targetIndex++
      }
      if (targetIndex < updatedBlocks.length) {
        updatedBlocks[targetIndex].task = {
          ...originalTask,
          id: `rescheduled-${Date.now()}`,
        }
        updatedBlocks[targetIndex].isRecentlyMoved = true
      }
    }

    // Step 4: Mark the next block (current time) as "Paused"
    updatedBlocks[nextBlockIndex].task = {
      id: `paused-${Date.now()}`,
      title: "Paused - Previous Disruption",
      type: "custom",
      color: "bg-gray-500",
    }

    setTimeBlocks(updatedBlocks)

    // Voice alert
    speakTimeAlert(
      "No response detected. Previous block marked as disrupted. Current block marked as paused. All future tasks delayed.",
    )

    // Show notification
    setNotificationType("disrupted")
    setShowChangeNotification(true)
    setTimeout(() => setShowChangeNotification(false), 5000)

    // Record the change for undo functionality
    const change: TaskChange = {
      type: "push",
      blockId: completedBlockId,
      oldTask: originalTask,
      newTask: {
        id: `disrupted-${Date.now()}`,
        title: "Disrupted - No Response",
        type: "custom",
        color: "bg-red-500",
      },
      affectedBlocks: [nextBlockId],
      timestamp: new Date(),
    }
    setRecentChanges((prev) => [change, ...prev.slice(0, 4)])

    setShowProgressCheck(false)
    setCompletedBlockId(null)
    setProgressCheckTimer(null)

    // Don't auto-start timer for paused block
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Tracker</h1>
            <p className="text-gray-600">
              {currentTime ? `${currentTime.toLocaleDateString()} - ${currentTime.toLocaleTimeString()}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-400">
              Current Block: {currentBlockId} | Timer: {isTimerRunning ? "ON" : "OFF"} | Popup:{" "}
              {showProgressCheck ? "OPEN" : "CLOSED"}
            </p>
          </div>
          <div className="flex gap-2">
            {recentChanges.length > 0 && (
              <Button variant="outline" onClick={undoLastChange} className="flex items-center gap-2 bg-transparent">
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowVoiceInterface(true)} className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Assistant
            </Button>
            <Button variant="outline" onClick={() => setShowNotionTasks(true)} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Notion Tasks
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                              const testBlock = timeBlocks.find((b) => b.id === getCurrentBlockId(currentTime || new Date()))
              if (testBlock) {
                handleBlockCompletion(testBlock, getCurrentBlockId(currentTime || new Date()))
                }
              }}
              className="flex items-center gap-2 bg-red-100"
            >
              Test Popup
            </Button>
          </div>
        </div>

        {/* Block Duration Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span>Time Block Settings</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{totalBlocks} blocks total</span>
                <span>{blocksPerHour} blocks/hour</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Block Duration:</span>
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowDurationSelector(!showDurationSelector)}
                  className="flex items-center gap-2 min-w-32"
                >
                  <span className="font-medium">{blockDurationMinutes} minutes</span>
                  <span className="text-xs text-gray-500">
                    ({blockDurationOptions.find((opt) => opt.value === blockDurationMinutes)?.description})
                  </span>
                </Button>

                {showDurationSelector && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">Choose your time block size:</div>
                      {blockDurationOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleBlockDurationChange(option.value)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
                            blockDurationMinutes === option.value ? "bg-blue-50 border border-blue-200" : "",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Current block: {currentBlock?.startTime} - {currentBlock?.endTime}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Notification */}
        {showChangeNotification && (
          <Card
            className={cn(
              "border-2",
              notificationType === "disrupted"
                ? "border-red-500 bg-red-50"
                : notificationType === "paused"
                  ? "border-gray-500 bg-gray-50"
                  : "border-blue-500 bg-blue-50",
            )}
          >
            <CardContent className="p-4">
              <div
                className={cn(
                  "flex items-center gap-2",
                  notificationType === "disrupted"
                    ? "text-red-700"
                    : notificationType === "paused"
                      ? "text-gray-700"
                      : "text-blue-700",
                )}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">
                  {notificationType === "disrupted"
                    ? "Block marked as disrupted"
                    : notificationType === "paused"
                      ? "Session paused due to absence"
                      : "Tasks automatically rescheduled"}
                </span>
                <span className="text-sm">
                  {notificationType === "disrupted"
                    ? "Previous block disrupted, current block paused, all tasks rescheduled"
                    : notificationType === "paused"
                      ? "Manual intervention required to resume"
                      : "Future tasks moved forward to accommodate changes"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Session</span>
              <div className="text-2xl font-mono">{formatTime(timerSeconds)}</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {currentBlock?.task ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-white", currentBlock.task.color)}>{currentBlock.task.type}</Badge>
                      <span className="font-medium text-lg">{currentBlock.task.title}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Current Block: {currentBlock.startTime} - {currentBlock.endTime} ({blockDurationMinutes} min)
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Block Time Remaining: {getRemainingTime(currentBlock)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-gray-500 text-lg">No task assigned for current time block</div>
                    <div className="text-sm text-gray-400">
                      {currentBlock?.startTime} - {currentBlock?.endTime} ({blockDurationMinutes} min)
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Block Time Remaining: {currentBlock ? getRemainingTime(currentBlock) : "0:00"}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isTimerRunning ? (
                  <Button onClick={startTimer} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Focus
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopTimer} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              24-Hour Time Grid ({blockDurationMinutes}-minute blocks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-2 max-h-[600px] overflow-y-auto p-2`}
              style={{ gridTemplateColumns: `repeat(${getGridColumns()}, minmax(0, 1fr))` }}
            >
              {timeBlocks.map((block, index) => {
                const isCurrentBlock = block.id === currentBlockId
                const blockStatus = getBlockTimeStatus(block.id)
                const hour = Math.floor(index / 6)
                const currentGradient = aiGradients[gradientIndex]

                return (
                  <div key={block.id} className="relative">
                    <div
                      onClick={(e) => handleBlockClick(block.id, e)}
                      className={cn(
                        "h-20 w-full border-2 cursor-pointer transition-all duration-500 hover:border-gray-400 rounded-lg p-2 relative overflow-hidden",
                        {
                          [`bg-gradient-to-br ${currentGradient} border-transparent text-white shadow-xl`]:
                            isCurrentBlock,
                          "bg-green-100 border-green-300": block.isCompleted && !isCurrentBlock,
                          "bg-yellow-100 border-yellow-300 animate-pulse": block.isActive && !isCurrentBlock,
                          "bg-red-100 border-red-300": block.task?.title?.includes("Disrupted") && !isCurrentBlock,
                          "bg-gray-100 border-gray-400": block.task?.title?.includes("Paused") && !isCurrentBlock,
                          "bg-gray-50 border-gray-200 hover:bg-gray-100":
                            !block.task && !isCurrentBlock && !block.isActive && !block.isCompleted,
                          "bg-orange-100 border-orange-300 animate-bounce": block.isRecentlyMoved,
                        },
                        block.task?.color &&
                          !isCurrentBlock &&
                          !block.isActive &&
                          !block.isCompleted &&
                          !block.task?.title?.includes("Disrupted") &&
                          !block.task?.title?.includes("Paused")
                          ? `${block.task.color} text-white`
                          : "",
                      )}
                      style={{
                        animation: isCurrentBlock
                          ? "breathe 2s ease-in-out infinite, star-glow 1s ease-in-out infinite"
                          : block.isRecentlyMoved
                            ? "slide-in 0.5s ease-out"
                            : undefined,
                        boxShadow: isCurrentBlock
                          ? "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                          : undefined,
                      }}
                      title={`${block.startTime} - ${block.endTime}${block.task ? `: ${block.task.title}` : ""} (${blockStatus})`}
                    >
                      {/* Breathing glow overlay */}
                      {isCurrentBlock && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-lg animate-pulse-soft" />
                      )}

                      {/* Recently moved indicator */}
                      {block.isRecentlyMoved && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                      )}

                      {/* Sparkle effects for current block */}
                      {isCurrentBlock && (
                        <>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
                          <div
                            className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-ping opacity-60"
                            style={{ animationDelay: "0.5s" }}
                          />
                        </>
                      )}

                      {/* Time label in upper left corner */}
                      <div
                        className={cn(
                          "absolute top-1 left-1 text-xs font-mono transition-all duration-300",
                          isCurrentBlock ? "text-white font-bold opacity-90" : "opacity-75",
                        )}
                      >
                        {block.startTime}-{block.endTime}
                      </div>

                      {/* Block status indicator */}
                      <div
                        className={cn(
                          "absolute top-1 right-8 text-xs opacity-50",
                          blockStatus === "past"
                            ? "text-gray-500"
                            : blockStatus === "current"
                              ? "text-white"
                              : "text-blue-600",
                        )}
                      >
                        {blockStatus === "past" ? "📅" : blockStatus === "current" ? "⏰" : "🔮"}
                      </div>

                      {/* Current time countdown */}
                      {isCurrentBlock && (
                        <div className="absolute top-1 right-1 text-xs font-bold bg-white bg-opacity-25 px-2 py-1 rounded-full backdrop-blur-sm">
                          {getRemainingTime(block)}
                        </div>
                      )}

                      {/* Task content */}
                      <div className="mt-4 h-full flex flex-col justify-center">
                        {block.task ? (
                          <div className="text-center">
                            <div
                              className={cn(
                                "text-xs font-medium truncate px-1",
                                isCurrentBlock ? "text-white font-bold" : "",
                              )}
                            >
                              {block.task.title}
                            </div>
                            {block.task.type && (
                              <Badge
                                className={cn(
                                  "mt-1 text-xs",
                                  isCurrentBlock
                                    ? "bg-white bg-opacity-20 text-white border-white border-opacity-30"
                                    : "",
                                )}
                                variant={isCurrentBlock ? "outline" : "secondary"}
                              >
                                {block.task.type}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "text-center text-xs transition-all duration-300",
                              isCurrentBlock ? "text-white opacity-80" : "text-gray-400",
                            )}
                          >
                            Click to add task
                          </div>
                        )}
                      </div>

                      {/* Removed the Focus session indicator that was hiding the task */}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Task Selector Modal */}
        {showTaskSelector && selectedBlock && (
          <TaskSelector
            isOpen={showTaskSelector}
            onClose={() => {
              setShowTaskSelector(false)
              setSelectedBlock(null)
            }}
            onTaskSelect={(task) => handleTaskAssign(task, selectedBlock)}
            blockTime={timeBlocks.find((b) => b.id === selectedBlock)}
          />
        )}

        {/* Voice Interface Modal */}
        {showVoiceInterface && (
          <VoiceInterface
            isOpen={showVoiceInterface}
            onClose={() => setShowVoiceInterface(false)}
            onTaskCreate={(task) => {
              if (selectedBlock) {
                handleTaskAssign(task, selectedBlock)
              }
            }}
          />
        )}

        {/* Notion Tasks Modal */}
        {showNotionTasks && (
          <NotionTasks
            isOpen={showNotionTasks}
            onClose={() => setShowNotionTasks(false)}
            onTaskSelect={(task) => {
              if (selectedBlock) {
                handleTaskAssign(task, selectedBlock)
              }
            }}
          />
        )}
        {/* Quick Task Input */}
        <QuickTaskInput
          isOpen={showQuickInput}
          onClose={() => {
            setShowQuickInput(false)
            setEditingBlockId(null)
          }}
          onSave={handleQuickTaskSave}
          onDelete={handleQuickTaskDelete}
          position={quickInputPosition}
          initialValue={editingBlockId ? timeBlocks.find((b) => b.id === editingBlockId)?.task?.title || "" : ""}
          isEditing={!!editingBlockId && !!timeBlocks.find((b) => b.id === editingBlockId)?.task}
        />
        {/* Progress Check Popup */}
        <ProgressCheckPopup
          isOpen={showProgressCheck}
          completedBlock={completedBlockId ? timeBlocks.find((b) => b.id === completedBlockId) : null}
          onDone={handleProgressDone}
          onStillDoing={handleProgressStillDoing}
                        onTimeout={() => handleProgressTimeout(getCurrentBlockId(currentTime || new Date()))}
        />
      </div>
    </div>
  )
}
