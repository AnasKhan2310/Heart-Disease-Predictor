import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post("/api/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.error("CRITICAL: GEMINI_API_KEY is missing or invalid in server environment.");
        return res.status(500).json({ 
          error: "API Key Missing: Please add 'GEMINI_API_KEY' to your environment variables in AI Studio (Settings > Secrets) or your hosting platform." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING },
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
        throw new Error("Empty response from AI model");
      }

      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMessage = "Failed to process health analysis on the server.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("API key not valid")) {
          errorMessage = "The provided API key is invalid. Please check your GEMINI_API_KEY configuration.";
        }
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in Development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in Production mode...");
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
