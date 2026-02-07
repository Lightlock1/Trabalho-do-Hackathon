
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, EmotionalState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_PROMPT = `
You are the MindPulse AI Engine, an expert in mental wellness and burnout prevention for students and young professionals.
Analyze user input (mood scale 1-10 and short text) to detect stress patterns.

OUTPUT RULES:
- Return ONLY JSON.
- emotionalState must be one of: "Calm", "Stressed", "Overloaded", "Burnout Risk".
- stressScore is 0-100 (0 = zen, 100 = critical burnout risk).
- aiMessage: max 2 sentences, empathetic, supportive, NO clinical jargon.
- suggestions: exactly 3 actionable, personalized wellness tips.

STRESS SCORE LOGIC (Pseudocode):
Score = (11 - moodScale) * 8.
If text contains keywords like 'exhausted', 'hopeless', 'overwhelmed', 'can't focus': +20.
If text is positive: -10.
Clamp result between 0-100.
`;

const CHAT_SYSTEM_PROMPT = `
You are MPAI, the personal wellness assistant for MindPulse AI. 
You help students and young professionals with burnout, focus, sleep, and physical well-being.
Be supportive, concise, and proactive. Do not give medical advice.
Keep responses under 3 sentences unless asked for a detailed list.
`;

export const analyzeCheckIn = async (moodScale: number, text: string): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Mood Scale: ${moodScale}/10. User Text: "${text}"`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stressScore: { type: Type.NUMBER },
            emotionalState: { type: Type.STRING },
            aiMessage: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["stressScore", "emotionalState", "aiMessage", "suggestions"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      stressScore: Math.min(100, Math.max(0, data.stressScore)),
      emotionalState: data.emotionalState as EmotionalState,
      aiMessage: data.aiMessage,
      suggestions: data.suggestions
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      stressScore: (11 - moodScale) * 10,
      emotionalState: moodScale > 7 ? EmotionalState.CALM : EmotionalState.STRESSED,
      aiMessage: "I'm here for you. Take a moment to breathe.",
      suggestions: ["Short walk", "Deep breathing", "Drink water"]
    };
  }
};

export const getAssistantResponse = async (history: {role: 'user' | 'model', text: string}[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT,
    }
  });
  
  // We handle history manually for simplicity in this prototype
  const response = await chat.sendMessage({ message });
  return response.text;
};
