import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTacticalAdvice(context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ parts: [{ text: `You are a tactical military advisor in a 2D shooter game. 
      The player is currently in this situation: ${context}. 
      Give a very short, punchy, "COD-style" tactical advice (max 15 words). 
      Examples: "Reload now, soldier!", "Flank them from the left!", "Watch your six!"` }] }],
    });
    return response.text || "Stay frosty, soldier.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Keep moving!";
  }
}
