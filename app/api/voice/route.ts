import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are a helpful time management assistant. The user said: "${message}". 
      
      Analyze their request and help them create or schedule a task. Be concise and actionable.
      
      If they mention:
      - Time durations, acknowledge them
      - Specific tasks, help organize them
      - Priorities, factor them in
      - Breaks or rest, encourage healthy habits
      
      Respond in a friendly, supportive tone as if you're speaking to them.`,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error("Voice API error:", error)
    return Response.json({ error: "Failed to process voice command" }, { status: 500 })
  }
}
