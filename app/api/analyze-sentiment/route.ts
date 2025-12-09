import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

interface MessageInput {
  direction: 'incoming' | 'outgoing';
  message: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: MessageInput[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    const conversationText = messages
      .map(m => `${m.direction === 'incoming' ? 'Customer' : 'Agent'}: ${m.message}`)
      .join('\n');

    const prompt = `Analyze the following conversation between a customer and an AI agent. Provide:
1. Overall sentiment (positive, negative, or neutral)
2. A brief summary of the conversation (2-3 sentences)
3. Key topics discussed (list 3-5 topics)
4. Customer's mood/emotional state (e.g., satisfied, frustrated, curious, etc.)
5. A rating from 1-5 stars based on how well the interaction went

Conversation:
${conversationText}

Respond with JSON in this exact format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "summary": "Brief summary here",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "customerMood": "Description of customer mood",
  "rating": 1-5
}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a customer service analytics expert. Analyze conversations and provide insights about sentiment, topics, and customer satisfaction. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      sentiment: result.sentiment || 'neutral',
      summary: result.summary || 'Unable to generate summary',
      keyTopics: result.keyTopics || [],
      customerMood: result.customerMood || 'Unknown',
      rating: Math.min(5, Math.max(1, result.rating || 3))
    });

  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze conversation";
    const isConfigError = errorMessage.includes("OPENAI_API_KEY");
    return NextResponse.json(
      { error: isConfigError ? "AI service is not configured. Please add your OpenAI API key." : "Failed to analyze conversation" },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
