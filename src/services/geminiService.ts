import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface HeartData {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
}

export interface AnalysisResult {
  riskLevel: "Low" | "Medium" | "High";
  probability: number;
  insights: string;
  recommendations: string[];
}

export async function analyzeHeartHealth(data: HeartData): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    throw new Error("API Key is missing. If you're seeing this on a deployed site, ensure GEMINI_API_KEY is configured in your settings.");
  }

  const prompt = `Analyze the following heart clinical data for potential heart disease risk. 
  Data: ${JSON.stringify(data)}
  
  Please provide a structured analysis including:
  1. Risk Level (Low, Medium, High).
  2. Estimated risk probability (0.0 to 1.0).
  3. Brief clinical insights based on benchmarks.
  4. 3-4 actionable medical recommendations.
  
  Format the response as a valid JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            probability: { type: Type.NUMBER },
            insights: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["riskLevel", "probability", "insights", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Received an empty response from the health analysis system.");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during health analysis.");
  }
}
