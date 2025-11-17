

import { GoogleGenAI, Modality } from "@google/genai";
import { BOT_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const SYSTEM_INSTRUCTION = `You are a helpful and very concise customer service chatbot for an ordering service named ${BOT_NAME}. Your responses should be short, friendly, and sound like they are from a WhatsApp message. Do not use markdown or formatting.`;


export const generateBotResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SYSTEM_INSTRUCTION}\n\n${prompt}`,
      config: {
        temperature: 0.7,
      }
    });
    
    return response.text;

  } catch (error) {
    console.error('Error generating content from Gemini:', error);
    throw new Error('Failed to get response from AI');
  }
};

const AD_SYSTEM_INSTRUCTION = `You are a witty and effective marketing copywriter for a food delivery service called '${BOT_NAME}'. Generate 3 distinct, short, and punchy advertising copy options based on the user's prompt. The tone should be perfect for social media ads (like Instagram or Facebook) and WhatsApp promotions. Use emojis appropriately. Each option should be separated by '---'.`;

export const generateAdCopy = async (prompt: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AD_SYSTEM_INSTRUCTION}\n\nUser Prompt: ${prompt}`,
      config: {
        temperature: 0.8,
      }
    });
    
    const text = response.text;
    return text.split('---').map(ad => ad.trim()).filter(ad => ad.length > 0);

  } catch (error) {
    console.error('Error generating ad copy from Gemini:', error);
    throw new Error('Failed to get response from AI for ad copy');
  }
};


export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg'
            },
        });
        
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error('Error generating image from Gemini:', error);
        throw new Error('Failed to generate image');
    }
};

export const generateLogoFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const enhancedPrompt = `Design a modern, minimalist vector logo for ${prompt}. The logo should be clean, professional, and suitable for a brand identity. White background.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png', // PNG for potential transparency
              aspectRatio: '1:1', // Logos are usually square
            },
        });
        
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error('Error generating logo from Gemini:', error);
        throw new Error('Failed to generate logo');
    }
};

export const generateVideoFromPrompt = async (prompt: string, onProgress: (message: string) => void): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        onProgress('Starting video generation...');
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        onProgress('Processing... This may take a few minutes.');
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            onProgress('Checking status...');
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress('Fetching video data...');
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation finished but no download link was found.');
        }

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            console.error("Video download error:", errorBody);
            throw new Error('Failed to download the generated video.');
        }
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        onProgress('Video generation complete!');
        return videoUrl;
    } catch (error) {
        console.error('Error generating video from Gemini:', error);
        onProgress(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
        throw new Error('Failed to generate video');
    }
};


// Helper function for base64 decoding (for audio)
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
  
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
}


export const generateSpeechFromText = async (text: string): Promise<AudioBuffer> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
              },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error('No audio data received.');
        }

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContext,
            24000,
            1,
        );
        return audioBuffer;
    } catch (error) {
        console.error('Error generating speech:', error);
        throw new Error('Failed to generate speech');
    }
}