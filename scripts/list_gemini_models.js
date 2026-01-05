import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    // The listModels method is on the genAI instance, but the error says it's not a function.
    // Let's try to check the SDK version or use a different approach.
    // Actually, in newer versions of @google/generative-ai, listModels might be used differently.
    // Let's try to fetch it via the REST API directly to be sure what's available for this key.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m) => {
        console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(", ")})`);
      });
    } else {
      console.log("No models found or error in response:", data);
    }
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
