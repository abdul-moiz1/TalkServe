import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Using Gemini AI integration (blueprint:javascript_gemini)
// Note: gemini-2.5-flash is the newest model
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
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

    const systemPrompt = `You are a customer service analytics expert. Analyze conversations and provide insights about sentiment, topics, and customer satisfaction. Always respond with valid JSON.`;

    const userPrompt = `Analyze the following conversation between a customer and an AI agent. Provide:
1. Overall sentiment (positive, negative, or neutral)
2. A brief summary of the conversation (2-3 sentences)
3. Key topics discussed (list 3-5 topics)
4. Customer's mood/emotional state (e.g., satisfied, frustrated, curious, etc.)
5. A rating from 1-5 stars based on how well the interaction went

Conversation:
${conversationText}

Respond with JSON in this exact format:
{
  "sentiment": "positive" or "negative" or "neutral",
  "summary": "Brief summary here",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "customerMood": "Description of customer mood",
  "rating": 1-5
}`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            summary: { type: "string" },
            keyTopics: { type: "array", items: { type: "string" } },
            customerMood: { type: "string" },
            rating: { type: "number" },
          },
          required: ["sentiment", "summary", "keyTopics", "customerMood", "rating"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
    });

    const content = response.text;
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
    const isConfigError = errorMessage.includes("GEMINI_API_KEY");
    return NextResponse.json(
      { error: isConfigError ? "AI service is not configured. Please add your Gemini API key." : "Failed to analyze conversation" },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
