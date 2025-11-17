
import { GoogleGenAI } from "@google/genai";
import { BOT_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

export const generateBotResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: `You are a helpful and very concise customer service chatbot for an ordering service named ${BOT_NAME}. Your responses should be short, friendly, and sound like they are from a WhatsApp message. Do not use markdown or formatting.`,
        temperature: 0.7,
      }
    });
    
    return response.text;

  } catch (error) {
    console.error('Error generating content from Gemini:', error);
    throw new Error('Failed to get response from AI');
  }
};
