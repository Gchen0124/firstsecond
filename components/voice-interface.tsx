"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface VoiceInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreate: (task: any) => void
}

export default function VoiceInterface({ isOpen, onClose, onTaskCreate }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [conversation, setConversation] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      timestamp: Date
    }>
  >([])

  // Mock voice recognition and synthesis
  const startListening = () => {
    setIsListening(true)
    // Simulate voice recognition
    setTimeout(() => {
      const mockTranscripts = [
        "I need to work on the project proposal for 30 minutes",
        "Schedule a focus session for deep work",
        "Add a task to review the design mockups",
        "Create a break time for 10 minutes",
        "I want to do email processing now",
      ]
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
      setTranscript(randomTranscript)
      setIsListening(false)
      handleVoiceCommand(randomTranscript)
    }, 2000)
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const handleVoiceCommand = async (command: string) => {
    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        content: command,
        timestamp: new Date(),
      },
    ])

    // Mock AI response
    setTimeout(() => {
      let response = ""
      let taskCreated = null

      if (command.toLowerCase().includes("project proposal")) {
        response =
          "I'll create a task for working on the project proposal. This seems like a high-priority task that requires focus time."
        taskCreated = {
          id: `voice-${Date.now()}`,
          title: "Work on project proposal",
          description: "Focus session for project proposal development",
          priority: "high",
          color: "bg-red-500",
          type: "voice",
        }
      } else if (command.toLowerCase().includes("focus session") || command.toLowerCase().includes("deep work")) {
        response = "Perfect! I'll set up a deep work focus session for you. This will help you maintain concentration."
        taskCreated = {
          id: `voice-${Date.now()}`,
          title: "Deep Work Focus Session",
          description: "Uninterrupted focus time for important tasks",
          priority: "high",
          color: "bg-blue-500",
          type: "voice",
        }
      } else if (command.toLowerCase().includes("design mockups")) {
        response = "I'll add a task to review design mockups. This is important for keeping projects on track."
        taskCreated = {
          id: `voice-${Date.now()}`,
          title: "Review design mockups",
          description: "Review and provide feedback on design mockups",
          priority: "medium",
          color: "bg-purple-500",
          type: "voice",
        }
      } else if (command.toLowerCase().includes("break")) {
        response = "Great idea! Taking breaks is essential for productivity. I'll schedule a break time for you."
        taskCreated = {
          id: `voice-${Date.now()}`,
          title: "Break Time",
          description: "Rest and recharge",
          priority: "low",
          color: "bg-green-500",
          type: "voice",
        }
      } else if (command.toLowerCase().includes("email")) {
        response = "I'll create an email processing task. Batching email work is a great productivity strategy."
        taskCreated = {
          id: `voice-${Date.now()}`,
          title: "Email Processing",
          description: "Check, respond, and organize emails",
          priority: "medium",
          color: "bg-yellow-500",
          type: "voice",
        }
      } else {
        response =
          "I understand you want to create a task. Could you be more specific about what you'd like to work on?"
      }

      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ])

      if (taskCreated) {
        onTaskCreate(taskCreated)
      }

      // Mock text-to-speech
      setIsSpeaking(true)
      setTimeout(() => setIsSpeaking(false), 3000)
    }, 1000)
  }

  const speakText = (text: string) => {
    setIsSpeaking(true)
    // Mock TTS duration
    setTimeout(() => setIsSpeaking(false), text.length * 50)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Voice Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-5 w-5" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5" />
                      Start Listening
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <Volume2 className="h-5 w-5 text-green-500 animate-pulse" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">{isSpeaking ? "Speaking..." : "Silent"}</span>
                </div>
              </div>

              {isListening && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700">Listening...</span>
                  </div>
                </div>
              )}

              {transcript && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>You said:</strong> "{transcript}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Conversation</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {conversation.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Start a conversation by clicking "Start Listening" and tell me what task you'd like to create or
                    schedule.
                  </p>
                ) : (
                  conversation.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                        {message.role === "assistant" && (
                          <Button
                            onClick={() => speakText(message.content)}
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-6 px-2 text-xs"
                          >
                            <Volume2 className="h-3 w-3 mr-1" />
                            Speak
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Commands */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Quick Commands</h3>
              <div className="grid grid-cols-2 gap-2">
                {["Create a focus session", "Schedule a break", "Add email processing time", "Plan project work"].map(
                  (command) => (
                    <Button
                      key={command}
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoiceCommand(command)}
                      className="text-left justify-start"
                    >
                      {command}
                    </Button>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
