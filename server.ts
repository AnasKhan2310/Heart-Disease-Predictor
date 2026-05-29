import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateFallbackHeartRisk(data: any, apiErrorMsg: string) {
  const age = Number(data?.age || 45);
  const sex = Number(data?.sex ?? 1);
  const cp = Number(data?.cp ?? 0);
  const trestbps = Number(data?.trestbps || 120);
  const chol = Number(data?.chol || 230);
  const fbs = Number(data?.fbs ?? 0);
  const restecg = Number(data?.restecg ?? 1);
  const thalach = Number(data?.thalach || 150);
  const exang = Number(data?.exang ?? 0);
  const oldpeak = Number(data?.oldpeak || 1.0);
  const slope = Number(data?.slope ?? 1);
  const ca = Number(data?.ca ?? 0);
  const thal = Number(data?.thal ?? 2);

  let score = 10; // baseline

  // Age impact
  if (age > 50) {
    score += (age - 50) * 0.7;
  }

  // Sex impact
  if (sex === 1) {
    score += 10;
  }

  // Chest pain (Typical Angina cp=0 has highest indicators, cp=3 asymptomatic can be ambiguous/severe)
  if (cp === 0) {
    score += 20;
  } else if (cp === 1) {
    score += 10;
  } else if (cp === 2) {
    score += 5;
  } else if (cp === 3) {
    score += 15;
  }

  // Resting blood pressure
  if (trestbps > 140) {
    score += 15;
  } else if (trestbps > 120) {
    score += 5;
  }

  // Cholesterol
  if (chol > 240) {
    score += 15;
  } else if (chol > 200) {
    score += 5;
  }

  // Fasting Blood Sugar
  if (fbs === 1) {
    score += 8;
  }

  // Maximum heart rate (lower is higher risk during stress)
  if (thalach < 130) {
    score += 15;
  } else if (thalach < 150) {
    score += 5;
  }

  // Exercise ST depression (oldpeak)
  if (oldpeak > 2.0) {
    score += 20;
  } else if (oldpeak > 1.0) {
    score += 10;
  }

  // Major vessels (ca)
  if (ca > 0) {
    score += ca * 10;
  }

  // Thalassemia
  if (thal === 3) {
    score += 15;
  } else if (thal === 2) {
    score += 5;
  }

  // Exercise inducing angina
  if (exang === 1) {
    score += 12;
  }

  // Cap probability at 5% to 95%
  const probability = Math.min(Math.max(Math.round(score), 5), 95);

  // Risk Level
  let riskLevel: "Low" | "Medium" | "High" = "Low";
  if (probability >= 60) {
    riskLevel = "High";
  } else if (probability >= 30) {
    riskLevel = "Medium";
  }

  // Custom tailored physiological clinical insight
  const clinicalDescriptors: string[] = [];
  if (trestbps > 140) clinicalDescriptors.push(`Systolic BP (${trestbps} mmHg)`);
  if (chol > 240) clinicalDescriptors.push(`Cholesterol (${chol} mg/dL)`);
  if (oldpeak > 1.2) clinicalDescriptors.push(`ST depression of ${oldpeak} mm`);
  if (ca > 0) clinicalDescriptors.push(`${ca} fluoroscopy vessel markers`);

  let insights = "";
  if (riskLevel === "High") {
    insights = `Elevated risk indicators detected, primarily driven by ${clinicalDescriptors.length > 0 ? clinicalDescriptors.join(", ") : "severe physiological stress biomarkers"}. Standard benchmarks suggest clinical correlation with ischemic patterns. Cardiovascular evaluation is strongly indicated.`;
  } else if (riskLevel === "Medium") {
    insights = `Moderate ischemic markers detected. Risk profiling is affected by ${clinicalDescriptors.length > 0 ? clinicalDescriptors.join(", ") : "partial biomarker deviation"}. Proactive therapeutic routine adjustment is suggested to contain progress.`;
  } else {
    insights = `Cardiovascular profiles align neatly within protective physiological benchmarks. Target vessel reserve appears solid. Continued active routine wellness tracking and low-stress diet is indicated to sustain performance.`;
  }

  // Tailored recommendations
  const recommendations: string[] = [];
  if (trestbps > 130) {
    recommendations.push("Initiate low-sodium nutrition profile (<2g daily) and steady cardiovascular hydration.");
  } else {
    recommendations.push("Maintain standard heart-safe fluid levels and organic mineral pacing.");
  }

  if (chol > 200) {
    recommendations.push("Reduce high-fat saturated lipid intakes; emphasize monounsaturated acids and soluble fibers.");
  } else {
    recommendations.push("Include regular unsaturated fats (e.g. olive oil, omega-3) to sustain vascular endothelium.");
  }

  if (oldpeak > 1.0 || ca > 0) {
    recommendations.push("Consult a cardiologist for a targeted stress test or non-invasive coronary imaging.");
  } else {
    recommendations.push("Establish yearly preventative multi-parameter blood checks and clinical assessment.");
  }

  recommendations.push("Track resting heart rate weekly and log changes in physical exercise recovery speed.");

  return {
    riskLevel,
    probability,
    insights,
    recommendations,
    isFallback: true,
    apiError: apiErrorMsg
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Gemini API Proxy (Server-side to keep key SECRET)
  app.post("/api/analyze", async (req, res) => {
    const { prompt, data } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "VITE_GEMINI_API_KEY") {
        console.warn("GEMINI_API_KEY is missing in server environment. Invoking clinical rule-based predictor fallback.");
        const fallback = calculateFallbackHeartRisk(data, "API Key Missing: Please add 'GEMINI_API_KEY' or 'VITE_GEMINI_API_KEY' via 'Settings > Secrets' menu.");
        return res.json(fallback);
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      if (!text) throw new Error("Empty response from AI model");

      res.json({
        ...JSON.parse(text),
        isFallback: false
      });
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMessage = "Failed to process analysis";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      const isExpired = errorMessage.toLowerCase().includes("expired") || 
                        errorMessage.toLowerCase().includes("api_key_invalid") || 
                        errorMessage.toLowerCase().includes("invalid_argument") ||
                        errorMessage.toLowerCase().includes("quota") ||
                        errorMessage.toLowerCase().includes("400") ||
                        errorMessage.toLowerCase().includes("key");

      if (isExpired) {
        errorMessage = "API key expired. Apki Gemini API Key expire ho chuki ya invalid hai. Please AI Studio ke Settings (Left Side Menu) > Secrets me jaakar 'GEMINI_API_KEY' ya 'VITE_GEMINI_API_KEY' ko renew karein.";
      }

      console.warn("Invoking clinical rule-based predictor fallback due to API error:", errorMessage);
      const fallback = calculateFallbackHeartRisk(data, errorMessage);
      res.json(fallback);
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
